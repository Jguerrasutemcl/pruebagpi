from pydantic import BaseModel, Field
from typing import Literal


class ScopeModel(BaseModel):
    scan_type: Literal["full", "quick", "custom"] = "quick"
    ports: str = "1-1024"
    categories: list[Literal["ports", "web", "vuln", "os"]] = ["ports"]


class TargetCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    target: str = Field(..., description="IP o dominio del objetivo")
    description: str | None = None
    scope: ScopeModel = Field(default_factory=ScopeModel)


class TargetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    scope: ScopeModel | None = None


class TargetResponse(BaseModel):
    target_id: str
    name: str
    target: str
    description: str | None
    scope: ScopeModel
    created_at: str
    updated_at: str | None = None