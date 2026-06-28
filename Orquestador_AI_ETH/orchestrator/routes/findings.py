"""Endpoints de hallazgos del Orquestador.

Sirven al Backend como proxy para leer y actualizar los findings
almacenados en memoria durante la campaña activa.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from core.campaign_manager import campaign_manager

router = APIRouter(tags=["findings"])


class StatusUpdate(BaseModel):
    status: str  # pending | reviewed | false_positive


class RemediatedUpdate(BaseModel):
    remediated: bool
    notes: str | None = None


@router.get("/findings")
def get_all_findings(
    severity: str | None = Query(None),
    status: str | None = Query(None, alias="status"),
    campaign_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Lista hallazgos en memoria con filtros opcionales."""
    findings = campaign_manager.get_findings()

    if severity:
        findings = [f for f in findings if f.get("severity") == severity]
    if status:
        findings = [f for f in findings if f.get("status") == status]
    if campaign_id:
        findings = [f for f in findings if f.get("campaign_id") == campaign_id]

    total = len(findings)
    page = findings[offset: offset + limit]
    return {"findings": page, "total": total, "limit": limit, "offset": offset}


@router.get("/patches")
def get_patches(
    status: str | None = Query(None, alias="status"),
    severity: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Hallazgos pendientes de remediación (Patch Manager)."""
    effective_status = status or "pending"
    findings = campaign_manager.get_findings()
    results = [f for f in findings if f.get("status") == effective_status]
    if severity:
        results = [f for f in results if f.get("severity") == severity]
    total = len(results)
    page = results[offset: offset + limit]
    return {"patches": page, "total": total, "limit": limit, "offset": offset}


@router.put("/findings/{finding_id}/status")
def update_finding_status(finding_id: str, body: StatusUpdate) -> dict:
    """Cambia el estado de revisión de un hallazgo."""
    ok = campaign_manager.update_finding(finding_id, {"status": body.status})
    if not ok:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    return {"finding_id": finding_id, "status": body.status}


@router.put("/findings/{finding_id}/remediated")
def update_finding_remediated(finding_id: str, body: RemediatedUpdate) -> dict:
    """Marca un hallazgo como remediado."""
    ok = campaign_manager.update_finding(
        finding_id, {"remediated": body.remediated, "notes": body.notes}
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    return {"finding_id": finding_id, "remediated": body.remediated}
