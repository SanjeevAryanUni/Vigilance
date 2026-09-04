# 🛡️ VIGILANCE — Hackathon Working Prototype

### SIH26124: AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet
**Department:** Bharat Electronics Limited (BEL)  
**Team:** VIGILANCE | SRM Institute of Science and Technology

---

## 🌟 What This Prototype Demonstrates

1. **Edge AI Perception & Telemetry Engine (`edge/`):**
   * INT8-quantized YOLOv8-Nano ONNX Runtime model (`D00` longitudinal crack, `D10` transverse crack, `D20` alligator crack, `D40` pothole).
   * 5 virtual municipal buses concurrently streaming GPS-geotagged telemetry across the Chennai transit grid.
   * Real hardware benchmark: **~110 MB RAM footprint at ~23 FPS on Apple Silicon** (see `edge/BENCHMARKS.md`).

2. **DBSCAN Spatial Deduplication, POI & SLA Engine (`backend/`):**
   * Eliminates duplicate reports from multiple buses traversing the same road segment within a **15-meter spatial threshold**.
   * Computes dynamic **Repair Prioritization Index (RPI)** using real Chennai road hierarchy and proximity to critical emergency hospitals and schools.
   * Auto-matches raw GPS coordinates to arterial corridors (`match_nearest_road`) and links road segments to contracted maintenance entities (`ROAD_CONTRACTORS`) with SLA countdowns.
   * Preserves operator repair dispatch status (`open` ➔ `assigned` ➔ `resolved`) across live re-clustering passes.

3. **Next.js 14 WebGIS Municipal Command Center (`dashboard-next/`):**
   * Dark-mode MapLibre GL multi-layer vector map centered on Chennai with style switcher (CARTO, OSM, Satellite, Topo).
   * Real-time WebSocket telemetry stream, ApexCharts distress velocity splines, and RPI radial formula gauges.
   * Dedicated `/capture` Mobile Dashcam HUD for vehicle windshield testing.
   * Interactive PWD Work-Order status dispatcher with contractor contact & SLA tracking.

4. **Mobile Phone & Android Field Clients (`phone_client.py` & `termux_client.py`):**
   * Physical Android phone support via Termux + Termux:API (`termux-location` GPS-FRESH fix + `termux-camera-photo`).
   * `/capture` browser-based dashcam utilizing phone camera and HTML5 Geolocation.

---

## 🚀 Quickstart (One-Click Launch)

```bash
cd vigilance-prototype
./start_demo.sh
```

* 🌐 **WebGIS Command Center:** `http://localhost:3000`
* 📱 **Mobile Windshield Dashcam:** `http://localhost:3000/capture`
* 📚 **REST API Documentation:** `http://localhost:8000/docs`
* 📐 **RPI Mathematical Methodology:** [`../docs/RPI_METHODOLOGY.md`](../docs/RPI_METHODOLOGY.md)
* ⚡ **Edge AI Benchmarks:** [`edge/BENCHMARKS.md`](edge/BENCHMARKS.md)


### 📲 Running on an Android Phone (Live Field Telemetry)
```bash
# Inside Termux on Android Phone:
pkg install python termux-api
pip install requests
export VIGILANCE_API_URL="http://<YOUR_LAPTOP_IP>:8000/api/detections"
python termux_client.py
```

