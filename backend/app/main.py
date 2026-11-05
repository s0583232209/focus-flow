from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.db import close_db, connect_db, get_db
from app.errors import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup; close the connection on shutdown."""
    await connect_db()
    yield
    await close_db()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="FocusFlow API",
        lifespan=lifespan,
        # Disable the default 422 handler so our custom one takes over
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
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

    @app.get("/health", tags=["ops"])
    async def health():
        """Liveness + readiness probe. Returns 200 only when MongoDB is reachable."""
        from motor.motor_asyncio import AsyncIOMotorDatabase

        from app.db import _db  # noqa: PLC0415

        if _db is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=503, detail="database unavailable")
        try:
            await _db.command("ping")
        except Exception:
            from fastapi import HTTPException

            raise HTTPException(status_code=503, detail="database unavailable")
        return {"status": "ok"}

    return app


app = create_app()
