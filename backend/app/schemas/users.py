from typing import Annotated

from pydantic import BaseModel, EmailStr, StringConstraints

from app.utils import iso

DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    display_name: DisplayName


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: str


def to_user_out(doc: dict) -> UserOut:
    """The only way a user document becomes a response, so password_hash can never leak."""
    return UserOut(
        id=str(doc["_id"]),
        email=doc["email"],
        display_name=doc["display_name"],
        created_at=iso(doc["created_at"]),
    )
