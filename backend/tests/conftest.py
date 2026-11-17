"""Pytest configuration and shared fixtures for the FocusFlow backend test suite."""
# קובץ conftest.py נטען אוטומטית על ידי pytest לפני כל הטסטים.
# כאן מגדירים את הסביבה ואת ה-fixtures (רכיבים משותפים) שכל הטסטים משתמשים בהם.

import os  # גישה למשתני סביבה

# ---------------------------------------------------------------------------
# חייבים להגדיר את משתני הסביבה לפני שמייבאים משהו מהאפליקציה, כי ההגדרות נקראות בייבוא.
# os.environ[...] = ... תמיד דורס, כך שהערכים כאן הם הקובעים.
# ---------------------------------------------------------------------------
os.environ["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017")  # אם לא הוגדר – Mongo מקומי
# מוסיפים _test לשם המסד, כדי שהטסטים לעולם לא ייגעו במסד האמיתי (הם מוחקים אותו בסוף!)
os.environ["MONGO_DB"] = os.environ.get("MONGO_DB", "focusflow") + "_test"
os.environ["JWT_SECRET"] = os.environ.get(  # סוד לטסטים בלבד (לפחות 32 תווים, אחרת השרת לא עולה)
    "JWT_SECRET", "test-secret-that-is-at-least-32-characters"
)
os.environ["CORS_ORIGINS"] = os.environ.get("CORS_ORIGINS", "http://localhost:3000")

# get_settings שומר את התוצאה בזיכרון (lru_cache). מנקים אותו כדי שייקרא מחדש עם שם המסד של הטסטים
from app.config import get_settings  # noqa: E402  (ייבוא לא בראש הקובץ – מכוון)

get_settings.cache_clear()

import pytest  # noqa: E402  ספריית הטסטים
import pytest_asyncio  # noqa: E402  תוסף לטסטים אסינכרוניים (async def)
import app.db as db_module  # noqa: E402  מודול המסד – כדי להתחבר ולנתק ישירות
from httpx import ASGITransport, AsyncClient  # noqa: E402  לקוח HTTP ששולח בקשות ישר לאפליקציה, בלי רשת אמיתית

from app.main import app  # noqa: E402  האפליקציה עצמה


@pytest.fixture(scope="session")  # fixture שנוצר פעם אחת לכל הרצת הטסטים
def test_db_name() -> str:
    return os.environ["MONGO_DB"]  # כבר כולל את הסיומת _test


@pytest_asyncio.fixture  # fixture אסינכרוני; נוצר מחדש לכל טסט
async def client(test_db_name):
    """
    Per-test AsyncClient with a live DB connection and an empty test database.

    Connects app.db directly (so the same _db is visible to routes), runs the
    test, drops the test database and disconnects. Function scope avoids
    cross-event-loop issues with the async Mongo client in pytest-asyncio.
    """
    # כל טסט מקבל לקוח HTTP ומסד ריק. בסוף הטסט המסד נמחק – כך טסטים לא משפיעים זה על זה
    assert test_db_name.endswith("_test")  # הגנה: לא ממשיכים אם בטעות זה לא מסד טסטים
    await db_module.connect_db()  # התחברות למסד (אותו חיבור שהנתיבים משתמשים בו)

    try:
        async with AsyncClient(  # יצירת לקוח HTTP שמדבר ישירות עם האפליקציה
            transport=ASGITransport(app=app), base_url="http://test"  # base_url הוא סתם שם; אין רשת אמיתית
        ) as ac:
            yield ac  # הטסט רץ כאן ומקבל את הלקוח
    finally:  # רץ תמיד, גם אם הטסט נכשל
        await db_module._client.drop_database(test_db_name)  # מחיקת מסד הטסטים
        await db_module.close_db()  # ניתוק


@pytest_asyncio.fixture
async def db(client):  # תלוי ב-client, כך שהחיבור כבר פתוח
    """The live test database, for tests that look at what was stored."""
    # לטסטים שרוצים לבדוק ישירות מה נשמר במסד (למשל שהסיסמה שמורה כ-hash)
    return db_module._db
