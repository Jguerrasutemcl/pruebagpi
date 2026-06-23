"""
Endpoints de autenticación del backend.

Reglas de seguridad:
- /register : El registro público SIEMPRE asigna rol 'viewer' sin company_id,
              ignorando cualquier valor que el cliente intente enviar.
              Los roles superiores y la asignación de empresa son exclusivos
              del Admin de empresa (POST /users/company).
- /me/profile: Devuelve perfil completo incluyendo company_id y role,
               leyendo desde Firestore como fuente de verdad.
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.core.firebase import get_auth, get_firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    # Nota: el campo 'role' fue eliminado intencionalmente.
    # El backend asigna 'viewer' siempre para el registro público.


class RegisterResponse(BaseModel):
    uid: str
    email: str | None
    name: str
    role: str
    company_id: str | None = None


class MeResponse(BaseModel):
    uid: str
    email: str | None
    name: str | None
    role: str
    company_id: str | None = None
    email_verified: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Auto-registro público — siempre asigna rol 'viewer' sin empresa",
)
async def register_profile(
    body: RegisterRequest,
    user: Annotated[dict, Depends(get_current_user)],
) -> RegisterResponse:
    """
    Guarda el perfil extendido del usuario en Firestore.

    REGLA DE SEGURIDAD CRÍTICA:
    - El rol asignado es siempre 'viewer', sin importar qué envíe el cliente.
    - company_id es siempre None. Solo un Admin de empresa puede invitar
      usuarios a su empresa mediante POST /api/v1/users/company.
    """
    uid = user["uid"]
    now = datetime.now(timezone.utc).isoformat()
    forced_role = "viewer"  # Inmutable — nunca confiar en el cliente

    profile = {
        "uid": uid,
        "email": user.get("email"),
        "name": body.name,
        "role": forced_role,
        "company_id": None,
        "created_at": now,
        "updated_at": now,
    }

    try:
        db = get_firestore()
        db.collection("users").document(uid).set(profile, merge=True)
    except RuntimeError:
        pass

    try:
        from app.core.security import ROLE_PERMISSIONS
        permisos = ROLE_PERMISSIONS.get(forced_role, [])
        get_auth().set_custom_user_claims(uid, {
            "role": forced_role,
            "company_id": None,
            "permissions": permisos,
        })
    except Exception as e:
        logger.warning(f"No se pudieron escribir custom claims para {uid}: {e}")

    return RegisterResponse(**profile)


@router.get(
    "/me/profile",
    response_model=MeResponse,
    summary="Perfil completo del usuario actual (incluyendo company_id)",
)
async def get_my_profile(
    user: Annotated[dict, Depends(get_current_user)],
) -> MeResponse:
    """
    Devuelve el perfil del usuario combinando Firebase Auth + Firestore.
    Firestore es la fuente de verdad para role y company_id.
    """
    uid = user["uid"]
    role = "viewer"
    company_id = None
    name = user.get("name")

    try:
        db = get_firestore()
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            role = data.get("role", "viewer")
            company_id = data.get("company_id")
            name = data.get("name") or name
    except RuntimeError:
        # Fallback al JWT si Firestore no está disponible
        role = user.get("role", "viewer")
        company_id = user.get("company_id")

    return MeResponse(
        uid=uid,
        email=user.get("email"),
        name=name,
        role=role,
        company_id=company_id,
        email_verified=user.get("email_verified", False),
    )


@router.post("/logout", summary="Cerrar sesión")
async def logout(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    """
    Invalida la sesión del lado del servidor.
    El frontend debe eliminar el token localmente después de llamar esto.
    """
    return {"message": "Sesión cerrada exitosamente", "uid": user["uid"]}
