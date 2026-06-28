@echo off
echo ===================================
echo  Levantando el Ecosistema DANI-ETH
echo ===================================

:: 1. Backend Principal (Puerto 8000)
echo Iniciando el Backend Principal (Puerto 8000)...
start "Backend Principal" cmd /k "cd dani-eth\backend && .\venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8000"

:: 2. Frontend (Puerto 5173)
echo Iniciando el Frontend (Puerto 5173)...
start "Frontend" cmd /k "cd dani-eth\frontend && npm run dev"

:: 3. Orquestador de IA (Puerto 8001)
echo Iniciando el Orquestador de IA (Puerto 8001)...
start "Orquestador IA" cmd /k "cd Orquestador_AI_ETH\orchestrator && ..\..\venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8001"

:: 4. Runner (Tool Registry :8003 + Tool Executor :8004)
::    Se usa docker-compose desde backend_runner/ para evitar colision de puertos
::    con el Backend (8000) y el Orquestador (8001).
echo Iniciando el Runner (Puertos 8003, 8004)...
start "Runner (Docker)" cmd /k "cd danieth-backend_runner-frontend\backend_runner && docker-compose up"

echo.
echo =================================================================
echo  Puertos asignados:
echo    Frontend     -> http://localhost:5173
echo    Backend      -> http://localhost:8000
echo    Orquestador  -> http://localhost:8001
echo    Tool Registry-> http://localhost:8003
echo    Tool Executor-> http://localhost:8004
echo =================================================================

echo Todos los servicios se estan iniciando en ventanas separadas.
echo Puedes cerrar esta ventana principal.
exit
