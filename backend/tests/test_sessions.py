"""Sessions and readings API tests."""

import pytest

from tests.helpers import auth_headers

VIDEO = {"title": "Video", "type": "youtube", "source": "https://youtu.be/dQw4w9WgXcQ"}


async def setup_session(client, headers):
    content = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
    session = await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)
    assert session.status_code == 201
    return content, session.json()


async def add(client, headers, session_id, score=0.5, position=5):
    return await client.post(
        f"/api/sessions/{session_id}/readings",
        json={"position": position, "score": score},
        headers=headers,
    )


async def test_full_flow_gives_average_and_count(client):
    headers = await auth_headers(client)
    content, session = await setup_session(client, headers)
    assert set(session) == {"id", "content_id", "started_at"}
    assert session["content_id"] == content["id"]

    for score in (0.2, 0.6, 1.0):
        response = await add(client, headers, session["id"], score)
        assert response.status_code == 201
        assert set(response.json()) == {"position", "score", "created_at"}

    ended = await client.post(f"/api/sessions/{session['id']}/end", headers=headers)
    assert ended.status_code == 200
    body = ended.json()
    assert body["reading_count"] == 3
    assert body["average_score"] == 0.6
    assert body["ended_at"].endswith("Z")
    assert body["content_title"] == "Video"

    again = await client.post(f"/api/sessions/{session['id']}/end", headers=headers)
    assert again.json() == body


async def test_reading_after_end_is_409(client):
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    await client.post(f"/api/sessions/{session['id']}/end", headers=headers)
    response = await add(client, headers, session["id"])
    assert response.status_code == 409
    assert response.json() == {"message": "Session already ended"}


@pytest.mark.parametrize(
    "payload",
    [
        {"position": 1, "score": 1.5},
        {"position": 1, "score": -0.1},
        {"position": -1, "score": 0.5},
        {"position": 1},
        {"score": 0.5},
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


async def test_end_without_readings_has_null_average(client):
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    body = (await client.post(f"/api/sessions/{session['id']}/end", headers=headers)).json()
    assert body["reading_count"] == 0
    assert body["average_score"] is None


async def test_another_user_gets_404_on_every_route(client):
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    content, session = await setup_session(client, alice)
    sid = session["id"]

    responses = [
        await client.get(f"/api/sessions/{sid}", headers=bob),
        await client.post(f"/api/sessions/{sid}/end", headers=bob),
        await add(client, bob, sid),
        await client.post("/api/sessions", json={"content_id": content["id"]}, headers=bob),
    ]
    assert [r.status_code for r in responses] == [404, 404, 404, 404]
    assert (await client.get("/api/sessions", headers=bob)).json() == []

    # Bob's attempts changed nothing.
    mine = (await client.get(f"/api/sessions/{sid}", headers=alice)).json()
    assert mine["ended_at"] is None
    assert mine["readings"] == []


async def test_ended_session_of_another_user_is_404_not_409(client):
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    _, session = await setup_session(client, alice)
    await client.post(f"/api/sessions/{session['id']}/end", headers=alice)
    assert (await add(client, bob, session["id"])).status_code == 404


async def test_list_has_summaries_without_readings(client):
    headers = await auth_headers(client)
    content, first = await setup_session(client, headers)
    await add(client, headers, first["id"], 0.4)
    second = await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)

    items = (await client.get("/api/sessions", headers=headers)).json()
    assert [i["id"] for i in items] == [second.json()["id"], first["id"]]
    assert all("readings" not in i for i in items)
    assert items[1]["reading_count"] == 1
    assert items[1]["average_score"] == 0.4


async def test_get_has_summary_and_readings(client):
    headers = await auth_headers(client)
    _, session = await setup_session(client, headers)
    await add(client, headers, session["id"], 0.4, 7)
    body = (await client.get(f"/api/sessions/{session['id']}", headers=headers)).json()
    assert body["reading_count"] == 1
    assert body["readings"][0]["position"] == 7
    assert body["readings"][0]["score"] == 0.4
    assert body["readings"][0]["created_at"].endswith("Z")


async def test_bad_id_is_404(client):
    headers = await auth_headers(client)
    assert (await client.get("/api/sessions/abc", headers=headers)).status_code == 404
    assert (await client.post("/api/sessions/abc/end", headers=headers)).status_code == 404
    assert (await add(client, headers, "abc")).status_code == 404


async def test_deleting_content_deletes_its_sessions(client):
    headers = await auth_headers(client)
    content, session = await setup_session(client, headers)
    await client.delete(f"/api/content/{content['id']}", headers=headers)
    assert (await client.get(f"/api/sessions/{session['id']}", headers=headers)).status_code == 404
