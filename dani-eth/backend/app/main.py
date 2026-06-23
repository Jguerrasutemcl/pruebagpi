"""
Aplicación principal de FastAPI para DANI-ETH.

Entry point del backend. Configura:
- FastAPI con metadata y documentación.
- CORS para el frontend.
- Firebase (Auth + Firestore + Storage) al arrancar.
- Cierre limpio del cliente del orquestador al apagar.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.firebase import initialize_firebase
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup y shutdown del servidor."""
    # ── Startup ──────────────────────────────────────────────────
    logger.info(f"Iniciando {settings.app_name} en modo {settings.app_env}")

    firebase_ok = initialize_firebase()
    if not firebase_ok:
        logger.warning(
            "Firebase no inicializado. Los endpoints protegidos no funcionarán "
            "hasta agregar las credenciales en backend/credentials/firebase-admin-key.json"
        )
    else:
        logger.info("Firebase (Auth + Firestore + Storage) inicializado")

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    logger.info("Apagando servidor — cerrando cliente del orquestador...")
    try:
        from app.services.orchestrator_client import get_orchestrator_client
        client = get_orchestrator_client()
        await client.close()
        logger.info("OrchestratorClient cerrado correctamente")
    except Exception as e:
        logger.warning(f"No se pudo cerrar el cliente del orquestador: {e}")


app = FastAPI(
    title=settings.app_name,
    description="Backend del orquestador inteligente de Ethical Hacking DANI-ETH",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — debe ir antes de los routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "message": f"Bienvenido a {settings.app_name}",
        "docs": "/docs",
        "health": "/api/v1/health",
        "version": "0.2.0",
    }
