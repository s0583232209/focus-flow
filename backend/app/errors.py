# מטפלי שגיאות: דואגים שכל שגיאה שהשרת מחזיר תהיה JSON בפורמט אחיד {"message": "..."}.
# כך הלקוח תמיד יודע איפה למצוא את ההודעה להצגה. (בלי זה FastAPI מחזיר {"detail": ...}.)

import logging  # ספריית הלוגים המובנית של פייתון
import traceback  # מאפשר לקבל את "עקבות" השגיאה (באיזו שורה ומאיפה היא הגיעה) כטקסט

from fastapi import Request  # אובייקט הבקשה – ממנו לוקחים את השיטה (GET/POST) והנתיב ללוג
from fastapi.exceptions import RequestValidationError  # השגיאה ש-FastAPI זורק כשהקלט לא עומד בסכמה
from fastapi.responses import JSONResponse  # תגובה בפורמט JSON עם קוד סטטוס שנבחר
from starlette.exceptions import HTTPException as StarletteHTTPException  # שגיאת HTTP הבסיסית (גם 404 של נתיב לא קיים)

logger = logging.getLogger(__name__)  # יוצרים לוגר בשם המודול (app.errors), כדי שיהיה ברור מאיפה הגיעה כל הודעה


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Return every HTTP error as {"message": str}."""
    # כשמבקשים נתיב שלא קיים, Starlette מחזיר 404 עם הטקסט "Not Found".
    # נתיב שלנו שזורק 404 עם הודעה משלו (למשל "Content not found") – ההודעה שלו צריכה לעבור כמו שהיא.
    if exc.status_code == 404 and exc.detail == "Not Found":
        return JSONResponse(status_code=404, content={"message": "Not found"})
    # detail הוא בדרך כלל מחרוזת; אם לא (למשל מילון) – ממירים לטקסט
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"message": message})  # אותו קוד סטטוס, בפורמט שלנו


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return the first validation error as a short, human-readable 422."""
    errors = exc.errors()  # רשימה של כל שגיאות האימות (שדה חסר, טיפוס לא נכון וכו')
    if errors:  # אם יש לפחות שגיאה אחת
        first = errors[0]  # מציגים רק את הראשונה – הודעה קצרה וברורה למשתמש
        # loc הוא tuple שמתאר איפה השגיאה, למשל ('body', 'email'). לוקחים את החלק האחרון = שם השדה
        loc = first.get("loc", ())
        field = str(loc[-1]) if loc else "field"  # אם אין מיקום, כותבים פשוט "field"
        reason = first.get("msg", "invalid value")  # הסיבה (למשל "field required")
        message = f"{field}: {reason}"  # מחברים להודעה אחת, למשל "email: value is not a valid email address"
    else:  # מקרה נדיר – שגיאת אימות בלי פרטים
        message = "Invalid request"
    return JSONResponse(status_code=422, content={"message": message})  # 422 = הקלט לא תקין


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the full traceback, return a generic 500."""
    # כל שגיאה שלא טופלה (באג) נכתבת ללוג עם כל הפרטים – בשבילנו, המפתחים
    logger.error(
        "Unhandled exception on %s %s\n%s",  # תבנית ההודעה; כל %s יוחלף בערך מהשורות הבאות
        request.method,  # למשל POST
        request.url.path,  # למשל /api/content
        traceback.format_exc(),  # עקבות השגיאה המלאים כטקסט
    )
    # למשתמש מחזירים רק הודעה כללית – אסור לחשוף לו פרטים פנימיים של השרת (אבטחה)
    return JSONResponse(status_code=500, content={"message": "Internal server error"})
