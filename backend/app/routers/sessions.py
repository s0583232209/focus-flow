from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.routers.content import find_owned
from app.utils import iso, parse_object_id, utcnow

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

NOT_FOUND = "Session not found"

# Summaries are computed in the database, so the readings array never leaves it.
SUMMARY_FIELDS = {
    "content_id": 1,
    "content_title": 1,
    "started_at": 1,
    "ended_at": 1,
    "reading_count": {"$size": "$readings"},
    "average_score": {"$avg": "$readings.score"},
}


class SessionIn(BaseModel):
    content_id: str


class ReadingIn(BaseModel):
    position: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    score: Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]


def to_summary(doc: dict) -> dict:
    average = doc.get("average_score")
    return {
        "id": str(doc["_id"]),
        "content_id": doc["content_id"],
        "content_title": doc["content_title"],
        "started_at": iso(doc["started_at"]),
        "ended_at": iso(doc["ended_at"]) if doc.get("ended_at") else None,
        "reading_count": doc["reading_count"],
        "average_score": round(average, 3) if average is not None else None,
    }


def to_reading(reading: dict) -> dict:
    return {
        "position": reading["position"],
        "score": reading["score"],
        "created_at": iso(reading["created_at"]),
    }


async def get_summary(db: AsyncDatabase, session_id: str, owner_id: str) -> dict:
    oid = parse_object_id(session_id, NOT_FOUND)
    cursor = await db.sessions.aggregate(
        [{"$match": {"_id": oid, "owner_id": owner_id}}, {"$project": SUMMARY_FIELDS}]
    )
    docs = await cursor.to_list(1)
    if not docs:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return to_summary(docs[0])


@router.post("", status_code=status.HTTP_201_CREATED)
async def start_session(
    body: SessionIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    content = await find_owned(db, body.content_id, current.id)
    doc = {
        "owner_id": current.id,
        "content_id": str(content["_id"]),
        "content_title": content["title"],
        "started_at": utcnow(),
        "ended_at": None,
        "readings": [],
    }
    result = await db.sessions.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "content_id": doc["content_id"],
        "started_at": iso(doc["started_at"]),
    }


@router.post("/{session_id}/readings", status_code=status.HTTP_201_CREATED)
async def add_reading(
    session_id: str,
    body: ReadingIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    oid = parse_object_id(session_id, NOT_FOUND)
    reading = {"position": body.position, "score": body.score, "created_at": utcnow()}
    # One atomic update: two instances can never add a reading to a session that just closed.
    result = await db.sessions.update_one(
        {"_id": oid, "owner_id": current.id, "ended_at": None},
        {"$push": {"readings": reading}},
    )
    if result.matched_count == 0:
        if await db.sessions.find_one({"_id": oid, "owner_id": current.id}, {"_id": 1}):
            raise HTTPException(status_code=409, detail="Session already ended")
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return to_reading(reading)


@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    oid = parse_object_id(session_id, NOT_FOUND)
    # Filtering on ended_at: None keeps the first end time when end is called again.
    await db.sessions.update_one(
        {"_id": oid, "owner_id": current.id, "ended_at": None},
        {"$set": {"ended_at": utcnow()}},
    )
    return await get_summary(db, session_id, current.id)


@router.get("")
async def list_sessions(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    cursor = await db.sessions.aggregate(
        [
            {"$match": {"owner_id": current.id}},
            {"$sort": {"started_at": DESCENDING, "_id": DESCENDING}},
            {"$project": SUMMARY_FIELDS},
        ]
    )
    return [to_summary(doc) async for doc in cursor]


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    summary = await get_summary(db, session_id, current.id)
    doc = await db.sessions.find_one(
        {"_id": parse_object_id(session_id, NOT_FOUND), "owner_id": current.id},
        {"readings": 1},
    )
    return {**summary, "readings": [to_reading(r) for r in doc["readings"]]}
