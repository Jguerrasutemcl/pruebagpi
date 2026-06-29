@echo off
setlocal enabledelayedexpansion

title DANI-ETH Launcher

echo.
echo  ============================================================
echo    DANI-ETH  -  Iniciando Ecosistema de Pentesting
echo  ============================================================
echo.

:: ── Verificar directorio de ejecucion ───────────────────────
if not exist "iniciar_proyecto.bat" (
    echo  [ERROR] Ejecuta este .bat desde el directorio raiz del proyecto.
    pause
    exit /b 1
)

:: ── Verificar Docker ────────────────────────────────────────
echo  Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Docker Desktop no esta corriendo.
    echo          Arrancalo e intentalo de nuevo.
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker disponible.

:: ── Detectar docker-compose (v1) o docker compose (v2) ──────
docker-compose version >nul 2>&1
if errorlevel 1 (
    set "COMPOSE=docker compose"
    echo  [OK] Usando docker compose (CLI v2)
) else (
    set "COMPOSE=docker-compose"
    echo  [OK] Usando docker-compose (CLI v1)
)
echo.

:: ── Avisar si hay puertos ya ocupados (no fatal) ────────────
echo  Verificando puertos criticos...
for %%P in (8000 8001 5173 8003 8004 8012) do (
    netstat -ano 2>nul | findstr ":%%P " | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 echo  [AVISO] Puerto %%P ya en uso - puede haber conflicto.
)
echo.

:: ── 1. Backend Principal (Puerto 8000) ──────────────────────
echo  [1/4] Backend Principal       -^>  http://localhost:8000
start "Backend :8000" cmd /k "cd dani-eth\backend && .\venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8000"

:: ── 2. Orquestador IA (Puerto 8001) ─────────────────────────
echo  [2/4] Orquestador IA          -^>  http://localhost:8001
start "Orquestador :8001" cmd /k "cd Orquestador_AI_ETH\orchestrator && ..\..\venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8001"

:: ── 3. Runner (Docker) ──────────────────────────────────────
echo  [3/4] Runner (Docker)         -^>  :8003  :8004  :8012  :6379
start "Runner (Docker)" cmd /k "cd danieth-backend_runner-frontend\backend_runner && %COMPOSE% up"

:: ── 4. Frontend Vite (Puerto 5173) ──────────────────────────
echo  [4/4] Frontend                -^>  http://localhost:5173
start "Frontend :5173" cmd /k "cd dani-eth\frontend && npm run dev"

echo.
echo  ============================================================
echo    Todos los servicios iniciandose en ventanas separadas.
echo.
echo    Frontend       ->  http://localhost:5173
echo    Backend        ->  http://localhost:8000
echo    Orquestador    ->  http://localhost:8001
echo    Tool Registry  ->  http://localhost:8003
echo    Tool Executor  ->  http://localhost:8004
echo    API Gateway    ->  http://localhost:8012
echo    Redis          ->  localhost:6379
echo  ============================================================
echo.
echo  Puedes cerrar esta ventana cuando quieras.
echo.
pause
exit /b 0
