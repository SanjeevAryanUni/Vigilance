@echo off
REM ================================================================
REM 🛡️  VIGILANCE — Urban Road Intelligence Prototype Launcher (Windows)
REM ================================================================

echo ================================================================
echo 🛡️  VIGILANCE — Urban Road Intelligence Prototype Launcher
echo ================================================================

cd /d "%~dp0\vigilance-prototype"

REM 1. Start Celery Async Worker Process
echo Starting Celery Background Deduplication Worker...
start "VIGILANCE Celery Worker" cmd /k "python -m celery -A backend.celery_app worker --loglevel=info --pool=solo"

timeout /t 2 /nobreak >nul

REM 2. Start FastAPI Backend on Port 8000
echo Starting FastAPI Server on http://localhost:8000 ...
start "VIGILANCE FastAPI Server" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

REM 3. Seed Database with initial Chennai road distress detections
echo Seeding initial Chennai transit detections with dynamic RPI...
python backend/seed_data.py

REM 4. Start Next.js WebGIS Dashboard on Port 3000
echo Starting Next.js WebGIS Dashboard on http://localhost:3000 ...
if exist "dashboard-next" (
    cd dashboard-next
    start "VIGILANCE WebGIS Dashboard" cmd /k "npm run dev -- -p 3000"
    cd ..
)

REM 5. Start Simulated Fleet Stream in background
echo Starting Simulated Fleet Edge AI Stream (5 Virtual Buses)...
start "VIGILANCE Fleet Perception" cmd /k "python edge/simulate_fleet.py"

echo ================================================================
echo ✨ VIGILANCE Prototype is LIVE!
echo 👉 Dashboard URL: http://localhost:3000
echo 👉 REST API Docs: http://localhost:8000/docs
echo ================================================================

timeout /t 4 /nobreak >nul
start http://localhost:3000
pause
