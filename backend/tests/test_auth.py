"""Register and login API tests."""
# טסטים להרשמה ולהתחברות.

import asyncio  # asyncio.gather – לשלוח שתי בקשות במקביל

from tests.helpers import PW, login, register  # פונקציות העזר


async def test_register_returns_201_without_password_data(client):  # הרשמה תקינה
    response = await register(client)
    assert response.status_code == 201  # 201 = נוצר
    body = response.json()
    assert set(body) == {"id", "email", "display_name"}  # בדיוק השדות האלה – בלי סיסמה או hash
    assert body["email"] == "alice@test.com"
    assert isinstance(body["id"], str)  # המזהה הוא מחרוזת (לא ObjectId)


async def test_password_is_stored_as_bcrypt_hash(client, db):  # מה נשמר במסד
    await register(client)
    doc = await db.users.find_one({"email_lower": "alice@test.com"})  # קוראים ישירות מהמסד
    assert doc["password_hash"].startswith("$2b$12$")  # $2b$ = bcrypt, 12 = מספר הסבבים (cost)
    assert doc["token_version"] == 0  # גרסת טוקנים התחלתית


async def test_duplicate_email_with_different_case_is_409(client):  # אותו אימייל באותיות גדולות
    await register(client)
    response = await register(client, email="ALICE@Test.com")
    assert response.status_code == 409  # נחשב לאותו אימייל
    assert response.json() == {"message": "Email already registered"}


async def test_parallel_registers_create_one_user(client, db):  # שתי הרשמות באותו רגע
    results = await asyncio.gather(register(client), register(client))  # gather מריץ את שתיהן במקביל
    assert sorted(r.status_code for r in results) == [201, 409]  # בדיוק אחת הצליחה ואחת נדחתה
    assert await db.users.count_documents({"email_lower": "alice@test.com"}) == 1  # ובמסד יש משתמש אחד


async def test_short_password_is_422(client):  # סיסמה קצרה
    response = await register(client, pw="abc1")
    assert response.status_code == 422
    assert response.json()["message"]  # יש הודעה (לא ריקה)


async def test_password_without_digit_is_422(client):  # בלי ספרה
    assert (await register(client, pw="abcdefghij")).status_code == 422


async def test_password_with_email_name_is_422(client):  # הסיסמה מכילה את השם מהאימייל
    assert (await register(client, email="dana@test.com", pw="dana12345")).status_code == 422


async def test_invalid_email_is_422_with_message(client):  # אימייל לא בפורמט תקין
    response = await register(client, email="not-an-email")
    assert response.status_code == 422
    assert "message" in response.json()  # השגיאה עברה דרך מטפל השגיאות שלנו


async def test_blank_display_name_is_422(client):  # שם תצוגה ריק
    assert (await register(client, display_name="   ")).status_code == 422


async def test_login_returns_token(client):  # התחברות תקינה
    await register(client)
    response = await login(client)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"access_token", "token_type", "expires_in"}  # השדות שהמטלה דורשת
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600  # 60 דקות בשניות


async def test_login_email_is_case_insensitive(client):  # התחברות לא תלויה באותיות גדולות/קטנות
    await register(client)
    assert (await login(client, email="Alice@TEST.com")).status_code == 200


async def test_wrong_password_and_unknown_email_look_the_same(client):  # לא חושפים אילו אימיילים רשומים
    await register(client)
    wrong = await login(client, pw="Wrong1234")  # סיסמה שגויה למשתמש קיים
    unknown = await login(client, email="nobody@test.com", pw="Wrong1234")  # משתמש שלא קיים
    assert wrong.status_code == unknown.status_code == 401  # אותו קוד
    assert wrong.json() == unknown.json() == {"message": "Incorrect email or password"}  # ואותה הודעה


async def test_sixth_failure_is_429_even_with_right_password(client):  # הגבלת ניסיונות
    await register(client)
    for _ in range(5):  # 5 ניסיונות כושלים (_ = משתנה שלא משתמשים בו)
        assert (await login(client, pw="Wrong1234")).status_code == 401
    blocked = await login(client, pw="Wrong1234")  # השישי
    assert blocked.status_code == 429  # חסום
    assert "Too many" in blocked.json()["message"]
    assert (await login(client, pw=PW)).status_code == 429  # חסום גם עם הסיסמה הנכונה


async def test_limit_is_per_email(client):  # ההגבלה נפרדת לכל אימייל
    await register(client)
    for _ in range(5):  # 5 כישלונות לאימייל אחר
        await login(client, email="other@test.com", pw="Wrong1234")
    assert (await login(client)).status_code == 200  # אליס לא נחסמה בגללם


async def test_success_clears_failed_attempts(client, db):  # הצלחה מאפסת את המונה
    await register(client)
    await login(client, pw="Wrong1234")  # כישלון אחד
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 1
    await login(client)  # הצלחה
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 0  # נמחק


async def test_no_response_contains_the_hash(client):  # ה-hash לא מופיע באף תשובה
    responses = [await register(client), await login(client), await register(client)]  # הרשמה, התחברות, הרשמה כפולה (409)
    for response in responses:
        assert "password_hash" not in response.text  # לא שם השדה
        assert "$2b$" not in response.text  # ולא ערך שנראה כמו hash של bcrypt
