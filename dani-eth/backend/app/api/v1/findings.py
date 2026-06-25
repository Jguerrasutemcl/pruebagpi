"""
Endpoints de hallazgos.

Flujo de escritura (interno):
  El orquestador llama POST /findings con cada hallazgo descubierto.
  Se valida X-Service-Token y se guarda en la colección 'findings' de Firestore.

Flujo de lectura (frontend):
  GET /findings  → lista paginada con filtros opcionales (severity, status, campaign_id)
  GET /patches   → hallazgos con status=pending (remediaciones pendientes)
  PUT /findings/{id}/status     → cambia el estado de revisión
  PUT /findings/{id}/remediated → marca como remediado
"""
import datetime
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel

from app.core.security import requiere_permiso
from app.core.firebase import get_firestore
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["findings"])

ReadVuln  = Annotated[dict, Depends(requiere_permiso("read:vulnerabilities"))]
WriteVuln = Annotated[dict, Depends(requiere_permiso("write:vulnerabilities"))]


# ── Schema de ingesta (orquestador → backend) ─────────────────────────────────

class FindingIngest(BaseModel):
    campaign_id: str
    target: str
    title: str
    description: str = ""
    severity: str = "info"   # critical | high | medium | low | info
    type: str = "finding"
    host: str | None = None
    port: int | None = None


def _verify_service_token(x_service_token: str | None = Header(default=None)):
    """Solo el orquestador puede llamar POST /findings."""
    if x_service_token != settings.orchestrator_service_token:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "INVALID_SERVICE_TOKEN",
                "message": "Acceso no autorizado. Solo el orquestador puede llamar este endpoint.",
            },
        )


# ── El orquestador empuja hallazgos ───────────────────────────────────────────

@router.post("/findings", status_code=201)
async def ingest_finding(
    body: FindingIngest,
    _token=Depends(_verify_service_token),
) -> dict:
    """
    Recibe un hallazgo del orquestador y lo guarda en Firestore.
    Header requerido: X-Service-Token
    """
    db = get_firestore()
    doc_ref = db.collection("findings").document()
    finding_id = doc_ref.id

    doc_ref.set({
        "finding_id": finding_id,
        "campaign_id": body.campaign_id,
        "target": body.target,
        "title": body.title,
        "description": body.description,
        "severity": body.severity,
        "type": body.type,
        "host": body.host,
        "port": body.port,
        "status": "pending",
        "remediated": False,
        "notes": None,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z",
    })

    logger.info(f"Hallazgo guardado: {finding_id} ({body.severity}) — {body.title[:60]}")
    return {"finding_id": finding_id, "message": "Hallazgo guardado correctamente"}


# ── El frontend consulta hallazgos ────────────────────────────────────────────

@router.get("/findings")
async def get_all_findings(
    _: ReadVuln,
    severity: str | None = Query(None, description="critical | high | medium | low | info"),
    finding_status: str | None = Query(None, alias="status"),
    campaign_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Lista hallazgos almacenados en Firestore con filtros opcionales.
    Requiere: read:vulnerabilities
    """
    db = get_firestore()
    query = db.collection("findings").order_by("created_at", direction="DESCENDING")

    docs = list(query.stream())

    results = []
    for d in docs:
        data = d.to_dict()
        if severity and data.get("severity") != severity:
            continue
        if finding_status and data.get("status") != finding_status:
            continue
        if campaign_id and data.get("campaign_id") != campaign_id:
            continue
        results.append(data)

    page = results[offset: offset + limit]
    return {
        "findings": page,
        "total": len(results),
        "limit": limit,
        "offset": offset,
    }


@router.get("/patches")
async def get_all_patches(
    _: ReadVuln,
    patch_status: str | None = Query(None, alias="status"),
    severity: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """
    Hallazgos pendientes de remediación (Patch Manager).
    Requiere: read:vulnerabilities
    """
    db = get_firestore()
    docs = list(
        db.collection("findings")
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )

    results = []
    for d in docs:
        data = d.to_dict()
        effective_status = patch_status or "pending"
        if data.get("status") != effective_status:
            continue
        if severity and data.get("severity") != severity:
            continue
        results.append(data)

    page = results[offset: offset + limit]
    return {
        "patches": page,
        "total": len(results),
        "limit": limit,
        "offset": offset,
    }


# ── El frontend actualiza hallazgos ───────────────────────────────────────────

class StatusUpdate(BaseModel):
    status: str  # pending | reviewed | false_positive


class RemediatedUpdate(BaseModel):
    remediated: bool
    notes: str | None = None


@router.put("/findings/{finding_id}/status")
async def update_finding_status(
    finding_id: str,
    body: StatusUpdate,
    _: WriteVuln,
) -> dict:
    """Cambia el estado de revisión de un hallazgo. Requiere: write:vulnerabilities"""
    db = get_firestore()
    doc = db.collection("findings").document(finding_id)
    if not doc.get().exists:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    doc.update({"status": body.status})
    return {"finding_id": finding_id, "status": body.status}


@router.put("/findings/{finding_id}/remediated")
async def update_finding_remediated(
    finding_id: str,
    body: RemediatedUpdate,
    _: WriteVuln,
) -> dict:
    """Marca un hallazgo como remediado. Requiere: write:vulnerabilities"""
    db = get_firestore()
    doc = db.collection("findings").document(finding_id)
    if not doc.get().exists:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    doc.update({"remediated": body.remediated, "notes": body.notes})
    return {"finding_id": finding_id, "remediated": body.remediated}
