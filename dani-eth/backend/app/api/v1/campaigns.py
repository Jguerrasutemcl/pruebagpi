"""
Proxy de campañas, hallazgos y remediación hacia el orquestador.
El back nunca genera ni persiste datos de pentesting — solo reenvía.

Excepción: campaigns_index en Firestore guarda un registro ligero de
cada campaña (campaign_id, target_id, status) para que el back pueda:
  - Listar campañas sin preguntarle al orquestador.
  - Validar en DELETE /targets que no haya campaña activa.
  - Mostrar conteos en el dashboard aunque el orquestador esté caído.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
import httpx

from app.core.security import get_current_user, requiere_permiso
from app.core.firebase import get_firestore
from app.services.orchestrator_client import get_orchestrator_client, OrchestratorClient
from app.schemas.campaign import (
    CampaignStart,
    CampaignStatusResponse,
    FindingStatusUpdate,
    FindingRemediatedUpdate,
)

router = APIRouter(prefix="/campaign", tags=["campaigns"])

WriteCampaign = Annotated[dict, Depends(requiere_permiso("write:campaigns"))]
ReadCampaign  = Annotated[dict, Depends(requiere_permiso("read:campaigns"))]
WriteVuln     = Annotated[dict, Depends(requiere_permiso("write:vulnerabilities"))]
ReadVuln      = Annotated[dict, Depends(requiere_permiso("read:vulnerabilities"))]

OrcClient = Annotated[OrchestratorClient, Depends(get_orchestrator_client)]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _handle_orc_error(e: Exception):
    """Convierte errores del orquestador en respuestas HTTP claras."""
    if isinstance(e, httpx.HTTPStatusError):
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Orquestador respondió: {e.response.text}",
        )
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "error": "ORCHESTRATOR_UNAVAILABLE",
            "message": "Orquestador no disponible. Verificar que esté corriendo.",
        },
    )


# ── Lista de campañas (índice local) ─────────────────────────────────────────

@router.get("s", tags=["campaigns"])
async def list_campaigns(
    _: ReadCampaign,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Lista el historial de campañas desde el índice local de Firestore.
    El índice se escribe al iniciar/pausar/detener una campaña.
    (GET /campaigns — nota: el prefijo del router es /campaign, la ruta agrega 's')
    """
    db = get_firestore()
    query = db.collection("campaigns_index").order_by("started_at", direction="DESCENDING")
    docs = list(query.stream())
    total = len(docs)
    page = docs[offset: offset + limit]

    campaigns = [
        {
            "campaign_id": doc.to_dict().get("campaign_id", doc.id),
            "target_id": doc.to_dict().get("target_id"),
            "target_address": doc.to_dict().get("target_address"),
            "status": doc.to_dict().get("status", "unknown"),
            "created_by": doc.to_dict().get("created_by"),
            "started_at": doc.to_dict().get("started_at"),
            "finished_at": doc.to_dict().get("finished_at"),
        }
        for doc in page
    ]
    return {"campaigns": campaigns, "total": total, "limit": limit, "offset": offset}


# ── Control de campañas (proxy al orquestador + escritura en índice) ──────────

@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_campaign(
    body: CampaignStart,
    user: WriteCampaign,
    orc: OrcClient,
) -> dict:
    """
    Inicia una nueva campaña de pentesting (requiere write:campaigns).

    1. Valida que el target exista en Firestore.
    2. Reenvía al orquestador.
    3. Guarda el registro en campaigns_index para trazabilidad local.
    """
    db = get_firestore()

    # Validar que el target existe antes de llamar al orquestador
    target_doc = db.collection("targets").document(body.target_id).get()
    if not target_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "TARGET_NOT_FOUND", "message": "El target_id no existe"},
        )

    try:
        result = await orc.start_campaign(body.model_dump())
    except Exception as e:
        _handle_orc_error(e)

    # Escribir en el índice local para que el back tenga referencia de la campaña
    campaign_id = result.get("campaign_id")
    if campaign_id:
        db.collection("campaigns_index").document(campaign_id).set({
            "campaign_id": campaign_id,
            "target_id": body.target_id,
            "target_address": body.target,
            "status": "running",
            "created_by": user.get("uid"),
            "started_at": _utcnow(),
            "paused_at": None,
            "stopped_at": None,
            "finished_at": None,
        })

    return result


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    _: WriteCampaign,
    orc: OrcClient,
) -> dict:
    """Pausa una campaña en curso (requiere write:campaigns)."""
    try:
        result = await orc.pause_campaign(campaign_id)
    except Exception as e:
        _handle_orc_error(e)

    # Actualizar índice local
    try:
        get_firestore().collection("campaigns_index").document(campaign_id).update({
            "status": "paused",
            "paused_at": _utcnow(),
        })
    except Exception:
        pass  # No bloquear si el doc no existe en el índice

    return result


