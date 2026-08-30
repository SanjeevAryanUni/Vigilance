# 🛡️ VIGILANCE — AI-Powered Mobile Urban Intelligence Platform

<div align="center">

**Smart India Hackathon (SIH 2026)**  
**Problem Statement ID:** `SIH26124` | **Category:** Software  
**Organization:** Bharat Electronics Limited (BEL)  
**Theme:** Smart Transportation & Public Infrastructure  
**Team:** VIGILANCE | SRM Institute of Science and Technology

</div>

---

## 📌 Executive Summary

**VIGILANCE** turns the buses and municipal vehicles already traversing city roads every day into a live, continuous road-inspection and urban intelligence network.

By mounting sub-₹3,000 edge camera units on existing public transit fleets (buses, waste management trucks, patrol vans), VIGILANCE passively detects road distress (potholes, cracks, surface ravelling), geotags anomalies in real time, eliminates duplicate telemetry via spatial clustering (DBSCAN), and prioritizes municipal maintenance work orders via a dynamic **Repair Prioritization Index (RPI)**.

---

## 🚀 Key Innovation & Architectural Pillars

1. **Zero New Fleet Capex:** Reuses India's existing 63+ lakh km public transit network instead of deploying ₹50–80 Lakh dedicated LiDAR survey cars.
2. **Onboard Edge AI (ONNX Runtime INT8):** INT8-quantized YOLOv8-Nano model running locally on commodity ARM CPUs with **~110 MB RAM footprint at ~23 FPS** on Apple Silicon (see [`vigilance-prototype/edge/BENCHMARKS.md`](vigilance-prototype/edge/BENCHMARKS.md) for measured hardware benchmarks).
3. **Spatial Deduplication (DBSCAN):** Merges multi-vehicle passes across identical road segments into unified master incidents within a verified **15-meter spatial threshold**.
4. **Dynamic Repair Prioritization Index (RPI):**
   $$\text{RPI} = 0.40 \cdot \text{Severity} + 0.25 \cdot \text{Density} + 0.20 \cdot \text{TrafficHierarchy} + 0.15 \cdot \text{POIProximity}$$
   * *TrafficHierarchy:* Real weights per Chennai arterial route (e.g. NH-32 GST Road = 1.0, Anna Salai = 0.85).
   * *POIProximity:* Live geospatial distance to critical emergency healthcare & educational hubs (SRM Hospital, MIOT International, Apollo Hospital, Anna University, IIT Madras).
5. **Live WebGIS Command Center:** Next.js 14 App Router + MapLibre GL vector tiles + WebSockets for real-time live telemetry feeds, heatmaps, and automated PWD work-order dispatches.

---

## 📂 Repository Layout

