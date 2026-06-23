"""Schemas para el módulo de Settings (preferencias del usuario)."""
from typing import Literal
from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    language: Literal["en", "es", "fr"] = "es"
    theme: Literal["light", "dark"] = "dark"
    notifications_enabled: bool = True


class SettingsUpdate(BaseModel):
    """Todos los campos son opcionales — solo se actualizan los enviados."""
    language: Literal["en", "es", "fr"] | None = Field(
        default=None,
        description="Idioma de la interfaz: en (inglés), es (español), fr (francés)",
    )
    theme: Literal["light", "dark"] | None = Field(
        default=None,
        description="Tema visual: light o dark",
    )
    notifications_enabled: bool | None = Field(
        default=None,
        description="Activar o desactivar notificaciones del sistema",
    )
