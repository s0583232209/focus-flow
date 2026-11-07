"""Profile API tests: rename, change password, delete account."""

from tests.helpers import PW, auth_headers, login

NEW_PW = "NewPassw0rd9"
VIDEO = {"title": "Video", "type": "youtube", "source": "https://youtu.be/dQw4w9WgXcQ"}


def change(current, new):
    return {"current_password": current, "new_password": new}


async def test_rename_strips_and_persists(client):
    headers = await auth_headers(client)
    response = await client.patch(
        "/api/users/me", json={"display_name": "  Dan Cohen  "}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Dan Cohen"
    assert (await client.get("/api/users/me", headers=headers)).json()["display_name"] == "Dan Cohen"


async def test_blank_name_is_422(client):
    headers = await auth_headers(client)
    response = await client.patch("/api/users/me", json={"display_name": "   "}, headers=headers)
    assert response.status_code == 422


async def test_wrong_current_password_is_400(client):
    headers = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change("Wrong1234", NEW_PW), headers=headers
    )
    assert response.status_code == 400
    assert response.json() == {"message": "Current password is incorrect"}


async def test_weak_new_password_is_422(client):
    headers = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change(PW, "short1"), headers=headers
    )
    assert response.status_code == 422


async def test_change_password_ends_all_old_tokens(client):
    device_a = await auth_headers(client)
    device_b = await auth_headers(client)
    response = await client.post(
        "/api/users/me/password", json=change(PW, NEW_PW), headers=device_a
    )
    assert response.status_code == 204
    assert (await client.get("/api/users/me", headers=device_a)).status_code == 401
    assert (await client.get("/api/users/me", headers=device_b)).status_code == 401

    assert (await login(client)).status_code == 401
    assert (await login(client, pw=NEW_PW)).status_code == 200


async def test_delete_account_removes_all_its_data_only(client, db):
    alice = await auth_headers(client)
    bob = await auth_headers(client, email="bob@test.com")
    alice_id = (await client.get("/api/users/me", headers=alice)).json()["id"]

    for headers in (alice, bob):
        content = (await client.post("/api/content", json=VIDEO, headers=headers)).json()
        await client.post("/api/sessions", json={"content_id": content["id"]}, headers=headers)
    await login(client, pw="Wrong1234")
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 1

    assert (await client.delete("/api/users/me", headers=alice)).status_code == 204

    assert (await login(client)).status_code == 401
    assert (await client.get("/api/users/me", headers=alice)).status_code == 401
    assert await db.content.count_documents({"owner_id": alice_id}) == 0
    assert await db.sessions.count_documents({"owner_id": alice_id}) == 0
    assert await db.users.count_documents({"email_lower": "alice@test.com"}) == 0

    assert len((await client.get("/api/content", headers=bob)).json()) == 1
    assert len((await client.get("/api/sessions", headers=bob)).json()) == 1
