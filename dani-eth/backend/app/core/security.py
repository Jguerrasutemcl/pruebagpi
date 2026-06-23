"""
Dependencias de autenticación y autorización para FastAPI.

Expone:
- get_current_user          : valida el JWT de Firebase; normaliza role y company_id.
- requiere_permiso(permiso) : verifica permiso granular.
- requiere_rol(roles)       : verifica pertenencia de rol.
- requiere_super_admin()    : exclusivo para el rol super_admin global.
- requiere_company_admin()  : exclusivo para admin de empresa (con company_id).
- ROLE_PERMISSIONS          : mapa rol → permisos.
"""
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import get_auth, get_firestore, is_firebase_ready

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)

# ── Mapa de permisos por rol ─────────────────────────────────────────────────
ROLE_PERMISSIONS: dict[str, list[str]] = {
    # Super Admin global — solo gestión de empresas, sin acceso a datos operativos
    "super_admin": [
        "manage:companies",
        "read:companies",
    ],
    # Admin de empresa — gestión completa dentro de su company_id
    "admin": [
        "write:users",           "read:users",
        "write:targets",         "read:targets",
        "write:campaigns",       "read:campaigns",
        "write:vulnerabilities", "read:vulnerabilities",
        "read:reports",          "write:reports",
        "write:settings",        "read:settings",
        "write:teams",           "read:teams",
        "write:assets",          "read:assets",
    ],
    "security_engineer": [
        "read:users",
        "write:targets",         "read:targets",
        "write:campaigns",       "read:campaigns",
        "write:vulnerabilities", "read:vulnerabilities",
        "read:reports",
        "write:settings",        "read:settings",
    ],
    "pentester": [
        "write:targets",         "read:targets",
        "write:campaigns",       "read:campaigns",
        "write:vulnerabilities", "read:vulnerabilities",
        "read:reports",
        "write:settings",        "read:settings",
    ],
    "analyst": [
        "read:targets",
        "read:campaigns",
        "read:vulnerabilities",
        "read:reports",
        "write:settings",        "read:settings",
    ],
    "viewer": [
        "read:campaigns",
        "read:vulnerabilities",
        "read:reports",
        "read:settings",
    ],
}


# ── Validación de token ──────────────────────────────────────────────────────

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> dict:
    """
    Valida el JWT de Firebase y retorna el payload enriquecido.

    Normaliza siempre los campos 'role' y 'company_id' en el dict devuelto
    para que todas las dependencias downstream puedan leerlos de forma segura.

    Prioridad de fuente:
      1. Custom claims del JWT (camino rápido — no toca Firestore).
      2. Firestore como fallback (usuarios migrados sin claims actualizados).
    """
    if not is_firebase_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de autenticación no disponible",
        )
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = get_auth().verify_id_token(credentials.credentials)
    except Exception as e:
        logger.warning(f"Token inválido: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Normalizar role y company_id desde custom claims
    role = decoded.get("role")
    company_id = decoded.get("company_id")

    # Fallback a Firestore si no hay claims (usuario sin claims actualizados)
    if not role:
        try:
            db = get_firestore()
            doc = db.collection("users").document(decoded["uid"]).get()
            if doc.exists:
                data = doc.to_dict()
                role = data.get("role", "viewer")
                company_id = data.get("company_id")
        except Exception:
            role = "viewer"

    # Inyectar campos normalizados — disponibles en todas las dependencias downstream
    decoded["role"] = role or "viewer"
    decoded["company_id"] = company_id  # None para super_admin y viewers sin empresa
    return decoded


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> dict | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# ── Helpers internos ─────────────────────────────────────────────────────────

def _get_permissions_from_token(user: dict) -> list[str]:
    if "permissions" in user and user["permissions"]:
        return user["permissions"]
    role = user.get("role", "viewer")
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["viewer"])


# ── Dependencias RBAC ────────────────────────────────────────────────────────

def requiere_permiso(permiso: str):
    """
    Verifica permiso granular.
    Ejemplo: Depends(requiere_permiso("write:targets"))
    """
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        permisos = _get_permissions_from_token(user)
        if permiso not in permisos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "PERMISSION_DENIED",
                    "message": f"Se requiere el permiso: {permiso}",
                    "your_role": user.get("role", "unknown"),
                },
            )
        return user
    return dependency


def requiere_rol(roles: list[str]):
    """
    Verifica que el usuario tiene uno de los roles de la lista.
    Preferir requiere_permiso() para granularidad; este es para checks de rol puro.
    """
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        role = user.get("role", "viewer")
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "ROLE_INSUFFICIENT",
                    "message": f"Rol requerido: {roles}. Tu rol: {role}",
                },
            )
        return user
    return dependency


def requiere_super_admin():
    """
    Exclusivo para el Super Admin global.
    Ningún otro rol puede acceder, ni siquiera el admin de empresa.
    """
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "SUPER_ADMIN_ONLY",
                    "message": "Esta acción solo puede realizarla un Super Admin.",
                    "your_role": user.get("role", "unknown"),
                },
            )
        return user
    return dependency


def requiere_company_admin():
    """
    Solo admins de empresa con company_id válido.
    Uso: crear usuarios, gestionar equipos y assets de su empresa.
    """
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "COMPANY_ADMIN_ONLY",
                    "message": "Solo el Admin de empresa puede realizar esta acción.",
                    "your_role": user.get("role", "unknown"),
                },
            )
        if not user.get("company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "NO_COMPANY_ASSIGNED",
                    "message": "Este Admin no tiene empresa asignada. Contacta al Super Admin.",
                },
            )
        return user
    return dependency
