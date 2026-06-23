"""
CRUD de objetivos de pentesting.
Los targets son datos propios del back — se guardan en Firestore.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, requiere_permiso
from app.core.firebase import get_firestore
from app.schemas.target import TargetCreate, TargetUpdate, TargetResponse

router = APIRouter(prefix="/targets", tags=["targets"])

WriteTarget = Annotated[dict, Depends(requiere_permiso("write:targets"))]
ReadTarget  = Annotated[dict, Depends(requiere_permiso("read:targets"))]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_target(doc_id: str, data: dict) -> TargetResponse:
    return TargetResponse(
        target_id=doc_id,
        name=data.get("name", ""),
        target=data.get("target", ""),
        description=data.get("description"),
        scope=data.get("scope", {}),
        created_at=data.get("created_at", ""),
        updated_at=data.get("updated_at"),
    )


@router.post("", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(body: TargetCreate, _: WriteTarget) -> TargetResponse:
    """Crea un nuevo objetivo de pentesting (requiere write:targets)."""
    db = get_firestore()
    now = _utcnow()
    data = {
        "name": body.name,
        "target": body.target,
        "description": body.description,
        "scope": body.scope.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    doc_ref = db.collection("targets").document()
    doc_ref.set(data)
    return _doc_to_target(doc_ref.id, data)


@router.get("", response_model=list[TargetResponse])
async def list_targets(_: ReadTarget) -> list[TargetResponse]:
    """Lista todos los objetivos (requiere read:targets)."""
    db = get_firestore()
    docs = db.collection("targets").order_by("created_at").stream()
    return [_doc_to_target(doc.id, doc.to_dict()) for doc in docs]


@router.get("/{target_id}", response_model=TargetResponse)
async def get_target(target_id: str, _: ReadTarget) -> TargetResponse:
    """Detalle de un objetivo específico (requiere read:targets)."""
    db = get_firestore()
    doc = db.collection("targets").document(target_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    return _doc_to_target(doc.id, doc.to_dict())


@router.put("/{target_id}", response_model=TargetResponse)
async def update_target(
    target_id: str,
    body: TargetUpdate,
    _: WriteTarget,
) -> TargetResponse:
    """Actualiza nombre, descripción o scope de un objetivo (requiere write:targets)."""
    db = get_firestore()
    ref = db.collection("targets").document(target_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "scope" in updates and body.scope:
        updates["scope"] = body.scope.model_dump()
    updates["updated_at"] = _utcnow()
    ref.update(updates)
    return _doc_to_target(target_id, ref.get().to_dict())


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target(target_id: str, _: WriteTarget):
    """
    Elimina un objetivo (requiere write:targets).
    Falla si tiene una campaña activa en el índice local.
    """
    db = get_firestore()
    ref = db.collection("targets").document(target_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    # Verificar campañas activas en el índice local que mantiene el back.
    # (La colección campaigns_index se escribe en POST /campaign/start)
    active = (
        db.collection("campaigns_index")
        .where("target_id", "==", target_id)
        .where("status", "in", ["running", "paused"])
        .limit(1)
        .get()
    )
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "TARGET_HAS_ACTIVE_CAMPAIGN",
                "message": "No se puede eliminar un objetivo con campaña activa",
            },
        )

    ref.delete()
