from typing import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

# Module-level client — set during lifespan, cleared on shutdown
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all MongoDB indexes.

    TODO (add index calls in each feature task):
    - T10: users.email_lower (unique)
    - T10: content (owner_id, created_at -1)
    - T10: sessions (owner_id, started_at -1), sessions.content_id
    - T10: revoked_tokens.jti (unique) + TTL on expires_at
    - T10: login_attempts TTL on created_at (900 s) + index email_lower
    """
    pass  # indexes added in T10


async def connect_db() -> None:
    """Open the MongoDB connection and create indexes."""
    global _client, _db
    settings = get_settings()
    _client = AsyncIOMotorClient(
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
        _client.close()
        _client = None
        _db = None


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """FastAPI dependency — yields the active database handle."""
    if _db is None:
        raise RuntimeError("Database not initialised — lifespan did not run")
    yield _db
