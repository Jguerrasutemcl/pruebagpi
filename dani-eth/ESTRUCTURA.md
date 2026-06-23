# DANI-ETH — Documentación Completa de Estructura del Proyecto

> Plataforma de Ethical Hacking Automatizado basada en IA (DeepSeek). Orquesta pentesting, descubrimiento de vulnerabilidades, remediación y reportes mediante un stack moderno full-stack.

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Equipo y Contexto Académico](#2-equipo-y-contexto-académico)
3. [Stack Técnico](#3-stack-técnico)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Arquitectura del Sistema](#5-arquitectura-del-sistema)
6. [Backend — FastAPI](#6-backend--fastapi)
   - [Configuración y Arranque](#61-configuración-y-arranque)
   - [Módulos Core](#62-módulos-core)
   - [API v1 — Endpoints](#63-api-v1--endpoints)
   - [Schemas Pydantic](#64-schemas-pydantic)
   - [Servicios](#65-servicios)
   - [Base de Datos — Firestore](#66-base-de-datos--firestore)
   - [RBAC — Roles y Permisos](#67-rbac--roles-y-permisos)
7. [Frontend — React + Vite](#7-frontend--react--vite)
   - [Estructura de Archivos](#71-estructura-de-archivos)
   - [Routing](#72-routing)
   - [Páginas](#73-páginas)
   - [Componentes](#74-componentes)
   - [Contextos y Estado Global](#75-contextos-y-estado-global)
   - [Servicios Frontend](#76-servicios-frontend)
   - [Internacionalización (i18n)](#77-internacionalización-i18n)
   - [Comunicación en Tiempo Real](#78-comunicación-en-tiempo-real)
8. [Infraestructura y DevOps](#8-infraestructura-y-devops)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Flujos Principales del Sistema](#10-flujos-principales-del-sistema)
11. [Integración con Orquestador Externo](#11-integración-con-orquestador-externo)
12. [Colecciones Firestore](#12-colecciones-firestore)
13. [Convenciones y Estándares](#13-convenciones-y-estándares)
14. [Setup y Desarrollo Local](#14-setup-y-desarrollo-local)

---

## 1. Visión General

DANI-ETH es una plataforma web de **Ethical Hacking Automatizado** con **Arquitectura Multi-Tenant** que actúa como orquestador inteligente de campañas de pentesting. El sistema:

- Permite registrar **objetivos** (IPs / dominios) con su alcance de escaneo.
- Lanza **campañas de pentesting** que se delegan a un orquestador IA externo (DeepSeek).
- Muestra **vulnerabilidades** descubiertas en tiempo real con severidad clasificada.
- Genera y almacena **reportes** en PDF (vía Supabase Storage).
- Gestiona **equipos, usuarios y activos** mediante aislamiento de datos por empresa (`company_id`).
- Ofrece un **dashboard** con métricas en vivo (risk score, heatmap, estadísticas).
- Cuenta con **3 portales aislados** basados en roles (Super Admin, Admin de Empresa, Roles Operativos).

El backend actúa como **proxy inteligente**: persiste datos propios en Firestore y reenvía operaciones de pentesting al orquestador separado (desarrollado por otro subequipo).

---

## 2. Equipo y Contexto Académico

| Rol | Persona |
|-----|---------|
| Desarrollador | Vicente Campos |
| Desarrollador | Javier Guerra |
| Desarrollador | Tomás Farías |
| Desarrollador | Felipe Poblete |
| **Empresa cliente** | Alloxentric |
| **Tutor académico** | Dr. Oscar Magna Veloso |
| **Asignatura** | Gestión de Proyectos Informáticos |

---

## 3. Stack Técnico

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.6.3 | Tipado estático |
| Vite | 5.4.10 | Build tool / Dev server |
| Tailwind CSS | 3.4.14 | Estilos utilitarios |
| React Router DOM | 6.27.0 | Routing SPA |
| Axios | 1.7.7 | Cliente HTTP |
| Firebase SDK | 11.0.1 | Auth + Firestore (cliente) |
| react-i18next | 15.1.1 | Internacionalización |
| i18next | 23.16.4 | i18n core |
| Recharts | 3.8.1 | Gráficos |
| Framer Motion | 12.40.0 | Animaciones |
| Zustand | 5.0.0 | Estado global (disponible) |
| socket.io-client | 4.8.3 | WebSocket (instalado, implementado como polling) |
| react-countup | 6.5.3 | Animaciones de contadores |
| date-fns | 4.4.0 | Manipulación de fechas |

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| FastAPI | 0.115.0 | Framework API REST |
| Python | 3.11+ | Lenguaje |
| Uvicorn | 0.32.0 | Servidor ASGI |
| Pydantic v2 | 2.9.2 | Validación de datos |
| pydantic-settings | 2.6.0 | Variables de entorno |
| Firebase Admin SDK | 6.5.0 | Auth + Firestore servidor |
| httpx | 0.25.2 | Cliente HTTP async (proxy al orquestador) |
| Redis | 5.1.1 | Colas de tareas futuras |
| supabase | 2.4.0 | Storage de PDFs |
| pytest | 8.3.3 | Testing |
| pytest-asyncio | 0.24.0 | Testing async |

### Infraestructura 

| Servicio | Propósito |
|---------|-----------|
| Firebase Auth | Autenticación de usuarios (JWT) |
| Firebase Firestore | Base de datos principal (NoSQL) |
| Supabase Storage | Almacenamiento de PDFs (bucket `reportes`) |
| Redis 7 | Cola de tareas (preparado para uso futuro) |
| Docker + Docker Compose | Contenerización local |
| Orquestador IA externo | DeepSeek — generación de campañas y hallazgos |

---

## 4. Estructura de Directorios

```
dani-eth/
│
├── README.md                          # Guía de instalación y convenciones
├── ESTRUCTURA.md                      # Este documento
├── .gitignore
│
├── backend/                           # FastAPI — Python 3.11
│   ├── Dockerfile
│   ├── requirements.txt               # Dependencias Python
│   ├── .env                           # Variables locales (no en Git)
│   ├── .env.example                   # Plantilla de variables
│   ├── credentials/
│   │   └── firebase-admin-key.json    # Credencial Firebase (NO en Git)
│   ├── app/
│   │   ├── main.py                    # Entry point — FastAPI + lifespan
│   │   ├── core/
│   │   │   ├── config.py              # Settings con pydantic-settings
│   │   │   ├── firebase.py            # Inicialización Firebase Admin
│   │   │   └── security.py            # JWT + RBAC (get_current_user, requiere_permiso)
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py          # Registro de todos los sub-routers
│   │   │       ├── health.py          # GET /api/v1/health
│   │   │       ├── auth.py            # POST /register, GET /me/profile, POST /logout
│   │   │       ├── companies.py       # CRUD empresas (exclusivo super_admin)
│   │   │       ├── users.py           # Gestión de usuarios
│   │   │       ├── targets.py         # CRUD objetivos de pentesting
│   │   │       ├── campaigns.py       # Proxy campañas → orquestador
│   │   │       ├── findings.py        # Vista global hallazgos y parches
│   │   │       ├── reports.py         # Reportes + PDF (Supabase)
│   │   │       ├── dashboard.py       # Resumen agregado
│   │   │       ├── settings.py        # Configuración por usuario
│   │   │       ├── teams.py           # CRUD equipos y miembros
│   │   │       └── assets.py          # CRUD activos tecnológicos
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── target.py
│   │   │   ├── campaign.py
│   │   │   ├── report.py
│   │   │   ├── asset.py
│   │   │   ├── team.py                # Teams + TeamMembers + Stats
│   │   │   └── settings.py
│   │   └── services/
│   │       └── orchestrator_client.py # Cliente HTTP singleton → orquestador
│   ├── scripts/
│   │   └── seed_firestore.py          # Poblar Firestore con datos de prueba
│   └── tests/
│       └── test_health.py
│
└── frontend/                          # React + Vite + TypeScript
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── postcss.config.js
    ├── index.html
    ├── .env                           # Variables locales (no en Git)
    ├── .env.example
    ├── public/
    │   └── shield.svg
    └── src/
        ├── main.tsx                   # Entry point React
        ├── App.tsx                    # Root — ThemeProvider + AuthProvider
        ├── router.tsx                 # Rutas públicas y protegidas
        ├── styles/
        │   └── globals.css            # Variables CSS globales (tema oscuro/claro)
        ├── contexts/
        │   ├── AuthContext.tsx        # Estado de autenticación global
        │   └── ThemeContext.tsx       # Tema oscuro/claro
        ├── lib/
        │   ├── firebase.ts            # Inicialización Firebase cliente
        │   ├── api.ts                 # Axios + interceptor JWT automático
        │   ├── i18n.ts               # Configuración i18next
        │   └── socket.ts             # Polling REST simulando WebSocket
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── VulnerabilityHub.tsx
        │   ├── AIPentesting.tsx
        │   ├── PatchManager.tsx
        │   ├── TeamAssets.tsx
        │   ├── Reports.tsx
        │   ├── Settings.tsx
        │   └── SetupCheck.tsx
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.tsx
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx
        │   │   ├── CompanyAdminLayout.tsx
        │   │   ├── SuperAdminLayout.tsx
        │   │   ├── Header.tsx
        │   │   └── Sidebar.tsx
        │   ├── dashboard/
        │   │   ├── ActiveScansWidget.tsx
        │   │   ├── DashboardSkeleton.tsx
        │   │   ├── PatchProgressWidget.tsx
        │   │   ├── QuickStatsCards.tsx
        │   │   ├── RecentVulnerabilitiesTable.tsx
        │   │   ├── RiskHeatmap.tsx
        │   │   ├── RiskScoreGauge.tsx
        │   │   ├── Tooltip.tsx
        │   │   ├── VulnerabilityDrawer.tsx
        │   │   ├── mockData.ts        # Datos de fallback mientras orquestador no disponible
        │   │   ├── types.ts
        │   │   └── utils.ts
        │   ├── portals/
        │   │   ├── SuperAdminPortal.tsx
        │   │   └── CompanyAdminPortal.tsx
        │   ├── company-admin/
        │   │   └── CompanyUsersPage.tsx
        │   ├── team/
        │   │   ├── AddMemberModal.tsx
        │   │   ├── MemberCard.tsx
        │   │   └── StatCard.tsx
        │   └── ui/
        │       └── PagePlaceholder.tsx
        ├── services/                  # Capa de servicios API
        │   ├── campaignService.ts
        │   ├── dashboardService.ts
        │   ├── findingService.ts
        │   ├── reportService.ts
        │   ├── settingsService.ts
        │   ├── targetService.ts
        │   └── teamService.ts
        ├── types/
        │   ├── campaign.ts
        │   ├── navigation.ts
        │   ├── report.ts
        │   ├── target.ts
        │   └── team.ts
        └── locales/
            ├── es.json                # Español (idioma principal)
            ├── en.json                # Inglés
            ├── de.json                # Alemán
            └── fr.json                # Francés
```

---

## 5. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE WEB                         │
│         React 18 + TypeScript + Vite (port 5173)        │
│                                                         │
│  AuthContext ─ Firebase Auth SDK                        │
│  apiClient   ─ Axios + Bearer Token automático          │
│  socket.ts   ─ Polling REST (fallback de WebSocket)     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND PROPIO                        │
│           FastAPI + Python 3.11 (port 8000)             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ API v1 (/api/v1/...)   (Aislado por company_id)  │   │
│  │  /health    /auth    /companies /users           │   │
│  │  /targets   /campaigns   /findings   /patches    │   │
│  │  /reports   /dashboard   /teams   /assets        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Firebase Admin SDK          OrchestratorClient         │
│  ├─ Auth: verificar JWT      └─ httpx async singleton   │
│  └─ Firestore: datos propios                            │
└────────┬────────────────────────────┬───────────────────┘
         │                            │ HTTP proxy
         ▼                            ▼
┌─────────────────┐        ┌──────────────────────────────┐
│  Firebase       │        │   ORQUESTADOR IA EXTERNO     │
│  ├─ Auth        │        │   (DeepSeek / port 8001)     │
│  └─ Firestore   │        │                              │
│     Colecciones:│        │  POST /campaign/start        │
│     - companies │        │                              │
│     - users     │        │  POST /campaign/{id}/pause   │
│     - targets   │        │  POST /campaign/{id}/stop    │
│     - campaigns │        │  GET  /campaign/{id}/status  │
│       _index    │        │  GET  /campaign/{id}/findings│
│     - reports   │        │  GET  /findings              │
│     - teams     │        │  GET  /patches               │
│     - team      │        │  GET  /dashboard/summary     │
│       _members  │        └──────────────────────────────┘
│     - assets    │
│     - settings  │        ┌──────────────────────────────┐
└─────────────────┘        │   SUPABASE STORAGE           │
                           │   bucket: reportes           │
                           │   (PDFs de campañas)         │
                           └──────────────────────────────┘

                           ┌──────────────────────────────┐
                           │   REDIS (port 6379)          │
                           │   (colas de tareas — futuro) │
                           └──────────────────────────────┘
```

**Principio clave:** El backend propio **nunca genera ni almacena** datos de pentesting (hallazgos, vulnerabilidades). Solo persiste en Firestore:
- Un **índice ligero** de campañas (`campaigns_index`) para listados y validaciones.
- Datos 100% propios: empresas, usuarios, targets, reportes, equipos, activos, settings. (Todos asilados mediante el campo `company_id`).

---

## 6. Backend — FastAPI

### 6.1 Configuración y Arranque

**Archivo:** [backend/app/main.py](backend/app/main.py)

- Versión de la app: `0.2.0`
- Usa `lifespan` context manager para startup/shutdown.
- Al arrancar: inicializa Firebase (Auth + Firestore). Si falla, el servidor arranca de todas formas con advertencia.
- Al apagar: cierra el cliente HTTP del orquestador (`OrchestratorClient.close()`).
- CORS configurado para aceptar orígenes de `settings.cors_origins` (lista separada por comas).
- Docs disponibles en `/docs` (Swagger) y `/redoc`.

### 6.2 Módulos Core

#### `app/core/config.py` — Settings
Usa `pydantic-settings` con `lru_cache` para singleton. Lee desde `.env`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `APP_NAME` | `DANI-ETH Backend` | Nombre de la app |
| `APP_ENV` | `development` | Entorno |
| `APP_DEBUG` | `True` | Nivel de logging |
| `APP_PORT` | `8000` | Puerto del servidor |
| `CORS_ORIGINS` | `http://localhost:5173` | Orígenes CORS (separados por coma) |
| `FIREBASE_CREDENTIALS_PATH` | `./credentials/firebase-admin-key.json` | Ruta a credencial |
| `FIREBASE_PROJECT_ID` | `` | ID del proyecto Firebase |
| `REDIS_URL` | `redis://localhost:6379` | URL de Redis |
| `ORCHESTRATOR_URL` | `http://localhost:8001` | URL del orquestador |
| `ORCHESTRATOR_SERVICE_TOKEN` | `changeme...` | Token de servicio interno |
| `RUNNER_URL` | `http://localhost:8002` | URL del runner |
| `SUPABASE_URL` | `` | URL de Supabase |
| `SUPABASE_KEY` | `` | API Key de Supabase |

#### `app/core/firebase.py` — Firebase Admin
- Inicializa Firebase Admin SDK con `firebase-admin-key.json`.
- Expone `get_firestore()` → cliente Firestore.
- Expone `get_auth()` → módulo Auth de Firebase Admin.
- Expone `is_firebase_ready()` → bool para health checks.
- Si las credenciales no existen, el sistema arranca pero los endpoints protegidos responden 503.

#### `app/core/security.py` — Autenticación y RBAC
- `get_current_user`: dependencia FastAPI que valida el JWT de Firebase y retorna el payload decodificado.
- `get_current_user_optional`: igual pero retorna `None` si no hay token.
- `requiere_permiso(permiso)`: factory de dependencias que verifica un permiso granular específico.
- `requiere_rol(roles)`: verifica que el usuario tiene uno de los roles dados.
- Los permisos se resuelven desde: (1) custom claims del JWT, (2) campo `role` en el JWT, (3) Firestore como fallback.

### 6.3 API v1 — Endpoints

**Prefijo global:** `/api/v1`

#### `/health` — Health Check
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Estado del servidor y Firebase |

Respuesta ejemplo:
```json
{"status": "ok", "firebase": "connected"}
```

#### `/auth` — Autenticación
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/api/v1/auth/register` | JWT válido | Guarda perfil extendido en Firestore + escribe custom claims (rol + permisos) |
| GET | `/api/v1/auth/me/profile` | JWT válido | Devuelve perfil combinado (Firebase Auth + Firestore) |
| POST | `/api/v1/auth/logout` | JWT válido | Invalida sesión lado servidor |

**Flujo de registro:**
1. El frontend crea el usuario en Firebase Auth.
2. Llama `POST /auth/register` con `{name, role}`.
3. El backend guarda el perfil en Firestore (`users/{uid}`) y escribe custom claims.

**Roles permitidos:** `admin`, `security_engineer`, `pentester`, `analyst`, `viewer`

#### `/companies` — Empresas (Super Admin)
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/api/v1/companies` | `super_admin` | Crear nueva empresa y su primer Admin |
| GET | `/api/v1/companies` | `super_admin` | Listar todas las empresas |


#### `/targets` — Objetivos de Pentesting
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/api/v1/targets` | `write:targets` | Crear objetivo |
| GET | `/api/v1/targets` | `read:targets` | Listar todos |
| GET | `/api/v1/targets/{id}` | `read:targets` | Detalle de uno |
| PUT | `/api/v1/targets/{id}` | `write:targets` | Actualizar |
| DELETE | `/api/v1/targets/{id}` | `write:targets` | Eliminar (falla si tiene campaña activa) |

Cada target tiene: `name`, `target` (IP/dominio), `description`, `scope` (scan_type, ports, categories).

#### `/campaign` — Campañas de Pentesting
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/campaigns` | `read:campaigns` | Listar desde índice Firestore |
| POST | `/api/v1/campaign/start` | `write:campaigns` | Iniciar campaña (→ orquestador) |
| POST | `/api/v1/campaign/{id}/pause` | `write:campaigns` | Pausar |
| POST | `/api/v1/campaign/{id}/stop` | `write:campaigns` | Detener |
| GET | `/api/v1/campaign/{id}/status` | `read:campaigns` | Estado actual |
| GET | `/api/v1/campaign/{id}/findings` | `read:vulnerabilities` | Hallazgos de una campaña |
| PUT | `/api/v1/campaign/{id}/findings/{fid}/status` | `write:vulnerabilities` | Cambiar estado de hallazgo |
| GET | `/api/v1/campaign/{id}/remediation-plan` | `read:vulnerabilities` | Plan de remediación |
| PUT | `/api/v1/campaign/{id}/findings/{fid}/remediated` | `write:vulnerabilities` | Marcar como remediado |

#### `/findings` y `/patches` — Vistas Globales
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/findings` | `read:vulnerabilities` | Todos los hallazgos (cross-campaign, con filtros) |
| GET | `/api/v1/patches` | `read:vulnerabilities` | Remediaciones globales (con filtros) |

Filtros disponibles en `/findings`: `severity`, `status`, `campaign_id`, `limit`, `offset`.
Filtros disponibles en `/patches`: `status`, `severity`, `limit`, `offset`.

#### `/reports` — Reportes
| Método | Ruta | Seguridad | Descripción |
|--------|------|-----------|-------------|
| POST | `/api/v1/reports` | `X-Service-Token` | Orquestador ingesta reporte + PDF base64 |
| GET | `/api/v1/reports` | `read:reports` | Listar reportes |
| GET | `/api/v1/reports/{id}` | `read:reports` | Detalle de un reporte |
| POST | `/api/v1/reports/{id}/pdf` | `X-Service-Token` | Subir PDF como archivo binario |
| GET | `/api/v1/reports/{id}/pdf` | `read:reports` | Descargar PDF (redirect a Supabase) |

Los PDFs se almacenan en Supabase Storage (bucket `reportes`). El reporte se guarda en Firestore con referencia al PDF.

#### `/dashboard` — Dashboard
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/dashboard/summary` | JWT válido | Métricas agregadas (Firestore + orquestador) |

Respuesta incluye: `total_targets`, `total_reports`, `active_campaigns` (local), datos del orquestador (`total_findings`, `findings_by_severity`, `recent_campaigns`), y `_meta.orchestrator_available`.

Si el orquestador está caído, responde con datos locales + ceros en campos del orquestador.

#### `/teams` — Equipos y Miembros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/teams` | Listar equipos con conteo de miembros |
| POST | `/api/v1/teams` | Crear equipo |
| GET | `/api/v1/teams/stats/summary` | Estadísticas globales (5 tarjetas UI) |
| GET | `/api/v1/teams/{id}` | Detalle de equipo |
| PATCH | `/api/v1/teams/{id}` | Actualizar equipo |
| DELETE | `/api/v1/teams/{id}` | Eliminar equipo |
| GET | `/api/v1/teams/{id}/members` | Listar miembros del equipo |
| POST | `/api/v1/teams/{id}/members` | Añadir miembro (auto-genera `member_code`) |
| GET | `/api/v1/teams/members/{mid}` | Detalle de miembro |
| PATCH | `/api/v1/teams/members/{mid}` | Actualizar miembro |
| DELETE | `/api/v1/teams/members/{mid}` | Eliminar miembro |

**Códigos de miembro:** se auto-generan por prefijo del nombre del equipo:
- `network` → `NET-001`
- `application` / `app` → `APP-001`
- `server` → `SRV-001`
- otros → `MBR-001`

**Cálculo de carga de trabajo (workload):**
- ≤2 tareas activas → "Light Load" (hasta 40%)
- 3-5 tareas → "Medium Load" (40-70%)
- >5 tareas → "Overloaded" (>70%)

#### `/assets` — Activos Tecnológicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/assets` | Listar con filtros (status, asset_type, environment, team_id) |
| POST | `/api/v1/assets` | Crear activo |
| GET | `/api/v1/assets/{id}` | Detalle |
| PATCH | `/api/v1/assets/{id}` | Actualizar |
| DELETE | `/api/v1/assets/{id}` | Eliminar |

**Tipos de asset válidos:** `web_app`, `api`, `database`, `server`, `network_device`, `mobile_app`, `cloud_service`  
**Estados válidos:** `active`, `inactive`, `maintenance`, `decommissioned`  
**Entornos válidos:** `production`, `staging`, `development`, `testing`

### 6.4 Schemas Pydantic

#### `schemas/target.py`
```python
ScopeModel:
  - scan_type: "full" | "quick" | "custom"
  - ports: str (e.g. "1-1024")
  - categories: list["ports" | "web" | "vuln" | "os"]

TargetCreate: name, target, description, scope
TargetUpdate: name, description, scope (todos opcionales)
TargetResponse: target_id, name, target, description, scope, created_at, updated_at
```

#### `schemas/campaign.py`
```python
CampaignStart: target_id, target, scan_type, scope(list[str])
CampaignStatusResponse: campaign_id, status, phase, progress, findings, logs, started_at, finished_at
FindingStatusUpdate: status ("pending"|"reviewed"|"false_positive")
FindingRemediatedUpdate: remediated(bool), notes
```

#### `schemas/team.py`
```python
TeamCreate: name, description, icon
TeamResponse: id, name, description, icon, member_count, created_at, updated_at
TeamMemberCreate: name, email, role, team_id, is_team_lead, firebase_uid, permissions, notifications, notify_when
TeamMemberResponse: id, member_code, name, email, role, is_team_lead, team_id, active_tasks_count, workload_pct, workload_label, ...
TeamStatsResponse: total_members, total_teams, active_tasks, overloaded_count, available_count, avg_completion_days
```

#### `schemas/asset.py`
Campos: `name`, `hostname`, `ip_address`, `asset_type`, `status`, `environment`, `description`, `team_id`.

#### `schemas/report.py`
```python
ReportIngest: campaign_id, target, type, summary, findings, generated_at, pdf_base64(opcional)
ReportSummary: report_id, campaign_id, target, type, generated_at, pdf_url
ReportDetail: + summary, findings
```

### 6.5 Servicios

#### `services/orchestrator_client.py` — OrchestratorClient

Singleton (`lru_cache`) que encapsula todas las llamadas al orquestador:

```
OrchestratorClient(base_url: str)
  ├── _get(path, params)           → GET con raise_for_status
  ├── _post(path, body)            → POST con raise_for_status
  ├── _put(path, body)             → PUT con raise_for_status
  ├── start_campaign(payload)      → POST /campaign/start
  ├── pause_campaign(id)           → POST /campaign/{id}/pause
  ├── stop_campaign(id)            → POST /campaign/{id}/stop
  ├── get_campaign_status(id)      → GET /campaign/{id}/status
  ├── get_findings(id, ...)        → GET /campaign/{id}/findings
  ├── update_finding_status(id, s) → PUT /findings/{id}/status
  ├── get_remediation_plan(id)     → GET /campaign/{id}/remediation-plan
  ├── update_finding_remediated    → PUT /findings/{id}/remediated
  ├── get_campaign_report(id)      → GET /campaign/{id}/report
  ├── get_dashboard_summary()      → GET /dashboard/summary
  └── close()                      → cierra httpx.AsyncClient
```

Timeout: 30s (connect: 5s). Header `Content-Type: application/json` automático.

### 6.6 Base de Datos — Firestore

Ver sección [12. Colecciones Firestore](#12-colecciones-firestore) para detalle completo.

### 6.7 RBAC — Roles y Permisos

| Permiso | admin | security_engineer | pentester | analyst | viewer |
| **super_admin** (Solo gestiona `/companies`, no tiene acceso operativo ni `company_id`). |
|---------|-------|-------------------|-----------|---------|--------|
| `write:users` | ✓ | | | | |
| `read:users` | ✓ | ✓ | | | |
| `write:targets` | ✓ | ✓ | ✓ | | |
| `read:targets` | ✓ | ✓ | ✓ | ✓ | |
| `write:campaigns` | ✓ | ✓ | ✓ | | |
| `read:campaigns` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `write:vulnerabilities` | ✓ | ✓ | ✓ | | |
| `read:vulnerabilities` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `read:reports` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `write:settings` | ✓ | ✓ | ✓ | ✓ | |
| `read:settings` | ✓ | ✓ | ✓ | ✓ | ✓ |

* **Aislamiento Multi-Tenant:** Todas las consultas y escrituras a las colecciones operativas están filtradas e inyectadas automáticamente por el `company_id` presente en el JWT del usuario autenticado.
* **super_admin:** Rol global que no pertenece a ninguna empresa.
* **admin:** Rol gestor de la empresa. Puede gestionar usuarios, equipos y activos.

Los custom claims se escriben en Firebase Auth al hacer `POST /auth/register`, por lo que viajan en el JWT desde el siguiente login.

---

## 7. Frontend — React + Vite

### 7.1 Estructura de Archivos

El punto de entrada es [frontend/src/main.tsx](frontend/src/main.tsx), que monta `<App />` en `#root`.

[frontend/src/App.tsx](frontend/src/App.tsx) envuelve todo con:
```
ThemeProvider → AuthProvider → RouterProvider
```

### 7.2 Routing

**Archivo:** [frontend/src/router.tsx](frontend/src/router.tsx)

```
/login           → LoginPage           (público)
/register        → RegisterPage        (público, fuerza role viewer)

/super-admin      → ProtectedRoute (roles: ['super_admin'])
  └─ SuperAdminLayout
       └─ /               → SuperAdminPortal (Crear empresas)

/company-admin    → ProtectedRoute (roles: ['admin'])
  └─ CompanyAdminLayout
       ├─ /               → CompanyAdminPortal
       ├─ /team           → TeamAssetsPage
       └─ /users          → CompanyUsersPage

/dashboard        → ProtectedRoute (roles: operativos)
  └─ DashboardLayout
       ├─ /                 → DashboardPage
       ├─ /vulnerabilities  → VulnerabilityHubPage
       ├─ /ai-pentesting    → AIPentestingPage
       ├─ /patches          → PatchManagerPage
       ├─ /reports          → ReportsPage
       ├─ /settings         → SettingsPage
       ├─ /setup            → SetupCheckPage
       └─ /*                → redirect a /dashboard
```

`ProtectedRoute` verifica `AuthContext.user`. Si no hay usuario autenticado, redirige a `/login`.

### 7.3 Páginas

| Página | Ruta | Descripción |
|--------|------|-------------|
| `Login.tsx` | `/login` | Formulario login con Firebase Auth |
| `Register.tsx` | `/register` | Registro + POST /auth/register |
| `Dashboard.tsx` | `/dashboard` | Métricas en tiempo real (widgets + polling) |
| `AIPentesting.tsx` | `/ai-pentesting` | Lanzar/monitorear campañas de pentesting |
| `VulnerabilityHub.tsx` | `/vulnerabilities` | Vista global de hallazgos con filtros |
| `PatchManager.tsx` | `/patches` | Gestión de remediaciones |
| `TeamAssets.tsx` | `/team` | Gestión de equipos y activos tecnológicos |
| `Reports.tsx` | `/reports` | Lista y descarga de reportes PDF |
| `Settings.tsx` | `/settings` | Tema, idioma, notificaciones |
| `SetupCheck.tsx` | `/setup` | Verificación de conexión al backend |

#### `AIPentesting.tsx` — Detalle
Maneja 3 estados: `'select'` → `'running'` → `'finished'`.

- **select:** Lista targets desde `targetService.list()`. Selección de target y tipo de scan (`quick`/`full`).
- **running:** Polling cada 3s a `campaignService.getStatus(id)`. Muestra progreso, fase, logs, hallazgos en tiempo real. Botones pausar/detener.
- **finished:** Muestra resultados finales. Botón para nuevo scan.

#### `Dashboard.tsx` — Detalle
- Carga datos reales desde `dashboardService.getSummary()` (Risk Score, Quick Stats).
- Resto de widgets (heatmap, vulnerabilidades recientes, patch progress, scans activos) usan **datos mock** como fallback mientras el orquestador no está disponible.
- Conecta a socket (`getDashboardSocket()`) para actualizaciones en tiempo real (polling REST cada 5s).
- Muestra indicador "Live Connected" / "Mock Fallback" según estado del socket.

### 7.4 Componentes

#### Layout (`components/layout/`)
- **`DashboardLayout.tsx`**: Estructura principal — Sidebar + Header + `<Outlet />`
- **`Sidebar.tsx`**: Navegación lateral con links a todas las secciones
- **`Header.tsx`**: Barra superior con perfil de usuario y acciones

#### Dashboard (`components/dashboard/`)
| Componente | Descripción |
|-----------|-------------|
| `RiskScoreGauge` | Gauge circular con score de riesgo (0-10) |
| `QuickStatsCards` | Tarjetas: críticos, alta prioridad, resueltos este mes |
| `RiskHeatmap` | Heatmap de riesgo por categoría |
| `PatchProgressWidget` | Progreso de parches pendientes |
| `RecentVulnerabilitiesTable` | Tabla con últimas vulnerabilidades + click para drawer |
| `ActiveScansWidget` | Lista de escaneos activos con progreso |
| `VulnerabilityDrawer` | Panel lateral con detalle de una vulnerabilidad |
| `DashboardSkeleton` | Skeleton loading mientras cargan los datos |
| `mockData.ts` | Datos de fallback para desarrollo sin orquestador |

#### Team (`components/team/`)
- **`MemberCard.tsx`**: Tarjeta de miembro con workload, stats y permisos
- **`AddMemberModal.tsx`**: Modal para añadir nuevo miembro al equipo
- **`StatCard.tsx`**: Tarjeta de estadística individual

#### Auth (`components/auth/`)
- **`ProtectedRoute.tsx`**: Guard de ruta — verifica `AuthContext.user`

### 7.5 Contextos y Estado Global

#### `AuthContext.tsx`
```typescript
interface AuthContextValue {
  user: User | null          // Firebase User object
  profile: UserProfile | null // {uid, email, name, role} de /api/v1/auth/me/profile
  loading: boolean
  signIn(email, password): Promise<void>
  signUp(email, password, name, role?): Promise<void>
  signOut(): Promise<void>
  resetPassword(email): Promise<void>
}
```

**Flujo de auth:**
1. `onAuthStateChanged` escucha cambios en Firebase Auth.
2. Si hay usuario, llama `GET /api/v1/auth/me/profile` para obtener el rol de Firestore.
3. Si falla el profile, usa el perfil básico de Firebase como fallback (rol: `analyst`).

**`signUp`:** crea usuario en Firebase → `updateProfile` (displayName) → `POST /api/v1/auth/register`.

#### `ThemeContext.tsx`
- Persiste en `localStorage` la preferencia de tema (`dark` / `light`).
- Aplica clase CSS al `<html>` para activar variables CSS del tema.
- Variables CSS definidas en [frontend/src/styles/globals.css](frontend/src/styles/globals.css).

**Variables CSS principales:**
```css
--bg-primary, --bg-secondary, --bg-tertiary, --bg-quaternary
--border-primary, --border-secondary
--text-primary, --text-secondary, --text-muted
--accent-cyan, --accent-blue
--severity-critical, --severity-high, --severity-medium, --severity-low
--shadow-sm, --shadow-md, --shadow-lg
```

### 7.6 Servicios Frontend

Cada servicio usa `apiClient` (Axios con interceptor JWT automático):

| Servicio | Endpoints que consume |
|---------|----------------------|
| `dashboardService.ts` | GET `/api/v1/dashboard/summary` |
| `targetService.ts` | CRUD `/api/v1/targets` |
| `campaignService.ts` | `/api/v1/campaign/*` (start, pause, stop, status, findings) |
| `findingService.ts` | GET `/api/v1/findings`, PATCH status/remediated |
| `reportService.ts` | GET `/api/v1/reports`, GET PDF |
| `settingsService.ts` | GET/PUT `/api/v1/settings` |
| `teamService.ts` | CRUD `/api/v1/teams` y `/api/v1/teams/{id}/members` |

**`lib/api.ts` — Interceptor:**
- Request: agrega `Authorization: Bearer <firebase_token>` automáticamente.
- Response: loguea advertencia en 401.
- Timeout: 30 segundos.

### 7.7 Internacionalización (i18n)

**Idiomas soportados:** Español (es), Inglés (en), Alemán (de), Francés (fr)  
**Idioma por defecto:** Español (`fallbackLng: 'es'`)  
**Detección automática:** localStorage → `navigator.language`

Archivos en [frontend/src/locales/](frontend/src/locales/). Todos los textos de la UI se extraen de estos archivos (requisito de Alloxentric).

Cambio de idioma en tiempo real desde `Settings.tsx` → `i18n.changeLanguage(lang)`.

### 7.8 Comunicación en Tiempo Real

**Archivo:** [frontend/src/lib/socket.ts](frontend/src/lib/socket.ts)

Implementa la interfaz de `socket.io-client` pero usando polling REST (no WebSocket real):

- `connect()`: simula conexión y activa polling cada 5s a `GET /api/v1/dashboard/summary`.
- Mapea la respuesta del summary a eventos: `dashboard:risk-score`, `dashboard:scan-update`.
- Botón "Live Connected" se activa cuando el polling conecta correctamente.

**Eventos:**
- `dashboard:risk-score` → actualiza `RiskScoreGauge`
- `dashboard:recent-vulnerability` → prepend en tabla de vulnerabilidades
- `dashboard:scan-update` → actualiza o agrega en `ActiveScansWidget`

---

## 8. Infraestructura y DevOps

### Docker

Cada servicio tiene su propio `Dockerfile` para contenerización individual:

| Servicio | Dockerfile | Puerto | Base |
|---------|-----------|--------|------|
| `backend` | `backend/Dockerfile` | 8000 | Python 3.11 + uvicorn |
| `frontend` | `frontend/Dockerfile` | 5173 | Node.js 20 + Vite dev server |

> **Nota:** el archivo `docker-compose.yml` raíz y la carpeta `.devcontainer/` fueron eliminados de la rama actual. Para orquestar localmente con Docker, usar los Dockerfiles individuales o levantar los servicios sin contenedor (ver sección 14).

---

## 9. Variables de Entorno

### Backend (`backend/.env`)

```env
APP_NAME=DANI-ETH Backend
APP_ENV=development
APP_DEBUG=True
APP_PORT=8000

CORS_ORIGINS=http://localhost:5173

FIREBASE_CREDENTIALS_PATH=./credentials/firebase-admin-key.json
FIREBASE_PROJECT_ID=<tu-proyecto-firebase>

REDIS_URL=redis://localhost:6379

ORCHESTRATOR_URL=http://localhost:8001
ORCHESTRATOR_SERVICE_TOKEN=<secreto-compartido-con-orquestador>

RUNNER_URL=http://localhost:8002

SUPABASE_URL=<url-de-supabase>
SUPABASE_KEY=<api-key-de-supabase>
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<api-key>
VITE_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<proyecto>
VITE_FIREBASE_STORAGE_BUCKET=<proyecto>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<app-id>
```

---

## 10. Flujos Principales del Sistema

### Flujo 1: Registro de Usuario
```
Frontend                    Firebase Auth              Backend
   │                              │                       │
   ├─ createUserWithEmailAndPassword ──────────────────► │
   │                              │  crea usuario         │
   ├─ updateProfile (displayName) ────────────────────► │
   │                              │                       │
   ├─ POST /api/v1/auth/register ─────────────────────────► guarda en Firestore
   │   {name, role}               │                       ├─ users/{uid}
   │                              │                       └─ set_custom_user_claims
   ◄──────────────────────────────────────────────────── RegisterResponse
```

### Flujo 2: Inicio de Campaña de Pentesting
```
Frontend              Backend              Orquestador         Firestore
   │                     │                     │                   │
   ├─ POST /campaign/start ──────────────────► │                   │
   │   {target_id, target,                     │                   │
   │    scan_type, scope}   ├─ valida target ──────────────────── ►│
   │                        │                  │                   │
   │                        ├─ POST /campaign/start ─────────────► │
   │                        │                  ├─ inicia scan       │
   │                        │  ◄── {campaign_id, status}           │
   │                        ├─ guarda campaigns_index ────────────►│
   ◄── {campaign_id, ...}   │                  │                   │
```

### Flujo 3: Ingesta de Reporte
```
Orquestador            Backend                 Supabase        Firestore
   │                      │                       │               │
   ├─ POST /reports ────► │                       │               │
   │   {X-Service-Token,  │                       │               │
   │    campaign_id,       │                       │               │
   │    pdf_base64, ...}   ├─ sube PDF ──────────►│               │
   │                       │                       │               │
   │                       │ ◄── public URL        │               │
   │                       ├─ guarda doc ─────────────────────────►│
   │                       │   reports/{id}        │               │
   ◄── {report_id, ...}    │                       │               │
```

### Flujo 4: Dashboard en Tiempo Real
```
Frontend (polling 5s)          Backend                 Orquestador
       │                           │                        │
       ├─ GET /dashboard/summary ─►│                        │
       │                           ├─ count targets         │
       │                           ├─ count reports         │
       │                           ├─ count active campaigns│
       │                           ├─ GET /dashboard/summary ────► │
       │                           │  ◄── orc_summary              │
       │ ◄─ {total_targets,        │                               │
       │      total_reports,       │                               │
       │      active_campaigns,    │                               │
       │      findings_by_severity,│                               │
       │      _meta: {orc_avail}}  │                               │
```

---

## 11. Integración con Orquestador Externo

El orquestador es un servicio **externo desarrollado por otro subequipo** usando DeepSeek. El backend propio actúa como proxy.

### Contrato de API esperado del orquestador:

```
POST /campaign/start
  Body: {target_id, target, scan_type, scope[]}
  Response: {campaign_id, status}

POST /campaign/{id}/pause
POST /campaign/{id}/stop

GET /campaign/{id}/status
  Response: {campaign_id, status, phase, progress, findings[], logs[], started_at, finished_at}

GET /campaign/{id}/findings
  Query: severity?, status?
  Response: {findings: [...]}

PUT /findings/{id}/status
  Body: {status: "pending"|"reviewed"|"false_positive"}

GET /campaign/{id}/remediation-plan
  Response: {plan: ...}

PUT /findings/{id}/remediated
  Body: {remediated: bool, notes: str}

GET /findings
  Query: severity?, status?, campaign_id?, limit, offset

GET /patches
  Query: status?, severity?, limit, offset

GET /dashboard/summary
  Response: {active_campaigns, total_findings, findings_by_severity{}, recent_campaigns[]}
```

### Token de servicio
El orquestador usa `X-Service-Token: <ORCHESTRATOR_SERVICE_TOKEN>` para llamar `POST /reports` y `POST /reports/{id}/pdf`. Este token debe coincidir con el configurado en el `.env` del backend.

---

## 12. Colecciones Firestore

### `users/{uid}`
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "analyst",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

### `targets/{target_id}`
```json
{
  "name": "Mi servidor web",
  "target": "192.168.1.100",
  "description": "Servidor de producción",
  "scope": {
    "scan_type": "quick",
    "ports": "1-1024",
    "categories": ["ports", "web"]
  },
  "created_at": "...",
  "updated_at": "..."
}
```

### `campaigns_index/{campaign_id}`
Índice ligero — solo para listados y validaciones sin depender del orquestador:
```json
{
  "campaign_id": "uuid",
  "target_id": "firestore_id",
  "target_address": "192.168.1.100",
  "status": "running | paused | stopped | finished",
  "created_by": "uid",
  "started_at": "...",
  "paused_at": null,
  "stopped_at": null,
  "finished_at": null
}
```

### `reports/{report_id}`
```json
{
  "report_id": "firestore_id",
  "campaign_id": "uuid",
  "target": "192.168.1.100",
  "type": "technical | executive",
  "summary": "...",
  "findings": [{...}],
  "generated_at": "...",
  "pdf_url": "https://supabase.../reportes/report_id.pdf"
}
```

### `teams/{team_id}`
```json
{
  "name": "Network Security Team",
  "description": "...",
  "icon": "🌐",
  "created_at": "...",
  "updated_at": "..."
}
```

### `team_members/{member_id}`
```json
{
  "member_code": "NET-001",
  "firebase_uid": "optional_uid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Penetration Tester",
  "is_team_lead": false,
  "team_id": "team_firestore_id",
  "team_name": "Network Security Team",
  "active_tasks_count": 3,
  "completed_this_month": 8,
  "avg_completion_days": 2.5,
  "permissions": {"view_dashboard": true, "run_scans": true, ...},
  "notifications": {"email": true, "slack": true, ...},
  "notify_when": {"task_assigned": true, ...},
  "created_at": "...",
  "updated_at": "..."
}
```

### `assets/{asset_id}`
```json
{
  "name": "Main Web Server",
  "hostname": "web.example.com",
  "ip_address": "203.0.113.10",
  "asset_type": "web_app",
  "status": "active",
  "environment": "production",
  "description": "...",
  "team_id": "team_firestore_id",
  "team_name": "Network Security Team",
  "created_at": "...",
  "updated_at": "..."
}
```

### `settings/{uid}`
Configuración individual por usuario (tema, notificaciones, preferencias).

---

## 13. Convenciones y Estándares

### Git
- **Branch principal:** `main` (protegido, solo merge via PR)
- **Feature branches:** `feature/nombre-descriptivo`
- **Commits:** en español, formato corto
  - `feat: agregar login con email`
  - `fix: corregir validación de password`
  - `refactor: extraer servicio de campañas`

### Backend
- Schemas Pydantic v2 para toda validación de entrada/salida.
- Dependencias FastAPI con `Depends()` para auth y permisos.
- `_utcnow()` helper en cada router para timestamps ISO 8601 UTC.
- Errores del orquestador se convierten con `_handle_orc_error()` para dar respuestas claras al frontend.
- Logging estructurado con niveles por entorno (`DEBUG` en dev, `INFO` en prod).

### Frontend
- Alias `@/` apunta a `src/` (configurado en `vite.config.ts`).
- Todos los textos de UI en archivos `locales/*.json` (sin hardcoding).
- Colores de severidad via variables CSS: `var(--severity-critical)`, etc.
- Temas (oscuro/claro) via variables CSS en `globals.css`.
- Servicios en `src/services/` — cada uno agrupa las llamadas API de un dominio.

### Seguridad
- Las credenciales de Firebase Admin (`firebase-admin-key.json`) nunca se suben a Git.
- El `ORCHESTRATOR_SERVICE_TOKEN` debe ser un secreto real en producción.
- Los tokens JWT de Firebase tienen TTL de 1 hora — el interceptor Axios siempre pide un token fresco con `getIdToken()`.

---

## 14. Setup y Desarrollo Local

### Prerequisitos

- **Node.js** 20+
- **Python** 3.11+
- **Docker Desktop** (opcional pero recomendado)
- Cuenta en **Firebase** con proyecto creado

### Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <url-del-repo>
cd dani-eth

# 2. Frontend
cd frontend
cp .env.example .env    # Completar variables VITE_FIREBASE_*
npm install

# 3. Backend
cd ../backend
cp .env.example .env    # Completar FIREBASE_PROJECT_ID, SUPABASE_*, etc.
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. Credenciales Firebase Admin
# Descargar firebase-admin-key.json de Firebase Console
# → Configuración → Cuentas de servicio → Generar nueva clave privada
# Colocar en: backend/credentials/firebase-admin-key.json
```

### Levantar en Desarrollo

**Sin Docker (recomendado para desarrollo activo):**
```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

**Con Docker (cada servicio por separado):**
```bash
# Backend
docker build -t dani-eth-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env dani-eth-backend

# Frontend
docker build -t dani-eth-frontend ./frontend
docker run -p 5173:5173 dani-eth-frontend
```

> El `docker-compose.yml` fue eliminado — usar los comandos individuales anteriores o preferir el modo sin Docker.

### URLs de Desarrollo

| Servicio | URL | Descripción |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | App React |
| Backend | http://localhost:8000 | API FastAPI |
| Swagger UI | http://localhost:8000/docs | Documentación interactiva |
| ReDoc | http://localhost:8000/redoc | Documentación alternativa |
| Health Check | http://localhost:8000/api/v1/health | Estado del servidor |

### Datos de Prueba

```bash
cd backend
source venv/bin/activate
python scripts/seed_firestore.py
```

---

## 15. Correcciones Aplicadas (rama `integracion-visual`)

Los siguientes bugs fueron identificados y corregidos el **2026-06-10**:

### Bug 1 — `backend/app/api/v1/auth.py`: imports faltantes

**Problema:** `get_auth` no estaba importado desde `app.core.firebase`, y `logger` no estaba definido. Causaba `NameError` en producción al llamar `POST /auth/register`.

**Corrección:** Se añadió `import logging`, `logger = logging.getLogger(__name__)` y `get_auth` al import de `app.core.firebase`.

---

### Bug 2 — `frontend/src/pages/Dashboard.tsx`: campos incorrectos en `setQuickStats`

**Problema:** `setQuickStats` se llamaba con `{ criticalIssues, highPriority, resolvedThisMonth }` usando `as any`, pero `QuickStatsResponse` define `{ critical, high, resolved }`. `QuickStatsCards` accede a `data.critical` / `data.high` / `data.resolved`, por lo que los tres contadores mostraban `undefined`. También había una llamada duplicada a `setQuickStatsError(null)`.

**Corrección:** Se corrigieron los nombres de campo y se eliminó la llamada duplicada.

---

### Bug 3 — `frontend/tailwind.config.js`: token `bg-quaternary` faltante

**Problema:** `--bg-quaternary` está definida en `globals.css` y se usa en `Header.tsx` (`hover:bg-bg-quaternary`) y `Register.tsx` (`bg-bg-quaternary`), pero no estaba en el config de Tailwind. Las clases eran silenciosamente ignoradas, rompiendo el hover de botones del header y la barra de fortaleza de contraseña.

**Corrección:** Se agregó `quaternary: 'var(--bg-quaternary)'` al bloque `bg` de `tailwind.config.js`.

---

### Archivos eliminados (fuera de scope de correcciones)

Los siguientes archivos fueron eliminados por el equipo antes de esta sesión (visible en `git status`):
- `docker-compose.yml`
- `.devcontainer/devcontainer.json`
- `.devcontainer/devcontainer-lock.json`
- `.devcontainer/docker-compose.yml`

La documentación de la sección 8 fue actualizada para reflejar este estado.

---

*Documento actualizado el 10 de junio de 2026 — rama `integracion-visual`*