```
.
├── docker-compose.yml              # 🐳 Multi-Arch PostgreSQL + PostGIS + Redis Stack
├── requirements.txt                # 📦 Complete Python Dependencies
├── LICENSE                         # ⚖️ MIT License
├── README.md                       # 📖 Root Architecture Documentation
├── CONTRIBUTING.md                 # 🤝 Team Git Branching Strategy & Workflow
├── .gitignore
│
├── vigilance-prototype/            # 🚀 End-to-End Working Prototype
│   ├── start_demo.sh               # ⚡ One-click Cross-Platform Launcher
│   ├── README.md
│   │
│   ├── edge/                       # 🧠 Edge AI Detection & Telemetry Engine
│   │   ├── detector.py             # ONNX INT8 / PyTorch / Simulated Perception Engine
│   │   ├── telemetry_publisher.py  # GPS-tagged Telemetry Streamer
│   │   ├── simulate_fleet.py       # 5-Bus Concurrent Fleet Simulation
│   │   ├── export_onnx.py          # INT8 Quantization & Export Pipeline
│   │   ├── benchmark.py            # Hardware Benchmark Suite
│   │   ├── BENCHMARKS.md           # Measured Hardware Benchmark Report
│   │   └── models/                 # Model Checkpoints (road_damage_yolov8n_int8.onnx)
│   │
│   ├── backend/                    # ⚙️ Core Backend & Spatial Intelligence
│   │   ├── main.py                 # FastAPI REST API & WebSocket Server
│   │   ├── database.py             # Dual-Mode PostGIS / SQLite Spatial DBSCAN
│   │   ├── poi_data.py             # Chennai Arterial Hierarchy & POI Proximity Engine
│   │   ├── celery_app.py           # Celery Broker Configuration
│   │   ├── tasks.py                # Asynchronous Deduplication Worker
│   │   ├── seed_data.py            # Chennai Transit Dataset Seeder
│   │   └── init_postgis.sql        # PostGIS Extension Setup
│   │
│   └── dashboard-next/             # 🌐 Next.js 14 WebGIS Municipal Command Center
│       ├── src/app/page.tsx        # Live Dashboard with WebSocket, Metrics & Charts
│       ├── src/components/         # WebGISMap (MapLibre GL Dark Vector Tiles)
│       ├── .env.example
│       └── package.json
│
├── training/                       # 🚗 RDD2022 Dataset Training Suite
│   ├── train_road_damage.py        # YOLOv8-Nano Fine-Tuning Pipeline
│   ├── data/rdd2022.yaml           # 4-Class Road Damage Dataset Config
│   └── README.md                   # Training & Download Guide
│
├── presentations/                  # 📊 Official Presentation Decks
│   ├── VIGILANCE_SIH2026_BEL_Refreshed.pptx   # ⭐ Master Canonical Deck (BEL / SIH26124)
│   └── archive/                    # Historical iterations & draft backups
│
├── images/                         # 🖼️ High-Res Presentation Assets
│   ├── bus_camera_setup.jpg        # Edge AI dashcam unit
│   ├── gis_dashboard_heatmap.jpg   # WebGIS command center map
│   ├── indian_road_potholes.jpg    # Road distress hazard
│   └── road_before_after.jpg       # AI proof-of-work repair verification
│
└── docs/                           # 📚 Problem Statement & Pitch Guidelines
    ├── PRESENTATION_SCRIPT.md      # 6-7 Minute Pitch Script & Judge Q&A Prep
    ├── SIH2026_Official_Problem_Statements.md
    └── SIH2026_Official_Guidelines.pdf
```

---

## ⚡ Quickstart: Running the Working Prototype

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the Prototype (One-Click)
```bash
cd vigilance-prototype
./start_demo.sh
```

* 🌐 **GIS Dashboard:** `http://localhost:3000`
* 📚 **Interactive REST API Docs:** `http://localhost:8000/docs`

---

## 👥 Team VIGILANCE — SRM Institute of Science and Technology

| Name | Role | Department | Registration No. | Email |
| :--- | :--- | :--- | :--- | :--- |
| **Sanjeev Aryan** | Team Leader & Full Stack | CINTEL | RA2511047010030 | sa8129@srmist.edu.in |
| **Parth Jaina** | Edge AI & Computer Vision | CINTEL | RA2511047010069 | pj2752@srmist.edu.in |
| **Dhiti Mahajan** | Data Science & Geospatial Analytics | DSBS | RA2511056010060 | dm5223@srmist.edu.in |
| **Shubh Garg** | Backend Architecture & IoT | CINTEL | RA2511047010023 | sg8735@srmist.edu.in |
| **Prakhar Sharma** | Frontend & WebGIS Engineering | C-TECH | RA2511003010764 | ps1158@srmist.edu.in |
| **Navdeep Rathe** | Systems Integration & Testing | C-TECH | RA2511003010177 | nr8188@srmist.edu.in |
| **Dr. Pavithra L** | Faculty Mentor | CINTEL | — | pavithrl3@srmist.edu.in |
| **Dr. Kishore Anthuvan Sahayaraj** | Industry Mentor | — | — | kishorea1@srmist.edu.in |
