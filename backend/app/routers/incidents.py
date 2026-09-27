import math

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas import (
    IncidentCreate, IncidentOut, IncidentStatusUpdate, NearbyIncident,
    CATEGORIES, SEVERITIES, STATUSES,
)
from app.security import CurrentUser, get_current_user, require_admin, is_admin
from app.supabase_client import supabase_admin

router = APIRouter(tags=["incidents"])


@router.post("/api/incidents", response_model=IncidentOut)
def create_incident(payload: IncidentCreate, user: CurrentUser = Depends(get_current_user)):
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if payload.severity not in SEVERITIES:
        raise HTTPException(status_code=400, detail="Invalid severity")

    row = {
        "user_id": user.id,
        "title": payload.title or "Incident Report",
        "description": payload.description,
        "category": payload.category,
        "severity": payload.severity,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address,
        "media_urls": payload.media_urls,
        "ai_summary": payload.ai_summary,
        "ai_classification": payload.ai_classification,
    }
    result = supabase_admin.table("incidents").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create incident")
    return result.data[0]


@router.get("/api/incidents", response_model=list[IncidentOut])
def list_my_incidents(user: CurrentUser = Depends(get_current_user)):
    result = (
        supabase_admin.table("incidents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/api/admin/incidents", response_model=list[IncidentOut])
def list_all_incidents(_: CurrentUser = Depends(require_admin)):
    result = (
        supabase_admin.table("incidents")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@router.get("/api/incidents/nearby", response_model=list[NearbyIncident])
def list_nearby_incidents(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(20, gt=0, le=200),
    include_resolved: bool = Query(False),
    _: CurrentUser = Depends(get_current_user),
):
    query = (
        supabase_admin.table("incidents")
        .select("id, title, category, severity, status, latitude, longitude, address, created_at")
        .not_.is_("latitude", "null")
        .not_.is_("longitude", "null")
    )
    if not include_resolved:
        query = query.not_.in_("status", ["resolved", "closed"])

    result = query.order("created_at", desc=True).limit(500).execute()

    nearby = []
    for row in result.data or []:
        dist = _haversine_km(lat, lng, row["latitude"], row["longitude"])
        if dist <= radius_km:
            nearby.append({**row, "distance_km": round(dist, 2)})

    nearby.sort(key=lambda r: r["distance_km"])
    return nearby[:100]


@router.get("/api/incidents/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        supabase_admin.table("incidents")
        .select("*")
        .eq("id", incident_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident = result.data[0]
    if incident["user_id"] != user.id and not is_admin(user.id):
        raise HTTPException(status_code=404, detail="Incident not found")

    return incident


@router.patch("/api/incidents/{incident_id}/status", response_model=IncidentOut)
def update_status(
    incident_id: str,
    payload: IncidentStatusUpdate,
    _: CurrentUser = Depends(require_admin),
):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = (
        supabase_admin.table("incidents")
        .update({"status": payload.status})
        .eq("id", incident_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return result.data[0]
