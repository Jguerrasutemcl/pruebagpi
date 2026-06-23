"""Endpoints de control del orquestador (campaña de exploración).

Arquitectura de sesión única: el campaign_id recibido del Backend se acepta
en la URL pero se ignora internamente — el CampaignManager gestiona una sola
sesión activa. El soporte multi-campaña se añadirá en una versión posterior.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from core.campaign_manager import campaign_manager
from config import SESION_ID

router = APIRouter(prefix="/campaign", tags=["campaign"])


class IniciarCampaña(BaseModel):
    # extra="ignore" absorbe los campos adicionales que manda el Backend
    # (target_id, scan_type, scope) sin levantar un error de validación.
    model_config = ConfigDict(extra="ignore")

    target: str = Field(..., description="IP o host objetivo (entorno autorizado)")
    sesion_id: int = Field(SESION_ID, description="ID de sesión del runner")


# ── Control de campaña ─────────────────────────────────────────────────────────

@router.post("/start")
def iniciar(payload: IniciarCampaña):
    """Inicia la exploración contra el objetivo indicado."""
    try:
        campaign_manager.iniciar(payload.target, payload.sesion_id)
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.post("/{campaign_id}/pause")
def pausar(campaign_id: str):
    """Pausa la campaña en curso (toma efecto en el próximo checkpoint)."""
    try:
        campaign_manager.pausar()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.post("/{campaign_id}/stop")
def detener(campaign_id: str):
    """Detiene la campaña en curso (toma efecto en el próximo checkpoint)."""
    try:
        campaign_manager.detener()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.post("/resume")
def reanudar():
    """Reanuda una campaña pausada."""
    try:
        campaign_manager.reanudar()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.get("/{campaign_id}/status")
def estado(campaign_id: str):
    """Devuelve el estado actual del orquestador para la campaña indicada."""
    return campaign_manager.estado_actual()


# ── Hallazgos y remediación por campaña ───────────────────────────────────────

@router.get("/{campaign_id}/findings")
def get_findings(
    campaign_id: str,
    severity: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Hallazgos de la campaña activa, con filtros opcionales de severidad y estado."""
    findings = campaign_manager.get_findings(severity=severity, status=status)
    total = len(findings)
    page = findings[offset: offset + limit]
    return {
        "campaign_id": campaign_id,
        "findings": page,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{campaign_id}/remediation-plan")
def get_remediation_plan(campaign_id: str) -> dict:
    """Plan de remediación basado en los hallazgos actuales de la campaña."""
    findings = campaign_manager.get_findings()
    steps = [
        {
            "step": i + 1,
            "finding_id": f.get("id"),
            "title": f.get("title", ""),
            "severity": f.get("severity", "low"),
            "recommendation": f.get("recommendation", ""),
            "status": "pending",
        }
        for i, f in enumerate(findings)
    ]
    return {
        "campaign_id": campaign_id,
        "steps": steps,
        "total": len(steps),
    }


@router.get("/{campaign_id}/report")
def get_report(campaign_id: str) -> dict:
    """Ruta del reporte final generado (disponible cuando la campaña finaliza)."""
    estado = campaign_manager.estado_actual()
    ruta = estado.get("ruta_reporte")
    return {
        "campaign_id": campaign_id,
        "status": estado.get("status"),
        "report_path": ruta,
        "available": ruta is not None,
    }
