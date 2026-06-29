"""Endpoints de control del orquestador (campaña de exploración).

Fix 2: Las rutas /pause, /stop y /status ahora aceptan {campaign_id} como
path parameter, en línea con lo que el Backend envía.
Fix 5: IniciarCampaña usa ConfigDict(extra="ignore") para absorber campos
extra del Backend sin lanzar 422.
Fix 8: IniciarCampaña acepta campaign_id y modo como campos opcionales.
"""

import ipaddress
import re

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from core.campaign_manager import campaign_manager
from core.reports_handler import listar_reportes, obtener_reporte
from config import SESION_ID, construir_mision

router = APIRouter(prefix="/campaign", tags=["campaign"])

# Valores válidos de los enums
MODOS_VALIDOS = [
    "solo_reconocimiento",
    "reconocimiento_vulnerabilidades",
    "reconocimiento_explotacion",
    # Modos del Frontend/Backend
    "exploration",
    "full",
]
PROFUNDIDADES_VALIDAS = ["superficial", "estandar", "exhaustivo"]

FLAG_FORMAT_DEFAULT = "FLAG{...}"

# Mapa de modos del frontend/backend a modos internos del orquestador
_MODO_BACKEND_MAP = {
    "exploration": "solo_reconocimiento",
    "full": "reconocimiento_explotacion",
}

_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$"
)


def _target_valido(valor: str) -> bool:
    """True si `valor` es una IP (v4/v6) o un hostname con forma válida."""
    try:
        ipaddress.ip_address(valor)
        return True
    except ValueError:
        pass
    return bool(_HOSTNAME_RE.match(valor))


class Restricciones(BaseModel):
    no_pivoting: bool = True
    modo_ctf: bool = False
    flag_format: str = FLAG_FORMAT_DEFAULT
    solo_reportar_criticos: bool = False
    stealth: bool = False


class IniciarCampaña(BaseModel):
    model_config = ConfigDict(extra="ignore")

    target: str | None = Field(None, description="IP o host objetivo (entorno autorizado)")
    sesion_id: int = Field(SESION_ID, description="ID de sesión del runner")
    modo: str | None = Field(None, description="Modo de ataque o None para reconocimiento")
    profundidad: str = Field("estandar", description="Nivel de profundidad")
    restricciones: Restricciones = Field(default_factory=Restricciones)
    # Campos propagados desde el Backend (Fix 8)
    campaign_id: str | None = Field(None, description="UUID de campaña generado por el Backend")


class ReporteResumen(BaseModel):
    id: str = Field(..., description="Identificador del reporte (timestamp)")
    fecha: str = Field(..., description="Fecha legible 'YYYY-MM-DD HH:MM:SS'")
    target: str = Field(..., description="Objetivo evaluado")
    mision: str = Field("", description="Misión de la campaña")
    iteraciones: int | None = Field(None, description="Nº de iteraciones (null si es un reporte antiguo sin metadata)")


class ListaReportes(BaseModel):
    reportes: list[ReporteResumen]


class ReporteCompleto(ReporteResumen):
    archivo_md: str = Field(..., description="Nombre del archivo .md")
    contenido: str = Field(..., description="Contenido completo del reporte en markdown")


# ── Inicio de campaña ──────────────────────────────────────────────────────────

@router.post("/start")
def iniciar(payload: IniciarCampaña):
    """Inicia la exploración contra el objetivo indicado."""
    target = (payload.target or "").strip()

    if not target:
        return JSONResponse(
            status_code=422,
            content={
                "error": "campo_requerido",
                "campo": "target",
                "mensaje": "El campo 'target' es obligatorio. Debes indicar la IP o el hostname del objetivo.",
            },
        )

    if not _target_valido(target):
        return JSONResponse(
            status_code=422,
            content={
                "error": "formato_invalido",
                "campo": "target",
                "mensaje": f"El valor '{target}' no es una IP ni un hostname válido.",
                "ejemplos_validos": ["10.10.10.5", "scanme.nmap.org", "192.168.1.100"],
            },
        )

    # Normalizar modo: None → "solo_reconocimiento"
    modo_raw = (payload.modo or "solo_reconocimiento").strip() or "solo_reconocimiento"
    if modo_raw not in MODOS_VALIDOS:
        return JSONResponse(
            status_code=422,
            content={
                "error": "valor_invalido",
                "campo": "modo",
                "valor_recibido": modo_raw,
                "valores_validos": MODOS_VALIDOS,
                "mensaje": "Modo de ataque no reconocido.",
            },
        )

    if payload.profundidad not in PROFUNDIDADES_VALIDAS:
        return JSONResponse(
            status_code=422,
            content={
                "error": "valor_invalido",
                "campo": "profundidad",
                "valor_recibido": payload.profundidad,
                "valores_validos": PROFUNDIDADES_VALIDAS,
                "mensaje": "Nivel de profundidad no reconocido.",
            },
        )

    advertencias: list[dict] = []
    if payload.restricciones.modo_ctf and not payload.restricciones.flag_format.strip():
        payload.restricciones.flag_format = FLAG_FORMAT_DEFAULT
        advertencias.append(
            {
                "campo": "flag_format",
                "mensaje": "No se proporcionó formato de flag. Se usará el valor por defecto: FLAG{...}",
            }
        )

    restricciones = payload.restricciones.model_dump()

    # Mapear modos del frontend a modos internos para construir_mision
    modo_interno = _MODO_BACKEND_MAP.get(modo_raw, modo_raw)
    mision = construir_mision(target, modo_interno, payload.profundidad, restricciones)

    try:
        campaign_manager.iniciar(
            target,
            payload.sesion_id,
            mision=mision,
            modo=modo_raw,
            profundidad=payload.profundidad,
            restricciones=restricciones,
            campaign_id=payload.campaign_id,
        )
    except RuntimeError:
        estado = campaign_manager.estado_actual()
        return JSONResponse(
            status_code=409,
            content={
                "error": "campaña_en_curso",
                "mensaje": "Ya hay una campaña activa. Detenla antes de iniciar una nueva.",
                "estado_actual": {
                    "campaign_id": estado["campaign_id"],
                    "status": estado["status"],
                    "target": estado["target"],
                },
            },
        )

    respuesta = campaign_manager.estado_actual()
    respuesta["advertencias"] = advertencias
    return respuesta


