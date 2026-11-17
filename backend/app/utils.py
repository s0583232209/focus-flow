# פונקציות עזר קטנות שמשמשות בכל השרת: זמן נוכחי, פורמט תאריכים, והמרת מזהים.

from datetime import datetime, timezone  # טיפוס תאריך-ושעה, ואזור זמן (נשתמש ב-UTC)

from bson import ObjectId  # סוג המזהה של MongoDB (24 תווים הקסדצימליים)
from bson.errors import InvalidId  # השגיאה שנזרקת כשמנסים להמיר מחרוזת לא תקינה ל-ObjectId
from fastapi import HTTPException  # שגיאת HTTP שתחזור למשתמש


def utcnow() -> datetime:
    return datetime.now(timezone.utc)  # הזמן הנוכחי ב-UTC (ולא בשעון המקומי של השרת)


def iso(dt: datetime) -> str:
    """Format as UTC "YYYY-MM-DDTHH:MM:SS.sssZ". Naive datetimes (from Mongo) are UTC."""
    if dt.tzinfo is None:  # MongoDB מחזיר תאריכים בלי אזור זמן ("naive"), אבל הם תמיד ב-UTC
        dt = dt.replace(tzinfo=timezone.utc)  # לכן פשוט מצמידים להם UTC (בלי לשנות את השעה)
    dt = dt.astimezone(timezone.utc)  # אם התאריך הגיע באזור זמן אחר – ממירים ל-UTC
    # strftime יוצר "2026-11-10T14:03:05." ואז מוסיפים מילישניות בשלוש ספרות ו-"Z" (= UTC)
    # microsecond // 1000 ממיר מיקרו-שניות למילי-שניות; :03d מוסיף אפסים מובילים (למשל 007)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def parse_object_id(value: str, not_found_message: str = "Not found") -> ObjectId:
    """An id that cannot exist is reported exactly like one that does not exist."""
    try:
        return ObjectId(value)  # ממירים את המחרוזת מה-URL למזהה של MongoDB
    except (InvalidId, TypeError):  # מחרוזת לא תקינה (למשל "abc") או טיפוס לא נכון
        # מחזירים 404 – בדיוק כמו פריט שלא קיים. כך לא חושפים שום מידע על המזהים במערכת.
        # from None מסתיר את השגיאה המקורית מהעקבות, כי היא לא מעניינת
        raise HTTPException(status_code=404, detail=not_found_message) from None
