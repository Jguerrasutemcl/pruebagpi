"""Gestión del ciclo de vida de una campaña de exploración.

Envuelve el orquestador (que es un proceso largo y bloqueante) en un hilo de
fondo controlable mediante start / pause / resume / stop, exponiendo su estado.

Sesión única por ahora: un solo campaign_id activo a la vez. El soporte
multi-campaña con identificadores se implementará más adelante.
"""

import enum
import threading
import uuid
from datetime import datetime, timezone

from agents.commander import dirigir_campaña
from config import SESION_ID


class EstadoCampaña(str, enum.Enum):
    INACTIVO = "inactivo"
    EJECUTANDO = "ejecutando"
    PAUSADO = "pausado"
    DETENIDO = "detenido"
    FINALIZADO = "finalizado"
    ERROR = "error"


# Mapeo al vocabulario que el Backend (y CampaignStatusResponse) espera.
_ESTADO_A_STATUS: dict[EstadoCampaña, str] = {
    EstadoCampaña.INACTIVO:   "stopped",
    EstadoCampaña.EJECUTANDO: "running",
    EstadoCampaña.PAUSADO:    "paused",
    EstadoCampaña.DETENIDO:   "stopped",
    EstadoCampaña.FINALIZADO: "finished",
    EstadoCampaña.ERROR:      "stopped",
}


class CampañaDetenida(Exception):
    """Se lanza desde un checkpoint cuando se solicitó detener la campaña."""


def run_campaign(target: str, sesion_id: int = SESION_ID, control: "CampaignManager | None" = None) -> str:
    """Ejecuta el flujo completo de la campaña para un objetivo."""
    return dirigir_campaña(target, sesion_id=sesion_id, control=control)


class CampaignManager:
    """Orquestador controlable: corre `run_campaign` en un hilo de fondo."""

    def __init__(self):
        self._lock = threading.Lock()
        self._hilo: threading.Thread | None = None
        self._evento_pausa = threading.Event()
        self._evento_pausa.set()
        self._evento_stop = threading.Event()

        self.estado = EstadoCampaña.INACTIVO
        self.campaign_id: str | None = None
        self.target: str | None = None
        self.sesion_id: int = SESION_ID
        self.iteracion_actual = 0
        self.ruta_reporte: str | None = None
        self.error: str | None = None
        self.started_at: str | None = None
        self.finished_at: str | None = None
        self._findings: list[dict] = []

    # --- API de control (llamada desde los endpoints) ---

    def iniciar(self, target: str, sesion_id: int = SESION_ID) -> None:
        with self._lock:
            if self.estado in (EstadoCampaña.EJECUTANDO, EstadoCampaña.PAUSADO):
                raise RuntimeError("Ya hay una campaña en curso. Deténla antes de iniciar otra.")

            self._evento_pausa.set()
            self._evento_stop.clear()
            self.estado = EstadoCampaña.EJECUTANDO
            self.campaign_id = str(uuid.uuid4())
            self.target = target
            self.sesion_id = sesion_id
            self.iteracion_actual = 0
            self.ruta_reporte = None
            self.error = None
            self.started_at = datetime.now(timezone.utc).isoformat()
            self.finished_at = None
            self._findings = []

            self._hilo = threading.Thread(target=self._run, args=(target, sesion_id), daemon=True)
            self._hilo.start()

    def pausar(self) -> None:
        with self._lock:
            if self.estado != EstadoCampaña.EJECUTANDO:
                raise RuntimeError("No hay una campaña en ejecución para pausar.")
            self._evento_pausa.clear()
            self.estado = EstadoCampaña.PAUSADO

    def reanudar(self) -> None:
        with self._lock:
            if self.estado != EstadoCampaña.PAUSADO:
                raise RuntimeError("No hay una campaña pausada para reanudar.")
            self._evento_pausa.set()
            self.estado = EstadoCampaña.EJECUTANDO

    def detener(self) -> None:
        with self._lock:
            if self.estado not in (EstadoCampaña.EJECUTANDO, EstadoCampaña.PAUSADO):
                raise RuntimeError("No hay una campaña activa para detener.")
            self._evento_stop.set()
            self._evento_pausa.set()
            self.estado = EstadoCampaña.DETENIDO

    def estado_actual(self) -> dict:
        """Devuelve el estado en el formato que espera el Backend (CampaignStatusResponse)."""
        with self._lock:
            status = _ESTADO_A_STATUS.get(self.estado, "stopped")
            phase = f"iteracion_{self.iteracion_actual}" if self.iteracion_actual else None
            return {
                # Campos que CampaignStatusResponse requiere
                "campaign_id": self.campaign_id or "",
                "status": status,
                "phase": phase,
                "progress": min(self.iteracion_actual * 10, 100),
                "findings": list(self._findings),
                "logs": [],
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                # Campos internos adicionales (el Backend los ignora pero son útiles)
                "estado": self.estado.value,
                "target": self.target,
                "sesion_id": self.sesion_id,
                "iteracion_actual": self.iteracion_actual,
                "ruta_reporte": self.ruta_reporte,
                "error": self.error,
            }

    # --- Gestión de hallazgos en memoria ---

    def add_finding(self, finding: dict) -> dict:
        """Registra un hallazgo durante la campaña. Los agentes pueden llamar esto."""
        with self._lock:
            if "id" not in finding:
                finding = {**finding, "id": str(uuid.uuid4())}
            if "status" not in finding:
                finding = {**finding, "status": "pending"}
            self._findings.append(finding)
            return finding

    def get_findings(
        self,
        severity: str | None = None,
        status: str | None = None,
    ) -> list[dict]:
        with self._lock:
            findings = list(self._findings)
        if severity:
            findings = [f for f in findings if f.get("severity") == severity]
        if status:
            findings = [f for f in findings if f.get("status") == status]
        return findings

    def update_finding(self, finding_id: str, updates: dict) -> dict | None:
        with self._lock:
            for f in self._findings:
                if f.get("id") == finding_id:
                    f.update(updates)
                    return dict(f)
        return None

    # --- Cooperación con el hilo de trabajo ---

    def checkpoint(self) -> None:
        """Llamado desde el flujo de exploración. Bloquea si está pausado y
        lanza CampañaDetenida si se solicitó detener."""
        if self._evento_stop.is_set():
            raise CampañaDetenida()
        self._evento_pausa.wait()
        if self._evento_stop.is_set():
            raise CampañaDetenida()

    def set_iteracion(self, n: int) -> None:
        with self._lock:
            self.iteracion_actual = n

    # --- Hilo de trabajo ---

    def _run(self, target: str, sesion_id: int) -> None:
        try:
            ruta = run_campaign(target, sesion_id=sesion_id, control=self)
            with self._lock:
                self.ruta_reporte = ruta
                self.finished_at = datetime.now(timezone.utc).isoformat()
                self.estado = (
                    EstadoCampaña.DETENIDO
                    if self._evento_stop.is_set()
                    else EstadoCampaña.FINALIZADO
                )
        except CampañaDetenida:
            with self._lock:
                self.estado = EstadoCampaña.DETENIDO
        except Exception as e:  # noqa: BLE001
            with self._lock:
                self.error = str(e)
                self.estado = EstadoCampaña.ERROR


# Instancia única compartida por la API (sesión única por ahora).
campaign_manager = CampaignManager()
