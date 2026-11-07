from typing import AsyncGenerator

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

# Module-level client — set during lifespan, cleared on shutdown
_client: AsyncMongoClient | None = None
_db: AsyncDatabase | None = None


async def create_indexes(db: AsyncDatabase) -> None:
    """Create all MongoDB indexes (idempotent)."""
    await db.users.create_index("email_lower", unique=True)
    await db.content.create_index([("owner_id", ASCENDING), ("created_at", DESCENDING)])
    await db.sessions.create_index([("owner_id", ASCENDING), ("started_at", DESCENDING)])
    await db.sessions.create_index("content_id")
    await db.revoked_tokens.create_index("jti", unique=True)
    await db.revoked_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("created_at", expireAfterSeconds=900)
    await db.login_attempts.create_index("email_lower")


async def connect_db() -> None:
    """Open the MongoDB connection and create indexes."""
    global _client, _db
    if _db is not None:
        return  # already connected (e.g. called twice in tests)
    from app.config import get_settings  # imported here so env vars are already set
    settings = get_settings()
    _client = AsyncMongoClient(
        settings.MONGO_URL,
        serverSelectionTimeoutMS=5000,
    )
    # Verify connectivity early (raises ServerSelectionTimeoutError if unreachable)
    await _client.admin.command("ping")
    _db = _client[settings.MONGO_DB]
    await create_indexes(_db)


async def close_db() -> None:
    """Close the MongoDB connection."""
    global _client, _db
    if _client is not None:
        await _client.close()
        _client = None
        _db = None


async def get_db() -> AsyncGenerator[AsyncDatabase, None]:
    """FastAPI dependency — yields the active database handle."""
    if _db is None:
        raise RuntimeError("Database not initialised — lifespan did not run")
    yield _db
