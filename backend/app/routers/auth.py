# נתיבי ההזדהות: הרשמה, התחברות והתנתקות. כולם מתחת ל-/api/auth.

import asyncio  # נשתמש ב-asyncio.to_thread כדי להריץ את bcrypt (פעולה איטית) בלי לתקוע את השרת
from datetime import datetime, timedelta, timezone  # תאריכים, פרקי זמן ואזור זמן

from fastapi import APIRouter, Depends, HTTPException, Response, status  # כלי FastAPI לנתיבים, תלויות, שגיאות וקודי סטטוס
from pymongo.asynchronous.database import AsyncDatabase  # טיפוס המסד
from pymongo.errors import DuplicateKeyError  # שגיאה כשמנסים להכניס ערך שכבר קיים באינדקס ייחודי

from app.db import get_db  # תלות: המסד
from app.deps import CurrentUser, get_current_user  # תלות: המשתמש המחובר
from app.schemas.users import LoginIn, RegisterIn  # סכמות הקלט
from app.security import (  # פונקציות האבטחה
    create_access_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.utils import utcnow  # הזמן הנוכחי ב-UTC

# קבוצת נתיבים: כל נתיב כאן יקבל את הקידומת /api/auth, ובדף /docs הם יופיעו תחת "auth"
router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5  # כמה ניסיונות כושלים מותרים
ATTEMPT_WINDOW = timedelta(minutes=15)  # בתוך איזה חלון זמן סופרים אותם

# hash "מזויף" שמשווים אליו כשהאימייל לא קיים. כך שני סוגי הכישלון (אימייל לא קיים / סיסמה שגויה)
# לוקחים אותו זמן, ותוקף לא יכול לגלות לפי מהירות התשובה אילו אימיילים רשומים
_DUMMY_HASH = hash_password("timing-equalizer-0")


def normalize_email(email: str) -> str:
    return email.strip().lower()  # בלי רווחים ובאותיות קטנות: Alice@Test.com ו-alice@test.com הם אותו משתמש


@router.post("/register", status_code=status.HTTP_201_CREATED)  # POST /api/auth/register; הצלחה = 201 Created
async def register(body: RegisterIn, db: AsyncDatabase = Depends(get_db)):  # body נבדק אוטומטית מול RegisterIn
    validate_password_strength(body.password, body.email)  # סיסמה חלשה → 422 עם הודעה ברורה
    email_lower = normalize_email(body.email)  # האימייל המנורמל, לבדיקת כפילות
    conflict = HTTPException(status_code=409, detail="Email already registered")  # 409 = התנגשות, כבר קיים

    if await db.users.find_one({"email_lower": email_lower}, {"_id": 1}):  # כבר יש משתמש עם האימייל הזה?
        raise conflict

    # bcrypt איטי בכוונה (~רבע שנייה). to_thread מריץ אותו בתהליכון נפרד, כך שבינתיים השרת ממשיך לטפל בבקשות אחרות
    password_hash = await asyncio.to_thread(hash_password, body.password)
    doc = {  # המסמך שנשמר במסד
        "email": body.email,  # כפי שהוקלד
        "email_lower": email_lower,  # מנורמל – עליו האינדקס הייחודי
        "password_hash": password_hash,  # רק ה-hash, אף פעם לא הסיסמה עצמה
        "display_name": body.display_name,
        "token_version": 0,  # גרסה ראשונה של הטוקנים; תעלה בהחלפת סיסמה
        "created_at": utcnow(),
    }
    try:
        result = await db.users.insert_one(doc)  # שמירה במסד
    except DuplicateKeyError:
        # שתי בקשות הרשמה באותו רגע בדיוק: שתיהן עברו את הבדיקה למעלה, אבל האינדקס הייחודי מכריע – רק אחת תצליח
        raise conflict from None
    # מחזירים רק שדות בטוחים (בלי password_hash)
    return {"id": str(result.inserted_id), "email": doc["email"], "display_name": doc["display_name"]}


@router.post("/login")  # POST /api/auth/login; הצלחה = 200
async def login(body: LoginIn, db: AsyncDatabase = Depends(get_db)):
    email_lower = normalize_email(body.email)
    now = utcnow()

    # כמה ניסיונות כושלים היו לאימייל הזה ב-15 הדקות האחרונות ($gte = גדול או שווה)
    # הספירה נשמרת ב-MongoDB ולא בזיכרון, כי בענן יש כמה מופעים של השרת והם צריכים לראות אותו מספר
    failures = await db.login_attempts.count_documents(
        {"email_lower": email_lower, "created_at": {"$gte": now - ATTEMPT_WINDOW}}
    )
    if failures >= MAX_FAILED_ATTEMPTS:  # 5 כישלונות או יותר → חסימה, גם אם הסיסמה הפעם נכונה
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")  # 429 = יותר מדי בקשות

    user = await db.users.find_one({"email_lower": email_lower})  # מחפשים את המשתמש
    stored_hash = user["password_hash"] if user else _DUMMY_HASH  # אם אין משתמש – משווים ל-hash המזויף (אותו זמן)
    password_ok = await asyncio.to_thread(verify_password, body.password, stored_hash)  # בדיקת הסיסמה (איטית, בתהליכון נפרד)

    if not user or not password_ok:  # אימייל לא קיים או סיסמה שגויה
        await db.login_attempts.insert_one({"email_lower": email_lower, "created_at": now})  # רושמים ניסיון כושל
        # אותה הודעה בדיוק לשני המקרים – לא חושפים אם האימייל רשום
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    await db.login_attempts.delete_many({"email_lower": email_lower})  # הצלחה: מאפסים את מונה הכישלונות
    token, expires_in = create_access_token(str(user["_id"]), user["token_version"])  # יוצרים טוקן חתום
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in}  # הלקוח שומר את הטוקן ושולח אותו בכל בקשה


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)  # הצלחה = 204 (בלי גוף תשובה)
async def logout(current: CurrentUser = Depends(get_current_user), db: AsyncDatabase = Depends(get_db)):  # רק משתמש מחובר
    """A JWT cannot be recalled, so its jti is kept on a revoked list until it expires anyway."""
    # אי אפשר "למחוק" JWT שכבר נמסר ללקוח, לכן שומרים את המזהה שלו ברשימת המבוטלים עד שהוא יפוג ממילא
    expires_at = datetime.fromtimestamp(current.claims["exp"], tz=timezone.utc)  # exp בטוקן הוא מספר שניות → datetime
    try:
        await db.revoked_tokens.insert_one({"jti": current.claims["jti"], "expires_at": expires_at})  # אינדקס TTL ימחק אותו אחרי expires_at
    except DuplicateKeyError:
        pass  # התנתקות כפולה באותו רגע – הטוקן כבר ברשימה, אין מה לעשות
    return Response(status_code=status.HTTP_204_NO_CONTENT)  # תשובה ריקה
