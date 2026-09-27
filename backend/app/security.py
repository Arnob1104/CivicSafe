import time
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

from app.config import SUPABASE_JWKS_URL
from app.supabase_client import supabase_admin

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 60 * 60  # refetch at most once an hour


def _get_jwks() -> dict:
    now = time.time()
    if not _jwks_cache["keys"] or (now - _jwks_cache["fetched_at"]) > _JWKS_TTL_SECONDS:
        resp = httpx.get(SUPABASE_JWKS_URL, timeout=10)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json().get("keys", [])
        _jwks_cache["fetched_at"] = now
    return {"keys": _jwks_cache["keys"]}


def _find_key(kid: str) -> Optional[dict]:
    jwks = _get_jwks()
    for key in jwks["keys"]:
        if key.get("kid") == kid:
            return key
    # Key rotated since our cache was populated - force a refresh once.
    _jwks_cache["fetched_at"] = 0
    jwks = _get_jwks()
    for key in jwks["keys"]:
        if key.get("kid") == kid:
            return key
    return None


def decode_supabase_jwt(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token header")

    kid = header.get("kid")
    alg = header.get("alg", "RS256")

    if not kid:
        raise HTTPException(status_code=401, detail="Token missing key id")

    key = _find_key(kid)
    if not key:
        raise HTTPException(status_code=401, detail="Unknown signing key")

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")

    return payload


class CurrentUser:
    def __init__(self, id: str, email: Optional[str]):
        self.id = id
        self.email = email


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")

    return CurrentUser(id=user_id, email=payload.get("email"))


def is_admin(user_id: str) -> bool:
    result = (
        supabase_admin.table("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .eq("role", "admin")
        .execute()
    )
    return len(result.data or []) > 0


async def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not is_admin(user.id):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
