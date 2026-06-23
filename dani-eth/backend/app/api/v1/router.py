"""
Router principal de la API v1.
Registra todos los sub-routers en orden lógico.
"""
from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    users,
    companies,  # Portal Super Admin — gestión de empresas
    targets,
    campaigns,
    findings,   # GET /findings y GET /patches (vistas globales)
    reports,
    dashboard,
    settings,
    teams,
    assets,
)

api_router = APIRouter(prefix="/api/v1")

# Infraestructura
api_router.include_router(health.router)

# Identidad y sesión
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(companies.router)  # Solo Super Admin
api_router.include_router(settings.router)

# Recursos propios del back
api_router.include_router(targets.router)

# Campañas (proxy + índice local)
api_router.include_router(campaigns.router)

# Vistas globales de hallazgos y parches (proxy al orquestador)
api_router.include_router(findings.router)

# Reportes (almacenados en Firestore + PDF en Storage)
api_router.include_router(reports.router)

# Dashboard
api_router.include_router(dashboard.router)

# Team & Assets
api_router.include_router(teams.router)
api_router.include_router(assets.router)
