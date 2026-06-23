"""Endpoint de resumen para el dashboard del orquestador."""

from fastapi import APIRouter

from core.campaign_manager import campaign_manager

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict:
    """Agrega métricas de la sesión activa para el Dashboard principal del Frontend."""
    estado = campaign_manager.estado_actual()
    findings = campaign_manager.get_findings()

    active = 1 if estado["status"] in ("running", "paused") else 0

    by_severity: dict[str, int] = {
        "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0
    }
    for f in findings:
        sev = f.get("severity", "low")
        by_severity[sev] = by_severity.get(sev, 0) + 1

    recent_campaigns = []
    if estado.get("campaign_id"):
        recent_campaigns = [
            {
                "campaign_id": estado["campaign_id"],
                "target": estado.get("target"),
                "status": estado["status"],
                "started_at": estado.get("started_at"),
                "finished_at": estado.get("finished_at"),
            }
        ]

    return {
        "active_campaigns": active,
        "total_findings": len(findings),
        "findings_by_severity": by_severity,
        "recent_campaigns": recent_campaigns,
    }
