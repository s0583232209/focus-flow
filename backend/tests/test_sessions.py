"""Sessions and readings API tests."""
# טסטים לסשנים ולמדידות.

import pytest  # ספריית הטסטים

from tests.helpers import auth_headers  # הרשמה + התחברות

VIDEO = {"title": "Video", "type": "youtube", "source": "https://youtu.be/dQw4w9WgXcQ"}  # פריט לדוגמה


async def setup_session(client, headers):  # עזר: יוצר פריט ומתחיל עליו סשן
    content = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
    session = await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)
    assert session.status_code == 201
    return content, session.json()  # מחזיר את שניהם


async def add(client, headers, session_id, score=0.5, position=5):  # עזר: שולח מדידה אחת
    return await client.post(
        f"/api/sessions/{session_id}/readings",
        json={"position": position, "score": score},
        headers=headers,
    )


async def test_full_flow_gives_average_and_count(client):  # הזרימה המלאה
    headers = await auth_headers(client)
    content, session = await setup_session(client, headers)
    assert set(session) == {"id", "content_id", "started_at"}  # השדות שחוזרים בהתחלת סשן
    assert session["content_id"] == content["id"]

    for score in (0.2, 0.6, 1.0):  # שלוש מדידות
        response = await add(client, headers, session["id"], score)
        assert response.status_code == 201
        assert set(response.json()) == {"position", "score", "created_at"}

    ended = await client.post(f"/api/sessions/{session['id']}/end", headers=headers)  # סיום
    assert ended.status_code == 200
    body = ended.json()
    assert body["reading_count"] == 3
    assert body["average_score"] == 0.6  # (0.2 + 0.6 + 1.0) / 3
    assert body["ended_at"].endswith("Z")
    assert body["content_title"] == "Video"

    again = await client.post(f"/api/sessions/{session['id']}/end", headers=headers)  # סיום שני
    assert again.json() == body  # בדיוק אותה תשובה (כולל אותו ended_at)


async def test_reading_after_end_is_409(client):  # מדידה לסשן סגור
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)  # _ = לא צריך את הפריט
    await client.post(f"/api/sessions/{session['id']}/end", headers=headers)
    response = await add(client, headers, session["id"])
    assert response.status_code == 409  # התנגשות – הסשן כבר הסתיים
    assert response.json() == {"message": "Session already ended"}


@pytest.mark.parametrize(
    "payload",
    [
        {"position": 1, "score": 1.5},  # ציון מעל 1
        {"position": 1, "score": -0.1},  # ציון שלילי
        {"position": -1, "score": 0.5},  # מיקום שלילי
        {"position": 1},  # חסר ציון
        {"score": 0.5},  # חסר מיקום
    ],
)
async def test_invalid_reading_is_422(client, payload):
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    response = await client.post(
        f"/api/sessions/{session['id']}/readings", json=payload, headers=headers
    )
    assert response.status_code == 422
    assert response.json()["message"]


async def test_end_without_readings_has_null_average(client):  # סשן בלי מדידות
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    body = (await client.post(f"/api/sessions/{session['id']}/end", headers=headers)).json()
    assert body["reading_count"] == 0
    assert body["average_score"] is None  # אין ממוצע (null), ולא 0


async def test_another_user_gets_404_on_every_route(client):  # הפרדה בכל הנתיבים
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    content, session = await setup_session(client, alice)  # הסשן של אליס
    sid = session["id"]

    responses = [  # בוב מנסה כל פעולה אפשרית על הסשן והפריט של אליס
        await client.get(f"/api/sessions/{sid}", headers=bob),  # לקרוא
        await client.post(f"/api/sessions/{sid}/end", headers=bob),  # לסיים
        await add(client, bob, sid),  # להוסיף מדידה
        await client.post("/api/sessions", json={"content_id": content["id"]}, headers=bob),  # להתחיל סשן על הפריט שלה
    ]
    assert [r.status_code for r in responses] == [404, 404, 404, 404]  # תמיד 404
    assert (await client.get("/api/sessions", headers=bob)).json() == []  # הרשימה שלו ריקה

    # הניסיונות של בוב לא שינו כלום
    mine = (await client.get(f"/api/sessions/{sid}", headers=alice)).json()
    assert mine["ended_at"] is None  # עדיין פתוח
    assert mine["readings"] == []  # בלי מדידות


async def test_ended_session_of_another_user_is_404_not_409(client):  # לא מדליפים שהסשן קיים
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    _, session = await setup_session(client, alice)
    await client.post(f"/api/sessions/{session['id']}/end", headers=alice)  # אליס סוגרת
    assert (await add(client, bob, session["id"])).status_code == 404  # לבוב: 404 (409 היה מגלה שהסשן קיים)


async def test_list_has_summaries_without_readings(client):  # רשימת הסשנים
    headers = await auth_headers(client)
    content, first = await setup_session(client, headers)
    await add(client, headers, first["id"], 0.4)  # מדידה אחת בסשן הראשון
    second = await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)  # סשן שני

    items = (await client.get("/api/sessions", headers=headers)).json()
    assert [i["id"] for i in items] == [second.json()["id"], first["id"]]  # החדש ראשון
    assert all("readings" not in i for i in items)  # בלי מערך המדידות
    assert items[1]["reading_count"] == 1  # אבל עם ספירה
    assert items[1]["average_score"] == 0.4  # וממוצע


async def test_get_has_summary_and_readings(client):  # סשן בודד כולל מדידות
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    await add(client, headers, session["id"], 0.4, 7)  # ציון 0.4 במיקום 7
    body = (await client.get(f"/api/sessions/{session['id']}", headers=headers)).json()
    assert body["reading_count"] == 1
    assert body["readings"][0]["position"] == 7
    assert body["readings"][0]["score"] == 0.4
    assert body["readings"][0]["created_at"].endswith("Z")


async def test_bad_id_is_404(client):  # מזהה לא תקין בכל נתיב
    headers = await auth_headers(client)
    assert (await client.get("/api/sessions/abc", headers=headers)).status_code == 404
    assert (await client.post("/api/sessions/abc/end", headers=headers)).status_code == 404
    assert (await add(client, headers, "abc")).status_code == 404


async def test_deleting_content_deletes_its_sessions(client):  # מחיקת פריט מוחקת גם את הסשנים שלו
    headers = await auth_headers(client)
    content, session = await setup_session(client, headers)
    await client.delete(f"/api/content/{content['id']}", headers=headers)
    assert (await client.get(f"/api/sessions/{session['id']}", headers=headers)).status_code == 404
