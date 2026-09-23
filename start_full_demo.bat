@echo off
setlocal enabledelayedexpansion

echo =============================================
echo 🚀 VIGILANCE Full Stack Demo Launcher (Windows)
echo =============================================

:: Check if Docker is available
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📦 Starting Docker services (PostGIS, Mosquitto, Redis)...
    docker compose up -d
    timeout /t 3 /nobreak >nul
    set "DATABASE_URL=postgresql://postgres:vigilance2026@localhost:5432/vigilance"
) else (
    echo ⚠️ Docker not detected in PATH. Using local SQLite database.
)

:: Start Backend API
echo 🖥️ Starting FastAPI backend on http://localhost:8000...
start "VIGILANCE Backend" cmd /k "cd vigilance-prototype && py -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul

:: Start MQTT Listener
echo 📥 Starting MQTT Listener...
start "VIGILANCE MQTT Listener" cmd /k "cd vigilance-prototype && py backend\mqtt_listener.py"
timeout /t 1 /nobreak >nul

:: Start Fleet Simulator
echo 🚌 Starting Fleet Simulation (5 Vehicles via MQTT)...
start "VIGILANCE Fleet Simulator" cmd /k "cd vigilance-prototype\edge && py simulate_fleet.py"

:: Check and Start Frontend if node/npm is available
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "vigilance-prototype\dashboard-next\package.json" (
        echo 🌐 Starting Next.js Dashboard...
        start "VIGILANCE Dashboard" cmd /k "cd vigilance-prototype\dashboard-next && npm run dev"
    )
)

echo.
echo =============================================
echo ✅ VIGILANCE SERVICES LAUNCHED
echo =============================================
echo 📱 Phone capture:  https://vigilance-sih.vercel.app/capture
echo 💻 Dashboard:      http://localhost:3000
echo 🔧 Backend API:    http://localhost:8000/api/health
echo 📡 MQTT Broker:    localhost:1883
echo =============================================
echo.
pause
