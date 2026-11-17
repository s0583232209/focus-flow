# נקודת הכניסה של השרת: כאן נוצרת אפליקציית FastAPI, מחברים אליה את ה-CORS,
# את מטפלי השגיאות ואת כל הנתיבים. uvicorn מריץ את המשתנה app שבסוף הקובץ.

from contextlib import asynccontextmanager  # מאפשר לכתוב פונקציה עם "לפני" ו"אחרי" סביב yield

from fastapi import FastAPI, HTTPException  # מחלקת האפליקציה, ושגיאת HTTP שאפשר לזרוק מנתיב
from fastapi.exceptions import RequestValidationError  # סוג השגיאה של קלט לא תקין
from fastapi.middleware.cors import CORSMiddleware  # רכיב שמוסיף כותרות CORS לתגובות
from starlette.exceptions import HTTPException as StarletteHTTPException  # שגיאת HTTP הבסיסית

from app.errors import (  # שלושת מטפלי השגיאות שכתבנו ב-errors.py
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)


@asynccontextmanager  # הופך את הפונקציה ל"מנהל הקשר": הקוד לפני yield רץ בעלייה, אחריו – בכיבוי
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup; close the connection on shutdown."""
    from app.db import close_db, connect_db  # noqa: PLC0415  (ייבוא בתוך פונקציה – מכוון, ההערה משתיקה את ה-linter)

    await connect_db()  # כשהשרת עולה: מתחברים למסד ויוצרים אינדקסים
    yield  # כאן השרת רץ ומטפל בבקשות
    await close_db()  # כשהשרת נכבה: סוגרים את החיבור למסד


def create_app() -> FastAPI:
    # מייבאים את ההגדרות רק כשהפונקציה רצה (ולא בטעינת הקובץ),
    # כדי שהטסטים יוכלו לשנות משתני סביבה לפני שהאפליקציה נוצרת
    from app.config import get_settings  # noqa: PLC0415

    settings = get_settings()  # קריאת ההגדרות ממשתני הסביבה

    app = FastAPI(  # יצירת האפליקציה
        title="FocusFlow API",  # השם שמופיע בדף התיעוד
        lifespan=lifespan,  # מה לעשות בעלייה ובכיבוי (הפונקציה למעלה)
        docs_url="/docs",  # כתובת דף התיעוד האינטראקטיבי (Swagger)
        redoc_url="/redoc",  # כתובת תיעוד נוסף בסגנון ReDoc
    )

    # CORS: הדפדפן חוסם קריאות מאתר אחד לשרת בכתובת אחרת, אלא אם השרת מאשר זאת בכותרות.
    # כאן מאשרים רק את האתרים שברשימה מההגדרות (למשל http://localhost:3000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,  # רשימת האתרים המורשים
        allow_credentials=True,  # מותר לשלוח פרטי הזדהות עם הבקשה
        allow_methods=["*"],  # כל שיטות ה-HTTP מותרות (GET, POST, DELETE...)
        allow_headers=["Authorization", "Content-Type"],  # רק הכותרות שאנחנו באמת צריכים
    )

    # רישום מטפלי השגיאות: לכל סוג שגיאה – הפונקציה שתהפוך אותה ל-{"message": ...}
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # 401/404/409 וכו'
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # 422 קלט לא תקין
    app.add_exception_handler(Exception, unhandled_exception_handler)  # כל השאר → 500

    # ── נתיבים ──────────────────────────────────────────────────────────────

    from app.routers import auth, content, sessions, users  # noqa: PLC0415  (קבצי הנתיבים מתיקיית routers)

    app.include_router(auth.router)  # /api/auth/... – הרשמה, התחברות, התנתקות
    app.include_router(users.router)  # /api/users/... – פרופיל המשתמש
    app.include_router(content.router)  # /api/content/... – הספרייה
    app.include_router(sessions.router)  # /api/sessions/... – סשנים ומדידות

    @app.get("/health", tags=["ops"])  # נתיב בדיקת תקינות (בלי /api), משמש את Docker ואת הענן
    async def health():
        """Liveness + readiness probe. Returns 200 only when MongoDB is reachable."""
        import app.db as db_module  # noqa: PLC0415  (מייבאים את המודול כדי לקרוא את _db העדכני)

        db = db_module._db  # החיבור הנוכחי למסד
        if db is None:  # אין חיבור בכלל
            raise HTTPException(status_code=503, detail="database unavailable")  # 503 = השירות לא זמין
        try:
            await db.command("ping")  # בודקים שהמסד באמת עונה עכשיו
        except Exception:  # כל תקלה בחיבור
            raise HTTPException(status_code=503, detail="database unavailable")
        return {"status": "ok"}  # הכל תקין → 200

    return app  # מחזירים את האפליקציה המוכנה


# האפליקציה נוצרת כבר בטעינת הקובץ (uvicorn מחפש את app.main:app);
# לכן בטסטים, conftest חייב להגדיר את משתני הסביבה לפני שהוא מייבא את הקובץ הזה
app = create_app()
