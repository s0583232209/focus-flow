import asyncio
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.schemas.users import LoginIn, RegisterIn
from app.security import (
    create_access_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.utils import utcnow

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5
ATTEMPT_WINDOW = timedelta(minutes=15)

# Compared against when the email is unknown, so both failures take the same time.
_DUMMY_HASH = hash_password("timing-equalizer-0")


def normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: AsyncDatabase = Depends(get_db)):
    validate_password_strength(body.password, body.email)
    email_lower = normalize_email(body.email)
    conflict = HTTPException(status_code=409, detail="Email already registered")

    if await db.users.find_one({"email_lower": email_lower}, {"_id": 1}):
        raise conflict

    password_hash = await asyncio.to_thread(hash_password, body.password)
    doc = {
        "email": body.email,
        "email_lower": email_lower,
        "password_hash": password_hash,
        "display_name": body.display_name,
        "token_version": 0,
        "created_at": utcnow(),
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        # Two requests at the same moment: the unique index decides.
        raise conflict from None
    return {"id": str(result.inserted_id), "email": doc["email"], "display_name": doc["display_name"]}


@router.post("/login")
async def login(body: LoginIn, db: AsyncDatabase = Depends(get_db)):
    email_lower = normalize_email(body.email)
    now = utcnow()

    failures = await db.login_attempts.count_documents(
        {"email_lower": email_lower, "created_at": {"$gte": now - ATTEMPT_WINDOW}}
    )
    if failures >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email_lower": email_lower})
    stored_hash = user["password_hash"] if user else _DUMMY_HASH
    password_ok = await asyncio.to_thread(verify_password, body.password, stored_hash)

    if not user or not password_ok:
        await db.login_attempts.insert_one({"email_lower": email_lower, "created_at": now})
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    await db.login_attempts.delete_many({"email_lower": email_lower})
    token, expires_in = create_access_token(str(user["_id"]), user["token_version"])
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current: CurrentUser = Depends(get_current_user), db: AsyncDatabase = Depends(get_db)):
    """A JWT cannot be recalled, so its jti is kept on a revoked list until it expires anyway."""
    expires_at = datetime.fromtimestamp(current.claims["exp"], tz=timezone.utc)
    try:
        await db.revoked_tokens.insert_one({"jti": current.claims["jti"], "expires_at": expires_at})
    except DuplicateKeyError:
        pass  # logged out twice at the same moment
    return Response(status_code=status.HTTP_204_NO_CONTENT)
