"""Profile API tests: rename, change password, delete account."""
# טסטים לפרופיל: שינוי שם, החלפת סיסמה ומחיקת חשבון.

from tests.helpers import PW, auth_headers, login  # סיסמת ברירת המחדל ופונקציות העזר

NEW_PW = "NewPassw0rd9"  # סיסמה חדשה ותקינה
VIDEO = {"title": "Video", "type": "youtube", "source": "https://youtu.be/dQw4w9WgXcQ"}  # פריט תוכן לדוגמה


def change(current, new):  # בונה את גוף הבקשה להחלפת סיסמה
    return {"current_password": current, "new_password": new}


async def test_rename_strips_and_persists(client):  # שינוי שם מסיר רווחים ונשמר
    headers = await auth_headers(client)
    response = await client.patch(
        "/api/users/me", json={"display_name": "  Dan Cohen  "}, headers=headers  # שם עם רווחים בקצוות
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Dan Cohen"  # הרווחים הוסרו
    # קריאה נוספת מוכיחה שהשם באמת נשמר במסד
    assert (await client.get("/api/users/me", headers=headers)).json()["display_name"] == "Dan Cohen"


async def test_blank_name_is_422(client):  # שם שכולו רווחים
    headers = await auth_headers(client)
    response = await client.patch("/api/users/me", json={"display_name": "   "}, headers=headers)
    assert response.status_code == 422  # אחרי הסרת רווחים הוא ריק → לא תקין


async def test_wrong_current_password_is_400(client):  # סיסמה נוכחית שגויה
    headers = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change("Wrong1234", NEW_PW), headers=headers
    )
    assert response.status_code == 400
    assert response.json() == {"message": "Current password is incorrect"}


async def test_weak_new_password_is_422(client):  # סיסמה חדשה חלשה
    headers = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change(PW, "short1"), headers=headers  # רק 6 תווים
    )
    assert response.status_code == 422


async def test_change_password_ends_all_old_tokens(client):  # החלפת סיסמה מנתקת את כל המכשירים
    device_a = await auth_headers(client)  # שני טוקנים = שני מכשירים
    device_b = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change(PW, NEW_PW), headers=device_a  # מחליפים סיסמה ממכשיר A
    )
    assert response.status_code == 204
    assert (await client.get("/api/users/me", headers=device_a)).status_code == 401  # A כבר לא עובד
    assert (await client.get("/api/users/me", headers=device_b)).status_code == 401  # וגם B לא

    assert (await login(client)).status_code == 401  # הסיסמה הישנה לא עובדת
    assert (await login(client, pw=NEW_PW)).status_code == 200  # החדשה כן


async def test_delete_account_removes_all_its_data_only(client, db):  # מחיקה מוחקת רק את הנתונים של המשתמש
    alice = await auth_headers(client)  # משתמשת שתימחק
    bob = await auth_headers(client, email="bob@test.com")  # משתמש שצריך להישאר בלי פגע
    alice_id = (await client.get("/api/users/me", headers=alice)).json()["id"]

    for headers in (alice, bob):  # לכל אחד מהם: פריט תוכן וסשן
        content = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
        await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)
    await login(client, pw="Wrong1234")  # ניסיון התחברות כושל של אליס
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 1  # נרשם במסד

    assert (await client.delete("/api/users/me", headers=alice)).status_code == 204  # מחיקת החשבון

    assert (await login(client)).status_code == 401  # אי אפשר להתחבר יותר
    assert (await client.get("/api/users/me", headers=alice)).status_code == 401  # והטוקן הישן לא עובד
    assert await db.content.count_documents({"owner_id": alice_id}) == 0  # אין לה תוכן
    assert await db.sessions.count_documents({"owner_id": alice_id}) == 0  # אין לה סשנים
    assert await db.users.count_documents({"email_lower": "alice@test.com"}) == 0  # והמשתמשת עצמה נמחקה

    # הנתונים של בוב לא נפגעו
    assert len((await client.get("/api/content", headers=bob)).json()) == 1
    assert len((await client.get("/api/sessions", headers=bob)).json()) == 1
