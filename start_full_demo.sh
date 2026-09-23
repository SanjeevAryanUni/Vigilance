#!/bin/bash
set -e

echo "============================================="
echo "🚀 VIGILANCE Full Stack Demo Launcher"
echo "============================================="

# 1. Start Docker services (PostGIS + Redis + Mosquitto)
echo "📦 Starting Docker services..."
docker compose up -d 2>/dev/null || echo "⚠️  Docker compose not running, continuing with local fallback..."
sleep 3

# 2. Set DB to PostGIS if running, otherwise falls back to SQLite
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:vigilance2026@localhost:5432/vigilance"}

# 3. Start FastAPI backend
echo "🖥️  Starting backend..."
cd vigilance-prototype
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 2

# 4. Start MQTT listener
echo "📥 Starting MQTT listener..."
python3 backend/mqtt_listener.py &
LISTENER_PID=$!
sleep 1

# 5. Start fleet simulation
echo "🚌 Starting fleet simulation (5 buses)..."
cd edge
python3 simulate_fleet.py &
FLEET_PID=$!
cd ../..

# 6. Start frontend
echo "🌐 Starting Next.js dashboard..."
cd vigilance-prototype/dashboard-next
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "============================================="
echo "✅ ALL SERVICES RUNNING"
echo "============================================="
echo "📱 Phone capture:  https://vigilance-sih.vercel.app/capture"
echo "💻 Dashboard:      http://localhost:3000"
echo "🔧 Backend API:    http://localhost:8000/api/health"
echo "📡 MQTT Broker:    localhost:1883"
echo "🗄️  PostGIS:        localhost:5432"
echo "============================================="
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $LISTENER_PID $FLEET_PID $FRONTEND_PID 2>/dev/null; docker compose down 2>/dev/null || true; exit" INT TERM
wait
