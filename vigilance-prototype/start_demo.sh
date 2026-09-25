#!/bin/bash
set -e

echo "================================================================"
echo "🛡️  VIGILANCE — SIH Grand Finale One-Click Demo Launcher"
echo "================================================================"

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$( cd "$ROOT_DIR/.." && pwd )"

# 1. Activate Python Virtual Environment if present
if [ -d "$WORKSPACE_DIR/.venv" ]; then
    echo "[*] Activating Python virtualenv from $WORKSPACE_DIR/.venv..."
    source "$WORKSPACE_DIR/.venv/bin/activate"
elif [ -d "$ROOT_DIR/.venv" ]; then
    echo "[*] Activating Python virtualenv from $ROOT_DIR/.venv..."
    source "$ROOT_DIR/.venv/bin/activate"
fi

# 2. Free up existing ports (3000, 8000, 8001)
echo "[*] Ensuring clean ports (3000, 8000, 8001)..."
for PORT in 3000 8000 8001; do
    PID=$(lsof -ti :$PORT || true)
    if [ -n "$PID" ]; then
        echo "    Killing process $PID on port $PORT..."
        kill -9 $PID 2>/dev/null || true
    fi
done
sleep 1

# 3. Clean Seed Database with Rich Chennai Telemetry
echo "[*] Pre-seeding database with full Chennai arterial telemetry & RPI scores..."
cd "$ROOT_DIR/backend"
python3 seed_data.py --force

# 4. Start FastAPI Backend on Port 8000
echo "[*] Starting FastAPI Backend on http://localhost:8000 ..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 2

# 5. Start Next.js Dashboard on Port 3000
echo "[*] Starting Next.js WebGIS Command Center on http://localhost:3000 ..."
cd "$ROOT_DIR/dashboard-next"
if [ -d ".next" ]; then
    npm start -- -p 3000 &
    DASHBOARD_PID=$!
else
    npm run dev -- -p 3000 &
    DASHBOARD_PID=$!
fi

sleep 2

# 6. Optional: Start Edge Camera Streamer on Port 8001 if sample video exists
DEMO_VIDEO="$WORKSPACE_DIR/assets/demo_samples/chennai_road.mp4"
if [ -f "$DEMO_VIDEO" ]; then
    echo "[*] Launching Edge AI Multi-Model Video Streamer on http://localhost:8001 ..."
    cd "$ROOT_DIR/edge"
    python3 stream_video.py --video "$DEMO_VIDEO" --serve --no-window &
    STREAM_PID=$!
fi

echo "================================================================"
echo "✨ VIGILANCE Grand Finale Platform is LIVE!"
echo "👉 Command Center:     http://localhost:3000"
echo "👉 Dashcam Capture:    http://localhost:3000/capture"
echo "👉 REST API & Docs:    http://localhost:8000/docs"
if [ -n "$STREAM_PID" ]; then
    echo "👉 Edge Video Stream:  http://localhost:8001"
fi
echo "================================================================"
echo "Press Ctrl+C to terminate all services."

# Trap to kill all background services on exit
cleanup() {
    echo ""
    echo "[*] Shutting down VIGILANCE services..."
    kill $BACKEND_PID $DASHBOARD_PID ${STREAM_PID:-} 2>/dev/null || true
    echo "[+] Done."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Auto-open browser in background
sleep 2
case "$(uname -s)" in
  Darwin)
    open "http://localhost:3000" 2>/dev/null || true
    ;;
  Linux)
    xdg-open "http://localhost:3000" 2>/dev/null || echo "Please open http://localhost:3000 in your browser"
    ;;
esac

wait
