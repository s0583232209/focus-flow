import uuid
from datetime import timedelta

import bcrypt
import jwt
from fastapi import HTTPException

from app.config import get_settings
from app.utils import utcnow

BCRYPT_MAX_BYTES = 72
JWT_ALGORITHM = "HS256"
# A one or two letter email name would forbid almost every password.
MIN_EMAIL_NAME_LENGTH_TO_CHECK = 3


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    raw = password.encode("utf-8")
    if len(raw) > BCRYPT_MAX_BYTES:
        return False
    return bcrypt.checkpw(raw, password_hash.encode("ascii"))


def validate_password_strength(password: str, email: str) -> None:
    """Raise 422 with a message the user can act on. Messages are shown as they are in the UI."""
    size = len(password.encode("utf-8"))
    if size < 8:
        raise HTTPException(status_code=422, detail="הסיסמה קצרה מדי: לפחות 8 תווים")
    if size > BCRYPT_MAX_BYTES:
        raise HTTPException(status_code=422, detail="הסיסמה ארוכה מדי: עד 72 בתים")
    if not any(c.isalpha() for c in password):
        raise HTTPException(status_code=422, detail="הסיסמה חייבת לכלול לפחות אות אחת")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=422, detail="הסיסמה חייבת לכלול לפחות ספרה אחת")
    email_name = email.split("@")[0].strip().lower()
    if len(email_name) >= MIN_EMAIL_NAME_LENGTH_TO_CHECK and email_name in password.lower():
        raise HTTPException(status_code=422, detail="הסיסמה לא יכולה לכלול את השם שבכתובת האימייל")


def create_access_token(user_id: str, token_version: int) -> tuple[str, int]:
    """Return (token, expires_in seconds)."""
    settings = get_settings()
    now = utcnow()
    expires_in = settings.JWT_EXPIRE_MINUTES * 60
    claims = {
        "sub": user_id,
        "ver": token_version,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    return jwt.encode(claims, settings.JWT_SECRET, algorithm=JWT_ALGORITHM), expires_in


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            get_settings().JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "jti", "exp", "ver"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None
