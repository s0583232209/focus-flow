"""Content API tests: YouTube link validation and isolation between users."""

import pytest

from app.content_validation import extract_youtube_id, validate_text
from tests.helpers import auth_headers

ID = "dQw4w9WgXcQ"
VIDEO = {"title": "Video", "type": "youtube", "source": f"https://www.youtube.com/watch?v={ID}"}
LONG_TEXT = "a" * 500


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={ID}",
        f"http://youtube.com/watch?v={ID}&t=10s",
        f"https://m.youtube.com/watch?list=abc&v={ID}",
        f"https://youtu.be/{ID}",
        f"https://www.youtube.com/shorts/{ID}",
        f"https://www.youtube.com/embed/{ID}",
    ],
)
def test_valid_youtube_links(url):
    assert extract_youtube_id(url) == ID


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",
        f"https://youtube.com.evil.com/watch?v={ID}",
        f"https://evil.com/youtube.com/watch?v={ID}",
        "https://www.youtube.com/watch?v=short",
        f"https://www.youtube.com/watch?v={ID}extra",
        f"ftp://youtube.com/watch?v={ID}",
        "https://www.youtube.com/",
        f"https://youtu.be/{ID}/more",
        "not a url",
        "",
    ],
)
def test_invalid_youtube_links(url):
    assert extract_youtube_id(url) is None


def test_validate_text_limits():
    assert validate_text("  " + "a" * 20 + "  ") == "a" * 20
    assert validate_text("a" * 19) is None
    assert validate_text("a" * 100_001) is None


async def test_create_youtube_item(client):
    response = await client.post("/api/content", json=VIDEO, headers=await auth_headers(client))
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "title", "type", "source", "video_id", "created_at"}
    assert body["video_id"] == ID
    assert body["created_at"].endswith("Z")


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "x", "type": "youtube", "source": "javascript:alert(1)"},
        {"title": "x", "type": "youtube", "source": f"https://youtube.com.evil.com/watch?v={ID}"},
        {"title": "x", "type": "text", "source": "too short"},
        {"title": "x", "type": "pdf", "source": "abc"},
        {"title": "   ", "type": "youtube", "source": f"https://youtu.be/{ID}"},
        {"title": "x" * 201, "type": "youtube", "source": f"https://youtu.be/{ID}"},
    ],
)
async def test_invalid_content_is_422_with_message(client, payload):
    response = await client.post("/api/content", json=payload, headers=await auth_headers(client))
    assert response.status_code == 422
    assert response.json()["message"]


async def test_list_is_newest_first_and_previews_text(client):
    headers = await auth_headers(client)
    await client.post("/api/content", json=VIDEO, headers=headers)
    created = await client.post(
        "/api/content",
        json={"title": "<b>Text</b>", "type": "text", "source": LONG_TEXT},
        headers=headers,
    )
    items = (await client.get("/api/content", headers=headers)).json()
    assert [i["type"] for i in items] == ["text", "youtube"]
    assert len(items[0]["source"]) == 200

    full = (await client.get(f"/api/content/{created.json()['id']}", headers=headers)).json()
    assert len(full["source"]) == 500
    assert full["title"] == "<b>Text</b>"


async def test_second_user_sees_nothing(client):
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    item = (await client.post("/api/content", json=VIDEO, headers=alice)).json()
    path = f"/api/content/{item['id']}"

    assert (await client.get("/api/content", headers=bob)).json() == []

    for response in [await client.get(path, headers=bob), await client.delete(path, headers=bob)]:
        assert response.status_code == 404
        assert response.json() == {"message": "Content not found"}

    assert (await client.get(path, headers=alice)).status_code == 200


async def test_owner_id_in_the_body_is_ignored(client, db):
    alice = await auth_headers(client)
    me = (await client.get("/api/users/me", headers=alice)).json()
    response = await client.post(
        "/api/content", json={**VIDEO, "owner_id": "0" * 24}, headers=alice
    )
    assert response.status_code == 201
    doc = await db.content.find_one({})
    assert doc["owner_id"] == me["id"]


async def test_bad_id_and_delete(client):
    headers = await auth_headers(client)
    bad = await client.get("/api/content/abc", headers=headers)
    assert bad.status_code == 404
    assert bad.json() == {"message": "Content not found"}

    item = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
    path = f"/api/content/{item['id']}"
    assert (await client.delete(path, headers=headers)).status_code == 204
    assert (await client.get(path, headers=headers)).status_code == 404


async def test_content_requires_login(client):
    assert (await client.get("/api/content")).status_code == 401
    assert (await client.post("/api/content", json=VIDEO)).status_code == 401
