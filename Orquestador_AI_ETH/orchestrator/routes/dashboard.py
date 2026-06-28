"""Endpoints de resumen para el Dashboard del Frontend.

El Backend llama a GET /dashboard/summary y combina estos datos
con los conteos locales de Firestore antes de devolvérselos al Frontend.
"""

from fastapi import APIRouter

from core.campaign_manager import campaign_manager

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict:
    """Agrega el estado de la campaña activa y los findings en memoria."""
    estado = campaign_manager.estado_actual()
    findings = campaign_manager.get_findings()

    status = estado.get("status", "stopped")
    active_campaigns = 1 if status in ("running", "paused") else 0

    findings_by_severity: dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        sev = (f.get("severity") or "info").lower()
        if sev in findings_by_severity:
            findings_by_severity[sev] += 1

    recent_campaigns = []
    if estado.get("campaign_id"):
        recent_campaigns.append(
            {
                "campaign_id": estado["campaign_id"],
                "target": estado.get("target", ""),
                "status": status,
                "started_at": estado.get("started_at") or "",
            }
        )

    return {
        "active_campaigns": active_campaigns,
        "total_findings": len(findings),
        "findings_by_severity": findings_by_severity,
        "recent_campaigns": recent_campaigns,
    }
