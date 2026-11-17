"""Content API tests: YouTube link validation and isolation between users."""
# טסטים לספרייה: בדיקת קישורי YouTube, ובעיקר הפרדה בין משתמשים.

import pytest  # ספריית הטסטים

from app.content_validation import extract_youtube_id, validate_text  # הפונקציות שנבדקות ישירות
from tests.helpers import auth_headers  # הרשמה + התחברות

ID = "dQw4w9WgXcQ"  # מזהה סרטון תקין (11 תווים)
VIDEO = {"title": "Video", "type": "youtube", "source": f"https://www.youtube.com/watch?v={ID}"}  # פריט סרטון לדוגמה
LONG_TEXT = "a" * 500  # טקסט של 500 תווים – לבדוק שהרשימה מקצרת אותו


@pytest.mark.parametrize(  # כל קישור ברשימה = טסט נפרד
    "url",
    [
        f"https://www.youtube.com/watch?v={ID}",  # הקישור הרגיל
        f"http://youtube.com/watch?v={ID}&t=10s",  # http, בלי www, עם פרמטר זמן
        f"https://m.youtube.com/watch?list=abc&v={ID}",  # גרסת מובייל, v לא ראשון
        f"https://youtu.be/{ID}",  # קישור מקוצר
        f"https://www.youtube.com/shorts/{ID}",  # Shorts
        f"https://www.youtube.com/embed/{ID}",  # קישור הטמעה
    ],
)
def test_valid_youtube_links(url):
    assert extract_youtube_id(url) == ID  # מכל הפורמטים יוצא אותו מזהה


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",  # קוד זדוני במקום קישור
        f"https://youtube.com.evil.com/watch?v={ID}",  # דומיין מתחזה
        f"https://evil.com/youtube.com/watch?v={ID}",  # youtube.com רק בנתיב, לא בשרת
        "https://www.youtube.com/watch?v=short",  # מזהה קצר מדי
        f"https://www.youtube.com/watch?v={ID}extra",  # מזהה ארוך מדי
        f"ftp://youtube.com/watch?v={ID}",  # פרוטוקול לא מותר
        "https://www.youtube.com/",  # בלי סרטון
        f"https://youtu.be/{ID}/more",  # חלק מיותר בנתיב
        "not a url",  # סתם טקסט
        "",  # ריק
    ],
)
def test_invalid_youtube_links(url):
    assert extract_youtube_id(url) is None  # כולם נדחים


def test_validate_text_limits():  # גבולות האורך של טקסט
    assert validate_text("  " + "a" * 20 + "  ") == "a" * 20  # רווחים בקצוות מוסרים, 20 תווים בדיוק – תקין
    assert validate_text("a" * 19) is None  # 19 – קצר מדי
    assert validate_text("a" * 100_001) is None  # יותר מ-100,000 – ארוך מדי


async def test_create_youtube_item(client):  # הוספת סרטון דרך ה-API
    response = await client.post("/api/content", json=VIDEO, headers=await auth_headers(client))
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "title", "type", "source", "video_id", "created_at"}  # כל השדות של ContentOut
    assert body["video_id"] == ID  # השרת חילץ את המזהה
    assert body["created_at"].endswith("Z")


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "x", "type": "youtube", "source": "javascript:alert(1)"},  # קישור זדוני
        {"title": "x", "type": "youtube", "source": f"https://youtube.com.evil.com/watch?v={ID}"},  # דומיין מתחזה
        {"title": "x", "type": "text", "source": "too short"},  # טקסט קצר מדי
        {"title": "x", "type": "pdf", "source": "abc"},  # סוג לא נתמך
        {"title": "   ", "type": "youtube", "source": f"https://youtu.be/{ID}"},  # כותרת ריקה
        {"title": "x" * 201, "type": "youtube", "source": f"https://youtu.be/{ID}"},  # כותרת ארוכה מדי
    ],
)
async def test_invalid_content_is_422_with_message(client, payload):
    response = await client.post("/api/content", json=payload, headers=await auth_headers(client))
    assert response.status_code == 422
    assert response.json()["message"]  # עם הודעה


async def test_list_is_newest_first_and_previews_text(client):  # סדר הרשימה וקיצור טקסט
    headers = await auth_headers(client)
    await client.post("/api/content", json=VIDEO, headers=headers)  # קודם סרטון
    created = await client.post(  # אחר כך טקסט (עם תגית HTML בכותרת)
        "/api/content",
        json={"title": "<b>Text</b>", "type": "text", "source": LONG_TEXT},
        headers=headers,
    )
    items = (await client.get("/api/content", headers=headers)).json()
    assert [i["type"] for i in items] == ["text", "youtube"]  # החדש (טקסט) ראשון
    assert len(items[0]["source"]) == 200  # ברשימה הטקסט מקוצר ל-200

    full = (await client.get(f"/api/content/{created.json()['id']}", headers=headers)).json()  # הפריט הבודד
    assert len(full["source"]) == 500  # מלא
    assert full["title"] == "<b>Text</b>"  # נשמר כמו שהוא; הלקוח מציג אותו כטקסט ולא כ-HTML


async def test_second_user_sees_nothing(client):  # הפרדה בין משתמשים
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    item = (await client.post("/api/content", json=VIDEO, headers=alice)).json()  # אליס מוסיפה פריט
    path = f"/api/content/{item['id']}"

    assert (await client.get("/api/content", headers=bob)).json() == []  # הרשימה של בוב ריקה

    for response in [await client.get(path, headers=bob), await client.delete(path, headers=bob)]:  # בוב מנסה לקרוא ולמחוק
        assert response.status_code == 404  # 404 ולא 403 – לא חושפים שהפריט קיים
        assert response.json() == {"message": "Content not found"}

    assert (await client.get(path, headers=alice)).status_code == 200  # הפריט עדיין קיים אצל אליס


async def test_owner_id_in_the_body_is_ignored(client, db):  # אי אפשר "להתחזות" דרך הגוף
    alice = await auth_headers(client)
    me = (await client.get("/api/users/me", headers=alice)).json()
    response = await client.post(
        "/api/content", json={**VIDEO, "owner_id": "0" * 24}, headers=alice  # מנסים לשלוח owner_id אחר
    )
    assert response.status_code == 201
    doc = await db.content.find_one({})
    assert doc["owner_id"] == me["id"]  # נשמר ה-owner_id מהטוקן, לא מהגוף


async def test_bad_id_and_delete(client):  # מזהה לא תקין, ומחיקה
    headers = await auth_headers(client)
    bad = await client.get("/api/content/abc", headers=headers)
    assert bad.status_code == 404  # אותו 404 כמו פריט שלא קיים
    assert bad.json() == {"message": "Content not found"}

    item = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
    path = f"/api/content/{item['id']}"
    assert (await client.delete(path, headers=headers)).status_code == 204  # נמחק
    assert (await client.get(path, headers=headers)).status_code == 404  # ואחר כך לא נמצא


async def test_content_requires_login(client):  # בלי התחברות אין גישה
    assert (await client.get("/api/content")).status_code == 401
    assert (await client.post("/api/content", json=VIDEO)).status_code == 401
