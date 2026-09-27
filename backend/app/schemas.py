from typing import Optional, List, Any
from pydantic import BaseModel, Field

CATEGORIES = [
    "fire", "medical", "crime", "traffic_accident", "natural_disaster",
    "hazardous_material", "public_disturbance", "infrastructure", "other",
]
SEVERITIES = ["low", "medium", "high", "critical"]
STATUSES = ["pending", "reviewing", "in_progress", "resolved", "closed"]


class IncidentCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: str = "other"
    severity: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    ai_classification: Optional[Any] = None


class IncidentOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: str
    severity: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    ai_classification: Optional[Any] = None
    created_at: str
    updated_at: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str


class ProfileOut(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)


class NearbyIncident(BaseModel):
    id: str
    title: str
    category: str
    severity: str
    status: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    created_at: str
    distance_km: float


class AIAnalyzeRequest(BaseModel):
    image: str  # data URL, e.g. "data:image/png;base64,...."
    fileCount: int = 1


class AIAnalyzeResult(BaseModel):
    title: str
    description: str
    category: str
    severity: str
