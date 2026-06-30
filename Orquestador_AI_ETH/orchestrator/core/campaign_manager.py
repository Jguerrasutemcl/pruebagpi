"""Gestión del ciclo de vida de una campaña de exploración.

Envuelve el orquestador (que es un proceso largo y bloqueante) en un hilo de
fondo controlable mediante start / pause / resume / stop, exponiendo su estado.

Por ahora se maneja UNA sola sesión a la vez (sin id de campaña). El soporte
multi-campaña con identificadores se implementará más adelante.
"""

import enum
import sys
import threading
import uuid
from datetime import datetime, timezone

from agents.commander import dirigir_campaña
from config import SESION_ID
from core import event_bus


class EstadoCampaña(str, enum.Enum):
    INACTIVO = "inactivo"
    EJECUTANDO = "ejecutando"
    PAUSADO = "pausado"
    DETENIDO = "detenido"
    FINALIZADO = "finalizado"
    ERROR = "error"


_ESTADO_A_STATUS = {
    EstadoCampaña.INACTIVO:   "stopped",
    EstadoCampaña.EJECUTANDO: "running",
    EstadoCampaña.PAUSADO:    "paused",
    EstadoCampaña.DETENIDO:   "stopped",
    EstadoCampaña.FINALIZADO: "finished",
    EstadoCampaña.ERROR:      "stopped",
}


class CampañaDetenida(Exception):
    """Se lanza desde un checkpoint cuando se solicitó detener la campaña."""


class TeeWriter:
    """Intercepta sys.stdout durante la campaña y acumula líneas en _lines."""

    def __init__(self, original, lines: list):
        self._original = original
        self._lines = lines
        self._buf = ""

    def write(self, text: str) -> int:
        self._original.write(text)
        self._buf += text
        while "\n" in self._buf:
            line, self._buf = self._buf.split("\n", 1)
            stripped = line.rstrip()
            if stripped:
                self._lines.append(stripped)
        return len(text)

    def flush(self) -> None:
        if self._buf.strip():
            self._lines.append(self._buf.rstrip())
            self._buf = ""
        self._original.flush()

    def __getattr__(self, name):
        return getattr(self._original, name)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_campaign(
    target: str,
    sesion_id: int = SESION_ID,
    control: "CampaignManager | None" = None,
    mision: str | None = None,
    campaign_id: str | None = None,
    modo: str | None = None,
) -> str:
    """Ejecuta el flujo completo de la campaña para un objetivo.

    Delega la orquestación en el Commander (`dirigir_campaña`), que decide qué
    fases/agentes actúan. `control`, si se entrega, se propaga para permitir
    pausar o detener de forma cooperativa. `mision` es el prompt de misión ya
    construido; si es None, el Commander cae al fallback de `objetivo.txt`.
    Devuelve la ruta del reporte final.
    """
    return dirigir_campaña(
        target,
        sesion_id=sesion_id,
        control=control,
        mision=mision,
        campaign_id=campaign_id,
        modo=modo,
    )


