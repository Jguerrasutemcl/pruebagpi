"""Proxy HTTP entre el frontend y los microservicios del runner.

El navegador no puede llamar a los puertos 8003 y 8004 directamente porque
el runner no tiene CORS configurado para el frontend. El orquestador actúa
como único punto de entrada: recibe la llamada del frontend (con CORS OK) y
la reenvía al runner internamente.

Rutas expuestas:
  GET  /proxy/herramientas          → Registry (8003) GET /herramientas/
  POST /proxy/ejecutar              → Executor (8004) POST /ejecutar/
  GET  /proxy/tareas/{tarea_id}     → Executor (8004) GET /ejecutar/tareas/{id}
"""

import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from config import RUNNER_REGISTRY_URL, RUNNER_EXECUTOR_URL

router = APIRouter(prefix="/proxy", tags=["proxy"])

_TIMEOUT = 15  # segundos


def _forward_get(url: str) -> JSONResponse:
    try:
        r = requests.get(url, timeout=_TIMEOUT)
        r.raise_for_status()
        return JSONResponse(content=r.json(), status_code=r.status_code)
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail=f"Runner no disponible: {url}")
    except requests.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


def _forward_post(url: str, body: dict) -> JSONResponse:
    try:
        r = requests.post(url, json=body, timeout=_TIMEOUT)
        r.raise_for_status()
        return JSONResponse(content=r.json(), status_code=r.status_code)
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail=f"Runner no disponible: {url}")
    except requests.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/herramientas")
def listar_herramientas():
    """Lista las herramientas del Tool Registry (8003)."""
    return _forward_get(f"{RUNNER_REGISTRY_URL}/herramientas/")


@router.post("/ejecutar")
def ejecutar_herramienta(body: dict):
    """Lanza una tarea en el Tool Executor (8004) y devuelve el tarea_id."""
    return _forward_post(f"{RUNNER_EXECUTOR_URL}/ejecutar/", body)


@router.get("/tareas/{tarea_id}")
def obtener_tarea(tarea_id: int):
    """Consulta el estado/resultado de una tarea del Tool Executor (8004)."""
    return _forward_get(f"{RUNNER_EXECUTOR_URL}/ejecutar/tareas/{tarea_id}")


@router.get("/tareas")
def listar_tareas(limite: int = 20):
    """Stub — el executor no expone un listado de tareas; devuelve lista vacía."""
    return {"tareas": [], "total": 0}
