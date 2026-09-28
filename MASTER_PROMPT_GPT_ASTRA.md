# 🌌 MISSION CONTROL PROMPT: TRANSFORM PROJECT VIGILANCE INTO A WORLD-CLASS TIER-1 DEFENSE & URBAN INTELLIGENCE PLATFORM (10/10)

> **TARGET AGENT:** GPT-6 Astra / Claude Opus 4.6 / Advanced Autonomous Reasoning Agent  
> **OPERATIONAL MODE:** Extra High Compute / Autonomous Full-Stack Execution Mode  
> **MISSION:** Completely overhaul, refactor, and elevate **Project VIGILANCE** (SIH26124 — Bharat Electronics Limited) from an 8.0 prototype into an undisputed, best-in-class, enterprise-grade AI Urban Intelligence & Defense-grade Command Platform that wins Smart India Hackathon 2026 with a perfect 10/10 score.  
> **CORE DIRECTIVE:** You are not an advisory assistant; you are an autonomous principal software architect and staff engineer. You will **search the web, conduct deep technical research, formulate an explicit execution plan, write complete production code (zero pseudocode, zero placeholders), run test verification, commit to Git, and sync with GitHub and Supabase**.

---

## 🏛️ PART 1: STRATEGIC CONTEXT & THE HACKATHON STAKES

* **Event:** Smart India Hackathon 2026 (SIH 2026) — Grand Finale.
* **Problem Statement:** SIH26124 by **Bharat Electronics Limited (BEL)** (Ministry of Defence, Govt. of India).
* **Domain:** AI-Powered Edge Video Analytics, Automated Road Distress Detection, Municipal Infrastructure Audit & Smart City Defense Command.
* **Repository:** Monorepo at `/Users/sanjeev/Documents/SIH/` (Commit: `eff46f2` on branch `main`).
* **Active Remotes:**
  * `origin`: `git@github.com:SanjeevAryanUni/Vigilance.git` (Primary development repo)
  * `vercel-target`: `git@github.com:SanjeevAryanUni/vigilance-sih.git` (Production Vercel deployment sync)
