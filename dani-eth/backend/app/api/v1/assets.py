# backend/app/api/v1/assets.py
"""
Endpoints CRUD para Assets usando Firestore.
Colección: `assets`
Los assets son referenciados desde Vulnerability Hub, Patch Manager, etc.
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.security import get_current_user
from app.core.firebase import get_firestore
from app.schemas.team import AssetCreate, AssetUpdate, AssetResponse, VALID_ASSET_TYPES, VALID_STATUSES, VALID_ENVS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assets", tags=["assets"])

CurrentUser = Annotated[dict, Depends(get_current_user)]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_asset(doc_id: str, data: dict) -> AssetResponse:
    return AssetResponse(
        id=doc_id,
        name=data.get("name", ""),
        hostname=data.get("hostname", ""),
        ip_address=data.get("ip_address"),
        asset_type=data.get("asset_type", "web_app"),
        status=data.get("status", "active"),
        environment=data.get("environment", "production"),
        description=data.get("description"),
        team_id=data.get("team_id"),
        team_name=data.get("team_name"),
        created_at=data.get("created_at", ""),
        updated_at=data.get("updated_at", ""),
    )


@router.get("", response_model=list[AssetResponse])
async def list_assets(
    current: CurrentUser,
    asset_status: str | None = Query(None, alias="status"),
    asset_type: str | None = Query(None),
    environment: str | None = Query(None),
    team_id: str | None = Query(None),
) -> list[AssetResponse]:
    """Lista assets de la empresa del usuario autenticado con filtros opcionales."""
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin empresa asignada.")

    db = get_firestore()

    # Filtro base por empresa — aislamiento multi-tenant garantizado
    docs = list(
        db.collection("assets")
        .where("company_id", "==", company_id)
        .order_by("name")
        .stream()
    )
    results = []

    for doc in docs:
        data = doc.to_dict()
        if asset_status and data.get("status") != asset_status:
            continue
        if asset_type and data.get("asset_type") != asset_type:
            continue
        if environment and data.get("environment") != environment:
            continue
        if team_id and data.get("team_id") != team_id:
            continue
        results.append(_doc_to_asset(doc.id, data))

    return results


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(body: AssetCreate, current: CurrentUser) -> AssetResponse:
    """Crea un activo vinculado a la empresa del usuario autenticado."""
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin empresa asignada.")

    if body.asset_type not in VALID_ASSET_TYPES:
        raise HTTPException(400, f"asset_type inválido. Opciones: {VALID_ASSET_TYPES}")
    if body.status not in VALID_STATUSES:
        raise HTTPException(400, f"status inválido. Opciones: {VALID_STATUSES}")
    if body.environment not in VALID_ENVS:
        raise HTTPException(400, f"environment inválido. Opciones: {VALID_ENVS}")

    db = get_firestore()

    # Verificar hostname único dentro de la empresa
    existing = (
        db.collection("assets")
        .where("hostname", "==", body.hostname)
        .where("company_id", "==", company_id)
        .limit(1)
        .get()
    )
    if existing:
        raise HTTPException(400, f"Ya existe un asset con hostname '{body.hostname}'")

    # Obtener nombre del equipo si se especificó
    team_name = None
    if body.team_id:
        team_doc = db.collection("teams").document(body.team_id).get()
        if not team_doc.exists:
            raise HTTPException(404, "Equipo no encontrado")
        team_name = team_doc.to_dict().get("name")

    now = _utcnow()
    data = {
        "name":        body.name,
        "hostname":    body.hostname,
        "ip_address":  body.ip_address,
        "asset_type":  body.asset_type,
        "status":      body.status,
        "environment": body.environment,
        "description": body.description,
        "team_id":     body.team_id,
        "team_name":   team_name,
        "company_id":  company_id,   # Aislamiento multi-tenant
        "created_at":  now,
        "updated_at":  now,
    }

    doc_ref = db.collection("assets").document()
    doc_ref.set(data)

    logger.info(f"Asset creado: {doc_ref.id} — {body.hostname}")
    return _doc_to_asset(doc_ref.id, data)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, _: CurrentUser) -> AssetResponse:
    db = get_firestore()
    doc = db.collection("assets").document(asset_id).get()
    if not doc.exists:
        raise HTTPException(404, "Asset no encontrado")
    return _doc_to_asset(doc.id, doc.to_dict())


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, body: AssetUpdate, _: CurrentUser) -> AssetResponse:
    db = get_firestore()
    ref = db.collection("assets").document(asset_id)
    if not ref.get().exists:
        raise HTTPException(404, "Asset no encontrado")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if "team_id" in updates and updates["team_id"]:
        team_doc = db.collection("teams").document(updates["team_id"]).get()
        if not team_doc.exists:
            raise HTTPException(404, "Equipo no encontrado")
        updates["team_name"] = team_doc.to_dict().get("name")

    updates["updated_at"] = _utcnow()
    ref.update(updates)

    updated = ref.get()
    return _doc_to_asset(updated.id, updated.to_dict())


@router.delete("/{asset_id}", status_code=204)
async def delete_asset(asset_id: str, _: CurrentUser):
    db = get_firestore()
    ref = db.collection("assets").document(asset_id)
    if not ref.get().exists:
        raise HTTPException(404, "Asset no encontrado")
    ref.delete()