# ── Aliases sin campaign_id (para el frontend directo) ────────────────────────
# Se registran ANTES que las rutas con {campaign_id} para que FastAPI no trate
# "status", "pause" o "stop" como un campaign_id.

@router.get("/status")
def estado_directo():
    """Estado actual de la campaña (alias sin campaign_id)."""
    return campaign_manager.estado_actual()


@router.post("/pause")
def pausar_directo():
    """Pausa la campaña en curso (alias sin campaign_id)."""
    try:
        campaign_manager.pausar()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.post("/stop")
def detener_directo():
    """Detiene la campaña en curso (alias sin campaign_id)."""
    try:
        campaign_manager.detener()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


# ── Control con campaign_id (Fix 2) ───────────────────────────────────────────

@router.post("/{campaign_id}/pause")
def pausar(campaign_id: str):
    """Pausa la campaña en curso."""
    try:
        campaign_manager.pausar()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.post("/{campaign_id}/stop")
def detener(campaign_id: str):
    """Detiene la campaña en curso."""
    try:
        campaign_manager.detener()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


@router.get("/{campaign_id}/status")
def estado(campaign_id: str):
    """Devuelve el estado actual del orquestador."""
    return campaign_manager.estado_actual()


# ── Hallazgos y remediación por campaña (Fix 3) ───────────────────────────────

@router.get("/{campaign_id}/findings")
def get_campaign_findings(
    campaign_id: str,
    severity: str | None = Query(None),
    status: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Hallazgos de una campaña específica."""
    findings = campaign_manager.get_findings()
    if severity:
        findings = [f for f in findings if f.get("severity") == severity]
    if status:
        findings = [f for f in findings if f.get("status") == status]
    total = len(findings)
    page = findings[offset: offset + limit]
    return {"campaign_id": campaign_id, "total": total, "findings": page}


@router.get("/{campaign_id}/remediation-plan")
def get_remediation_plan(campaign_id: str) -> dict:
    """Plan de remediación para los hallazgos de la campaña."""
    findings = campaign_manager.get_findings()
    plan = [
        {
            "finding_id": f.get("finding_id"),
            "type": f.get("type", "finding"),
            "severity": f.get("severity", "info"),
            "action": f.get("recommendation", "Review and remediate this finding"),
            "reference": f.get("reference", ""),
            "remediated": f.get("remediated", False),
        }
        for f in findings
    ]
    return {"campaign_id": campaign_id, "plan": plan}


@router.get("/{campaign_id}/report")
def get_campaign_report(campaign_id: str) -> dict:
    """Reporte final de la campaña."""
    estado_dict = campaign_manager.estado_actual()
    return {
        "campaign_id": campaign_id,
        "status": estado_dict["status"],
        "report_path": estado_dict.get("ruta_reporte"),
        "available": estado_dict.get("ruta_reporte") is not None,
    }


# ── Resume (sin campaign_id, sigue siendo útil internamente) ─────────────────

@router.post("/resume")
def reanudar():
    """Reanuda una campaña pausada."""
    try:
        campaign_manager.reanudar()
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return campaign_manager.estado_actual()


# ── Logs en vivo (Fix 10 / Fix 13) ──────────────────────────────────────────
# El frontend usa polling incremental con cursor: ?desde=0, ?desde=5, etc.
# Devuelve los eventos del event_bus (structured JSON) que el CampaignLogFeed
# puede renderizar, más el total para que el hook avance el cursor.

@router.get("/logs")
def logs(desde: int = Query(0, ge=0)):
    """Eventos de la campaña desde el cursor indicado (polling incremental)."""
    from core import event_bus as bus
    return {
        "eventos": bus.obtener_desde(desde),
        "total": bus.total(),
    }


# ── Reportes ejecutivos (locales) ─────────────────────────────────────────────
# La ruta exacta /reports debe declararse antes que /reports/{id}.

@router.get("/reports", response_model=ListaReportes)
def reportes():
    """Lista todos los reportes ejecutivos (más nuevos primero)."""
    return {"reportes": listar_reportes()}


@router.get("/reports/{id}", response_model=ReporteCompleto)
def reporte(id: str):
    """Devuelve el contenido completo de un reporte por su id (timestamp)."""
    datos = obtener_reporte(id)
    if datos is None:
        raise HTTPException(status_code=404, detail=f"Reporte '{id}' no encontrado")
    return datos
