# Handoff — Refactorización de conectividad DANI-ETH

**Fecha inicial:** 2026-06-22 · **Última actualización:** 2026-06-24  
**Autor:** Claude Sonnet 4.6 (Arquitecto de Software)

---

## Contexto

Sistema de pentesting ético con arquitectura de cascada estricta en 4 servicios:

| Servicio      | Puerto | Tecnología |
|---------------|--------|------------|
| Frontend      | 5173   | React/Vite |
| Backend       | 8000   | FastAPI    |
| Orquestador   | 8001   | FastAPI + IA (DeepSeek) |
| Tool Registry | 8003   | FastAPI (Docker) |
| Tool Executor | 8004   | FastAPI (Docker) |

Flujo unidireccional: `Frontend → Backend → Orquestador → Runner (8003/8004)`

---

## Problemas encontrados y correcciones aplicadas

### Fix 1 — Import relativo roto en `orchestrator/main.py`

**Archivo:** `Orquestador_AI_ETH/orchestrator/main.py`

**Problema:** `from .routes.campaign import router` — el punto convierte esto en un import relativo de paquete. Con `uvicorn main:app` lanzado desde el directorio `orchestrator/`, Python no reconoce un paquete padre y lanza `ImportError: attempted relative import with no known parent package`. El Orquestador nunca arrancaba.

**Corrección:** Eliminé el punto. Adicionalmente registré los tres nuevos routers.

```python
# ANTES
from .routes.campaign import router as campaign_router

# DESPUÉS
from routes.campaign  import router as campaign_router
from routes.findings  import router as findings_router
from routes.dashboard import router as dashboard_router

app.include_router(campaign_router)
app.include_router(findings_router)
app.include_router(dashboard_router)
```

---

### Fix 2 — Rutas sin `campaign_id` en el Orquestador (cascada rota)

**Archivo:** `Orquestador_AI_ETH/orchestrator/routes/campaign.py`

**Problema:** El Backend (`orchestrator_client.py`) llama:
- `POST /campaign/{id}/pause`
- `POST /campaign/{id}/stop`
- `GET  /campaign/{id}/status`

Pero el Orquestador solo tenía `/campaign/pause`, `/campaign/stop`, `/campaign/status` (sin parámetro en la URL). Resultado: 404 en cada llamada de control.

**Corrección:** Las tres rutas ahora aceptan `campaign_id` como path parameter. En arquitectura de sesión única el valor se ignora internamente, pero la URL coincide con lo que el Backend envía.

```python
# ANTES
@router.post("/pause")
def pausar():

# DESPUÉS
@router.post("/{campaign_id}/pause")
def pausar(campaign_id: str):
```

---

### Fix 3 — `findings.py` y `reports.py` vacíos

**Archivos creados:**
- `Orquestador_AI_ETH/orchestrator/routes/findings.py` (nuevo, implementado)
- `Orquestador_AI_ETH/orchestrator/routes/dashboard.py` (nuevo, implementado)
- Endpoints agregados a `routes/campaign.py`

**Problema:** Los archivos `findings.py` y `reports.py` del Orquestador tenían 0 bytes. El Backend llama a todos estos endpoints que no existían → 404 en cascada, rompiendo Vulnerability Hub, Patch Manager y Dashboard.

**Endpoints implementados:**

| Método | Ruta | Archivo |
|--------|------|---------|
| GET | `/findings` | findings.py |
| GET | `/patches` | findings.py |
| PUT | `/findings/{id}/status` | findings.py |
| PUT | `/findings/{id}/remediated` | findings.py |
| GET | `/campaign/{id}/findings` | campaign.py |
| GET | `/campaign/{id}/remediation-plan` | campaign.py |
| GET | `/campaign/{id}/report` | campaign.py |
| GET | `/dashboard/summary` | dashboard.py |

---

### Fix 4 — Contrato JSON roto: respuesta del Orquestador incompatible con el Backend

**Archivo:** `Orquestador_AI_ETH/orchestrator/core/campaign_manager.py`

**Problema:** `estado_actual()` devolvía `{"estado": "ejecutando", ...}` pero `CampaignStatusResponse` del Backend requiere `{"campaign_id": "...", "status": "running", ...}`. El Backend hacía `result.get("campaign_id")` → `None` y nunca escribía la campaña en Firestore. Todos los estados internos usaban español (`ejecutando`, `pausado`) mientras el Backend espera inglés (`running`, `paused`).

