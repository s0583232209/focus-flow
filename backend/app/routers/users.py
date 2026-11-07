import asyncio

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.schemas.users import DisplayName, UserOut, to_user_out
from app.security import hash_password, validate_password_strength, verify_password

router = APIRouter(prefix="/api/users", tags=["users"])


class ProfileIn(BaseModel):
    display_name: DisplayName


class PasswordIn(BaseModel):
    current_password: str
    new_password: str


@router.get("/me", response_model=UserOut)
async def get_me(current: CurrentUser = Depends(get_current_user)):
    return to_user_out(current.doc)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: ProfileIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    await db.users.update_one(
        {"_id": current.doc["_id"]}, {"$set": {"display_name": body.display_name}}
    )
    return to_user_out({**current.doc, "display_name": body.display_name})


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: PasswordIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    matches = await asyncio.to_thread(
        verify_password, body.current_password, current.doc["password_hash"]
    )
    if not matches:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    validate_password_strength(body.new_password, current.doc["email"])
    new_hash = await asyncio.to_thread(hash_password, body.new_password)
    # token_version goes up, so every token issued before this moment stops working.
    await db.users.update_one(
        {"_id": current.doc["_id"]},
        {"$set": {"password_hash": new_hash}, "$inc": {"token_version": 1}},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    await db.sessions.delete_many({"owner_id": current.id})
    await db.content.delete_many({"owner_id": current.id})
    await db.login_attempts.delete_many({"email_lower": current.doc["email_lower"]})
    await db.users.delete_one({"_id": current.doc["_id"]})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
