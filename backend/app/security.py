# כלי האבטחה: הצפנת סיסמאות (bcrypt), בדיקת חוזק סיסמה, ויצירה ופענוח של טוקני JWT.

import uuid  # יצירת מזהים אקראיים ייחודיים (לשדה jti בטוקן)
from datetime import timedelta  # פרק זמן (למשל 60 דקות) שאפשר להוסיף לתאריך

import bcrypt  # ספריית הצפנת הסיסמאות
import jwt  # ספריית PyJWT ליצירת טוקנים ולבדיקתם
from fastapi import HTTPException  # שגיאה שתחזור למשתמש

from app.config import get_settings  # ההגדרות (הסוד ומשך התוקף)
from app.utils import utcnow  # הזמן הנוכחי ב-UTC

BCRYPT_MAX_BYTES = 72  # bcrypt מתעלם מכל מה שאחרי 72 בתים, לכן לא מאפשרים סיסמה ארוכה מזה
JWT_ALGORITHM = "HS256"  # אלגוריתם החתימה: HMAC עם SHA-256 וסוד משותף
# אם החלק שלפני ה-@ באימייל הוא באורך אות או שתיים, בדיקת "הסיסמה מכילה את השם" הייתה פוסלת כמעט כל סיסמה
MIN_EMAIL_NAME_LENGTH_TO_CHECK = 3


def hash_password(password: str) -> str:
    # encode ממיר טקסט לבתים; gensalt(rounds=12) יוצר "מלח" אקראי וקובע עלות של 2^12 סבבים (איטי בכוונה,
    # כדי שניחוש סיסמאות בכוח יהיה יקר); decode ממיר את התוצאה בחזרה לטקסט לשמירה במסד
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    raw = password.encode("utf-8")  # הסיסמה שהוקלדה, כבתים
    if len(raw) > BCRYPT_MAX_BYTES:  # סיסמה ארוכה מדי לא יכולה להיות נכונה (לא אפשרנו כזו בהרשמה)
        return False
    # checkpw מוציא את המלח מתוך ה-hash השמור, מצפין את הסיסמה שהוקלדה באותו אופן ומשווה
    return bcrypt.checkpw(raw, password_hash.encode("ascii"))


def validate_password_strength(password: str, email: str) -> None:
    """Raise 422 with a message the user can act on. Messages are shown as they are in the UI."""
    size = len(password.encode("utf-8"))  # האורך בבתים (אות עברית תופסת 2 בתים ב-UTF-8)
    if size < 8:  # קצרה מדי
        raise HTTPException(status_code=422, detail="הסיסמה קצרה מדי: לפחות 8 תווים")
    if size > BCRYPT_MAX_BYTES:  # ארוכה מהמגבלה של bcrypt
        raise HTTPException(status_code=422, detail="הסיסמה ארוכה מדי: עד 72 בתים")
    if not any(c.isalpha() for c in password):  # any = האם לפחות תו אחד הוא אות
        raise HTTPException(status_code=422, detail="הסיסמה חייבת לכלול לפחות אות אחת")
    if not any(c.isdigit() for c in password):  # האם לפחות תו אחד הוא ספרה
        raise HTTPException(status_code=422, detail="הסיסמה חייבת לכלול לפחות ספרה אחת")
    email_name = email.split("@")[0].strip().lower()  # החלק שלפני ה-@, באותיות קטנות (למשל "dana")
    # אם השם ארוך מספיק ומופיע בתוך הסיסמה (בלי תלות באותיות גדולות/קטנות) – פוסלים, כי קל לנחש
    if len(email_name) >= MIN_EMAIL_NAME_LENGTH_TO_CHECK and email_name in password.lower():
        raise HTTPException(status_code=422, detail="הסיסמה לא יכולה לכלול את השם שבכתובת האימייל")


def create_access_token(user_id: str, token_version: int) -> tuple[str, int]:
    """Return (token, expires_in seconds)."""
    settings = get_settings()  # צריך את הסוד ואת משך התוקף
    now = utcnow()  # רגע היצירה
    expires_in = settings.JWT_EXPIRE_MINUTES * 60  # משך התוקף בשניות (60 דקות = 3600)
    claims = {  # התוכן שנכנס לטוקן (גלוי לכל מי שמחזיק בו, אבל אי אפשר לשנות אותו בלי לשבור את החתימה)
        "sub": user_id,  # של מי הטוקן
        "ver": token_version,  # גרסת הטוקנים של המשתמש; עולה בהחלפת סיסמה ומבטלת את כל הישנים
        "jti": str(uuid.uuid4()),  # מזהה ייחודי לטוקן הזה – מאפשר לבטל רק אותו בהתנתקות
        "iat": now,  # issued at – מתי נוצר
        "exp": now + timedelta(seconds=expires_in),  # expiration – מתי פג תוקף
    }
    # חותמים על התוכן עם הסוד ומחזירים גם את הטוקן וגם את משך התוקף (הלקוח צריך אותו)
    return jwt.encode(claims, settings.JWT_SECRET, algorithm=JWT_ALGORITHM), expires_in


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(  # בודק חתימה ותוקף ומחזיר את התוכן כמילון
            token,
            get_settings().JWT_SECRET,  # אותו סוד שבו נחתם
            algorithms=[JWT_ALGORITHM],  # מקבלים רק HS256 – מונע התקפה שבה משנים את האלגוריתם בטוקן
            options={"require": ["sub", "jti", "exp", "ver"]},  # טוקן שחסר בו אחד השדות האלה נדחה
        )
    except jwt.PyJWTError:  # חתימה שגויה, פג תוקף, שדה חסר, או סתם טקסט משובש
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None