**Corrección:** `campaign_manager.py` ahora:
1. Genera un UUID al iniciar cada campaña y lo expone como `campaign_id`.
2. Mapea estados internos al vocabulario del Backend.
3. Registra `started_at` / `finished_at` en ISO 8601.
4. Mantiene un store en memoria de findings con métodos `add_finding`, `get_findings`, `update_finding`.

```python
# Mapeo de estados
_ESTADO_A_STATUS = {
    EstadoCampaña.INACTIVO:   "stopped",
    EstadoCampaña.EJECUTANDO: "running",
    EstadoCampaña.PAUSADO:    "paused",
    EstadoCampaña.DETENIDO:   "stopped",
    EstadoCampaña.FINALIZADO: "finished",
    EstadoCampaña.ERROR:      "stopped",
}
```

---

### Fix 5 — Schema mismatch en `POST /campaign/start`

**Archivo:** `Orquestador_AI_ETH/orchestrator/routes/campaign.py`

**Problema:** El Backend envía `{target_id, target, scan_type, scope}` pero el Orquestador solo declaraba `{target, sesion_id}` sin tolerancia a campos extra. Pydantic lanzaba error de validación 422 al arrancar una campaña.

**Corrección:** `model_config = ConfigDict(extra="ignore")` en `IniciarCampaña` absorbe los campos adicionales del Backend sin romper la validación.

```python
class IniciarCampaña(BaseModel):
    model_config = ConfigDict(extra="ignore")
    target: str
    sesion_id: int = Field(SESION_ID, ...)
```

---

### Fix 6 — Colisión de puertos en `backend_runner/docker-compose.yml`

**Archivo:** `danieth-backend_runner-frontend/backend_runner/docker-compose.yml`

**Problema:** `api_gateway` exponía `8000:8000` (choca con Backend principal) y `auth_service` exponía `8001:8001` (choca con Orquestador). Al levantar el Runner con Docker Compose, los puertos ya estaban ocupados y los contenedores fallaban o silenciaban al Backend/Orquestador.

**Corrección:**

```yaml
# ANTES
api_gateway:
  ports: ["8000:8000"]
auth_service:
  ports: ["8001:8001"]

# DESPUÉS
api_gateway:
  ports: ["8010:8000"]   # host:8010 → container:8000
auth_service:
  ports: ["8011:8001"]   # host:8011 → container:8001
```

---

### Fix 7 — `iniciar_proyecto.bat`: typo + ruta docker-compose incorrecta

**Archivo:** `iniciar_proyecto.bat`

**Problema 1 (typo):** `.\evn\Scripts\activate.bat` → directorio `evn` no existe; debía ser `venv`. El Orquestador nunca activaba su entorno virtual.

**Problema 2 (ruta):** `cd danieth-backend_runner-frontend && docker-compose up` ejecutaba el `docker-compose.yml` de ese directorio raíz, que contiene `backend` (puerto 8000) y `frontend` (puerto 5173) — duplicados que colisionan con los servicios standalone. El Runner correcto (`tool_registry`, `tool_executor`) está en el subdirectorio `backend_runner/`.

**Corrección:**

```bat
# ANTES
start "Orquestador IA" cmd /k "cd Orquestador_AI_ETH && .\evn\Scripts\activate.bat && cd orchestrator && uvicorn main:app --reload --port 8001"
start "Runner (Docker)" cmd /k "cd danieth-backend_runner-frontend && docker-compose up"

# DESPUÉS
start "Orquestador IA" cmd /k ".\venv\Scripts\activate.bat && cd Orquestador_AI_ETH\orchestrator && uvicorn main:app --reload --port 8001"
start "Runner (Docker)" cmd /k "cd danieth-backend_runner-frontend\backend_runner && docker-compose up"
```

**Nota sobre el venv:** El Orquestador no tiene su propio venv; usa el venv compartido de la raíz del proyecto (`dani-eth-paso1\venv`). Por eso se activa primero (antes del `cd`) y luego se entra al directorio `orchestrator/`. El Backend sí tiene su propio `dani-eth\backend\venv`, por lo que su comando permanece igual.

---

## Mapa de puertos final (sin colisiones)

| Puerto | Servicio | Proceso |
|--------|----------|---------|
| 5173 | Frontend | `npm run dev` |
| 8000 | Backend | `uvicorn app.main:app` |
| 8001 | Orquestador | `uvicorn main:app` |
| 8003 | Tool Registry | Docker Compose |
| 8004 | Tool Executor | Docker Compose |
| 8010 | Runner API Gateway | Docker Compose (antes en 8000) |
| 8011 | Runner Auth Service | Docker Compose (antes en 8001) |
| 6379 | Redis | Docker Compose |

