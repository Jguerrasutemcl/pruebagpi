"""Endpoints globales de hallazgos y remediación del orquestador.

Rutas expuestas (sin prefijo):
  GET  /findings                         — vista cross-campaign
  GET  /patches                          — remediaciones pendientes
  PUT  /findings/{finding_id}/status     — marcar revisado / falso positivo
  PUT  /findings/{finding_id}/remediated — marcar remediado con notas
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from core.campaign_manager import campaign_manager

router = APIRouter(tags=["findings"])


class FindingStatusUpdate(BaseModel):
    status: str  # pending | reviewed | false_positive


class FindingRemediatedUpdate(BaseModel):
    remediated: bool
    notes: str | None = None


# ── Vistas globales (cross-campaign) ──────────────────────────────────────────

@router.get("/findings")
def get_all_findings(
    severity: str | None = Query(None),
    status: str | None = Query(None),
    campaign_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Vista paginada de todos los hallazgos de la sesión activa."""
    findings = campaign_manager.get_findings(severity=severity, status=status)
    total = len(findings)
    page = findings[offset: offset + limit]
    return {"findings": page, "total": total, "limit": limit, "offset": offset}


@router.get("/patches")
def get_all_patches(
    status: str | None = Query(None, alias="status"),
    severity: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Vista paginada de remediaciones pendientes (hallazgos no remediados)."""
    all_findings = campaign_manager.get_findings(severity=severity)
    patches = [
        {
            "id": f.get("id"),
            "finding_id": f.get("id"),
            "title": f.get("title", ""),
            "severity": f.get("severity", "low"),
            "status": f.get("patch_status", "pending"),
            "recommendation": f.get("recommendation", ""),
            "remediated": f.get("remediated", False),
        }
        for f in all_findings
    ]
    if status:
        patches = [p for p in patches if p.get("status") == status]
    total = len(patches)
    page = patches[offset: offset + limit]
    return {"patches": page, "total": total, "limit": limit, "offset": offset}


# ── Mutaciones ─────────────────────────────────────────────────────────────────

@router.put("/findings/{finding_id}/status")
def update_finding_status(finding_id: str, body: FindingStatusUpdate) -> dict:
    """Actualiza el estado de revisión de un hallazgo."""
    updated = campaign_manager.update_finding(finding_id, {"status": body.status})
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' no encontrado")
    return updated


@router.put("/findings/{finding_id}/remediated")
def update_finding_remediated(finding_id: str, body: FindingRemediatedUpdate) -> dict:
    """Marca un hallazgo como remediado (o no) con notas opcionales."""
    updates: dict = {"remediated": body.remediated}
    if body.notes is not None:
        updates["notes"] = body.notes
    updated = campaign_manager.update_finding(finding_id, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' no encontrado")
    return updated
