"""Unit tests for password and token helpers. No database needed."""

import time
import uuid
from datetime import datetime, timezone

import jwt
import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.schemas.users import UserOut, to_user_out
from app.security import (
    create_access_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.utils import iso, parse_object_id

GOOD_PW = "Passw0rd123"


def claims(**overrides):
    now = int(time.time())
    base = {"sub": "0" * 24, "ver": 0, "jti": str(uuid.uuid4()), "iat": now, "exp": now + 600}
    base.update(overrides)
    return {k: v for k, v in base.items() if v is not None}


def sign(payload, secret=None):
    return jwt.encode(payload, secret or get_settings().JWT_SECRET, algorithm="HS256")


def test_hash_and_verify():
    hashed = hash_password(GOOD_PW)
    assert hashed.startswith("$2b$12$")
    assert GOOD_PW not in hashed
    assert verify_password(GOOD_PW, hashed)


def test_wrong_password_is_rejected():
    assert not verify_password("Wrong1234", hash_password(GOOD_PW))


def test_password_over_72_bytes_never_verifies():
    assert not verify_password("a1" * 40, hash_password(GOOD_PW))


@pytest.mark.parametrize(
    "password",
    [
        "abc1",  # too short
        "a1" * 37,  # 74 bytes
        "א" * 36 + "1",  # 73 bytes in fewer than 72 characters
        "abcdefghij",  # no digit
        "1234567890",  # no letter
        "dana12345",  # contains the email name
        "xDANA12345",  # same, different case
    ],
)
def test_weak_passwords_get_422(password):
    with pytest.raises(HTTPException) as err:
        validate_password_strength(password, "dana@test.com")
    assert err.value.status_code == 422
    assert err.value.detail


@pytest.mark.parametrize("password", [GOOD_PW, "a1" * 36, "abcd1234"])
def test_strong_passwords_pass(password):
    validate_password_strength(password, "dana@test.com")


def test_very_short_email_name_does_not_forbid_every_password():
    validate_password_strength("abcd1234", "a@test.com")


def test_token_round_trip():
    token, expires_in = create_access_token("user1", 3)
    assert expires_in == get_settings().JWT_EXPIRE_MINUTES * 60
    decoded = decode_token(token)
    assert decoded["sub"] == "user1"
    assert decoded["ver"] == 3
    assert decoded["exp"] - decoded["iat"] == expires_in
    assert decoded["jti"]


def test_each_token_has_its_own_jti():
    a, _ = create_access_token("user1", 0)
    b, _ = create_access_token("user1", 0)
    assert decode_token(a)["jti"] != decode_token(b)["jti"]


def assert_rejected(token):
    with pytest.raises(HTTPException) as err:
        decode_token(token)
    assert err.value.status_code == 401
    assert err.value.detail == "Invalid or expired token"


def test_expired_token_is_rejected():
    assert_rejected(sign(claims(exp=int(time.time()) - 5)))


def test_token_signed_with_another_secret_is_rejected():
    assert_rejected(sign(claims(), secret="another-secret-another-secret-12345"))


@pytest.mark.parametrize("missing", ["sub", "jti", "exp", "ver"])
def test_token_with_missing_claim_is_rejected(missing):
    assert_rejected(sign(claims(**{missing: None})))


def test_garbage_token_is_rejected():
    assert_rejected("garbage")


def test_alg_none_token_is_rejected():
    assert_rejected(jwt.encode(claims(), key="", algorithm="none"))


def test_user_out_has_no_password_hash():
    doc = {
        "_id": "abc",
        "email": "a@test.com",
        "email_lower": "a@test.com",
        "password_hash": "$2b$12$secret",
        "display_name": "A",
        "token_version": 0,
        "created_at": datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
    }
    dumped = to_user_out(doc).model_dump()
    assert "password_hash" not in UserOut.model_fields
    assert "password_hash" not in dumped
    assert dumped["id"] == "abc"


def test_parse_object_id_invalid_is_404():
    with pytest.raises(HTTPException) as err:
        parse_object_id("abc")
    assert err.value.status_code == 404


def test_parse_object_id_valid():
    assert str(parse_object_id("0" * 24)) == "0" * 24


def test_iso_format():
    aware = datetime(2026, 1, 2, 3, 4, 5, 678900, tzinfo=timezone.utc)
    assert iso(aware) == "2026-01-02T03:04:05.678Z"
    assert iso(aware.replace(tzinfo=None)) == "2026-01-02T03:04:05.678Z"