---

### Fix 8 — Reportes: desconexión entre Orquestador y Backend (flujo roto)

**Archivos modificados:**
- `Orquestador_AI_ETH/orchestrator/config.py`
- `Orquestador_AI_ETH/orchestrator/agents/commander.py`
- `Orquestador_AI_ETH/orchestrator/core/campaign_manager.py`
- `Orquestador_AI_ETH/orchestrator/routes/campaign.py`
- `dani-eth/backend/app/schemas/campaign.py`

**Problema:** El Orquestador generaba el reporte Markdown en disco local al finalizar `dirigir_campaña()`, pero nunca lo enviaba al Backend. El Frontend le pedía los reportes al Backend (`GET /api/v1/reports`), que los busca en Firestore — siempre vacío porque el Orquestador nunca escribió allí. El circuito estaba completamente roto.

**Corrección:**

1. **`config.py`** — Nuevas variables de entorno:
   ```python
   BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
   ORCHESTRATOR_SERVICE_TOKEN = os.getenv("ORCHESTRATOR_SERVICE_TOKEN", "")
   ```

2. **`commander.py`** — Nueva función `_enviar_reporte_al_backend()` llamada justo después de `reportador.generar_reporte()`. Lee el `.md` generado y hace `POST /api/v1/reports` con `X-Service-Token` en la cabecera:
   ```python
   requests.post(
       f"{BACKEND_URL}/api/v1/reports",
       json={"campaign_id": ..., "target": ..., "summary": {"markdown": contenido}, ...},
       headers={"X-Service-Token": ORCHESTRATOR_SERVICE_TOKEN},
   )
   ```

3. **`campaign_manager.py`** — `iniciar()` ahora acepta `campaign_id` (propagado desde el Backend) y `modo`. Ambos se pasan hasta `dirigir_campaña()` para que el reporte se registre con el ID correcto en Firestore.

4. **`routes/campaign.py`** — `IniciarCampaña` acepta `campaign_id: str | None` y `modo: str | None` como campos opcionales.

5. **`schemas/campaign.py` (backend)** — `CampaignStart` añade `modo: str | None = None` para que el campo no se descarte al hacer `body.model_dump()` antes de reenviar al Orquestador.

**Configuración requerida en el `.env` del Orquestador:**
```env
BACKEND_URL=http://127.0.0.1:8000
ORCHESTRATOR_SERVICE_TOKEN=<mismo valor que en el .env del Backend>
```

---

### Fix 9 — Header.tsx: perfil de usuario incompleto (solo mostraba el rol)

**Archivo:** `dani-eth/frontend/src/components/layout/Header.tsx`

**Problema:** El menú desplegable del avatar solo renderizaba el badge de rol; no había nombre ni email. El div `px-4 py-3` contenía un único `<div>` con el badge, sin envoltorio para los demás campos del perfil disponibles en `AuthContext`.

**Corrección:** Se añadió estructura vertical dentro del `px-4 py-3`:

```jsx
// ANTES — solo el badge
<div className="px-4 py-3 border-b border-border-primary">
  <div className="inline-flex ... bg-accent-cyan/10 ...">
    {role}
  </div>
</div>

// DESPUÉS — nombre + email + badge
<div className="px-4 py-3 border-b border-border-primary">
  <div>
    <p style={{ color: 'var(--text-primary)' }}>
      {profile?.name || user?.displayName || 'Usuario'}
    </p>
    <p style={{ color: 'var(--text-muted)' }}>
      {profile?.email || user?.email || ''}
    </p>
    <div className="inline-flex ... bg-accent-cyan/10 ...">
      {role}
    </div>
  </div>
</div>
```

---

### Fix 10 — AIPentesting.tsx: sin selector de modo y sin logs en vivo

**Archivos modificados:**
- `dani-eth/frontend/src/pages/AIPentesting.tsx`
- `dani-eth/frontend/src/types/campaign.ts`
- `Orquestador_AI_ETH/orchestrator/core/campaign_manager.py` (TeeWriter + obtener_logs)
- `Orquestador_AI_ETH/orchestrator/routes/campaign.py` (GET /campaign/logs)

**Problema:** La página de AI Pentesting no permitía elegir entre reconocimiento puro y explotación completa. Los logs del Orquestador (`print()`) nunca llegaban al Frontend — `status?.logs` siempre devolvía `[]` porque el endpoint de status no los incluía.

**Correcciones:**

**A. Selector de modo de campaña**

Dos tarjetas clicables en la fase `select` antes del botón de inicio:

