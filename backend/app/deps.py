# "השומר בכניסה": get_current_user בודק את הטוקן בכל בקשה לנתיב שדורש התחברות,
# ומחזיר את המשתמש המחובר. כל נתיב מוגן כותב user = Depends(get_current_user).

from dataclasses import dataclass  # דקורטור שיוצר מחלקה פשוטה לשמירת נתונים, בלי לכתוב __init__

from bson import ObjectId  # סוג המזהה של MongoDB
from bson.errors import InvalidId  # שגיאה כשמזהה לא תקין
from fastapi import Depends, HTTPException  # Depends = הזרקת תלות; HTTPException = שגיאה למשתמש
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # קריאת הכותרת Authorization: Bearer <token>
from pymongo.asynchronous.database import AsyncDatabase  # טיפוס המסד

from app.db import get_db  # התלות שנותנת את המסד
from app.security import decode_token  # פענוח ובדיקת חתימה של הטוקן

# auto_error=False: אם אין טוקן, FastAPI לא יחזיר שגיאה בעצמו – אנחנו נחזיר 401 בפורמט שלנו.
# בנוסף, זה מוסיף כפתור Authorize לדף /docs
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass  # יוצר אוטומטית בנאי שמקבל doc ו-claims
class CurrentUser:
    doc: dict  # מסמך המשתמש מהמסד (אימייל, שם תצוגה וכו')
    claims: dict  # התוכן של הטוקן (sub, jti, exp, ver)

    @property  # גישה כמו לשדה: user.id
    def id(self) -> str:
        """owner_id of everything this user owns. Comes from the token, never from a body."""
        # המזהה של המשתמש כמחרוזת. זה ה-owner_id שבו מסננים כל שאילתה –
        # הוא מגיע מהטוקן החתום, ולעולם לא ממה שהלקוח שלח בגוף הבקשה
        return str(self.doc["_id"])


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),  # הטוקן מהכותרת, או None אם אין
    db: AsyncDatabase = Depends(get_db),  # המסד
) -> CurrentUser:
    if credentials is None:  # לא נשלח טוקן בכלל
        raise HTTPException(status_code=401, detail="Not authenticated")  # 401 = לא מחובר

    claims = decode_token(credentials.credentials)  # בודק חתימה ותוקף; אם לא תקין – זורק 401 בעצמו
    rejected = HTTPException(status_code=401, detail="Invalid or expired token")  # שגיאה אחת לשימוש חוזר למטה

    # אם המזהה הייחודי של הטוקן (jti) נמצא ברשימת הטוקנים שבוטלו – המשתמש התנתק עם הטוקן הזה
    # {"_id": 1} = מבקשים רק את שדה המזהה, כי צריך רק לדעת אם קיים
    if await db.revoked_tokens.find_one({"jti": claims["jti"]}, {"_id": 1}):
        raise rejected

    try:
        user_id = ObjectId(claims["sub"])  # sub (subject) בטוקן = מזהה המשתמש
    except (InvalidId, TypeError):  # מזהה לא תקין בטוקן
        raise rejected from None

    user = await db.users.find_one({"_id": user_id})  # טעינת המשתמש מהמסד
    # המשתמש נמחק, או שהחליף סיסמה מאז שהטוקן נוצר (token_version עלה) – הטוקן הישן כבר לא תקף
    if user is None or user["token_version"] != claims["ver"]:
        raise rejected
    return CurrentUser(doc=user, claims=claims)  # הכל תקין – מחזירים את המשתמש לנתיב
