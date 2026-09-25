#!/bin/bash
set -e

echo "============================================="
echo "🚀 VIGILANCE Full Stack Demo Launcher"
echo "============================================="

# 1. Start Docker services (PostGIS + Redis + Mosquitto)
echo "📦 Starting Docker services..."
docker compose up -d 2>/dev/null || echo "⚠️  Docker compose not running, continuing with local fallback..."
sleep 3

# 2. Set DB to Supabase PostgreSQL or local fallback
DEFAULT_SUPABASE_URL="postgresql://postgres.sqhojwzbbalrhqpgetwy:taSpev-xyjwor-sepje4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
export DATABASE_URL=${DATABASE_URL:-$DEFAULT_SUPABASE_URL}

# 3. Start FastAPI backend
echo "🖥️  Starting backend..."
cd vigilance-prototype
../.venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 2

# 4. Start Cloudflare Tunnel if present
TUNNEL_PID=""
if [ -f "../bin/cloudflared" ]; then
  echo "🌐 Starting Cloudflare Public HTTPS Tunnel..."
  ../bin/cloudflared tunnel --protocol http2 --url http://localhost:8000 > /tmp/cloudflared.log 2>&1 &
  TUNNEL_PID=$!
  sleep 3
  TUNNEL_URL=$(grep -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' /tmp/cloudflared.log 2>/dev/null | tail -1 || echo "")
  if [ -n "$TUNNEL_URL" ]; then
    echo "🔗 Live Public API URL: $TUNNEL_URL"
  fi
fi

# 5. Start MQTT listener
echo "📥 Starting MQTT listener..."
../.venv/bin/python backend/mqtt_listener.py &
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

trap "kill $BACKEND_PID $TUNNEL_PID $LISTENER_PID $FLEET_PID $FRONTEND_PID 2>/dev/null; docker compose down 2>/dev/null || true; exit" INT TERM
wait
