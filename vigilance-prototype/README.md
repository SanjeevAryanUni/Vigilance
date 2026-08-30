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

2. **DBSCAN Spatial Deduplication & POI Engine (`backend/`):**
   * Eliminates duplicate reports from multiple buses traversing the same road segment within a **15-meter spatial threshold**.
   * Computes dynamic **Repair Prioritization Index (RPI)** using real Chennai road hierarchy and proximity to critical emergency hospitals and schools.
   * Preserves operator repair dispatch status (`open` ➔ `assigned` ➔ `resolved`) across live re-clustering passes.

3. **Next.js 14 WebGIS Municipal Command Center (`dashboard-next/`):**
   * Dark-mode MapLibre GL vector map centered on Chennai with interactive incident cluster badges.
   * Real-time WebSocket telemetry stream and Defect Type Distribution Doughnut Chart.
   * Interactive PWD Work-Order status dispatcher.

---

## 🚀 Quickstart (One-Click Launch)

```bash
cd vigilance-prototype
./start_demo.sh
```

* 🌐 **GIS Dashboard:** `http://localhost:3000`
* 📚 **REST API Documentation:** `http://localhost:8000/docs`
