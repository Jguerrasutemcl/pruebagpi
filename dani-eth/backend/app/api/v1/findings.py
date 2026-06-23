"""
Vista global de hallazgos cross-campaign para la página Vulnerability Hub.

El orquestador es la fuente de verdad. Este router solo reenvía con filtros.
Separado de campaigns.py para mantener las rutas limpias:
  /campaign/{id}/findings  → hallazgos de una campaña específica (en campaigns.py)
  /findings                → todos los hallazgos, filtrable (este archivo)
  /patches                 → remediaciones pendientes globales (este archivo)
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
import httpx

from app.core.security import requiere_permiso
from app.services.orchestrator_client import get_orchestrator_client, OrchestratorClient

router = APIRouter(tags=["findings"])

ReadVuln  = Annotated[dict, Depends(requiere_permiso("read:vulnerabilities"))]
WriteVuln = Annotated[dict, Depends(requiere_permiso("write:vulnerabilities"))]
OrcClient = Annotated[OrchestratorClient, Depends(get_orchestrator_client)]


def _handle_orc_error(e: Exception):
    if isinstance(e, httpx.HTTPStatusError):
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"error": "ORCHESTRATOR_UNAVAILABLE", "message": "Orquestador no disponible"},
    )


@router.get("/findings")
async def get_all_findings(
    _: ReadVuln,
    orc: OrcClient,
    severity: str | None = Query(None, description="critical | high | medium | low | info"),
    finding_status: str | None = Query(None, alias="status", description="pending | reviewed | false_positive"),
    campaign_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Vista global de hallazgos para Vulnerability Hub (requiere read:vulnerabilities).

    Si el orquestador expone GET /findings con filtros, se reenvía directamente.
    Si no, el orquestador debe implementar ese endpoint — coordinarlo con ese grupo.
    """
    params: dict = {"limit": limit, "offset": offset}
    if severity:
        params["severity"] = severity
    if finding_status:
        params["status"] = finding_status
    if campaign_id:
        params["campaign_id"] = campaign_id

    try:
        return await orc._get("/findings", params=params)
    except Exception as e:
        _handle_orc_error(e)


@router.get("/patches")
async def get_all_patches(
    _: ReadVuln,
    orc: OrcClient,
    patch_status: str | None = Query(None, alias="status", description="pending | in_progress | done"),
    severity: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Vista global de remediaciones pendientes para Patch Manager (requiere read:vulnerabilities).
    Llama al endpoint /patches del orquestador (coordinar con ese grupo).
    """
    params: dict = {"limit": limit, "offset": offset}
    if patch_status:
        params["status"] = patch_status
    if severity:
        params["severity"] = severity

    try:
        return await orc._get("/patches", params=params)
    except Exception as e:
        _handle_orc_error(e)