@router.post("/{campaign_id}/stop")
async def stop_campaign(
    campaign_id: str,
    _: WriteCampaign,
    orc: OrcClient,
) -> dict:
    """Detiene definitivamente una campaña (requiere write:campaigns)."""
    try:
        result = await orc.stop_campaign(campaign_id)
    except Exception as e:
        _handle_orc_error(e)

    try:
        get_firestore().collection("campaigns_index").document(campaign_id).update({
            "status": "stopped",
            "stopped_at": _utcnow(),
        })
    except Exception:
        pass

    return result


@router.get("/{campaign_id}/status", response_model=CampaignStatusResponse)
async def get_campaign_status(
    campaign_id: str,
    _: ReadCampaign,
    orc: OrcClient,
) -> dict:
    """Estado actual de una campaña, incluyendo progreso y hallazgos parciales."""
    try:
        result = await orc.get_campaign_status(campaign_id)
    except Exception as e:
        _handle_orc_error(e)

    # Si el orquestador reporta que terminó, actualizar índice local
    if result.get("status") == "finished":
        try:
            get_firestore().collection("campaigns_index").document(campaign_id).update({
                "status": "finished",
                "finished_at": result.get("finished_at") or _utcnow(),
            })
        except Exception:
            pass

    return result


# ── Hallazgos (proxy al orquestador) ─────────────────────────────────────────

@router.get("/{campaign_id}/findings")
async def get_findings_by_campaign(
    campaign_id: str,
    _: ReadVuln,
    orc: OrcClient,
    severity: str | None = Query(None),
    finding_status: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Hallazgos de una campaña específica con filtros opcionales.
    Ruta para Vulnerability Hub al ver una campaña puntual.
    """
    try:
        return await orc.get_findings(campaign_id, severity, finding_status)
    except Exception as e:
        _handle_orc_error(e)


@router.put("/{campaign_id}/findings/{finding_id}/status")
async def update_finding_status(
    campaign_id: str,
    finding_id: str,
    body: FindingStatusUpdate,
    _: WriteVuln,
    orc: OrcClient,
) -> dict:
    """Marca un hallazgo como revisado o falso positivo (requiere write:vulnerabilities)."""
    try:
        return await orc.update_finding_status(finding_id, body.status)
    except Exception as e:
        _handle_orc_error(e)


@router.get("/{campaign_id}/remediation-plan")
async def get_remediation_plan(
    campaign_id: str,
    _: ReadVuln,
    orc: OrcClient,
) -> dict:
    """Plan de remediación generado por el orquestador para esta campaña."""
    try:
        return await orc.get_remediation_plan(campaign_id)
    except Exception as e:
        _handle_orc_error(e)


@router.put("/{campaign_id}/findings/{finding_id}/remediated")
async def update_finding_remediated(
    campaign_id: str,
    finding_id: str,
    body: FindingRemediatedUpdate,
    _: WriteVuln,
    orc: OrcClient,
) -> dict:
    """Marca un hallazgo como remediado con notas (requiere write:vulnerabilities)."""
    try:
        return await orc.update_finding_remediated(finding_id, body.model_dump())
    except Exception as e:
        _handle_orc_error(e)


@router.get("/{campaign_id}/report")
async def get_campaign_report(
    campaign_id: str,
    _: ReadCampaign,
    orc: OrcClient,
) -> dict:
    """Reporte final de la campaña generado por el orquestador."""
    try:
        return await orc.get_campaign_report(campaign_id)
    except Exception as e:
        _handle_orc_error(e)
