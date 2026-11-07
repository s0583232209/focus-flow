from dataclasses import dataclass

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.security import decode_token

# auto_error=False: we answer 401 ourselves, in our JSON format. It also adds Authorize to /docs.
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    doc: dict
    claims: dict

    @property
    def id(self) -> str:
        """owner_id of everything this user owns. Comes from the token, never from a body."""
        return str(self.doc["_id"])


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncDatabase = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = decode_token(credentials.credentials)
    rejected = HTTPException(status_code=401, detail="Invalid or expired token")

    if await db.revoked_tokens.find_one({"jti": claims["jti"]}, {"_id": 1}):
        raise rejected

    try:
        user_id = ObjectId(claims["sub"])
    except (InvalidId, TypeError):
        raise rejected from None

    user = await db.users.find_one({"_id": user_id})
    if user is None or user["token_version"] != claims["ver"]:
        raise rejected
    return CurrentUser(doc=user, claims=claims)
