"""Auth dependency, /api/users/me and logout tests."""
# טסטים ל"שומר" (get_current_user), לנתיב /api/users/me ולהתנתקות.
# (בזכות asyncio_mode = auto ב-pytest.ini לא צריך @pytest.mark.asyncio על כל טסט)

import time  # הזמן הנוכחי בשניות – ליצירת טוקנים ידנית
import uuid  # מזהה ייחודי לשדה jti

import jwt  # ליצירת טוקנים "מזויפים" ופגי תוקף

from app.config import get_settings  # כדי לחתום עם הסוד האמיתי של הטסטים
from app.security import create_access_token  # יצירת טוקן אמיתי
from tests.helpers import auth_headers  # הרשמה + התחברות


def bearer(token):  # בונה כותרת Authorization מטוקן
    return {"Authorization": f"Bearer {token}"}


async def test_me_without_token_is_401(client):  # בלי טוקן בכלל
    response = await client.get("/api/users/me")
    assert response.status_code == 401
    assert response.json() == {"message": "Not authenticated"}


async def test_me_with_garbage_token_is_401(client):  # טוקן שהוא סתם טקסט
    assert (await client.get("/api/users/me", headers=bearer("garbage"))).status_code == 401


async def test_me_with_other_scheme_is_401(client):  # שיטת הזדהות אחרת (Basic במקום Bearer)
    response = await client.get("/api/users/me", headers={"Authorization": "Basic abc"})
    assert response.status_code == 401


async def test_me_with_token_signed_by_another_secret_is_401(client):  # טוקן שנראה תקין אבל נחתם בסוד אחר
    now = int(time.time())  # עכשיו, בשניות
    fake = jwt.encode(  # בונים טוקן עם כל השדות הנכונים...
        {"sub": "0" * 24, "ver": 0, "jti": str(uuid.uuid4()), "iat": now, "exp": now + 600},
        "another-secret-another-secret-12345",  # ...אבל עם סוד שהשרת לא מכיר
        algorithm="HS256",
    )
    assert (await client.get("/api/users/me", headers=bearer(fake))).status_code == 401  # החתימה לא תואמת → 401


async def test_me_with_expired_token_is_401(client):  # טוקן שפג תוקפו
    headers = await auth_headers(client)  # יוצרים משתמש אמיתי
    me = (await client.get("/api/users/me", headers=headers)).json()  # כדי לקבל את המזהה שלו
    now = int(time.time())
    expired = jwt.encode(  # טוקן עם הסוד הנכון, אבל exp בעבר (לפני 50 שניות)
        {"sub": me["id"], "ver": 0, "jti": str(uuid.uuid4()), "iat": now - 100, "exp": now - 50},
        get_settings().JWT_SECRET,
        algorithm="HS256",
    )
    assert (await client.get("/api/users/me", headers=bearer(expired))).status_code == 401


async def test_me_with_valid_token(client):  # המקרה התקין
    response = await client.get("/api/users/me", headers=await auth_headers(client))
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"id", "email", "display_name", "created_at"}  # בדיוק השדות האלה – בלי password_hash
    assert body["created_at"].endswith("Z")  # התאריך ב-UTC עם Z


async def test_token_for_deleted_or_unknown_user_is_401(client):  # טוקן תקין של משתמש שלא קיים
    token, _ = create_access_token("0" * 24, 0)  # מזהה של 24 אפסים – תקין בפורמט, אבל אין משתמש כזה
    assert (await client.get("/api/users/me", headers=bearer(token))).status_code == 401


async def test_token_with_old_version_is_401(client, db):  # מדמה החלפת סיסמה
    headers = await auth_headers(client)
    # מעלים את token_version ישירות במסד – הטוקן שנוצר קודם מחזיק בגרסה הישנה
    await db.users.update_one({"email_lower": "alice@test.com"}, {"$inc": {"token_version": 1}})
    assert (await client.get("/api/users/me", headers=headers)).status_code == 401


async def test_logout_revokes_only_this_token(client, db):  # התנתקות מבטלת רק את הטוקן שהתנתק
    first = await auth_headers(client)  # "מכשיר" ראשון
    second = await auth_headers(client)  # "מכשיר" שני של אותו משתמש
    response = await client.post("/api/auth/logout", headers=first)  # מתנתקים רק מהראשון
    assert response.status_code == 204
    assert response.content == b""  # 204 = גוף ריק
    assert (await client.get("/api/users/me", headers=first)).status_code == 401  # הראשון כבר לא עובד
    assert (await client.get("/api/users/me", headers=second)).status_code == 200  # השני עדיין עובד
    revoked = await db.revoked_tokens.find_one()  # במסד נשמר רישום הביטול
    assert revoked["jti"] and revoked["expires_at"]  # עם מזהה הטוקן ותאריך התפוגה


async def test_logout_without_token_is_401(client):  # אי אפשר להתנתק בלי להיות מחובר
    assert (await client.post("/api/auth/logout")).status_code == 401
