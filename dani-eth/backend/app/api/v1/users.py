"""
Gestión de usuarios.

- GET    /users             : Admin lista solo los usuarios de su empresa (filtrado por company_id).
- POST   /users/company     : Admin crea un usuario operativo asignado a su empresa.
- PUT    /users/{id}/role   : Admin cambia el rol de un usuario de su misma empresa.
- DELETE /users/{id}        : Admin elimina un usuario de su empresa (Firebase Auth + Firestore).

Aislamiento multi-tenant: todas las consultas filtran por company_id del Admin autenticado.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import (
    get_current_user,
    requiere_permiso,
    requiere_company_admin,
    ROLE_PERMISSIONS,
)
from app.core.firebase import get_firestore, get_auth
from app.schemas.user import (
    UserResponse,
    RoleUpdate,
    ALLOWED_ROLES,
    CreateCompanyUserRequest,
    OPERATIONAL_ROLES,
)

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

AdminUser  = Annotated[dict, Depends(requiere_permiso("write:users"))]
ReadUser   = Annotated[dict, Depends(requiere_permiso("read:users"))]
CompanyAdm = Annotated[dict, Depends(requiere_company_admin())]


@router.get("", response_model=list[UserResponse])
async def list_users(current: ReadUser) -> list[UserResponse]:
    """
    Lista todos los usuarios de la empresa del Admin autenticado.
    Aislamiento garantizado: nunca devuelve usuarios de otras empresas.
    """
    company_id = current.get("company_id")
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuario no tiene empresa asignada.",
        )

    db = get_firestore()
    docs = (
        db.collection("users")
        .where("company_id", "==", company_id)
        .stream()
    )
    return [
        UserResponse(
            user_id=doc.id,
            name=doc.to_dict().get("name"),
            email=doc.to_dict().get("email"),
            role=doc.to_dict().get("role", "viewer"),
            company_id=doc.to_dict().get("company_id"),
        )
        for doc in docs
    ]


@router.post(
    "/company",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear usuario operativo para esta empresa",
)
async def create_company_user(
    body: CreateCompanyUserRequest,
    admin: CompanyAdm,
) -> UserResponse:
    """
    Solo el Admin de empresa puede crear usuarios.
    El usuario hereda el company_id del Admin que lo crea.
    Solo se permiten roles operativos (security_engineer, pentester, analyst, viewer).
    """
    if body.role not in OPERATIONAL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido para usuario de empresa. Opciones: {sorted(OPERATIONAL_ROLES)}",
        )

    company_id = admin["company_id"]
    now = datetime.now(timezone.utc).isoformat()
    firebase_auth = get_auth()
    db = get_firestore()

    # Crear usuario en Firebase Auth
    try:
        firebase_user = firebase_auth.create_user(
            email=body.email,
            password=body.password,
            display_name=body.name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo crear el usuario en Firebase Auth: {e}",
        )

    uid = firebase_user.uid
    profile = {
        "uid": uid,
        "email": body.email,
        "name": body.name,
        "role": body.role,
        "company_id": company_id,
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.collection("users").document(uid).set(profile)
        permisos = ROLE_PERMISSIONS.get(body.role, [])
        firebase_auth.set_custom_user_claims(uid, {
            "role": body.role,
            "company_id": company_id,
            "permissions": permisos,
        })
    except Exception as e:
        # Rollback Firebase Auth si Firestore falla
        try:
            firebase_auth.delete_user(uid)
        except Exception:
            pass
        logger.error(f"Error guardando perfil de usuario {uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar perfil en Firestore: {e}",
        )

    logger.info(f"Usuario '{uid}' ({body.role}) creado por Admin de empresa '{company_id}'")
    return UserResponse(
        user_id=uid,
        email=body.email,
        name=body.name,
        role=body.role,
        company_id=company_id,
    )


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    body: RoleUpdate,
    admin: AdminUser,
) -> UserResponse:
    """
    Actualiza el rol de un usuario de la misma empresa.
    Verificación de empresa: el usuario target debe tener el mismo company_id.
    """
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Opciones: {sorted(ALLOWED_ROLES)}",
        )

    db = get_firestore()
    ref = db.collection("users").document(user_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    target_data = doc.to_dict()
    target_company = target_data.get("company_id")

    # Verificar aislamiento: solo se puede modificar usuarios de la misma empresa
    if target_company != admin.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar usuarios de otra empresa.",
        )

    now = datetime.now(timezone.utc).isoformat()
    ref.update({"role": body.role, "updated_at": now})

    # Cascada: propagar el nuevo rol a todos los team_members vinculados
    member_docs = (
        db.collection("team_members")
        .where("firebase_uid", "==", user_id)
        .stream()
    )
    for member_doc in member_docs:
        member_doc.reference.update({"role": body.role})
    logger.info(f"Rol actualizado en cascada a team_members para usuario '{user_id}'")

    try:
        permissions = ROLE_PERMISSIONS.get(body.role, [])
        get_auth().set_custom_user_claims(user_id, {
            "role": body.role,
            "company_id": target_company,
            "permissions": permissions,
        })
    except Exception as e:
        logger.warning(
            f"No se pudo escribir custom claim para {user_id}: {e}. "
            "El rol se actualizó en Firestore pero el JWT no cambia hasta el próximo login."
        )

    updated = ref.get().to_dict()
    return UserResponse(
        user_id=user_id,
        name=updated.get("name"),
        email=updated.get("email"),
        role=updated.get("role", "viewer"),
        company_id=updated.get("company_id"),
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_user(
    user_id: str,
    admin: CompanyAdm,
) -> None:
    """
    Elimina un usuario operativo de la empresa del Admin.
    Aislamiento: solo se puede eliminar usuarios con el mismo company_id que el Admin.
    Borra de Firebase Auth y de la colección `users` de Firestore.
    """
    db = get_firestore()
    ref = db.collection("users").document(user_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    target_data = doc.to_dict()
    target_company = target_data.get("company_id")

    if target_company != admin.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar usuarios de otra empresa.",
        )

    if target_data.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se puede eliminar al Admin de la empresa desde este portal.",
        )

    firebase_auth = get_auth()
    try:
        firebase_auth.delete_user(user_id)
    except Exception as e:
        logger.warning(f"No se pudo eliminar usuario '{user_id}' de Firebase Auth: {e}")

    # Cascada: eliminar todos los team_members vinculados antes de borrar el usuario
    member_docs = (
        db.collection("team_members")
        .where("firebase_uid", "==", user_id)
        .stream()
    )
    for member_doc in member_docs:
        member_doc.reference.delete()
    logger.info(f"team_members eliminados en cascada para usuario '{user_id}'")

    ref.delete()
    logger.info(f"Usuario '{user_id}' eliminado por Admin de empresa '{admin['company_id']}'")
