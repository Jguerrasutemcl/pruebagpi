# DANI-ETH Paso 1 — Estructura del Repositorio

> Repositorio raíz del sistema de Ethical Hacking Automatizado. Integra 3 subproyectos independientes que forman el pipeline completo: interfaz web, orquestador IA y runner de herramientas.

---

## Tabla de Contenidos

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Estructura de Directorios](#2-estructura-de-directorios)
3. [Arquitectura y Flujo de Datos](#3-arquitectura-y-flujo-de-datos)
4. [Mapa de Puertos](#4-mapa-de-puertos)
5. [Inicio Rápido](#5-inicio-rápido)
6. [Subproyecto: dani-eth (Backend + Frontend)](#6-subproyecto-dani-eth)
7. [Subproyecto: Orquestador AI ETH](#7-subproyecto-orquestador-ai-eth)
8. [Subproyecto: Runner (danieth-backend_runner-frontend)](#8-subproyecto-runner)
9. [Contratos de API entre Servicios](#9-contratos-de-api-entre-servicios)
10. [Variables de Entorno por Servicio](#10-variables-de-entorno-por-servicio)
11. [Entorno Compartido (venv raíz)](#11-entorno-compartido-venv-raíz)

---

## 1. Visión General del Sistema

El sistema orquesta campañas de pentesting éticas de punta a punta:

```
Usuario Web → Backend principal → Orquestador IA → Runner de herramientas → Objetivo
                  (Firestore)       (DeepSeek)         (Docker tools)
```

| Subproyecto | Directorio | Rol |
|-------------|-----------|-----|
| **dani-eth** | `dani-eth/` | App web multi-tenant: gestión de empresas, usuarios, targets, campañas, reportes y dashboard. Backend FastAPI + Frontend React. |
| **Orquestador AI ETH** | `Orquestador_AI_ETH/` | Motor de inteligencia artificial (DeepSeek). Coordina agentes especializados para ejecutar, analizar y reportar una campaña de pentesting. |
| **Runner** | `danieth-backend_runner-frontend/backend_runner/` | Microservicios dockerizados que ejecutan herramientas reales de pentesting (nmap, sqlmap, gobuster, etc.) en contenedores aislados. |

---

## 2. Estructura de Directorios

```
dani-eth-paso1/
│
├── ESTRUCTURA.md                          # Este documento
├── handoff.md                             # Registro de fixes de integración (2026-06-22)
├── iniciar_proyecto.bat                   # Script de inicio de todos los servicios
├── .gitignore
├── venv/                                  # Virtualenv compartido (Orquestador lo usa)
│
├── dani-eth/                              # Subproyecto 1: App web principal
│   ├── ESTRUCTURA.md                      # Documentación detallada de este subproyecto
│   ├── README.md
│   ├── backend/                           # FastAPI — puerto 8000
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── core/                      # config, firebase, security (RBAC)
│   │   │   ├── api/v1/                    # Todos los endpoints REST
│   │   │   ├── schemas/                   # Pydantic v2
│   │   │   └── services/
│   │   │       └── orchestrator_client.py # Proxy hacia el Orquestador (port 8001)
│   │   ├── credentials/
│   │   │   └── firebase-admin-key.json    # NO en Git
│   │   ├── scripts/
│   │   └── tests/
│   └── frontend/                          # React + Vite — puerto 5173
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── services/                  # Capa de servicios API (Axios)
│           ├── contexts/                  # AuthContext, ThemeContext
│           ├── lib/                       # firebase.ts, api.ts, i18n.ts, socket.ts
│           ├── locales/                   # i18n: es, en, de, fr
│           └── types/
│
├── Orquestador_AI_ETH/                    # Subproyecto 2: Motor IA
│   ├── README.md
│   ├── requirements.txt
│   ├── .env
│   ├── Docs/                              # Documentación técnica del orquestador
│   └── orchestrator/                      # FastAPI — puerto 8001
│       ├── main.py                        # Entry point
│       ├── config.py
│       ├── objetivo.txt                   # Target actual de la sesión
│       ├── agents/                        # Agentes IA especializados
│       ├── core/                          # campaign_manager, runner_client, scope_guard
│       ├── metricas/                      # Collector y generador de reportes de métricas
│       ├── metrics/                       # Reportes generados (ignorado por Git)
│       ├── models/                        # Modelos de datos (campaign, finding, remediation)
│       └── routes/                        # campaign, findings, dashboard, reports
│
└── danieth-backend_runner-frontend/       # Subproyecto 3: Runner + Frontend copia
    ├── README.md
    ├── docker-compose.yml                 # Orquesta backend+frontend (no usar — ver §5)
    ├── contexto_actual.txt
    ├── frontend/                          # Copia del frontend (inactiva — usar dani-eth/frontend)
    └── backend_runner/                    # Microservicios del Runner
        ├── docker-compose.yml             # Levanta los 5 microservicios del Runner
        ├── setup.ps1
        ├── .env / .env.example
        ├── api_gateway/                   # Puerto 8003 (host) → Gateway principal del Runner
        ├── tool_registry/                 # Catálogo de herramientas disponibles
        ├── tool_executor/                 # Ejecuta herramientas en contenedores Docker
        ├── auth_service/                  # Auth JWT interna del Runner (puerto 8011)
        ├── analysis_service/              # CVSS, clasificación de riesgo, recomendaciones
        ├── shared/                        # Modelos SQLAlchemy y schemas compartidos
        ├── scripts/                       # seed_db, create_admin, start-dev
        └── tools/                         # Una carpeta por herramienta (Dockerfile + run.py)
            ├── nmap/
            ├── sqlmap/
            ├── gobuster/
            ├── nikto/
            ├── nuclei/
            ├── hydra/
            ├── xsstrike/
            ├── osquery/
            ├── radare2/
            ├── curl/
            ├── cat/
            └── ls/
```

---

## 3. Arquitectura y Flujo de Datos

```
┌──────────────────────────────────────────────────────────────────┐
│                        USUARIO WEB                               │
│              React + Vite (localhost:5173)                       │
│   AuthContext (Firebase Auth)  ·  Axios + JWT automático         │
└─────────────────────────┬────────────────────────────────────────┘
                          │ REST / HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND PRINCIPAL                             │
│               FastAPI — Python 3.11 (port 8000)                 │
│  Gestiona: empresas, usuarios, targets, campañas_index,         │
│            reportes, equipos, activos, settings                 │
│                                                                  │
│  Firebase Admin SDK ──► Firestore (datos propios)               │
│  OrchestratorClient ──► Orquestador IA (port 8001)  ──────────► │
└──────────────────────────────────────────────────────────────────┘
                          │ HTTP proxy
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                   ORQUESTADOR IA                                 │
│               FastAPI — Python 3.11 (port 8001)                 │
│                                                                  │
│  CampaignManager (singleton)  ·  ScopeGuard  ·  RunnerClient    │
│                                                                  │
│  Agentes IA (DeepSeek):                                          │
│    Commander → Explorer → Exploiter → Judge → Summarizer        │
│             └→ Selector → Reporter                               │
│                                                                  │
│  RunnerClient (urllib/sync) ──► Runner API Gateway (port 8003)  │
└──────────────────────────────────────────────────────────────────┘
                          │ HTTP
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                   RUNNER (Docker Compose)                        │
│                                                                  │
│  api_gateway    (host:8003 → cont:8000)  ─────────────────────  │
│  tool_registry  (host:8003 vía gateway)  Catálogo de tools      │
│  tool_executor  (host:8004 → cont:8000)  Ejecuta en contenedor  │
│  auth_service   (host:8011 → cont:8001)  JWT interno            │
│  analysis_service               CVSS, risk, recomendaciones     │
│  redis          (host:6379)     Cola de tareas                   │
│                                                                  │
│  tools/: nmap · sqlmap · gobuster · nikto · nuclei · hydra      │
│          xsstrike · osquery · radare2 · curl · cat · ls          │
└──────────────────────────────────────────────────────────────────┘
```

**Principio de aislamiento:** El Backend principal **nunca** genera ni almacena datos de pentesting. Solo persiste en Firestore un índice ligero de campañas (`campaigns_index`) y datos 100% propios (empresas, usuarios, targets, reportes, equipos, activos, settings), todos filtrados por `company_id`.

---

## 4. Mapa de Puertos

| Puerto | Servicio | Proceso | Nota |
|--------|---------|---------|------|
| **5173** | Frontend | `npm run dev` | Vite dev server |
| **8000** | Backend principal | `uvicorn app.main:app` | FastAPI |
| **8001** | Orquestador IA | `uvicorn main:app` | FastAPI |
| **8003** | Runner — API Gateway | Docker Compose | host:8003 → container:8000 |
| **8004** | Runner — Tool Executor | Docker Compose | host:8004 → container:8000 |
| **8010** | Runner — API Gateway (alt) | Docker Compose | host:8010 → container:8000 (asignado post-fix colisión) |
| **8011** | Runner — Auth Service | Docker Compose | host:8011 → container:8001 (antes 8001, colisionaba con Orquestador) |
| **6379** | Redis | Docker Compose | Cola de tareas |

---

## 5. Inicio Rápido

### Script automático (Windows)

```bat
iniciar_proyecto.bat
```

Levanta 4 terminales en secuencia:
1. **Backend** (`dani-eth/backend/venv`) → uvicorn port 8000
2. **Frontend** → npm run dev port 5173
3. **Orquestador** (venv raíz) → uvicorn port 8001
4. **Runner** (`backend_runner/`) → docker-compose up

### Manual (paso a paso)

```bash
# Terminal 1 — Backend
cd dani-eth/backend
.\venv\Scripts\activate          # Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd dani-eth/frontend
npm run dev

# Terminal 3 — Orquestador
.\venv\Scripts\activate          # usa el venv compartido de la raíz
cd Orquestador_AI_ETH/orchestrator
uvicorn main:app --reload --port 8001

# Terminal 4 — Runner (Docker)
cd danieth-backend_runner-frontend/backend_runner
docker-compose up
```

### URLs de desarrollo

| Servicio | URL |
|---------|-----|
| App web | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Backend | http://localhost:8000/docs |
| Orquestador API | http://localhost:8001 |
| Swagger Orquestador | http://localhost:8001/docs |
| Health check | http://localhost:8000/api/v1/health |

---

## 6. Subproyecto: dani-eth

> Documentación completa en [dani-eth/ESTRUCTURA.md](dani-eth/ESTRUCTURA.md).

**Resumen:** App web multi-tenant de gestión de pentesting.

- **Backend** (FastAPI): RBAC granular con Firebase Auth, Firestore como base de datos, proxy al Orquestador, Supabase Storage para PDFs.
- **Frontend** (React): 3 portales aislados por rol (Super Admin, Company Admin, Operativo), polling REST simulando WebSocket, i18n en 4 idiomas.

Roles: `super_admin` · `admin` · `security_engineer` · `pentester` · `analyst` · `viewer`

---

## 7. Subproyecto: Orquestador AI ETH

**Directorio:** `Orquestador_AI_ETH/orchestrator/`  
**Puerto:** 8001  
**Arranque:** `uvicorn main:app --reload --port 8001` (desde el directorio `orchestrator/`, con el venv raíz activo)

### 7.1 Estructura

```
orchestrator/
├── main.py               # Entry point — registra campaign, findings y dashboard routers
├── config.py             # Settings (DEEPSEEK_API_KEY, RUNNER_URL, etc.)
├── objetivo.txt          # Target de la sesión activa (escrito por la API al iniciar)
│
├── agents/               # Agentes IA especializados
│   ├── base_agent.py     # Clase base con cliente DeepSeek
│   ├── commander.py / commander_agent.py    # Coordina el flujo de la campaña
│   ├── explorer.py / explorer_agent.py      # Reconocimiento / descubrimiento
│   ├── exploiter.py / exploiter_agent.py    # Explotación de vulnerabilidades
│   ├── judge.py / judge_agent.py            # Evalúa y clasifica hallazgos
│   ├── selector.py / selector_agent.py      # Selecciona herramientas a usar
│   ├── summarizer.py / summarizer_agent.py  # Resume resultados por agente
│   ├── reporter.py / reporter_agent.py      # Genera reporte final Markdown
│   └── iterable_agent.py                    # Mixin para agentes iterativos
│
├── core/
│   ├── campaign_manager.py  # Singleton: estado de campaña, UUID, store de findings
│   ├── runner_client.py     # Cliente HTTP (urllib) → Runner API Gateway
│   └── scope_guard.py       # Valida que los targets estén dentro del scope permitido
│
├── metricas/
│   ├── collector.py      # Recolecta métricas de tiempo por agente
│   └── reporte.py        # Genera reporte de métricas en Markdown + gráfico PNG
│
├── metrics/              # Reportes de métricas generados (una carpeta por ejecución)
│
├── models/
│   ├── campaign.py       # EstadoCampaña (enum), CampaignInfo
│   ├── finding.py        # Finding (título, severidad, descripción, recomendación)
│   └── remediation.py    # RemediationPlan
│
└── routes/
    ├── campaign.py       # POST /campaign/start · POST /{id}/pause/stop · GET /{id}/status
    │                     # GET /{id}/findings · GET /{id}/remediation-plan · GET /{id}/report
    ├── findings.py       # GET /findings · GET /patches · PUT /findings/{id}/status
    │                     # PUT /findings/{id}/remediated
    ├── dashboard.py      # GET /dashboard/summary
    └── reports.py        # (reservado)
```

### 7.2 Flujo de una Campaña

```
POST /campaign/start
  └─ campaign_manager.iniciar(target)
       └─ Commander → lanza hilo de fondo
            ├─ Explorer: reconocimiento (llama Runner con nmap, gobuster...)
            ├─ Selector: elige herramientas según resultados
            ├─ Exploiter: explotación (sqlmap, nikto, xsstrike...)
            ├─ Judge: clasifica y puntúa hallazgos
            ├─ Summarizer: resume por agente
            └─ Reporter: genera reporte Markdown
                └─ campaign_manager.add_finding({...}) ← cada hallazgo
```

### 7.3 Estado de la Campaña

El `CampaignManager` es un singleton global que mantiene en memoria:
- Estado actual: `stopped` · `running` · `paused` · `finished`
- `campaign_id` (UUID generado al iniciar)
- `started_at` / `finished_at` (ISO 8601)
- Lista de findings
- Logs de progreso

### 7.4 Documentación adicional

| Archivo | Contenido |
|---------|-----------|
| [Docs/endpoints.md](Orquestador_AI_ETH/Docs/endpoints.md) | Detalle de todos los endpoints |
| [Docs/integracion_runner.md](Orquestador_AI_ETH/Docs/integracion_runner.md) | Cómo el Orquestador llama al Runner |
| [Docs/runner_api.md](Orquestador_AI_ETH/Docs/runner_api.md) | API del Runner consumida por el Orquestador |
| [Docs/GUIA_DE_USUARIO.md](Orquestador_AI_ETH/Docs/GUIA_DE_USUARIO.md) | Guía de uso del Orquestador |

---

## 8. Subproyecto: Runner

**Directorio:** `danieth-backend_runner-frontend/backend_runner/`  
**Arranque:** `docker-compose up` (desde ese directorio)

El Runner es una arquitectura de microservicios que ejecuta herramientas de pentesting reales en contenedores Docker aislados. Cada herramienta tiene su propio contenedor con el binario instalado.

### 8.1 Microservicios

| Servicio | Puerto (host) | Rol |
|---------|--------------|-----|
| `api_gateway` | 8003 | Gateway principal: authn, gestión de sesiones, proxy a tool_registry y tool_executor. Base de datos PostgreSQL compartida vía `shared/`. |
| `tool_registry` | (interno) | Catálogo CRUD de herramientas disponibles y sus versiones. |
| `tool_executor` | 8004 | Recibe órdenes de ejecución y lanza el contenedor Docker de la herramienta. |
| `auth_service` | 8011 | JWT interno del Runner (independiente del Firebase del Backend principal). |
| `analysis_service` | (interno) | Post-procesamiento: CVSS, clasificación de riesgo, motor de recomendaciones. |
| `redis` | 6379 | Cola de tareas para ejecución asíncrona. |

### 8.2 Estructura del API Gateway

```
api_gateway/app/
├── main.py
├── core/
│   ├── config.py         # Settings del gateway
│   ├── database.py       # SQLAlchemy engine + session
│   ├── dependencies.py   # Dependencias FastAPI (auth, db)
│   ├── security.py       # Verificación JWT
│   └── exceptions.py
├── api/routes/
│   ├── auth.py           # Login / registro interno
│   ├── objetivos.py      # CRUD de objetivos de escaneo
│   ├── sesiones.py       # Gestión de sesiones de escaneo
│   ├── tareas.py         # Gestión de tareas individuales
│   ├── hallazgos.py      # Resultados / hallazgos
│   ├── reportes.py       # Reportes del Runner
│   └── proxy.py          # Proxy directo a tool_registry / tool_executor
├── repositories/         # Capa de acceso a datos (patrón Repository)
└── services/             # Lógica de negocio
```

### 8.3 Base de Datos Compartida (SQLAlchemy)

Modelos en `shared/database/models/`:

| Modelo | Descripción |
|--------|-------------|
| `usuarios.py` | Usuarios internos del Runner |
| `sesiones_escaneo.py` | Una sesión agrupa varias tareas de escaneo |
| `tareas_escaneo.py` | Tarea individual (herramienta + objetivo + parámetros) |
| `resultados_tareas.py` | Output de cada tarea ejecutada |
| `herramientas.py` | Herramientas registradas |
| `versiones_herramientas.py` | Versiones disponibles por herramienta |
| `objetivos.py` | Objetivos (IPs / dominios) |

### 8.4 Herramientas Disponibles

Cada herramienta está en `tools/<nombre>/` con un `Dockerfile` propio y un `run.py` que normaliza su output al formato esperado por el `tool_executor`.

| Herramienta | Categoría | Propósito |
|------------|---------|-----------|
| `nmap` | Reconocimiento | Escaneo de puertos y servicios |
| `gobuster` | Reconocimiento | Fuerza bruta de directorios web |
| `nikto` | Web | Escáner de vulnerabilidades web |
| `nuclei` | Web | Escaneo con plantillas de CVEs |
| `sqlmap` | Explotación | Inyección SQL automatizada |
| `xsstrike` | Explotación | Detección y explotación de XSS |
| `hydra` | Credenciales | Fuerza bruta de autenticación |
| `radare2` | Análisis | Análisis de binarios / reversing |
| `osquery` | Forense | Consultas SQL sobre el sistema operativo |
| `curl` | Utilidad | Peticiones HTTP arbitrarias |
| `cat` / `ls` | Utilidad | Lectura de archivos y listado de directorios |

### 8.5 Configuración

Variables en `backend_runner/.env` (ver `.env.example`):
- Credenciales de PostgreSQL
- `SECRET_KEY` para JWT interno
- URLs internas entre microservicios
- Configuración de Redis

---

## 9. Contratos de API entre Servicios

### Backend → Orquestador (port 8001)

| Método | Ruta | Enviado por |
|--------|------|------------|
| POST | `/campaign/start` | `orchestrator_client.start_campaign()` |
| POST | `/campaign/{id}/pause` | `orchestrator_client.pause_campaign()` |
| POST | `/campaign/{id}/stop` | `orchestrator_client.stop_campaign()` |
| GET | `/campaign/{id}/status` | `orchestrator_client.get_campaign_status()` |
| GET | `/campaign/{id}/findings` | `orchestrator_client.get_findings()` |
| GET | `/campaign/{id}/remediation-plan` | `orchestrator_client.get_remediation_plan()` |
| GET | `/campaign/{id}/report` | `orchestrator_client.get_campaign_report()` |
| GET | `/findings` | `orchestrator_client.get_findings()` (global) |
| GET | `/patches` | (global) |
| PUT | `/findings/{id}/status` | `orchestrator_client.update_finding_status()` |
| PUT | `/findings/{id}/remediated` | `orchestrator_client.update_finding_remediated()` |
| GET | `/dashboard/summary` | `orchestrator_client.get_dashboard_summary()` |

**Contrato de respuesta `GET /campaign/{id}/status`:**
```json
{
  "campaign_id": "uuid",
  "status": "running | paused | stopped | finished",
  "phase": "exploration | exploitation | reporting",
  "progress": 0.0,
  "findings": [...],
  "logs": ["..."],
  "started_at": "ISO8601",
  "finished_at": null
}
```

### Orquestador → Backend (callback de reportes)

El Orquestador llama al Backend para ingestar el reporte final:

```
POST /api/v1/reports
Headers: X-Service-Token: <ORCHESTRATOR_SERVICE_TOKEN>
Body: { campaign_id, target, type, summary, findings, generated_at, pdf_base64? }
```

### Orquestador → Runner (port 8003)

El `RunnerClient` llama al API Gateway del Runner. Ver [Docs/runner_api.md](Orquestador_AI_ETH/Docs/runner_api.md) y [Docs/integracion_runner.md](Orquestador_AI_ETH/Docs/integracion_runner.md) para el contrato completo.

---

## 10. Variables de Entorno por Servicio

### dani-eth Backend (`dani-eth/backend/.env`)

```env
APP_PORT=8000
CORS_ORIGINS=http://localhost:5173
FIREBASE_CREDENTIALS_PATH=./credentials/firebase-admin-key.json
FIREBASE_PROJECT_ID=<proyecto>
ORCHESTRATOR_URL=http://localhost:8001
ORCHESTRATOR_SERVICE_TOKEN=<secreto-compartido>
RUNNER_URL=http://localhost:8003
SUPABASE_URL=<url>
SUPABASE_KEY=<key>
REDIS_URL=redis://localhost:6379
```

### dani-eth Frontend (`dani-eth/frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<proyecto>
VITE_FIREBASE_STORAGE_BUCKET=<proyecto>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<app-id>
```

### Orquestador (`Orquestador_AI_ETH/.env`)

```env
DEEPSEEK_API_KEY=<key>
RUNNER_URL=http://localhost:8003
RUNNER_API_KEY=<key>
```

### Runner (`danieth-backend_runner-frontend/backend_runner/.env`)

```env
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<pass>
POSTGRES_DB=runner_db
SECRET_KEY=<jwt-secret>
REDIS_URL=redis://redis:6379
```

---

## 11. Entorno Compartido (venv raíz)

El venv en `dani-eth-paso1/venv/` es usado por el **Orquestador**. Incluye:

- `openai` (cliente compatible con DeepSeek)
- `fastapi` + `uvicorn`
- `httpx`
- `matplotlib` + `numpy` + `pillow` (para reportes de métricas)
- `pydantic` v2

El **Backend** (`dani-eth/backend/`) tiene su propio venv en `dani-eth/backend/venv/`.

---

*Documento generado el 23 de junio de 2026*
