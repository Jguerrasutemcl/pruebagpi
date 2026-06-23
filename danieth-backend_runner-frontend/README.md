# DANI-ETH — Plataforma de Ethical Hacking Automatizado

> Orquestador inteligente de pentesting basado en IA (Gemini) que automatiza el descubrimiento, validación y remediación de vulnerabilidades.

---

## Estructura del proyecto

```
dani-eth/
├── frontend/              # Vite + React + TypeScript + Tailwind
├── backend/               # FastAPI + Python 3.11
├── docker-compose.yml     # Orquestación local (Redis + backend + frontend)
└── README.md
```

## Stack técnico

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, react-i18next, Firebase SDK (Auth + Firestore).

**Backend**: FastAPI, Python 3.11, Firebase Admin SDK, Pydantic v2, Google Generative AI (Gemini).

**Infraestructura**: Firebase (Auth + Firestore), Redis (colas de tareas), Docker.

---

## Setup inicial (primera vez)

### 1. Prerequisitos

- **Node.js** 20+ ([descargar](https://nodejs.org))
- **Python** 3.11+ ([descargar](https://www.python.org/downloads/))
- **Docker Desktop** ([descargar](https://www.docker.com/products/docker-desktop/)) — opcional pero recomendado
- Cuenta en **Firebase** con proyecto creado (ver `docs/firebase-setup.md`)

### 2. Clonar y configurar variables de entorno

```bash
git clone <url-del-repo>
cd dani-eth
```

#### Frontend

```bash
cd frontend
cp .env.example .env
# Editar .env con la config de Firebase (ya viene preconfigurada)
npm install
```

#### Backend

```bash
cd ../backend
cp .env.example .env
# Editar .env si hace falta
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Credenciales de Firebase Admin

1. Descargar el archivo `firebase-admin-key.json` desde Firebase Console (Configuración del proyecto → Cuentas de servicio).
2. Colocarlo en `backend/credentials/firebase-admin-key.json`.
3. **NO subir este archivo a Git** (ya está en `.gitignore`).

### 3. Levantar el entorno de desarrollo

**Opción A — Sin Docker (más simple para empezar):**

Terminal 1 (backend):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

**Opción B — Con Docker:**

```bash
docker-compose up
```

### 4. Verificar que todo funciona

- Backend: abrir http://localhost:8000/api/v1/health → debería responder `{"status": "ok", "firebase": "connected"}`
- Frontend: abrir http://localhost:5173 → debería cargar la app
- Docs API: http://localhost:8000/docs → Swagger UI con los endpoints

---

## Convenciones del proyecto

- **Branch principal**: `main` (protegido, solo merge via PR).
- **Branches de feature**: `feature/nombre-descriptivo`.
- **Commits**: en español, formato corto. Ej: `feat: agregar login con email`, `fix: corregir validación de password`.

---

## Equipo

- Vicente Campos
- Javier Guerra
- Tomás Farías
- Felipe Poblete

**Empresa**: Alloxentric  
**Académico**: Dr. Oscar Magna Veloso  
**Asignatura**: Gestión de Proyectos Informáticos
