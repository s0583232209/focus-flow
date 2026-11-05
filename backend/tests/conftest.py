"""Pytest configuration and shared fixtures for the FocusFlow backend test suite."""

import os

# ---------------------------------------------------------------------------
# Set env vars BEFORE any app import so pydantic-settings picks them up.
# Use os.environ[] (not setdefault) to always override whatever the shell set.
# ---------------------------------------------------------------------------
os.environ["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
os.environ["MONGO_DB"] = os.environ.get("MONGO_DB", "focusflow") + "_test"
os.environ["JWT_SECRET"] = os.environ.get(
    "JWT_SECRET", "test-secret-that-is-at-least-32-characters"
)
os.environ["CORS_ORIGINS"] = os.environ.get("CORS_ORIGINS", "http://localhost:3000")

# Clear settings cache so create_app() picks up the test DB name.
from app.config import get_settings  # noqa: E402

get_settings.cache_clear()

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
import app.db as db_module  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def test_db_name() -> str:
    return os.environ["MONGO_DB"]  # already has "_test" suffix


@pytest_asyncio.fixture
async def client(test_db_name):
    """
    Per-test AsyncClient with a live DB connection.

    Connects app.db directly (so the same _db is visible to routes),
    runs the test, then disconnects. Using function scope avoids
    cross-event-loop issues with Motor in pytest-asyncio 0.24.
    """
    # Connect the app DB on this test's event loop
    await db_module.connect_db()

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
    finally:
        await db_module.close_db()