* **Production Deployment:** `https://vigilance-sih.vercel.app`
* **Live Cloud Database:** Supabase PostgreSQL 17 + PostGIS 3.3 in Mumbai (`ap-south-1`):
  * Project Ref: `sqhojwzbbalrhqpgetwy`
  * Connection String: `postgresql://postgres.sqhojwzbbalrhqpgetwy:taSpev-xyjwor-sepje4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

### What The Judges Want (And Why Typical Hackathon Projects Fail)
Judges from Bharat Electronics Limited (BEL) and municipal corporations (e.g. Greater Chennai Corporation / PWD) evaluate prototypes ruthlessly:
1. **Visual Gravitas (35%):** If the UI looks like an amateur college dashboard with cookie-cutter cards, white borders, and generic Bootstrap/Tailwind tables, it gets graded as a student project. It must look like a **₹50-Crore Palantir Gotham / Tesla Fleet Command Center** — dark void background, obsidian glassmorphism, crisp monospace telemetry, animated SVG radar halos, and interactive vector GIS.
2. **Technical Authenticity & Data Provenance (35%):** The moment an expert judge clicks a button and sees a hardcoded mock or a random setInterval loop fabricating defect markers, the team is disqualified. Live data must be clearly badged as `[LIVE CLOUD STREAM]`, and cached/demo data must be transparently tagged as `[HISTORICAL BENCHMARK]`.
3. **Government & Defense Deliverables (15%):** Real administrative utility — automated PDF/CSV municipal audit generation based on Indian Road Congress (IRC) standard costing (IRC SP:20 / IRC 82-2015), contractor SLA enforcement, and sovereign integrations (ISRO Bhuvan satellite tiles, MoRTH API Setu, data.gov.in).
4. **Edge Computing Feasibility (15%):** Real INT8 quantized models, cellular bandwidth savings proofs (99.9% saved vs video streaming), and realistic hardware benchmarks (Apple Silicon M5 host baseline, Raspberry Pi Zero 2W target spec, Android smartphone zero-procurement option).

---

## 🔎 PART 2: AUTONOMOUS RESEARCH & PLANNING PROTOCOL (DO THIS FIRST)

Before writing or modifying any code, you must execute the following research and discovery phases:

### Phase 2.1: Inspect the Codebase & Technical Audit Pack
Read and internalize the findings already present in your workspace:
1. Read `docs/audits/2026-09-28/README.md` and `docs/audits/2026-09-28/VIGILANCE_Audit.md` (the comprehensive end-to-end technical audit).
2. Read `docs/audits/2026-09-28/SIH_Finale_Prep/Jury_Defense_90.md` (the 90 jury challenge questions).
3. Read `docs/audits/2026-09-28/SIH_Finale_Prep/Demo_Runbook.md` (the 5-minute winning presentation flow).
4. Read `vigilance-prototype/backend/main.py`, `database.py`, `models.py`, `dbscan_dedup.py`, `rpi_calculator.py`, and `pdf_report.py`.
5. Read `vigilance-prototype/dashboard-next/src/app/page.tsx`, `capture/page.tsx`, `analytics/page.tsx`, `fleet/page.tsx`, and `work-orders/page.tsx`.
6. Read `vigilance-prototype/edge/BENCHMARKS.md` and `training/runs/rdd_yolov8n/results.csv`.

### Phase 2.2: Conduct Targeted Web Research
Use your web search tools to actively research and ground your implementation:
1. **Palantir Gotham & Dark Command Center UI Design (2025/2026):** Search for high-density operational telemetry dashboards, obsidian glassmorphism CSS tokens, dark mode MapLibre vector styling, and micro-interactions.
2. **MapLibre GL JS Dark Vector Layering:** Search for MapLibre GL styling patterns for glowing polyline corridors, custom HTML radar pulse markers, and free Carto Dark Matter raster/vector configurations.
3. **Indian Road Congress (IRC) Maintenance Standards:** Search for IRC SP:20 and IRC 82-2015 repair rate norms for bituminous pavements (Mastic asphalt patching rates per m², slurry seal surfacing, crack bitumen routing).
4. **ISRO Bhuvan WMS Capabilities:** Search for Bhuvan Web Map Service endpoints for high-resolution satellite imagery over Indian metropolitan regions.
5. **Web Audio Synthesizer Chimes:** Search for zero-dependency Web Audio API oscillator patterns for tactical alert chimes without external MP3 assets.

### Phase 2.3: Formulate a Structured Implementation Plan
Output an explicit step-by-step roadmap breaking down your refactoring into sequential phases with verifiable milestones.

---

## 🗺️ PART 3: CURRENT VERIFIED CODEBASE STATE (GROUND TRUTH)

You are operating on a verified stack with **63/63 passing backend tests** and a **zero-error Next.js 14 production build**:

```
VIGILANCE PLATFORM INVENTORY
├── vigilance-prototype/
│   ├── backend/                     # FastAPI + PostgreSQL 17 / PostGIS 3.3 (Supabase Mumbai)
│   │   ├── main.py          (953L) # 29 HTTP endpoints + 1 WebSocket (30 total), CORS, API Key Auth, Rate Limiting
│   │   ├── database.py      (107L) # SQLAlchemy session pooler, PostGIS auto-migration
│   │   ├── models.py        (147L) # 5 ORM tables: detections, clusters, traffic_observations, incident_reports, fleet_positions
│   │   ├── dbscan_dedup.py  (171L) # 3-tier spatial clustering: PostGIS ST_ClusterDBSCAN → Sklearn Haversine → Python Leader
│   │   ├── rpi_calculator.py (92L) # IRC Road Priority Index: RPI = 0.40*S + 0.25*D + 0.20*R + 0.15*P
│   │   ├── poi_data.py      (163L) # Multi-city POIs, road hierarchy, contractor database
│   │   ├── congestion.py    (141L) # FHWA Congestion Index (CI = 1 - v/v_freeflow), TTI, heatmap coordinates
│   │   ├── od_analysis.py   (107L) # Origin-Destination transit transition matrix (9 multimodal hubs)
│   │   ├── delay_estimator.py(83L) # Route bottleneck & delay estimation
│   │   ├── pdf_report.py    (281L) # fpdf2 municipal maintenance audit PDF/CSV/JSON generator
│   │   ├── api_setu_client.py(115L)# MoRTH Parivahan vehicle registration lookup
│   │   ├── data_gov_client.py (65L)# Open Government Data road statistics client
│   │   ├── city_config.json (10KB) # Active configurations for Chennai, Bengaluru, New Delhi
│   │   ├── model_metadata.json(41L)# Sovereign AIKosh/AIRAWAT AI architecture registry
│   │   ├── seed_data.py     (225L) # Demo seeder (transparently marked with source="seed")
│   │   └── requirements.txt  (19 deps) # fastapi, sqlalchemy, geoalchemy2, paho-mqtt, fpdf2, slowapi, etc.
│   │
│   ├── dashboard-next/              # Next.js 14.2.35 App Router, Tailwind CSS, MapLibre GL 6.6, Three.js
│   │   ├── src/app/
│   │   │   ├── page.tsx      (762L) # Main Command Center HUD
│   │   │   ├── capture/page.tsx (1006L) # Mobile Windshield Dashcam PWA (ONNX Web + Accelerometer 3.5 m/s² shockwave)
│   │   │   ├── analytics/page.tsx (295L) # Congestion heatmaps, OD matrices, corridor distress
│   │   │   ├── fleet/page.tsx (373L) # Transit fleet real-time tracking & heartbeats
│   │   │   ├── work-orders/page.tsx (336L) # Municipal work orders, SLA countdown & contractor assignment
│   │   │   └── layout.tsx           # Dark theme root, Inter + JetBrains Mono typography
│   │   ├── src/components/          # 30 modular UI components (WebGISMap, HardwareCockpit, VideoCameraGrid, etc.)
│   │   ├── src/lib/                 # api.ts, yoloOnnxWeb.ts, trafficOnnxWeb.ts, anprWeb.ts, constants.ts
│   │   └── public/models/           # road_damage_yolov8n_int8.onnx (3.2MB), plate_detector.onnx, yolov8n_coco.onnx
│   │
│   └── edge/                        # Python Edge IoT & Computer Vision Nodes (13 files, 2,356 LOC)
│       ├── detector.py       (249L) # 3-tier fallback: ONNX INT8 → ONNX FP32 → PyTorch → Simulator
│       ├── traffic_detector.py (161L) # COCO vehicle & pedestrian density engine
│       ├── anpr_detector.py  (129L) # License plate detector + EasyOCR + MoRTH regex validation
│       ├── incident_detector.py (81L) # Multi-modal fusion (speeding + pedestrians + road damage)
│       ├── mqtt_publisher.py (162L) # Real paho-mqtt v2 telemetry node
│       ├── stream_video.py   (358L) # Full dashcam video processor with multi-model inference pipeline
│       ├── video_server.py   (445L) # Flask MJPEG streaming server on :8001
│       └── BENCHMARKS.md            # Validated edge benchmarks (41.7ms INT8 latency, 3.2MB footprint)
└── training/                        # YOLOv8n fine-tuning on 7,706 RDD2022 India distress images (mAP50: 39.89%)
```

---

## 🎨 PART 4: THE "MISSION CONTROL" REDESIGN SPECIFICATION

Transform the frontend from a student hackathon page into an elite **Defense & Municipal Command Center**:

### 4.1 Design System Tokens & Aesthetics
1. **Background:** Deep Void Canvas (`#06080F` to `#0B0F19` linear gradient with subtle 3% radial noise overlay). Never use standard flat `#111827` or `#1f2937`.
2. **Glassmorphism Panels:** Obsidian Glass cards:
   ```css
   background: rgba(11, 15, 25, 0.65);
   backdrop-filter: blur(16px);
   -webkit-backdrop-filter: blur(16px);
   border: 1px solid rgba(30, 41, 59, 0.6);
   box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
   ```
