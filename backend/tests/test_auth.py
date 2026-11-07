"""Register and login API tests."""

import asyncio

from tests.helpers import PW, login, register


async def test_register_returns_201_without_password_data(client):
    response = await register(client)
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "email", "display_name"}
    assert body["email"] == "alice@test.com"
    assert isinstance(body["id"], str)


async def test_password_is_stored_as_bcrypt_hash(client, db):
    await register(client)
    doc = await db.users.find_one({"email_lower": "alice@test.com"})
    assert doc["password_hash"].startswith("$2b$12$")
    assert doc["token_version"] == 0


async def test_duplicate_email_with_different_case_is_409(client):
    await register(client)
    response = await register(client, email="ALICE@Test.com")
    assert response.status_code == 409
    assert response.json() == {"message": "Email already registered"}


async def test_parallel_registers_create_one_user(client, db):
    results = await asyncio.gather(register(client), register(client))
    assert sorted(r.status_code for r in results) == [201, 409]
    assert await db.users.count_documents({"email_lower": "alice@test.com"}) == 1


async def test_short_password_is_422(client):
    response = await register(client, pw="abc1")
    assert response.status_code == 422
    assert response.json()["message"]


async def test_password_without_digit_is_422(client):
    assert (await register(client, pw="abcdefghij")).status_code == 422


async def test_password_with_email_name_is_422(client):
    assert (await register(client, email="dana@test.com", pw="dana12345")).status_code == 422


async def test_invalid_email_is_422_with_message(client):
    response = await register(client, email="not-an-email")
    assert response.status_code == 422
    assert "message" in response.json()


async def test_blank_display_name_is_422(client):
    assert (await register(client, display_name="   ")).status_code == 422


async def test_login_returns_token(client):
    await register(client)
    response = await login(client)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"access_token", "token_type", "expires_in"}
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600


async def test_login_email_is_case_insensitive(client):
    await register(client)
    assert (await login(client, email="Alice@TEST.com")).status_code == 200


async def test_wrong_password_and_unknown_email_look_the_same(client):
    await register(client)
    wrong = await login(client, pw="Wrong1234")
    unknown = await login(client, email="nobody@test.com", pw="Wrong1234")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"message": "Incorrect email or password"}


async def test_sixth_failure_is_429_even_with_right_password(client):
    await register(client)
    for _ in range(5):
        assert (await login(client, pw="Wrong1234")).status_code == 401
    blocked = await login(client, pw="Wrong1234")
    assert blocked.status_code == 429
    assert "Too many" in blocked.json()["message"]
    assert (await login(client, pw=PW)).status_code == 429


async def test_limit_is_per_email(client):
    await register(client)
    for _ in range(5):
        await login(client, email="other@test.com", pw="Wrong1234")
    assert (await login(client)).status_code == 200


async def test_success_clears_failed_attempts(client, db):
    await register(client)
    await login(client, pw="Wrong1234")
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 1
    await login(client)
    assert await db.login_attempts.count_documents({"email_lower": "alice@test.com"}) == 0


async def test_no_response_contains_the_hash(client):
    responses = [await register(client), await login(client), await register(client)]
    for response in responses:
        assert "password_hash" not in response.text
        assert "$2b$" not in response.text
