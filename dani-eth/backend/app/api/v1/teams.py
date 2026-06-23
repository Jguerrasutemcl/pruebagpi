# backend/app/api/v1/teams.py
"""
Endpoints para Team & TeamMembers usando Firestore.
Colecciones: `teams`, `team_members`
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.core.firebase import get_firestore
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse,
    TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse,
    TeamStatsResponse,
    DEFAULT_PERMISSIONS, DEFAULT_NOTIFICATIONS, DEFAULT_NOTIFY_WHEN,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/teams", tags=["teams"])

CurrentUser = Annotated[dict, Depends(get_current_user)]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _calc_workload(active_tasks: int) -> tuple[int, str]:
    """Devuelve (porcentaje, label) basado en cantidad de tareas activas."""
    if active_tasks <= 2:
        pct = min(active_tasks * 20, 40)
        label = "Light Load"
    elif active_tasks <= 5:
        pct = 40 + (active_tasks - 2) * 10
        label = "Medium Load"
    else:
        pct = min(70 + (active_tasks - 5) * 5, 100)
        label = "Overloaded"
    return pct, label


def _generate_member_code(team_name: str, count: int) -> str:
    """Genera NET-001, APP-002, SRV-003 según el nombre del equipo."""
    name_lower = team_name.lower()
    if "network" in name_lower:
        prefix = "NET"
    elif "application" in name_lower or "app" in name_lower:
        prefix = "APP"
    elif "server" in name_lower:
        prefix = "SRV"
    else:
        prefix = "MBR"
    return f"{prefix}-{int(count):03d}"


def _doc_to_team(doc_id: str, data: dict, member_count: int = 0) -> TeamResponse:
    return TeamResponse(
        id=doc_id,
        name=data.get("name", ""),
        description=data.get("description"),
        icon=data.get("icon"),
        member_count=member_count,
        created_at=data.get("created_at", ""),
        updated_at=data.get("updated_at", ""),
    )


def _doc_to_member(doc_id: str, data: dict, team_name: str | None = None) -> TeamMemberResponse:
    active = data.get("active_tasks_count", 0)
    pct, label = _calc_workload(active)
    return TeamMemberResponse(
        id=doc_id,
        member_code=data.get("member_code", ""),
        firebase_uid=data.get("firebase_uid"),
        name=data.get("name", ""),
        email=data.get("email", ""),
        role=data.get("role", ""),
        is_team_lead=data.get("is_team_lead", False),
        team_id=data.get("team_id", ""),
        team_name=team_name or data.get("team_name"),
        active_tasks_count=active,
        completed_this_month=data.get("completed_this_month", 0),
        avg_completion_days=data.get("avg_completion_days", 0.0),
        workload_pct=pct,
        workload_label=label,
        permissions=data.get("permissions", DEFAULT_PERMISSIONS),
        notifications=data.get("notifications", DEFAULT_NOTIFICATIONS),
        notify_when=data.get("notify_when", DEFAULT_NOTIFY_WHEN),
        created_at=data.get("created_at", ""),
        updated_at=data.get("updated_at", ""),
    )


# ════════════════════════════════════════════════════════════
#  TEAMS
# ════════════════════════════════════════════════════════════

@router.get("", response_model=list[TeamResponse])
async def list_teams(current: CurrentUser) -> list[TeamResponse]:
    """Lista los equipos de la empresa del usuario autenticado."""
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin empresa asignada.")

    db = get_firestore()
    # No .order_by() to avoid requiring a Firestore composite index; sort in Python.
    all_docs = sorted(
        db.collection("teams").where("company_id", "==", company_id).stream(),
        key=lambda d: d.to_dict().get("created_at", ""),
    )

    results: list[TeamResponse] = []
    for doc in all_docs:
        members_count = (
            db.collection("team_members")
            .where("team_id", "==", doc.id)
            .count()
            .get()[0][0]
            .value
        )
        results.append(_doc_to_team(doc.id, doc.to_dict(), members_count))

    return results


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(body: TeamCreate, current: CurrentUser) -> TeamResponse:
    """Crea un nuevo equipo en Firestore, vinculado a la empresa del Admin."""
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin empresa asignada.")

    db = get_firestore()
    now = _utcnow()

    data = {
        "name": body.name,
        "description": body.description,
        "icon": body.icon,
        "company_id": company_id,  # Aislamiento multi-tenant
        "created_at": now,
        "updated_at": now,
    }

    doc_ref = db.collection("teams").document()
    doc_ref.set(data)

    logger.info(f"Team creado: {doc_ref.id} — {body.name}")
    return _doc_to_team(doc_ref.id, data, member_count=0)


@router.get("/stats/summary", response_model=TeamStatsResponse)
async def get_stats(current: CurrentUser) -> TeamStatsResponse:
    """
    Estadísticas de la empresa del usuario autenticado:
    Total Members | Active Tasks | Overloaded | Available | Avg Completion
    """
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin empresa asignada.")

    db = get_firestore()

    teams_count = (
        db.collection("teams")
        .where("company_id", "==", company_id)
        .count()
        .get()[0][0]
        .value
    )
    members_docs = list(
        db.collection("team_members")
        .where("company_id", "==", company_id)
        .stream()
    )

    members_data = [d.to_dict() for d in members_docs]
    total_tasks = sum(m.get("active_tasks_count", 0) for m in members_data)
    overloaded  = sum(1 for m in members_data if m.get("active_tasks_count", 0) > 5)
    available   = sum(1 for m in members_data if m.get("active_tasks_count", 0) < 3)
    avg_days    = (
        sum(m.get("avg_completion_days", 0.0) for m in members_data) / len(members_data)
        if members_data else 0.0
    )

    return TeamStatsResponse(
        total_members=len(members_data),
        total_teams=teams_count,
        active_tasks=total_tasks,
        overloaded_count=overloaded,
        available_count=available,
        avg_completion_days=round(avg_days, 1),
    )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, _: CurrentUser) -> TeamResponse:
    db = get_firestore()
    doc = db.collection("teams").document(team_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    members_count = (
        db.collection("team_members")
        .where("team_id", "==", team_id)
        .count()
        .get()[0][0]
        .value
    )
    return _doc_to_team(doc.id, doc.to_dict(), members_count)


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, body: TeamUpdate, _: CurrentUser) -> TeamResponse:
    db = get_firestore()
    ref = db.collection("teams").document(team_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = _utcnow()
    ref.update(updates)

    updated_doc = ref.get()
    members_count = (
        db.collection("team_members")
        .where("team_id", "==", team_id)
        .count()
        .get()[0][0]
        .value
    )
    return _doc_to_team(updated_doc.id, updated_doc.to_dict(), members_count)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: str, _: CurrentUser):
    db = get_firestore()
    ref = db.collection("teams").document(team_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    ref.delete()


# ════════════════════════════════════════════════════════════
#  TEAM MEMBERS
# ════════════════════════════════════════════════════════════

@router.get("/{team_id}/members", response_model=list[TeamMemberResponse])
async def list_members(team_id: str, _: CurrentUser) -> list[TeamMemberResponse]:
    """Lista todos los miembros de un equipo."""
    db = get_firestore()

    # Verificar que el equipo existe y obtener su nombre
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    team_name = team_doc.to_dict().get("name", "")

    members_docs = sorted(
        db.collection("team_members").where("team_id", "==", team_id).stream(),
        key=lambda d: d.to_dict().get("member_code", ""),
    )

    return [_doc_to_member(d.id, d.to_dict(), team_name) for d in members_docs]


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=201)
async def create_member(team_id: str, body: TeamMemberCreate, current: CurrentUser) -> TeamMemberResponse:
    """
    Añade un miembro al equipo.
    Auto-genera member_code (NET-001) y escribe en Firestore.
    Se verá reflejado inmediatamente en la consola de Firebase.
    """
    db = get_firestore()

    # Verificar equipo
    team_doc = db.collection("teams").document(team_id).get()
    if not team_doc.exists:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    team_name = team_doc.to_dict().get("name", "")

    # Contar miembros actuales para generar el código
    current_count = (
        db.collection("team_members")
        .where("team_id", "==", team_id)
        .count()
        .get()[0][0]
        .value
    )
    member_code = _generate_member_code(team_name, current_count + 1)

    now = _utcnow()
    data = {
        "member_code":          member_code,
        "firebase_uid":         body.firebase_uid,
        "name":                 body.name,
        "email":                body.email,
        "role":                 body.role,
        "is_team_lead":         body.is_team_lead,
        "team_id":              team_id,
        "team_name":            team_name,
        "company_id":           current.get("company_id"),  # Aislamiento multi-tenant
        "active_tasks_count":   0,
        "completed_this_month": 0,
        "avg_completion_days":  0.0,
        "permissions":          body.permissions or DEFAULT_PERMISSIONS,
        "notifications":        body.notifications or DEFAULT_NOTIFICATIONS,
        "notify_when":          body.notify_when or DEFAULT_NOTIFY_WHEN,
        "created_at":           now,
        "updated_at":           now,
    }

    doc_ref = db.collection("team_members").document()
    doc_ref.set(data)

    logger.info(f"Miembro creado: {doc_ref.id} — {body.name} ({member_code})")
    return _doc_to_member(doc_ref.id, data, team_name)


@router.get("/members/{member_id}", response_model=TeamMemberResponse)
async def get_member(member_id: str, _: CurrentUser) -> TeamMemberResponse:
    db = get_firestore()
    doc = db.collection("team_members").document(member_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return _doc_to_member(doc.id, doc.to_dict())


@router.patch("/members/{member_id}", response_model=TeamMemberResponse)
async def update_member(member_id: str, body: TeamMemberUpdate, _: CurrentUser) -> TeamMemberResponse:
    db = get_firestore()
    ref = db.collection("team_members").document(member_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = _utcnow()

    # Si cambia de equipo, actualizar team_name también
    if "team_id" in updates:
        new_team_doc = db.collection("teams").document(updates["team_id"]).get()
        if not new_team_doc.exists:
            raise HTTPException(status_code=404, detail="Equipo destino no encontrado")
        updates["team_name"] = new_team_doc.to_dict().get("name", "")

    ref.update(updates)
    updated_doc = ref.get()
    return _doc_to_member(updated_doc.id, updated_doc.to_dict())


@router.delete("/members/{member_id}", status_code=204)
async def delete_member(member_id: str, _: CurrentUser):
    db = get_firestore()
    ref = db.collection("team_members").document(member_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    ref.delete()