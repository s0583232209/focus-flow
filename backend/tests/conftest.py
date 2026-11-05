"""Pytest configuration and shared fixtures for the FocusFlow backend test suite."""

import os

# ---------------------------------------------------------------------------
# Set test environment variables BEFORE importing any app module.
# Use os.environ[] (not setdefault) so these always override shell env vars,
# ensuring the app never connects to the real database during tests.
# ---------------------------------------------------------------------------
os.environ["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
os.environ["MONGO_DB"] = os.environ.get("MONGO_DB", "focusflow") + "_test"
os.environ["JWT_SECRET"] = os.environ.get(
    "JWT_SECRET", "test-secret-that-is-at-least-32-characters"
)
os.environ["CORS_ORIGINS"] = os.environ.get("CORS_ORIGINS", "http://localhost:3000")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

# Import app modules AFTER env vars are set
from app.config import get_settings

# Clear any cached settings so the app picks up the test DB name
get_settings.cache_clear()

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def test_db_name() -> str:
    return os.environ["MONGO_DB"]  # already has "_test" suffix


@pytest_asyncio.fixture(scope="session")
async def mongo_client():
    """Async Mongo client shared across the whole test session."""
    client = AsyncIOMotorClient(os.environ["MONGO_URL"], serverSelectionTimeoutMS=5000)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def clean_test_db(mongo_client, test_db_name):
    """Drop the test database before AND after the session for a clean slate."""
    await mongo_client.drop_database(test_db_name)
    yield
    await mongo_client.drop_database(test_db_name)


@pytest_asyncio.fixture(scope="session")
async def client():
    """AsyncClient wired to the FastAPI app using the isolated test database."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
