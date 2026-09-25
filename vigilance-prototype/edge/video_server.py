"""
VIGILANCE — Live Dashcam Video MJPEG Streaming Server
======================================================
Serves the multi-model annotated dashcam video feed over HTTP/MJPEG on port 8001.
Designed to be consumed by:
  - Next.js Web Dashboard (<VideoCameraGrid /> component on localhost:3000)
  - Standalone browser viewing (http://localhost:8001)
  - Edge telemetry aggregators

Endpoints:
  - GET /             : High-tech live camera monitor web UI
  - GET /video_feed   : MJPEG multipart stream of annotated frames (with CORS)
  - GET /api/stats    : JSON detection metrics, FPS, and status (with CORS)
  - GET /api/health   : Healthcheck endpoint
"""
import os
import sys
import time
import logging
import threading
import argparse
from typing import Optional, Generator, Dict, Any
import cv2
import numpy as np
from flask import Flask, Response, jsonify, render_template_string

# Ensure UTF-8 console output on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Disable verbose Werkzeug logging for clean console output
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)

# ── Shared Thread-Safe Frame & Telemetry Buffer ───────────────────
_latest_frame: Optional[bytes] = None
_frame_lock = threading.Lock()
_stats_lock = threading.Lock()
_stats: Dict[str, Any] = {
    "fps": 0.0,
    "frame_count": 0,
    "detections": {"road_damage": 0, "vehicles": 0, "plates": 0},
    "status": "initializing",
}

# Cache for standby placeholder frame
_placeholder_cache: Optional[bytes] = None
_placeholder_last_gen: float = 0.0


def set_latest_frame(frame_bytes: bytes):
    """Thread-safe setter for latest encoded JPEG frame."""
    global _latest_frame
    with _frame_lock:
        _latest_frame = frame_bytes


def get_latest_frame() -> Optional[bytes]:
    """Thread-safe getter for latest encoded JPEG frame."""
    with _frame_lock:
        return _latest_frame


def update_stats(new_stats: Dict[str, Any]):
    """Thread-safe update for live telemetry stats."""
    global _stats
    with _stats_lock:
        _stats.update(new_stats)


def get_stats() -> Dict[str, Any]:
    """Thread-safe copy of live telemetry stats."""
    with _stats_lock:
        return _stats.copy()


def create_standby_frame(msg: str = "VIGILANCE EDGE FEED STANDBY") -> bytes:
    """Generate a high-tech dark standby frame when no camera stream is active."""
    global _placeholder_cache, _placeholder_last_gen
    now = time.time()
    # Regenerate placeholder once per second for animated clock
    if _placeholder_cache is not None and (now - _placeholder_last_gen) < 1.0:
        return _placeholder_cache

    width, height = 960, 540
    frame = np.full((height, width, 3), 16, dtype=np.uint8)

    # Grid background pattern
    for x in range(0, width, 40):
        cv2.line(frame, (x, 0), (x, height), (24, 28, 36), 1)
    for y in range(0, height, 40):
        cv2.line(frame, (0, y), (width, y), (24, 28, 36), 1)

    # Center card
    cx, cy = width // 2, height // 2
    cv2.rectangle(frame, (cx - 260, cy - 80), (cx + 260, cy + 80), (28, 34, 46), -1)
    cv2.rectangle(frame, (cx - 260, cy - 80), (cx + 260, cy + 80), (0, 229, 255), 2)

    # Header & Status text
    cv2.putText(frame, "PROJECT VIGILANCE", (cx - 150, cy - 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 229, 255), 2, cv2.LINE_AA)
    cv2.putText(frame, msg, (cx - 220, cy + 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (220, 220, 220), 1, cv2.LINE_AA)

    # Timestamp
    time_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    cv2.putText(frame, f"AWAITING INPUT STREAM  *  {time_str}", (cx - 210, cy + 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 140, 160), 1, cv2.LINE_AA)

    # Corner brackets (HUD aesthetic)
    bracket_len = 25
    color_hud = (0, 229, 255)
    cv2.line(frame, (30, 30), (30 + bracket_len, 30), color_hud, 2)
    cv2.line(frame, (30, 30), (30, 30 + bracket_len), color_hud, 2)
    cv2.line(frame, (width - 30, 30), (width - 30 - bracket_len, 30), color_hud, 2)
    cv2.line(frame, (width - 30, 30), (width - 30, 30 + bracket_len), color_hud, 2)
    cv2.line(frame, (30, height - 30), (30 + bracket_len, height - 30), color_hud, 2)
    cv2.line(frame, (30, height - 30), (30, height - 30 - bracket_len), color_hud, 2)
    cv2.line(frame, (width - 30, height - 30), (width - 30 - bracket_len, height - 30), color_hud, 2)
    cv2.line(frame, (width - 30, height - 30), (width - 30, height - 30 - bracket_len), color_hud, 2)

    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    _placeholder_cache = jpeg.tobytes()
    _placeholder_last_gen = now
    return _placeholder_cache


def generate_mjpeg_stream() -> Generator[bytes, None, None]:
    """Generates multipart MJPEG frames from the latest frame buffer."""
    while True:
        frame_bytes = get_latest_frame()
        if frame_bytes is None:
            frame_bytes = create_standby_frame()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.035)  # Target ~28-30 FPS


