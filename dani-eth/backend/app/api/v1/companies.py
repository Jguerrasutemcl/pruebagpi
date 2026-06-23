"""
Gestión de empresas — exclusivo para Super Admin.

Flujo de creación de empresa:
1. Super Admin envía nombre + slug de empresa y datos del primer Admin.
2. Se verifica que el slug no esté tomado en Firestore.
3. Se crea el usuario Admin en Firebase Auth.
4. Se persiste el documento de empresa en Firestore: companies/{company_slug}.
5. Se persiste el perfil del Admin en Firestore: users/{uid}.
6. Se escriben custom claims del Admin: {role: "admin", company_id: slug}.

En caso de error en Firestore, se hace rollback eliminando el usuario Firebase
para mantener consistencia.
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import requiere_super_admin, ROLE_PERMISSIONS
from app.core.firebase import get_auth, get_firestore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])

SuperAdmin = Annotated[dict, Depends(requiere_super_admin())]


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdminUserData(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)


class CompanyCreateRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    company_slug: str = Field(
        ...,
        min_length=2,
        max_length=50,
        pattern=r"^[a-z0-9\-]+$",
        description="ID único: solo minúsculas, números y guiones. Ej: acme-security",
    )
    admin: AdminUserData


class CompanyResponse(BaseModel):
    company_id: str
    company_name: str
    admin_uid: str
    admin_email: str
    created_at: str


class CompanyListItem(BaseModel):
    company_id: str
    name: str
    admin_uid: str
    created_at: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Super Admin] Registrar nueva empresa y su primer Admin",
)
async def create_company(
    body: CompanyCreateRequest,
    super_admin: SuperAdmin,
) -> CompanyResponse:
    """
    Crea una empresa y su primer usuario Admin.

    Solo el Super Admin puede llamar este endpoint.
    El Admin creado puede inmediatamente iniciar sesión; sus custom claims
    ya incluyen {role: "admin", company_id: company_slug}.
    """
    db = get_firestore()
    firebase_auth = get_auth()
    company_id = body.company_slug
    now = datetime.now(timezone.utc).isoformat()

    # 1. Verificar que el slug no esté tomado
    if db.collection("companies").document(company_id).get().exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una empresa con el slug '{company_id}'.",
        )

    # 2. Crear el usuario Admin en Firebase Auth
    try:
        firebase_user = firebase_auth.create_user(
            email=body.admin.email,
            password=body.admin.password,
            display_name=body.admin.name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo crear el usuario Admin en Firebase Auth: {e}",
        )

    admin_uid = firebase_user.uid

    try:
        # 3. Crear documento de empresa en Firestore
        db.collection("companies").document(company_id).set({
            "company_id": company_id,
            "name": body.company_name,
            "admin_uid": admin_uid,
            "created_at": now,
            "created_by": super_admin["uid"],
        })

        # 4. Crear perfil del Admin en Firestore
        db.collection("users").document(admin_uid).set({
            "uid": admin_uid,
            "email": body.admin.email,
            "name": body.admin.name,
            "role": "admin",
            "company_id": company_id,
            "created_at": now,
            "updated_at": now,
        })

        # 5. Escribir custom claims del Admin
        permisos = ROLE_PERMISSIONS.get("admin", [])
        firebase_auth.set_custom_user_claims(admin_uid, {
            "role": "admin",
            "company_id": company_id,
            "permissions": permisos,
        })

    except Exception as e:
        # Rollback: eliminar el usuario Firebase si Firestore falla
        try:
            firebase_auth.delete_user(admin_uid)
            logger.warning(f"Rollback: usuario Firebase {admin_uid} eliminado tras error en Firestore.")
        except Exception as rb_err:
            logger.error(f"Rollback fallido para {admin_uid}: {rb_err}")
        logger.error(f"Error creando empresa {company_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar la empresa en Firestore. Usuario Firebase eliminado.",
        )

    logger.info(f"Empresa '{company_id}' creada por Super Admin {super_admin['uid']}. Admin: {admin_uid}")
    return CompanyResponse(
        company_id=company_id,
        company_name=body.company_name,
        admin_uid=admin_uid,
        admin_email=body.admin.email,
        created_at=now,
    )


@router.get(
    "",
    response_model=list[CompanyListItem],
    summary="[Super Admin] Listar todas las empresas registradas",
)
async def list_companies(_: SuperAdmin) -> list[CompanyListItem]:
    """Lista todas las empresas. Solo accesible por el Super Admin."""
    db = get_firestore()
    docs = db.collection("companies").order_by("created_at").stream()
    return [
        CompanyListItem(
            company_id=doc.id,
            name=doc.to_dict().get("name", ""),
            admin_uid=doc.to_dict().get("admin_uid", ""),
            created_at=doc.to_dict().get("created_at", ""),
        )
        for doc in docs
    ]