3. **Accent Neon Glows:**
   * **Cyber Cyan (`#00F2FE` / `#06B6D4`):** Primary system telemetry, active vehicle beacons, live connection indicators.
   * **Neon Emerald (`#10B981`):** Resolved road defects, low congestion (Free Flow), verified vehicle registrations.
   * **Warning Amber (`#F59E0B`):** Moderate road distress (`D20`), vibration gate threshold alerts, 48h SLA warnings.
   * **Laser Red (`#EF4444`):** Severe potholes (`D40`), active traffic incidents, breached contractor SLAs.
4. **Typography:**
   * Titles & Navigation: `Inter` or `Geist Sans` with crisp kerning (`tracking-tight font-semibold`).
   * Numerical Data, Coordinates, Timestamps, Speeds, License Plates: `font-mono` (`JetBrains Mono` / `ui-monospace`).
   * Animated Numbers: Utilize `<RollingNumber />` for smooth odometer transitions whenever counts update.

### 4.2 Module-by-Module Overhaul Requirements

#### Module 1: Main Command Center HUD (`src/app/page.tsx` & components)
* **Top Telemetry HUD Bar:** Replace disparate metric cards with an integrated, high-density Mission Control HUD:
  * Total Detections Logged (live rolling odometer).
  * Active Distress Clusters (PostGIS deduplicated count).
  * Mean Fleet Speed & Network Congestion Index (with live mini sparkline).
  * Critical Unrepaired Defects / SLA Breached (pulsing red laser badge).
  * Data Provenance Pill: `[● LIVE POSTGIS STREAM]` (when backend connected) vs `[○ HISTORICAL BENCHMARK]` (when offline).
