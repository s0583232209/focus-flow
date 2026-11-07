import logging
import traceback

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Return every HTTP error as {"message": str}."""
    # Starlette's own 404 for unknown routes has the detail "Not Found"; a route's own
    # detail ("Content not found") must get through.
    if exc.status_code == 404 and exc.detail == "Not Found":
        return JSONResponse(status_code=404, content={"message": "Not found"})
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"message": message})


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return the first validation error as a short, human-readable 422."""
    errors = exc.errors()
    if errors:
        first = errors[0]
        # loc is a tuple like ('body', 'email') — take the last meaningful segment
        loc = first.get("loc", ())
        field = str(loc[-1]) if loc else "field"
        reason = first.get("msg", "invalid value")
        message = f"{field}: {reason}"
    else:
        message = "Invalid request"
    return JSONResponse(status_code=422, content={"message": message})


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the full traceback, return a generic 500."""
    logger.error(
        "Unhandled exception on %s %s\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return JSONResponse(status_code=500, content={"message": "Internal server error"})
