from pydantic import BaseModel
from typing import Literal


class CampaignStart(BaseModel):
    target_id: str
    target: str
    scan_type: Literal["full", "quick", "custom"] = "quick"
    scope: list[str] = ["ports", "web"]


class CampaignStatusResponse(BaseModel):
    campaign_id: str
    status: Literal["started", "running", "paused", "stopped", "finished"]
    phase: str | None = None
    progress: int | None = None
    findings: list[dict] = []
    logs: list[str] = []
    started_at: str | None = None
    finished_at: str | None = None


class FindingStatusUpdate(BaseModel):
    status: Literal["pending", "reviewed", "false_positive"]


class FindingRemediatedUpdate(BaseModel):
    remediated: bool
    notes: str | None = None