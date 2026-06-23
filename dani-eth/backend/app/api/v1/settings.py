"""
Preferencias del usuario autenticado: idioma, tema visual y notificaciones.

Las preferencias se guardan dentro del documento del usuario en Firestore:
  users/{uid}.settings = { language, theme, notifications_enabled }

Solo el propio usuario puede leer y modificar sus preferencias — el back
extrae el uid del token, no lo acepta del body.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.firebase import get_firestore
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

CurrentUser = Annotated[dict, Depends(get_current_user)]

# Valores por defecto si el usuario no tiene settings guardados
_DEFAULTS = {"language": "es", "theme": "dark", "notifications_enabled": True}


@router.get("", response_model=SettingsResponse)
async def get_settings(user: CurrentUser) -> SettingsResponse:
    """
    Retorna las preferencias del usuario autenticado.
    Si no tiene preferencias guardadas, retorna los valores por defecto.
    """
    uid = user["uid"]
    db = get_firestore()
    doc = db.collection("users").document(uid).get()

    if not doc.exists:
        return SettingsResponse(**_DEFAULTS)

    raw = doc.to_dict().get("settings", {})
    merged = {**_DEFAULTS, **raw}

    # Validar que los valores guardados sean aún válidos (por si cambiaron los tipos)
    return SettingsResponse(
        language=merged.get("language", "es"),
        theme=merged.get("theme", "dark"),
        notifications_enabled=merged.get("notifications_enabled", True),
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(body: SettingsUpdate, user: CurrentUser) -> SettingsResponse:
    """
    Actualiza las preferencias del usuario autenticado.
    Solo se actualizan los campos enviados (PATCH semántico).
    """
    uid = user["uid"]
    db = get_firestore()
    ref = db.collection("users").document(uid)
    doc = ref.get()

    # Obtener settings actuales (o defaults si no existen)
    if doc.exists:
        current = doc.to_dict().get("settings", {})
    else:
        current = {}

    merged = {**_DEFAULTS, **current}

    # Aplicar solo los campos que vienen en el body
    updates = body.model_dump(exclude_none=True)
    merged.update(updates)

    # Guardar en Firestore (como subdocumento dentro de users/{uid})
    if doc.exists:
        ref.update({
            "settings": merged,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        # Crear el documento de usuario si no existe aún
        ref.set({
            "uid": uid,
            "email": user.get("email"),
            "settings": merged,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    return SettingsResponse(**merged)
