import re
from urllib.parse import parse_qs, urlparse

YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")

MIN_TEXT_LENGTH = 20
MAX_TEXT_LENGTH = 100_000


def extract_youtube_id(url: str) -> str | None:
    """Return the 11 character video id, or None for anything that is not a YouTube video link."""
    try:
        parsed = urlparse(url.strip())
        host = parsed.hostname
    except ValueError:
        return None

    if parsed.scheme not in ("http", "https") or host not in YOUTUBE_HOSTS:
        return None

    parts = [part for part in parsed.path.split("/") if part]
    candidate = None
    if host == "youtu.be":
        candidate = parts[0] if len(parts) == 1 else None
    elif parts == ["watch"]:
        candidate = parse_qs(parsed.query).get("v", [None])[0]
    elif len(parts) == 2 and parts[0] in ("shorts", "embed"):
        candidate = parts[1]

    return candidate if candidate and VIDEO_ID.match(candidate) else None


def validate_text(text: str) -> str | None:
    """Return the stripped text, or None if its length is out of range."""
    stripped = text.strip()
    return stripped if MIN_TEXT_LENGTH <= len(stripped) <= MAX_TEXT_LENGTH else None
