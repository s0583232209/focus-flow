"""Pytest configuration and shared fixtures for the FocusFlow backend test suite."""

import os

# ---------------------------------------------------------------------------
# Set test environment variables BEFORE importing any app module.
# This ensures pydantic-settings picks them up when Settings() is constructed.
# ---------------------------------------------------------------------------
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("MONGO_DB", "focusflow")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-at-least-32-characters")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient


@pytest.fixture(scope="session")
def test_db_name() -> str:
    """Return the name of the isolated test database."""
    base = os.environ.get("MONGO_DB", "focusflow")
    return base + "_test"


@pytest_asyncio.fixture(scope="session")
async def mongo_client():
    """Async Mongo client shared across the whole test session."""
    url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def clean_test_db(mongo_client, test_db_name):
    """Drop the test database before AND after the session for a clean slate."""
    await mongo_client.drop_database(test_db_name)
    yield
    await mongo_client.drop_database(test_db_name)


@pytest_asyncio.fixture(scope="session")
async def client(test_db_name):
    """
    AsyncClient wired to the FastAPI app, using an isolated test database.

    We override MONGO_DB in the environment and clear the lru_cache so
    the app's lifespan picks up the test database name.
    """
    # Override MONGO_DB for this session before the app is imported
    os.environ["MONGO_DB"] = test_db_name

    # Clear any cached settings so the app uses the updated env var
    from app.config import get_settings  # noqa: PLC0415

    get_settings.cache_clear()

    from app.main import app  # noqa: PLC0415

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
