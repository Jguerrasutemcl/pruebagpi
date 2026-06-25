"""Gestión del ciclo de vida de una campaña de exploración.

Envuelve el orquestador (que es un proceso largo y bloqueante) en un hilo de
fondo controlable mediante start / pause / resume / stop, exponiendo su estado.

Por ahora se maneja UNA sola sesión a la vez (sin id de campaña). El soporte
multi-campaña con identificadores se implementará más adelante.
"""

import enum
import io
import sys
import threading

from agents.commander import dirigir_campaña
from config import SESION_ID


class EstadoCampaña(str, enum.Enum):
    INACTIVO = "inactivo"
    EJECUTANDO = "ejecutando"
    PAUSADO = "pausado"
    DETENIDO = "detenido"
    FINALIZADO = "finalizado"
    ERROR = "error"


class CampañaDetenida(Exception):
    """Se lanza desde un checkpoint cuando se solicitó detener la campaña."""


class TeeWriter:
    """Redirige escrituras a dos destinos: stdout original y lista de líneas en memoria.

    Acumula caracteres hasta encontrar un salto de línea y entonces empuja la
    línea completa a `_lines`. Las líneas vacías se descartan.
    """

    def __init__(self, original, lines: list):
        self._original = original
        self._lines = lines
        self._accum = ""

    def write(self, text: str) -> int:
        self._original.write(text)
        self._accum += text
        while "\n" in self._accum:
            line, self._accum = self._accum.split("\n", 1)
            stripped = line.rstrip("\r")
            if stripped:
                self._lines.append(stripped)
        return len(text)

    def flush(self):
        self._original.flush()

    def isatty(self) -> bool:
        return False

    def fileno(self) -> int:
        return self._original.fileno()


def run_campaign(
    target: str,
    sesion_id: int = SESION_ID,
    control: "CampaignManager | None" = None,
    campaign_id: str = "",
    modo: str = "full",
) -> str:
    """Ejecuta el flujo completo de la campaña para un objetivo.

    Delega la orquestación en el Commander (`dirigir_campaña`), que decide qué
    fases/agentes actúan. `control`, si se entrega, se propaga para permitir
    pausar o detener de forma cooperativa. Devuelve la ruta del reporte final.
    """
    return dirigir_campaña(target, sesion_id=sesion_id, control=control, campaign_id=campaign_id, modo=modo)


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
        self.target: str | None = None
        self.sesion_id: int = SESION_ID
        self.campaign_id: str = ""
        self.modo: str = "full"
        self.iteracion_actual = 0
        self.ruta_reporte: str | None = None
        self.error: str | None = None
        self._log_lines: list[str] = []

    # --- API de control (llamada desde los endpoints) ---

    def iniciar(
        self,
        target: str,
        sesion_id: int = SESION_ID,
        campaign_id: str = "",
        modo: str = "full",
    ) -> None:
        with self._lock:
            if self.estado in (EstadoCampaña.EJECUTANDO, EstadoCampaña.PAUSADO):
                raise RuntimeError("Ya hay una campaña en curso. Deténla antes de iniciar otra.")

            # Reset de estado y señales para una sesión limpia.
            self._evento_pausa.set()
            self._evento_stop.clear()
            self.estado = EstadoCampaña.EJECUTANDO
            self.target = target
            self.sesion_id = sesion_id
            self.campaign_id = campaign_id
            self.modo = modo
            self.iteracion_actual = 0
            self.ruta_reporte = None
            self.error = None
            self._log_lines = []

            self._hilo = threading.Thread(
                target=self._run,
                args=(target, sesion_id, campaign_id, modo),
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

    def obtener_logs(self) -> list[str]:
        """Devuelve una copia de las líneas de log capturadas hasta el momento."""
        with self._lock:
            return list(self._log_lines)

    def estado_actual(self) -> dict:
        with self._lock:
            return {
                "estado": self.estado.value,
                "target": self.target,
                "sesion_id": self.sesion_id,
                "campaign_id": self.campaign_id,
                "modo": self.modo,
                "iteracion_actual": self.iteracion_actual,
                "ruta_reporte": self.ruta_reporte,
                "error": self.error,
            }

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

    def _run(self, target: str, sesion_id: int, campaign_id: str, modo: str) -> None:
        original_stdout = sys.stdout
        tee = TeeWriter(original_stdout, self._log_lines)
        sys.stdout = tee
        try:
            ruta = run_campaign(target, sesion_id=sesion_id, control=self, campaign_id=campaign_id, modo=modo)
            with self._lock:
                self.ruta_reporte = ruta
                # Si se solicitó detener justo al final (sin checkpoint pendiente
                # que lo honre), el stop debe prevalecer sobre el fin natural.
                self.estado = (
                    EstadoCampaña.DETENIDO
                    if self._evento_stop.is_set()
                    else EstadoCampaña.FINALIZADO
                )
        except CampañaDetenida:
            with self._lock:
                self.estado = EstadoCampaña.DETENIDO
        except Exception as e:  # noqa: BLE001 - se reporta vía estado/error
            with self._lock:
                self.error = str(e)
                self.estado = EstadoCampaña.ERROR
        finally:
            sys.stdout = original_stdout
            # Vaciar acumulador pendiente del Tee si terminó sin newline final.
            if tee._accum.strip():
                with self._lock:
                    self._log_lines.append(tee._accum.strip())


# Instancia única compartida por la API (sesión única por ahora).
campaign_manager = CampaignManager()
