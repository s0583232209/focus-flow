# החיבור ל-MongoDB: פתיחה, סגירה, יצירת אינדקסים, ופונקציה שנותנת לכל נתיב גישה למסד.

from typing import AsyncGenerator  # רמז טיפוס לפונקציה אסינכרונית שמשתמשת ב-yield

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient  # סדר עולה/יורד לאינדקסים, והלקוח האסינכרוני של MongoDB
from pymongo.asynchronous.database import AsyncDatabase  # הטיפוס של "מסד נתונים" בגרסה האסינכרונית

# משתנים ברמת המודול: נוצרים פעם אחת כשהשרת עולה ומשמשים את כל הבקשות.
# זה לא "מצב בזיכרון" של משתמשים – זה רק החיבור עצמו, ולכן זה בסדר גם בענן עם כמה מופעים.
_client: AsyncMongoClient | None = None  # הלקוח (החיבור לשרת MongoDB); None עד שמתחברים
_db: AsyncDatabase | None = None  # המסד הספציפי שלנו (focusflow); None עד שמתחברים


async def create_indexes(db: AsyncDatabase) -> None:
    """Create all MongoDB indexes (idempotent)."""
    # אינדקס ייחודי על האימייל באותיות קטנות – המסד עצמו ימנע שני משתמשים עם אותו אימייל,
    # גם אם שתי בקשות הרשמה מגיעות באותו רגע בדיוק
    await db.users.create_index("email_lower", unique=True)
    # אינדקס משולב: מאיץ את "כל התוכן של המשתמש, מהחדש לישן"
    await db.content.create_index([("owner_id", ASCENDING), ("created_at", DESCENDING)])
    # אותו רעיון לסשנים: "כל הסשנים של המשתמש, מהחדש לישן"
    await db.sessions.create_index([("owner_id", ASCENDING), ("started_at", DESCENDING)])
    # מאיץ מחיקת כל הסשנים של פריט תוכן מסוים (כשמוחקים את הפריט)
    await db.sessions.create_index("content_id")
    # טוקנים שבוטלו (התנתקות): jti ייחודי כדי לא לשמור אותו טוקן פעמיים
    await db.revoked_tokens.create_index("jti", unique=True)
    # אינדקס TTL: MongoDB מוחק לבד כל מסמך ברגע שהזמן שב-expires_at עבר (0 שניות אחריו).
    # אין טעם לזכור טוקן מבוטל אחרי שהוא פג תוקף ממילא
    await db.revoked_tokens.create_index("expires_at", expireAfterSeconds=0)
    # ניסיונות התחברות כושלים נמחקים אוטומטית אחרי 900 שניות = 15 דקות (חלון ההגבלה)
    await db.login_attempts.create_index("created_at", expireAfterSeconds=900)
    # מאיץ ספירת ניסיונות כושלים לפי אימייל
    await db.login_attempts.create_index("email_lower")


async def connect_db() -> None:
    """Open the MongoDB connection and create indexes."""
    global _client, _db  # אומר לפייתון שנשנה את המשתנים של המודול, ולא ניצור משתנים מקומיים חדשים
    if _db is not None:  # אם כבר מחוברים (למשל בטסטים שקוראים פעמיים)
        return  # לא מתחברים שוב
    from app.config import get_settings  # ייבוא בתוך הפונקציה, כדי שמשתני הסביבה כבר יהיו מוגדרים כשקוראים אותם
    settings = get_settings()  # קריאת ההגדרות (כתובת המסד ושמו)
    _client = AsyncMongoClient(  # יצירת הלקוח (עדיין בלי פנייה אמיתית לשרת)
        settings.MONGO_URL,  # לאן מתחברים
        serverSelectionTimeoutMS=5000,  # אם אין תשובה תוך 5 שניות – שגיאה, במקום לחכות לנצח
    )
    # פקודת ping בודקת כבר עכשיו שהמסד באמת זמין; אם לא – תיזרק שגיאה והשרת לא יעלה
    await _client.admin.command("ping")
    _db = _client[settings.MONGO_DB]  # בחירת המסד לפי השם (אם לא קיים, MongoDB ייצור אותו בכתיבה הראשונה)
    await create_indexes(_db)  # יצירת האינדקסים; אם כבר קיימים, לא קורה כלום


async def close_db() -> None:
    """Close the MongoDB connection."""
    global _client, _db  # נשנה את המשתנים של המודול
    if _client is not None:  # סוגרים רק אם באמת יש חיבור פתוח
        await _client.close()  # סגירת כל החיבורים למסד
        _client = None  # מאפסים, כדי שהמערכת תדע שאין חיבור
        _db = None


async def get_db() -> AsyncGenerator[AsyncDatabase, None]:
    """FastAPI dependency — yields the active database handle."""
    # זו "תלות" (dependency) של FastAPI: כל נתיב שכותב db = Depends(get_db) מקבל את המסד מכאן
    if _db is None:  # אם החיבור לא נפתח – זו תקלה בהפעלה, לא שגיאה של המשתמש
        raise RuntimeError("Database not initialised — lifespan did not run")
    yield _db  # מוסרים את המסד לנתיב שביקש אותו
