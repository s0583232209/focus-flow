# נתיבי הסשנים: סשן = צפייה אחת בפריט, עם מדידות קשב (ציון + מיקום בתוכן) כל 2 שניות.
# המדידות נשמרות כמערך בתוך מסמך הסשן. כולם מתחת ל-/api/sessions ודורשים התחברות.

from typing import Annotated  # להצמדת כללי בדיקה לטיפוס

from fastapi import APIRouter, Depends, HTTPException, status  # כלי FastAPI
from pydantic import BaseModel, Field  # מחלקת בסיס לסכמה, ו-Field לכללים כמו מינימום/מקסימום
from pymongo import DESCENDING  # סדר יורד
from pymongo.asynchronous.database import AsyncDatabase  # טיפוס המסד

from app.db import get_db  # תלות: המסד
from app.deps import CurrentUser, get_current_user  # תלות: המשתמש המחובר
from app.routers.content import find_owned  # לבדוק שהפריט שייך למשתמש לפני שמתחילים עליו סשן
from app.utils import iso, parse_object_id, utcnow  # פורמט תאריך, המרת מזהה, זמן נוכחי

router = APIRouter(prefix="/api/sessions", tags=["sessions"])  # קידומת לכל הנתיבים

NOT_FOUND = "Session not found"  # הודעה אחידה ל-404

# השדות של "סיכום סשן". הספירה והממוצע מחושבים בתוך המסד עצמו,
# כך שמערך המדידות (שיכול להיות ארוך) לא צריך לעבור לשרת כדי לחשב אותם
SUMMARY_FIELDS = {
    "content_id": 1,  # 1 = לכלול את השדה כמו שהוא
    "content_title": 1,
    "started_at": 1,
    "ended_at": 1,
    "reading_count": {"$size": "$readings"},  # $size = אורך המערך readings
    "average_score": {"$avg": "$readings.score"},  # $avg = ממוצע של score בכל המדידות (null אם אין)
}


class SessionIn(BaseModel):  # גוף הבקשה להתחלת סשן
    content_id: str  # על איזה פריט צופים


class ReadingIn(BaseModel):  # גוף הבקשה של מדידה אחת
    # מיקום בתוכן (שניות בסרטון או אחוז גלילה בטקסט): לפחות 0; allow_inf_nan=False חוסם אינסוף ו-NaN
    position: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    # ציון הקשב: בין 0 ל-1 (ge = גדול או שווה, le = קטן או שווה). 1.5 → 422
    score: Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]


def to_summary(doc: dict) -> dict:  # ממיר תוצאת אגרגציה לתשובת JSON
    average = doc.get("average_score")  # יכול להיות None אם אין מדידות
    return {
        "id": str(doc["_id"]),
        "content_id": doc["content_id"],
        "content_title": doc["content_title"],  # שם התוכן נשמר בסשן, כדי שההיסטוריה לא תצטרך לחפש אותו
        "started_at": iso(doc["started_at"]),
        "ended_at": iso(doc["ended_at"]) if doc.get("ended_at") else None,  # None אם הסשן עדיין פתוח
        "reading_count": doc["reading_count"],
        "average_score": round(average, 3) if average is not None else None,  # עיגול ל-3 ספרות אחרי הנקודה
    }


def to_reading(reading: dict) -> dict:  # ממיר מדידה אחת לתשובה (התאריך בפורמט ISO)
    return {
        "position": reading["position"],
        "score": reading["score"],
        "created_at": iso(reading["created_at"]),
    }


async def get_summary(db: AsyncDatabase, session_id: str, owner_id: str) -> dict:
    oid = parse_object_id(session_id, NOT_FOUND)  # מזהה לא תקין → 404
    cursor = await db.sessions.aggregate(  # אגרגציה = שרשרת שלבי עיבוד שרצה בתוך MongoDB
        [{"$match": {"_id": oid, "owner_id": owner_id}}, {"$project": SUMMARY_FIELDS}]  # סינון (גם לפי בעלים), ואז בחירת/חישוב השדות
    )
    docs = await cursor.to_list(1)  # לוקחים לכל היותר תוצאה אחת
    if not docs:  # לא נמצא, או שייך למשתמש אחר
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return to_summary(docs[0])


