"""
Cliente HTTP para comunicarse con el orquestador.

El back general nunca genera ni guarda datos de campañas —
solo actúa como proxy entre el frontend y el orquestador.
Todas las llamadas al orquestador pasan por aquí.
"""
import logging
from functools import lru_cache

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TIMEOUT = httpx.Timeout(30.0, connect=5.0)


class OrchestratorClient:
    """Encapsula todas las llamadas HTTP al orquestador."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=TIMEOUT,
            headers={"Content-Type": "application/json"},
        )

    async def _get(self, path: str, params: dict = None) -> dict:
        try:
            r = await self._client.get(path, params=params)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Orquestador error {e.response.status_code}: {path}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Orquestador no disponible: {e}")
            raise

    async def _post(self, path: str, body: dict = None) -> dict:
        try:
            r = await self._client.post(path, json=body or {})
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Orquestador error {e.response.status_code}: {path}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Orquestador no disponible: {e}")
            raise

    async def _put(self, path: str, body: dict = None) -> dict:
        try:
            r = await self._client.put(path, json=body or {})
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Orquestador error {e.response.status_code}: {path}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Orquestador no disponible: {e}")
            raise

    # ── Campañas ───────────────────────────────────────────────────────────────

    async def start_campaign(self, payload: dict) -> dict:
        return await self._post("/campaign/start", payload)

    async def pause_campaign(self, campaign_id: str) -> dict:
        return await self._post(f"/campaign/{campaign_id}/pause")

    async def stop_campaign(self, campaign_id: str) -> dict:
        return await self._post(f"/campaign/{campaign_id}/stop")

    async def get_campaign_status(self, campaign_id: str) -> dict:
        return await self._get(f"/campaign/{campaign_id}/status")

    # ── Hallazgos ──────────────────────────────────────────────────────────────

    async def get_findings(self, campaign_id: str, severity: str = None, status: str = None) -> dict:
        params = {}
        if severity:
            params["severity"] = severity
        if status:
            params["status"] = status
        return await self._get(f"/campaign/{campaign_id}/findings", params=params)

    async def update_finding_status(self, finding_id: str, status: str) -> dict:
        return await self._put(f"/findings/{finding_id}/status", {"status": status})

    async def get_remediation_plan(self, campaign_id: str) -> dict:
        return await self._get(f"/campaign/{campaign_id}/remediation-plan")

    async def update_finding_remediated(self, finding_id: str, payload: dict) -> dict:
        return await self._put(f"/findings/{finding_id}/remediated", payload)

    # ── Reportes ───────────────────────────────────────────────────────────────

    async def get_campaign_report(self, campaign_id: str) -> dict:
        return await self._get(f"/campaign/{campaign_id}/report")

    # ── Dashboard ──────────────────────────────────────────────────────────────

    async def get_dashboard_summary(self) -> dict:
        return await self._get("/dashboard/summary")

    async def close(self):
        await self._client.aclose()


@lru_cache
def get_orchestrator_client() -> OrchestratorClient:
    """Singleton del cliente — reutiliza la misma conexión."""
    return OrchestratorClient(settings.orchestrator_url)