* **Split-Screen Command Layout:**
  * **Left (65-70%):** Full-height WebGIS MapLibre Canvas with custom dark vector Carto tiles (`dark-matter-gl-style`). Layer toggle chips for Potholes, Cracks, Heatmaps, Transit Fleet, Congestion Corridors, and ISRO Bhuvan satellite imagery.
  * **Right (30-35%):** Tabbed Real-Time Intelligence Stream:
    * **Tab 1: Live Distress Feed** — Defect thumbnail, class badge (`D40 Pothole`, `D20 Alligator`), road segment, GPS coordinates, timestamp.
    * **Tab 2: ANPR & Incident Radar** — License plate, offense classification, vehicle speed, MoRTH RC verification badge.
    * **Tab 3: Edge AI Cockpit** — Quantization speedup, memory footprint reduction, cellular bandwidth savings counter.

#### Module 2: Mobile Dashcam Windshield HUD (`src/app/capture/page.tsx`)
* **Futuristic In-Vehicle HUD Viewport:**
  * Fullscreen camera feed with neon target reticle and active scanning crosshairs.
  * Real-time bounding boxes drawn directly on canvas:
    * Red = Road Distress (`D40` Pothole, `D20` Alligator Crack).
    * Cyan = Vehicle Registration Plates.
    * Yellow = Pedestrian & Sensitive School Zone warnings.
* **G-Force Vibration Shockwave Meter:**
  * Visual dynamic accelerometer meter at the bottom displaying $X/Y/Z$ G-forces.
  * When dynamic shock exceeds `3.5 m/s²`, trigger a glowing amber screen border and tactile haptic vibration (`navigator.vibrate([70, 40, 70])`).
* **Offline IndexedDB Resilience:**
  * Automatically queue detections in IndexedDB if cellular signal drops.
  * Show a discrete "📴 X observations queued offline" indicator.
  * Auto-flush and POST to `/api/detections` with batch synchronization the moment network restores.

#### Module 3: Edge AI Hardware & Green Compute Cockpit (`src/components/HardwareCockpit.tsx`)
Display proof-backed, verifiable edge benchmarks:
* **INT8 Quantization Advantage:**
  * Latency: `41.74 ms` INT8 vs `~96 ms` FP32 $\rightarrow$ **2.3× Speedup**.
  * Model Size: `3.20 MB` vs `11.70 MB` $\rightarrow$ **72.6% Memory Reduction**.
* **Cellular Bandwidth Savings Counter:**
  * Show calculated comparison: Raw 1080p video streaming at 5 Mbps vs VIGILANCE's 200-byte MQTT JSON telemetry:
  * `1 Hour Transit: Video Stream 2.25 GB | VIGILANCE Telemetry 36 KB | 99.998% Bandwidth Saved`.
* **Hardware BOM Specifications (BEL-Ready):**
  * Host Dev: Apple Silicon M5 (24 FPS real).
  * Production Target: Raspberry Pi Zero 2W (Sub-₹3,000 BOM, ~2.5 FPS = 3.3m spatial sampling at 30 km/h).
  * Zero-Procurement Option: Android Smartphone via Termux (~12 FPS, 85ms inference).

#### Module 4: Government & Municipal PWD Audit Deliverable (`src/app/work-orders/page.tsx` + `backend/pdf_report.py`)
* **Municipal Audit Export Button:**
  * Prominent glowing export action in `Header.tsx` supporting PDF, CSV, and JSON outputs.
* **IRC-Standard Maintenance Costing:**
  * Calculate repair estimates based on Indian Road Congress (IRC) rates:
    * `D40 Pothole (Mastic Asphalt Patching): ₹4,500 / m²`
    * `D20 Alligator Crack (Slurry Seal Resurfacing): ₹1,800 / m²`
    * `D00/D10 Crack (Polymer Bitumen Sealing): ₹650 / m`
* **Contractor SLA Accountability:**
  * SLA status badges: `Active (Within 48h)` vs `Breached (Overdue)`.
  * Grouping by municipal zones (e.g. GCC Zone 8 Anna Nagar, Zone 9 Teynampet, Zone 12 Alandur).

#### Module 5: Multi-City Configuration Engine
* Support instant switching between **Chennai**, **Bengaluru**, and **New Delhi** using `backend/city_config.json`.
* Header city dropdown triggers a smooth camera flyTo transition (`map.flyTo({ center, zoom: 12 })`), recalculates active corridors, and filters municipal work orders.