class CampaignManager:
    """Orquestador controlable: corre `run_campaign` en un hilo de fondo."""

    def __init__(self):
        self._lock = threading.Lock()
        self._hilo: threading.Thread | None = None
        # _evento_pausa "set" = libre para avanzar; "clear" = pausado.
        self._evento_pausa = threading.Event()
        self._evento_pausa.set()
        self._evento_stop = threading.Event()

        self.estado = EstadoCampaña.INACTIVO
        self.campaign_id: str | None = None
        self.target: str | None = None
        self.sesion_id: int = SESION_ID
        self.mision: str | None = None
        self.modo: str | None = None
        self.profundidad: str | None = None
        self.restricciones: dict | None = None
        self.iteracion_actual = 0
        self.ruta_reporte: str | None = None
        self.error: str | None = None
        self.started_at: str | None = None
        self.finished_at: str | None = None

        self._log_lines: list[str] = []
        self._findings: list[dict] = []

    # --- API de control (llamada desde los endpoints) ---

    def iniciar(
        self,
        target: str,
        sesion_id: int = SESION_ID,
        mision: str | None = None,
        modo: str | None = None,
        profundidad: str | None = None,
        restricciones: dict | None = None,
        campaign_id: str | None = None,
    ) -> None:
        with self._lock:
            if self.estado in (EstadoCampaña.EJECUTANDO, EstadoCampaña.PAUSADO):
                raise RuntimeError("Ya hay una campaña en curso. Deténla antes de iniciar otra.")

            # Reset de estado y señales para una sesión limpia.
            event_bus.limpiar()
            self._evento_pausa.set()
            self._evento_stop.clear()
            self.estado = EstadoCampaña.EJECUTANDO
            self.campaign_id = campaign_id or str(uuid.uuid4())
            self.target = target
            self.sesion_id = sesion_id
            self.mision = mision
            self.modo = modo
            self.profundidad = profundidad
            self.restricciones = restricciones
            self.iteracion_actual = 0
            self.ruta_reporte = None
            self.error = None
            self.started_at = _utcnow()
            self.finished_at = None
            self._log_lines = []
            self._findings = []

            self._hilo = threading.Thread(
                target=self._run,
                args=(target, sesion_id, mision, self.campaign_id, modo),
                daemon=True,
            )
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
            # Si estaba pausada, la despertamos para que llegue al checkpoint y termine.
            self._evento_pausa.set()
            self.estado = EstadoCampaña.DETENIDO

    def estado_actual(self) -> dict:
        with self._lock:
            return {
                # Campos del contrato Backend (CampaignStatusResponse)
                "campaign_id": self.campaign_id or "",
                "status": _ESTADO_A_STATUS.get(self.estado, "stopped"),
                "phase": self.modo,
                "progress": None,
                "findings": list(self._findings),
                "logs": [],
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                # Campos internos para el Orquestador
                "estado": self.estado.value,
                "target": self.target,
                "sesion_id": self.sesion_id,
                "modo": self.modo,
                "profundidad": self.profundidad,
                "restricciones": self.restricciones,
                "iteracion_actual": self.iteracion_actual,
                "ruta_reporte": self.ruta_reporte,
                "error": self.error,
            }

    # --- Store de findings en memoria ---

    def add_finding(self, finding: dict) -> str:
        """Registra un nuevo hallazgo. Devuelve el finding_id generado."""
        finding_id = str(uuid.uuid4())
        entry = {
            "finding_id": finding_id,
            "campaign_id": self.campaign_id or "",
            "status": "pending",
            "remediated": False,
            **finding,
        }
        with self._lock:
            self._findings.append(entry)
        return finding_id

    def get_findings(self) -> list[dict]:
        with self._lock:
            return list(self._findings)

    def update_finding(self, finding_id: str, updates: dict) -> bool:
        with self._lock:
            for f in self._findings:
                if f.get("finding_id") == finding_id:
                    f.update(updates)
                    return True
        return False

    # --- Logs capturados via TeeWriter ---

    def obtener_logs(self) -> list[str]:
        with self._lock:
            return list(self._log_lines)

    # --- Cooperación con el hilo de trabajo ---

    def checkpoint(self) -> None:
        """Llamado desde el flujo de exploración. Bloquea si está pausado y
        lanza CampañaDetenida si se solicitó detener."""
        if self._evento_stop.is_set():
            raise CampañaDetenida()
        self._evento_pausa.wait()  # bloquea mientras esté pausado
        if self._evento_stop.is_set():
            raise CampañaDetenida()

    def set_iteracion(self, n: int) -> None:
        with self._lock:
            self.iteracion_actual = n

    # --- Hilo de trabajo ---

    def _run(
        self,
        target: str,
        sesion_id: int,
        mision: str | None = None,
        campaign_id: str | None = None,
        modo: str | None = None,
    ) -> None:
        original_stdout = sys.stdout
        sys.stdout = TeeWriter(original_stdout, self._log_lines)
        try:
            ruta = run_campaign(
                target,
                sesion_id=sesion_id,
                control=self,
                mision=mision,
                campaign_id=campaign_id,
                modo=modo,
            )
            with self._lock:
                self.ruta_reporte = ruta
                self.finished_at = _utcnow()
                self.estado = (
                    EstadoCampaña.DETENIDO
                    if self._evento_stop.is_set()
                    else EstadoCampaña.FINALIZADO
                )
        except CampañaDetenida:
            with self._lock:
                self.finished_at = _utcnow()
                self.estado = EstadoCampaña.DETENIDO
        except Exception as e:  # noqa: BLE001 - se reporta vía estado/error
            with self._lock:
                self.error = str(e)
                self.estado = EstadoCampaña.ERROR
        finally:
            sys.stdout.flush()
            sys.stdout = original_stdout


# Instancia única compartida por la API (sesión única por ahora).
campaign_manager = CampaignManager()