@router.post("", status_code=status.HTTP_201_CREATED)  # POST /api/sessions – התחלת סשן
async def start_session(
    body: SessionIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    content = await find_owned(db, body.content_id, current.id)  # הפריט חייב להיות של המשתמש, אחרת 404
    doc = {
        "owner_id": current.id,  # הבעלים מהטוקן
        "content_id": str(content["_id"]),
        "content_title": content["title"],  # עותק של הכותרת, לתצוגה בהיסטוריה
        "started_at": utcnow(),
        "ended_at": None,  # None = הסשן פתוח
        "readings": [],  # מערך המדידות מתחיל ריק
    }
    result = await db.sessions.insert_one(doc)
    return {
        "id": str(result.inserted_id),  # המזהה החדש – הלקוח ישלח אליו מדידות
        "content_id": doc["content_id"],
        "started_at": iso(doc["started_at"]),
    }


@router.post("/{session_id}/readings", status_code=status.HTTP_201_CREATED)  # הוספת מדידה לסשן
async def add_reading(
    session_id: str,
    body: ReadingIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    oid = parse_object_id(session_id, NOT_FOUND)
    reading = {"position": body.position, "score": body.score, "created_at": utcnow()}  # המדידה שתישמר
    # עדכון אטומי אחד: הסינון כולל ended_at: None, ולכן אי אפשר להוסיף מדידה לסשן שבדיוק נסגר –
    # גם אם שני מופעים של השרת מטפלים בבקשות באותו רגע
    result = await db.sessions.update_one(
        {"_id": oid, "owner_id": current.id, "ended_at": None},  # רק סשן קיים, של המשתמש, ופתוח
        {"$push": {"readings": reading}},  # $push = הוספת איבר לסוף המערך
    )
    if result.matched_count == 0:  # שום מסמך לא התאים לסינון – צריך לברר למה
        if await db.sessions.find_one({"_id": oid, "owner_id": current.id}, {"_id": 1}):  # הסשן קיים ושלו?
            raise HTTPException(status_code=409, detail="Session already ended")  # כן → הוא פשוט סגור (409)
        raise HTTPException(status_code=404, detail=NOT_FOUND)  # לא → לא קיים או של מישהו אחר (404)
    return to_reading(reading)


@router.post("/{session_id}/end")  # סיום סשן
async def end_session(
    session_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    oid = parse_object_id(session_id, NOT_FOUND)
    # הסינון ended_at: None גורם לכך שרק הקריאה הראשונה קובעת את זמן הסיום.
    # קריאה שנייה לא משנה כלום ומחזירה את אותו סיכום (פעולה אידמפוטנטית)
    await db.sessions.update_one(
        {"_id": oid, "owner_id": current.id, "ended_at": None},
        {"$set": {"ended_at": utcnow()}},
    )
    return await get_summary(db, session_id, current.id)  # מחזיר סיכום (או 404 אם הסשן לא של המשתמש)


@router.get("")  # GET /api/sessions – רשימת הסשנים להיסטוריה
async def list_sessions(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    cursor = await db.sessions.aggregate(
        [
            {"$match": {"owner_id": current.id}},  # רק הסשנים של המשתמש
            {"$sort": {"started_at": DESCENDING, "_id": DESCENDING}},  # מהחדש לישן
            {"$project": SUMMARY_FIELDS},  # רק סיכום – בלי מערך המדידות, כדי שהרשימה תיטען מהר
        ]
    )
    return [to_summary(doc) async for doc in cursor]


@router.get("/{session_id}")  # GET /api/sessions/<id> – סשן אחד עם כל המדידות
async def get_session(
    session_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    summary = await get_summary(db, session_id, current.id)  # הסיכום (וגם בדיקת בעלות → 404)
    doc = await db.sessions.find_one(  # שולפים בנפרד רק את מערך המדידות
        {"_id": parse_object_id(session_id, NOT_FOUND), "owner_id": current.id},
        {"readings": 1},  # רק השדה readings
    )
    return {**summary, "readings": [to_reading(r) for r in doc["readings"]]}  # הסיכום + רשימת המדידות
