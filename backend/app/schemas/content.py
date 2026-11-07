from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints

from app.utils import iso

LIST_PREVIEW_LENGTH = 200

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class ContentIn(BaseModel):
    title: Title
    type: Literal["youtube", "text"]
    source: str


class ContentOut(BaseModel):
    id: str
    title: str
    type: str
    source: str
    video_id: str | None
    created_at: str


def to_content_out(doc: dict, preview: bool = False) -> ContentOut:
    source = doc["source"]
    if preview and doc["type"] == "text":
        source = source[:LIST_PREVIEW_LENGTH]
    return ContentOut(
        id=str(doc["_id"]),
        title=doc["title"],
        type=doc["type"],
        source=source,
        video_id=doc.get("video_id"),
        created_at=iso(doc["created_at"]),
    )
