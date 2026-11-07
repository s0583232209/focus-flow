"""Auth dependency, /api/users/me and logout tests."""

import time
import uuid

import jwt

from app.config import get_settings
from app.security import create_access_token
from tests.helpers import auth_headers


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


async def test_me_without_token_is_401(client):
    response = await client.get("/api/users/me")
    assert response.status_code == 401
    assert response.json() == {"message": "Not authenticated"}


async def test_me_with_garbage_token_is_401(client):
    assert (await client.get("/api/users/me", headers=bearer("garbage"))).status_code == 401


async def test_me_with_other_scheme_is_401(client):
    response = await client.get("/api/users/me", headers={"Authorization": "Basic abc"})
    assert response.status_code == 401


async def test_me_with_token_signed_by_another_secret_is_401(client):
    now = int(time.time())
    fake = jwt.encode(
        {"sub": "0" * 24, "ver": 0, "jti": str(uuid.uuid4()), "iat": now, "exp": now + 600},
        "another-secret-another-secret-12345",
        algorithm="HS256",
    )
    assert (await client.get("/api/users/me", headers=bearer(fake))).status_code == 401


async def test_me_with_expired_token_is_401(client):
    headers = await auth_headers(client)
    me = (await client.get("/api/users/me", headers=headers)).json()
    now = int(time.time())
    expired = jwt.encode(
        {"sub": me["id"], "ver": 0, "jti": str(uuid.uuid4()), "iat": now - 100, "exp": now - 50},
        get_settings().JWT_SECRET,
        algorithm="HS256",
    )
    assert (await client.get("/api/users/me", headers=bearer(expired))).status_code == 401


async def test_me_with_valid_token(client):
    response = await client.get("/api/users/me", headers=await auth_headers(client))
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"id", "email", "display_name", "created_at"}
    assert body["created_at"].endswith("Z")


async def test_token_for_deleted_or_unknown_user_is_401(client):
    token, _ = create_access_token("0" * 24, 0)
    assert (await client.get("/api/users/me", headers=bearer(token))).status_code == 401


async def test_token_with_old_version_is_401(client, db):
    headers = await auth_headers(client)
    await db.users.update_one({"email_lower": "alice@test.com"}, {"$inc": {"token_version": 1}})
    assert (await client.get("/api/users/me", headers=headers)).status_code == 401


async def test_logout_revokes_only_this_token(client, db):
    first = await auth_headers(client)
    second = await auth_headers(client)
    response = await client.post("/api/auth/logout", headers=first)
    assert response.status_code == 204
    assert response.content == b""
    assert (await client.get("/api/users/me", headers=first)).status_code == 401
    assert (await client.get("/api/users/me", headers=second)).status_code == 200
    revoked = await db.revoked_tokens.find_one()
    assert revoked["jti"] and revoked["expires_at"]


async def test_logout_without_token_is_401(client):
    assert (await client.post("/api/auth/logout")).status_code == 401
