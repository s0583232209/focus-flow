from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.content_validation import (
    MAX_TEXT_LENGTH,
    MIN_TEXT_LENGTH,
    extract_youtube_id,
    validate_text,
)
from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.schemas.content import ContentIn, ContentOut, to_content_out
from app.utils import parse_object_id, utcnow

router = APIRouter(prefix="/api/content", tags=["content"])

NOT_FOUND = "Content not found"


async def find_owned(db: AsyncDatabase, content_id: str, owner_id: str) -> dict:
    """Invalid id, missing item and another user's item are all the same 404."""
    oid = parse_object_id(content_id, NOT_FOUND)
    doc = await db.content.find_one({"_id": oid, "owner_id": owner_id})
    if doc is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return doc


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ContentOut)
async def create_content(
    body: ContentIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    video_id = None
    if body.type == "youtube":
        video_id = extract_youtube_id(body.source)
        if video_id is None:
            raise HTTPException(status_code=422, detail="Invalid YouTube link")
        source = body.source.strip()
    else:
        source = validate_text(body.source)
        if source is None:
            raise HTTPException(
                status_code=422,
                detail=f"Text must be {MIN_TEXT_LENGTH} to {MAX_TEXT_LENGTH} characters long",
            )

    doc = {
        "owner_id": current.id,
        "title": body.title,
        "type": body.type,
        "source": source,
        "video_id": video_id,
        "created_at": utcnow(),
    }
    result = await db.content.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_content_out(doc)


@router.get("", response_model=list[ContentOut])
async def list_content(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    cursor = db.content.find({"owner_id": current.id}).sort([("created_at", DESCENDING), ("_id", DESCENDING)])
    return [to_content_out(doc, preview=True) async for doc in cursor]


@router.get("/{content_id}", response_model=ContentOut)
async def get_content(
    content_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return to_content_out(await find_owned(db, content_id, current.id))


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    doc = await find_owned(db, content_id, current.id)
    await db.sessions.delete_many({"owner_id": current.id, "content_id": str(doc["_id"])})
    await db.content.delete_one({"_id": doc["_id"], "owner_id": current.id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