| Valor enviado | Comportamiento en el Orquestador |
|---|---|
| `"exploration"` | `dirigir_campaña()` elimina `explotacion` del dict de fases antes de que el CommanderAgent tome decisiones |
| `"full"` (default) | Comportamiento existente — CommanderAgent decide si explotar según los vectores hallados |

El valor se propaga: `AIPentesting → campaignService.start() → Backend → Orquestador → commander.py`

**B. Captura de logs (TeeWriter)**

En `campaign_manager.py`, nueva clase `TeeWriter` que intercepta `sys.stdout` durante el hilo de campaña:

```python
class TeeWriter:
    def write(self, text: str) -> int:
        self._original.write(text)   # sigue imprimiendo en consola
        # acumula hasta \n y añade la línea a self._lines
        ...
```

El `_run()` envuelve toda la ejecución de `run_campaign()`:
```python
sys.stdout = TeeWriter(original_stdout, self._log_lines)
try:
    run_campaign(...)
finally:
    sys.stdout = original_stdout
```

**C. Endpoint GET /campaign/logs**

```python
@router.get("/logs")
def logs():
    return {"logs": campaign_manager.obtener_logs()}
```

**D. Polling desde el Frontend**

`AIPentesting.tsx` tiene ahora un segundo `setInterval` independiente (cada 2.5 s) que llama directamente al Orquestador en `http://localhost:8001/campaign/logs`. La terminal negra con indicador "EN VIVO" se auto-hace scroll al último log.

---

## Tabla de contratos alineados (actualizada)

| Backend llama | Orquestador expone | Estado |
|---|---|---|
| `POST /campaign/start` | `POST /campaign/start` | ✅ |
| `POST /campaign/{id}/pause` | `POST /campaign/{id}/pause` | ✅ (fix 2) |
| `POST /campaign/{id}/stop` | `POST /campaign/{id}/stop` | ✅ (fix 2) |
| `GET  /campaign/{id}/status` | `GET  /campaign/{id}/status` | ✅ (fix 2) |
| `GET  /campaign/{id}/findings` | `GET  /campaign/{id}/findings` | ✅ (fix 3) |
| `GET  /campaign/{id}/remediation-plan` | `GET  /campaign/{id}/remediation-plan` | ✅ (fix 3) |
| `GET  /campaign/{id}/report` | `GET  /campaign/{id}/report` | ✅ (fix 3) |
| `GET  /findings` | `GET  /findings` | ✅ (fix 3) |
| `GET  /patches` | `GET  /patches` | ✅ (fix 3) |
| `PUT  /findings/{id}/status` | `PUT  /findings/{id}/status` | ✅ (fix 3) |
| `PUT  /findings/{id}/remediated` | `PUT  /findings/{id}/remediated` | ✅ (fix 3) |
| `GET  /dashboard/summary` | `GET  /dashboard/summary` | ✅ (fix 3) |
| Frontend → `GET  /campaign/logs` (directo al Orquestador) | `GET  /campaign/logs` | ✅ (fix 10) |
| Orquestador → `POST /api/v1/reports` (Backend) | `POST /reports` (Backend) | ✅ (fix 8) |

---

## Notas para el equipo

### Sobre el store de findings en memoria
Los agentes del Orquestador actualmente escriben hallazgos en un reporte Markdown (`reports/reporte_*.md`). Para que los endpoints `/findings` devuelvan datos reales durante la campaña, los agentes deben llamar a `campaign_manager.add_finding(dict)` cuando detecten una vulnerabilidad. Estructura mínima de un finding:

```python
campaign_manager.add_finding({
    "title": "SQL Injection en /login",
    "severity": "critical",          # critical | high | medium | low | info
    "description": "...",
    "recommendation": "...",
    "host": "192.168.1.1",
    "port": 80,
})
```

### Sobre el I/O bloqueante en `runner_client.py`
El Orquestador usa `urllib` (síncrono/bloqueante) para comunicarse con el Runner dentro de un contexto FastAPI asíncrono. Esto bloquea el event loop durante el polling de tareas. No se corrigió en esta iteración porque el flujo del Runner corre en un hilo de fondo (`threading.Thread`), lo que mitiga el problema. La corrección completa requiere refactorizar a `httpx.AsyncClient`, tarea pendiente para la próxima iteración.

### Sobre el frontend duplicado
Existen dos directorios frontend (`dani-eth/frontend` y `danieth-backend_runner-frontend/frontend`). El primero es el activo según `iniciar_proyecto.bat`. El segundo puede eliminarse o documentarse como versión alternativa.
