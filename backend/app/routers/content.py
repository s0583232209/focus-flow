# נתיבי הספרייה: הוספה, רשימה, צפייה ומחיקה של פריטי תוכן. כולם מתחת ל-/api/content ודורשים התחברות.
# כלל הזהב כאן: כל שאילתה מסננת לפי owner_id מהטוקן, ופריט של משתמש אחר מחזיר 404 (כאילו לא קיים).

from fastapi import APIRouter, Depends, HTTPException, Response, status  # כלי FastAPI
from pymongo import DESCENDING  # סדר יורד (מהחדש לישן)
from pymongo.asynchronous.database import AsyncDatabase  # טיפוס המסד

from app.content_validation import (  # בדיקות התוכן מהקובץ content_validation.py
    MAX_TEXT_LENGTH,
    MIN_TEXT_LENGTH,
    extract_youtube_id,
    validate_text,
)
from app.db import get_db  # תלות: המסד
from app.deps import CurrentUser, get_current_user  # תלות: המשתמש המחובר
from app.schemas.content import ContentIn, ContentOut, to_content_out  # סכמות והמרה לתשובה
from app.utils import parse_object_id, utcnow  # המרת מזהה (404 אם לא תקין) וזמן נוכחי

router = APIRouter(prefix="/api/content", tags=["content"])  # קידומת לכל הנתיבים בקובץ

NOT_FOUND = "Content not found"  # הודעה אחת לכל מקרי ה-404, כדי שלא יהיה אפשר להבחין ביניהם


async def find_owned(db: AsyncDatabase, content_id: str, owner_id: str) -> dict:
    """Invalid id, missing item and another user's item are all the same 404."""
    # מזהה לא תקין, פריט שלא קיים ופריט של משתמש אחר – כולם אותו 404 בדיוק
    oid = parse_object_id(content_id, NOT_FOUND)  # מזהה לא תקין → 404 כבר כאן
    doc = await db.content.find_one({"_id": oid, "owner_id": owner_id})  # מחפשים לפי המזהה וגם לפי הבעלים
    if doc is None:  # לא נמצא – או שלא קיים, או ששייך למישהו אחר
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return doc  # הפריט שייך למשתמש – מחזירים אותו


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ContentOut)  # POST /api/content → 201
async def create_content(
    body: ContentIn,  # כותרת, סוג ומקור (כבר נבדקו מול הסכמה)
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    video_id = None  # יישאר None בפריט טקסט
    if body.type == "youtube":  # פריט סרטון
        video_id = extract_youtube_id(body.source)  # מוציאים את מזהה הסרטון מהקישור
        if video_id is None:  # הקישור לא תקין או לא של YouTube
            raise HTTPException(status_code=422, detail="Invalid YouTube link")
        source = body.source.strip()  # שומרים את הקישור בלי רווחים בקצוות
    else:  # פריט טקסט
        source = validate_text(body.source)  # מחזיר את הטקסט בלי רווחים בקצוות, או None אם האורך לא בטווח
        if source is None:
            raise HTTPException(
                status_code=422,
                detail=f"Text must be {MIN_TEXT_LENGTH} to {MAX_TEXT_LENGTH} characters long",  # f-string משבץ את המספרים בהודעה
            )

    doc = {  # המסמך שנשמר
        "owner_id": current.id,  # הבעלים – מהטוקן, לא מהגוף
        "title": body.title,
        "type": body.type,
        "source": source,
        "video_id": video_id,
        "created_at": utcnow(),
    }
    result = await db.content.insert_one(doc)  # שמירה במסד
    doc["_id"] = result.inserted_id  # מוסיפים למסמך את המזהה שהמסד יצר
    return to_content_out(doc)  # מחזירים את הפריט המלא


@router.get("", response_model=list[ContentOut])  # GET /api/content – רשימת הפריטים
async def list_content(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    # רק פריטים של המשתמש, מהחדש לישן. מיון משני לפי _id שובר "תיקו" כששני פריטים נוצרו באותו רגע
    cursor = db.content.find({"owner_id": current.id}).sort([("created_at", DESCENDING), ("_id", DESCENDING)])
    # async for עובר על התוצאות אחת-אחת; preview=True מקצר טקסטים ארוכים ל-200 תווים
    return [to_content_out(doc, preview=True) async for doc in cursor]


@router.get("/{content_id}", response_model=ContentOut)  # GET /api/content/<id> – פריט אחד, מלא
async def get_content(
    content_id: str,  # מגיע מהנתיב ({content_id} ב-URL)
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return to_content_out(await find_owned(db, content_id, current.id))  # find_owned כבר מטפל ב-404


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)  # מחיקת פריט → 204
async def delete_content(
    content_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    doc = await find_owned(db, content_id, current.id)  # מוודאים שהפריט שייך למשתמש (אחרת 404 ושום דבר לא נמחק)
    await db.sessions.delete_many({"owner_id": current.id, "content_id": str(doc["_id"])})  # קודם הסשנים של הפריט
    await db.content.delete_one({"_id": doc["_id"], "owner_id": current.id})  # ואז הפריט עצמו
    return Response(status_code=status.HTTP_204_NO_CONTENT)
