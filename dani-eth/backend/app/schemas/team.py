# backend/app/schemas/team.py
"""
Schemas Pydantic v2 para Team & Assets.
Solo validación de datos — el almacenamiento es Firestore.
"""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, VALID_ASSET_TYPES, VALID_STATUSES, VALID_ENVS

# ── Defaults que se guardan en Firestore ───────────────────────────────────────

DEFAULT_PERMISSIONS: dict[str, bool] = {
    "view_dashboard":    True,
    "run_scans":         False,
    "vulnerability_hub": False,
    "manage_patches":    False,
    "team_management":   False,
    "admin_settings":    False,
}

DEFAULT_NOTIFICATIONS: dict[str, bool] = {
    "email":        True,
    "slack":        True,
    "sms_critical": False,
    "in_app":       True,
}

DEFAULT_NOTIFY_WHEN: dict[str, bool] = {
    "task_assigned":          True,
    "critical_vulnerabilities": True,
    "daily_digest":           False,
}


# ── Team ───────────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str | None = None
    icon: str | None = None          # emoji: "🌐", "💻", "🖥️"


class TeamUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    description: str | None = None
    icon: str | None = None


class TeamResponse(BaseModel):
    id: str                          # Firestore document ID
    name: str
    description: str | None = None
    icon: str | None = None
    member_count: int = 0
    created_at: str
    updated_at: str


# ── TeamMember ─────────────────────────────────────────────────────────────────

class TeamMemberCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    role: str = Field(..., min_length=2, max_length=100)
    team_id: str                     # Firestore doc ID del equipo
    is_team_lead: bool = False
    firebase_uid: str | None = None  # link opcional al usuario de Auth
    permissions: dict[str, bool] | None = None
    notifications: dict[str, bool] | None = None
    notify_when: dict[str, bool] | None = None


class TeamMemberUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    team_id: str | None = None
    is_team_lead: bool | None = None
    active_tasks_count: int | None = None
    completed_this_month: int | None = None
    avg_completion_days: float | None = None
    permissions: dict[str, bool] | None = None
    notifications: dict[str, bool] | None = None
    notify_when: dict[str, bool] | None = None


class TeamMemberResponse(BaseModel):
    id: str                          # Firestore document ID
    member_code: str                 # NET-001, APP-002, SRV-003
    firebase_uid: str | None = None
    name: str
    email: str
    role: str
    is_team_lead: bool
    team_id: str
    team_name: str | None = None
    active_tasks_count: int = 0
    completed_this_month: int = 0
    avg_completion_days: float = 0.0
    workload_pct: int = 0
    workload_label: str = "Light Load"
    permissions: dict[str, Any]
    notifications: dict[str, Any]
    notify_when: dict[str, Any]
    created_at: str
    updated_at: str
    
# ── Stats ──────────────────────────────────────────────────────────────────────

class TeamStatsResponse(BaseModel):
    total_members: int
    total_teams: int
    active_tasks: int
    overloaded_count: int    # active_tasks > 5
    available_count: int     # active_tasks < 3
    avg_completion_days: float