#### Module 6: Live Dashcam Video Inference Feeder (`edge/stream_video.py` + `VideoCameraGrid.tsx`)
* Embed the MJPEG annotated stream from `http://localhost:8001/video_feed` into the dashboard.
* Display real-time inference FPS, active bounding boxes, and camera stream health.

---

## ⚡ PART 5: CRITICAL BUG FIXES & DATA INTEGRITY DIRECTIVES

From the technical audit (`docs/audits/2026-09-28/VIGILANCE_Audit.md`), you must ensure these defects are permanently resolved:

1. **Eliminate Misleading Mock Presentation:**
   * In `useDashboardData.ts`, when the backend is healthy, all statistics, clusters, and detections MUST originate from the real Supabase PostgreSQL/PostGIS database.
   * If the backend is unreachable, the dashboard must display a clear, amber diagnostic warning banner: `⚠ Operating in Offline Demonstration Mode — Displaying Seed Reference Data`.
2. **Fix Status Continuity Across Deduplication:**
   * When `trigger_deduplication()` runs in `dbscan_dedup.py`, ensure existing cluster statuses (`in_progress`, `resolved`) and assigned contractors are strictly preserved across reclustering runs.
3. **Hardened Input Validation:**
   * Ensure `main.py` rejects invalid defect types or severities via Pydantic validators.
4. **WebSocket Token Authentication:**
   * Ensure `/ws?token=...` uses dynamic `get_api_key()` to prevent runtime `NameError`.
5. **DBSCAN Minimum Samples:**
   * Ensure single isolated detections are classified as unverified defects, while spatial clusters require $\ge 2$ observations within 15 meters to become verified municipal work orders.

---

## 🚀 PART 6: GIT, SUPABASE & VERCEL SYNCHRONIZATION DIRECTIVE

As an autonomous agent, you must manage the codebase lifecycle cleanly:

### 6.1 Git Operations
1. After completing each logical module, stage files and commit with clean, conventional commit messages:
   * `feat(ui): implement Palantir-inspired dark command center HUD`
   * `feat(capture): add neon reticle HUD, shockwave vibration and offline queue`
   * `feat(reports): enhance PWD municipal audit generator with IRC repair costing`
2. Push commits to `origin main`:
   ```bash
   git push origin main
   ```
3. Sync `vercel-target`:
   ```bash
   git push vercel-target main
   ```
   *(If direct Vercel credentials or remote push is not accessible in the current execution environment, ensure all commits are cleanly pushed to `origin main` on GitHub so the repository owner can trigger or merge to Vercel).*

### 6.2 Supabase Cloud Database Verification
* Verify connection to the live Supabase PostGIS database:
  ```bash
  DATABASE_URL="postgresql://postgres.sqhojwzbbalrhqpgetwy:taSpev-xyjwor-sepje4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
  ```
* Ensure all tables (`detections`, `clusters`, `traffic_observations`, `incident_reports`, `fleet_positions`) have valid PostGIS `geom` columns migrated.

### 6.3 Test Verification
Before considering the task complete, run and verify the entire test suite:
```bash
.venv/bin/python -m pytest tests/ vigilance-prototype/backend/test_api.py vigilance-prototype/backend/test_spatial_clustering.py
cd vigilance-prototype/dashboard-next && npm run build
```
**Every single test must pass (100%), and the Next.js build must compile with zero errors.**

---

## 🏁 PART 7: IMMEDIATE EXECUTION SEQUENCE

Begin your autonomous work now following this exact order:

1. **Step 1:** Review `docs/audits/2026-09-28/VIGILANCE_Audit.md` and conduct web research on modern dark glassmorphism command center UI patterns.
2. **Step 2:** Formulate and output your comprehensive architectural refactoring plan.
3. **Step 3:** Overhaul the Next.js Frontend styling (`globals.css`, `page.tsx`, `Header.tsx`, `KPICard.tsx`, `WebGISMap.tsx`).
4. **Step 4:** Refine the Windshield Capture HUD (`capture/page.tsx`) with neon reticle, G-force shockwave, and IndexedDB offline queueing.
5. **Step 5:** Wire up Analytics & Work Orders pages to live API endpoints.
6. **Step 6:** Verify PWD municipal report generator with IRC rates.
7. **Step 7:** Run `pytest` and `npm run build` to verify 100% compliance.
8. **Step 8:** Commit and push all changes to GitHub.

**Do not ask for confirmation at each step. Execute autonomously with full production-grade code.**
