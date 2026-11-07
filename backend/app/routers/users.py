from fastapi import APIRouter, Depends

from app.deps import CurrentUser, get_current_user
from app.schemas.users import UserOut, to_user_out

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current: CurrentUser = Depends(get_current_user)):
    return to_user_out(current.doc)
