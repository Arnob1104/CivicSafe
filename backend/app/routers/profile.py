import re

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import ProfileOut, ProfileUpdate
from app.security import CurrentUser, get_current_user
from app.supabase_client import supabase_admin

router = APIRouter(tags=["profile"])

_PHONE_RE = re.compile(r"^[+\d\s\-()]*$")


@router.get("/api/profile", response_model=ProfileOut)
def get_profile(user: CurrentUser = Depends(get_current_user)):
    result = (
        supabase_admin.table("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return ProfileOut(full_name=None, phone=None)
    return result.data[0]


@router.put("/api/profile", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, user: CurrentUser = Depends(get_current_user)):
    if payload.phone and not _PHONE_RE.match(payload.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number")

    row = {
        "user_id": user.id,
        "full_name": payload.full_name,
        "phone": payload.phone or None,
    }
    result = (
        supabase_admin.table("profiles")
        .upsert(row, on_conflict="user_id")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return result.data[0]
