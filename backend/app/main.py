from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.errors import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup; close the connection on shutdown."""
    from app.db import close_db, connect_db  # noqa: PLC0415

    await connect_db()
    yield
    await close_db()


def create_app() -> FastAPI:
    # Import settings at call time (not module load time) so tests can
    # override env vars before create_app() is invoked.
    from app.config import get_settings  # noqa: PLC0415

    settings = get_settings()

    app = FastAPI(
        title="FocusFlow API",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS — origins resolved at app creation time from current settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Error handlers
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ── Routes ──────────────────────────────────────────────────────────────

    from app.routers import auth, users  # noqa: PLC0415

    app.include_router(auth.router)
    app.include_router(users.router)

    @app.get("/health", tags=["ops"])
    async def health():
        """Liveness + readiness probe. Returns 200 only when MongoDB is reachable."""
        import app.db as db_module  # noqa: PLC0415

        db = db_module._db
        if db is None:
            raise HTTPException(status_code=503, detail="database unavailable")
        try:
            await db.command("ping")
        except Exception:
            raise HTTPException(status_code=503, detail="database unavailable")
        return {"status": "ok"}

    return app


# app is created at module load; conftest must set env vars before this import.
app = create_app()
