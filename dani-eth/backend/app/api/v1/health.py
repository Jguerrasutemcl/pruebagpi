"""
Endpoint de health check.

Verifica el estado del backend y sus dependencias (Firebase, Redis).
Útil para:
- Verificar que el setup inicial funciona.
- Monitoreo en producción.
- Debugging de problemas de conexión.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.core.firebase import is_firebase_ready

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    """Respuesta del health check."""
    status: str
    app_name: str
    app_env: str
    firebase: str
    project_id: str | None = None


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Verifica el estado general del backend.

    Returns:
        Estado del servicio, ambiente y conexiones.
    """
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        app_env=settings.app_env,
        firebase="connected" if is_firebase_ready() else "not_configured",
        project_id=settings.firebase_project_id if is_firebase_ready() else None,
    )
