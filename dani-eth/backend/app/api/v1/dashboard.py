"""
Dashboard summary.
Agrega datos del orquestador con conteos locales de Firestore.
Si el orquestador no está disponible, responde con los datos locales y ceros en el resto.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
import httpx

from app.core.security import get_current_user
from app.core.firebase import get_firestore
from app.services.orchestrator_client import get_orchestrator_client, OrchestratorClient

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

CurrentUser = Annotated[dict, Depends(get_current_user)]
OrcClient   = Annotated[OrchestratorClient, Depends(get_orchestrator_client)]


@router.get("/summary")
async def get_dashboard_summary(
    _: CurrentUser,
    orc: OrcClient,
) -> dict:
    """
    Agrega métricas para el Dashboard principal.
    Cualquier usuario autenticado puede acceder.
    """
    db = get_firestore()

    # Conteos propios del back (siempre disponibles)
    total_targets = db.collection("targets").count().get()[0][0].value
    total_reports = db.collection("reports").count().get()[0][0].value

    # Campañas activas desde el índice local
    active_campaigns_local = (
        db.collection("campaigns_index")
        .where("status", "in", ["running", "paused"])
        .count()
        .get()[0][0]
        .value
    )

    # Stats de hallazgos y campañas vienen del orquestador
    orchestrator_available = True
    try:
        orc_summary = await orc.get_dashboard_summary()
    except (httpx.HTTPStatusError, httpx.RequestError):
        orchestrator_available = False
        orc_summary = {
            "active_campaigns": active_campaigns_local,
            "total_findings": 0,
            "findings_by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "recent_campaigns": [],
        }

    return {
        **orc_summary,
        "total_targets": total_targets,
        "total_reports": total_reports,
        "_meta": {"orchestrator_available": orchestrator_available},
    }
