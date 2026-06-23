"""Punto de entrada de la API REST del Orquestador Dani-ETH.

Ejecutar desde el directorio orchestrator/:

    uvicorn main:app --reload --port 8001

Documentación interactiva en http://127.0.0.1:8001/docs
"""

from fastapi import FastAPI

# Imports SIN punto relativo: uvicorn main:app resuelve desde el directorio
# orchestrator/, así que los módulos se encuentran como paquetes normales.
from routes.campaign  import router as campaign_router
from routes.findings  import router as findings_router
from routes.dashboard import router as dashboard_router

app = FastAPI(
    title="Dani-ETH Orchestrator API",
    description="Orquestador de IA para campañas de pentesting ético.",
    version="1.0.0",
)

app.include_router(campaign_router)
app.include_router(findings_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"status": "ok", "service": "dani-eth-orchestrator"}