@app.route('/video_feed')
def video_feed():
    """MJPEG Live Stream Endpoint with open CORS for Next.js embedding."""
    response = Response(
        generate_mjpeg_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/api/stats')
def api_stats():
    """Live telemetry & detection counts JSON endpoint."""
    stats = get_stats()
    stats["server_time"] = time.time()
    response = jsonify(stats)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


@app.route('/api/health')
def api_health():
    """Health check endpoint."""
    response = jsonify({
        "status": "healthy",
        "service": "vigilance-edge-video-server",
        "version": "1.0.0",
        "stream_status": get_stats().get("status", "unknown"),
        "timestamp": time.time()
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


HTML_DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIGILANCE Edge AI — Live Dashcam Feed</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #080c14;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'JetBrains Mono', monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            padding: 24px 16px;
        }
        .header {
            width: 100%;
            max-width: 1100px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #1e293b;
        }
        .logo-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pulse-badge {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #10b981;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        h1 {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #f8fafc;
        }
        .badge-live {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid #10b981;
            color: #10b981;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .stats-grid {
            width: 100%;
            max-width: 1100px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid #1e293b;
            border-radius: 10px;
            padding: 14px 16px;
            backdrop-filter: blur(8px);
        }
        .stat-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94a3b8;
            margin-bottom: 6px;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f1f5f9;
        }
        .damage-color { color: #f43f5e; }
        .vehicle-color { color: #38bdf8; }
        .plate-color { color: #4ade80; }
        .fps-color { color: #f59e0b; }
        .video-container {
            width: 100%;
            max-width: 1100px;
            background: #020617;
            border: 1px solid #334155;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            position: relative;
        }
        .video-frame {
            width: 100%;
            height: auto;
            display: block;
        }
        .legend-bar {
            width: 100%;
            max-width: 1100px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
            align-items: center;
            margin-top: 18px;
            padding: 12px;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            font-size: 0.8rem;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-title">
            <div class="pulse-badge"></div>
            <h1>VIGILANCE EDGE AI — LIVE DASHCAM PROCESSOR</h1>
        </div>
        <div>
            <span class="badge-live" id="stream-status">STREAM ACTIVE</span>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Frame Rate</div>
            <div class="stat-value fps-color" id="val-fps">0.0 FPS</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Road Damage (INT8)</div>
            <div class="stat-value damage-color" id="val-damage">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Vehicles Detected</div>
            <div class="stat-value vehicle-color" id="val-vehicles">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">License Plates</div>
            <div class="stat-value plate-color" id="val-plates">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Frames</div>
            <div class="stat-value" id="val-frames">0</div>
        </div>
    </div>

    <div class="video-container">
        <img class="video-frame" src="/video_feed" alt="Vigilance Live Multi-Model Feed" />
    </div>

    <div class="legend-bar">
        <div class="legend-item">
            <span class="legend-dot" style="background:#ef4444;"></span>
            <span>Road Damage (Potholes / Cracks) [INT8 ONNX]</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background:#0284c7;"></span>
            <span>Vehicles (Cars / Buses / Trucks) [YOLOv8n]</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background:#10b981;"></span>
            <span>Indian License Plates [ANPR + OCR]</span>
        </div>
    </div>

    <script>
        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('val-fps').textContent = (data.fps || 0).toFixed(1) + ' FPS';
                    document.getElementById('val-frames').textContent = data.frame_count || 0;
                    if (data.detections) {
                        document.getElementById('val-damage').textContent = data.detections.road_damage || 0;
                        document.getElementById('val-vehicles').textContent = data.detections.vehicles || 0;
                        document.getElementById('val-plates').textContent = data.detections.plates || 0;
                    }
                    const statusElem = document.getElementById('stream-status');
                    if (data.status === 'running') {
                        statusElem.textContent = 'STREAM ACTIVE';
                        statusElem.style.borderColor = '#10b981';
                        statusElem.style.color = '#10b981';
                    } else {
                        statusElem.textContent = (data.status || 'OFFLINE').toUpperCase();
                        statusElem.style.borderColor = '#f59e0b';
                        statusElem.style.color = '#f59e0b';
                    }
                }
            } catch (e) {
                console.warn('Failed to poll telemetry stats:', e);
            }
        }
        setInterval(fetchStats, 1000);
        fetchStats();
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    """Serves the built-in browser monitoring UI."""
    return render_template_string(HTML_DASHBOARD_TEMPLATE)


def start_server_thread(host: str = '0.0.0.0', port: int = 8001):
    """
    Starts the Flask MJPEG server in a daemon thread.
    Allows seamless integration with stream_video.py or other edge scripts.
    """
    server_thread = threading.Thread(
        target=lambda: app.run(host=host, port=port, threaded=True, debug=False, use_reloader=False),
        daemon=True,
        name="VigilanceVideoServer"
    )
    server_thread.start()
    return server_thread


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="VIGILANCE — Live Video MJPEG Server")
    parser.add_argument("--port", type=int, default=8001, help="Port to serve on (default: 8001)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    args = parser.parse_args()

    print(f"============================================================")
    print(f"  VIGILANCE Edge AI — Video MJPEG Streaming Server")
    print(f"============================================================")
    print(f"  • Preview UI   : http://localhost:{args.port}/")
    print(f"  • Video Stream : http://localhost:{args.port}/video_feed")
    print(f"  • JSON Stats   : http://localhost:{args.port}/api/stats")
    print(f"============================================================")

    app.run(host=args.host, port=args.port, threaded=True, debug=False)
