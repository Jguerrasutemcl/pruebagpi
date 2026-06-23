from pydantic import BaseModel
from typing import Literal

VALID_ASSET_TYPES = {"web_app", "api", "server", "database", "network", "mobile_app", "other"}
VALID_STATUSES = {"active", "inactive", "maintenance", "decommissioned"}
VALID_ENVS = {"production", "staging", "development", "testing"}


class AssetCreate(BaseModel):
    name: str
    hostname: str
    ip_address: str | None = None
    asset_type: Literal["web_app", "api", "server", "database", "network", "mobile_app", "other"] = "web_app"
    status: Literal["active", "inactive", "maintenance", "decommissioned"] = "active"
    environment: Literal["production", "staging", "development", "testing"] = "production"
    description: str | None = None
    team_id: str | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    hostname: str | None = None
    ip_address: str | None = None
    asset_type: str | None = None
    status: str | None = None
    environment: str | None = None
    description: str | None = None
    team_id: str | None = None


class AssetResponse(BaseModel):
    id: str
    name: str
    hostname: str
    ip_address: str | None
    asset_type: str
    status: str
    environment: str
    description: str | None
    team_id: str | None
    team_name: str | None
    created_at: str
    updated_at: str