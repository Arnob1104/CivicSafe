from fastapi import APIRouter, Depends

from app.security import CurrentUser, get_current_user, is_admin

router = APIRouter(tags=["me"])


@router.get("/api/me")
def get_me(user: CurrentUser = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "isAdmin": is_admin(user.id)}
