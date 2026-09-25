# 🏆 PROJECT VIGILANCE: ROADMAP TO 10/10 (SIH 2026 INTERNAL ED.)
> **Target:** Smart India Hackathon 2026 — Problem Statement SIH26124 (Bharat Electronics Limited)  
> **Repository:** `SanjeevAryanUni/Vigilance`  
> **Team Structure:** 4 Core Developers (Sanjeev + 3 Teammates)  
> **Current Audit Score:** **8.5 / 10**  
> **Target Score:** **10 / 10 (Undisputed National Winning Standard)**

---

## 📌 INSTRUCTIONS FOR CLAUDE
You are an elite AI hackathon coach and Principal Systems Architect.  
Analyze this entire document and break it down into **4 individual, highly detailed, step-by-step implementation plans** (one for **Sanjeev**, one for **Teammate 1**, one for **Teammate 2**, and one for **Teammate 3**).

Each person's plan must:
1. Specify **exact file paths** they own (prevent merge conflicts).
2. Provide **drop-in code snippets**, dependencies, and CLI commands.
3. Be completely self-contained so that a teammate can paste their plan into their own IDE/agent and execute without asking questions.
4. Directly tackle the **UI/UX visual redesign** because our current frontend looks rough and needs an elite, high-tech command center aesthetic.

---

## 1. WHERE WE CURRENTLY STAND (THE AUDIT)

### ✅ What is Genuinely Built and Working (Score: 8.5/10)
1. **Edge AI Models (INT8 Quantized & Deployed):**
   - `road_damage_yolov8n_int8.onnx` (3.2 MB, fine-tuned on 7,706 RDD2022 India images, mAP50 = 39.89%, Precision = 54.3%).
   - `plate_detector.onnx` (12.2 MB, Indian license plate localizer + EasyOCR/Tesseract).
   - `yolov8n_coco.onnx` (12.8 MB, vehicle counting + pedestrian detection).
   - All 3 models exist in both `edge/models/` and `dashboard-next/public/models/`.
2. **PWA & In-Browser Inference:**
   - Next.js PWA with `@ducanh2912/next-pwa`, `public/manifest.json`, `sw.js`, and mobile icons.
   - WebAssembly client-side inference (`yoloOnnxWeb.ts`, `trafficOnnxWeb.ts`, `anprWeb.ts`).
   - Real accelerometer vibration frame gating (`DeviceMotionEvent` above $3.5\text{ m/s}^2$ threshold) in `/capture`.
3. **Spatial Database & Backend:**
   - FastAPI backend (20+ endpoints) with WebSockets connection manager.
   - Supabase PostgreSQL 17 + PostGIS 3.3 in Mumbai (`ap-south-1`).
   - PostGIS metric clustering (`ST_ClusterDBSCAN` with 15m radius) + Scikit-Learn Haversine fallback.
   - IRC-standard Road Priority Index (RPI) calculation ($RPI = 0.40S + 0.25D + 0.20R + 0.15P$).
   - FHWA Congestion Index ($CI = 1 - v/v_{freeflow}$) and Origin-Destination mobility matrix.
4. **IoT & Testing:**
   - Real MQTT telemetry (`paho-mqtt` v2) + background subscriber `mqtt_listener.py`.
   - **46 automated tests passing in 2.08s** across all backend and edge layers.

---

## 2. THE CRITICAL GAPS TO HIT 10/10

To make the judges (BEL officials and senior professors) award a **10/10**, we must resolve these 5 specific gaps:

### 🔴 GAP 1: Frontend UI/UX Needs an Elite Visual Overhaul
- **The Problem:** The current Next.js frontend is functionally rich but **visually clunky, uneven, and looks like a student hackathon theme**. It does not look like a ₹50 Crore Smart City Command Center.
- **What is Needed:**
  - **Aesthetic:** Dark-mode "Mission Control / Command Center" design (inspired by Palantir / Tesla Fleet / Vercel design standards).
  - **Glassmorphism & Depth:** Backdrop-blur cards (`bg-slate-900/80 backdrop-blur-md border border-slate-800`), neon status indicators, and clean typography (`Geist` or `JetBrains Mono` for telemetry).
  - **Map Overhaul:** Polished MapLibre GL styling (dark navigation tiles, pulsating heatmaps, animated cluster pins, custom SVG icons for potholes, cracks, and buses).
  - **Real-Time Visual Polish:** When a phone detects a pothole, the dashboard map should trigger a smooth radar-ping ripple animation and a subtle audio chime.

### 🔴 GAP 2: Government / PWD Deliverable (Administrative Utility)
- **The Problem:** Government judges always ask: *"What does the Chief Engineer or Municipal Commissioner actually print on Monday morning?"* Right now we only show a map.
- **What is Needed:**
  - 1-click **"Export PWD Municipal Audit Report"** (`/api/reports/pwd-summary` in PDF/CSV).
  - Breakdown by Greater Chennai Corporation zones (Zone 12 - Alandur, Zone 9 - Teynampet, etc.).
  - PWD Contractor SLA monitoring (48-hour deadline countdown, breached vs active).
  - Automated repair budget estimates based on Indian Road Congress (IRC) rates ($₹4,500/\text{m}^2$ for mastic asphalt D40 potholes).

### 🔴 GAP 3: Edge AI Hardware & Green Compute Proof
- **The Problem:** PPT pitches sub-₹3,000 edge hardware and low-power IoT, but the dashboard doesn't visually prove this claim.
- **What is Needed:**
  - An **"Edge AI Hardware & Bandwidth Cockpit"** widget on the dashboard:
    - **Model Compression:** INT8 3.2 MB vs FP32 12.2 MB (**72.6% compression**).
    - **Inference Speed:** 28.4 ms (INT8) vs 64.2 ms (FP32) $\rightarrow$ **2.26× Speedup**.
    - **Bandwidth Reduction:** Streaming 200-byte MQTT packets vs 5 Mbps raw 1080p video stream = **99.8% Cellular Bandwidth Saved**.
    - **Accelerometer Vibration Gauge:** Real-time G-force meter showing bump threshold vs idle state.

### 🔴 GAP 4: Live Dashcam Video Stream Feeder
- **The Problem:** Judges will ask: *"Can your computer vision process real video footage on the fly?"*
- **What is Needed:**
  - A standalone script `edge/stream_video.py` that plays a real road video file (`assets/demo_samples/chennai_road.mp4`), runs `detector.py` + `traffic_detector.py` + `anpr_detector.py` frame by frame, and renders a live OpenCV window / web feed with colored bounding boxes (Red = Potholes, Blue = Vehicles, Green = License Plates).

### 🔴 GAP 5: Multi-City Generalizability
- **The Problem:** Currently, roads and POIs are hardcoded to Chennai. A judge will say: *"This is just hardcoded for Chennai; how does BEL deploy this in Bangalore or Delhi?"*
- **What is Needed:**
  - Multi-city JSON configuration in `poi_data.py` with support for **Chennai**, **Bangalore**, and **Delhi**.
  - A clean dropdown in the dashboard header allowing live switching of the active city.

---

## 3. THE 4-PERSON DIVISION OF RESPONSIBILITY

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TEAM VIGILANCE WORK DIVISION MAP                     │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Track               │ Owner            │ Primary Responsibilities      │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 1. Core & Gov API   │ Sanjeev          │ PWD Reports, City Config, DB  │
│ 2. UI/UX & Cockpit  │ Teammate 1       │ Frontend Redesign, Cockpit    │
│ 3. Video & ANPR     │ Teammate 2       │ Video Feeder, Multi-Cam View  │
│ 4. Media & Pitch    │ Teammate 3       │ Test Assets, Backup Video, PPT│
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

### 👤 TRACK 1: SANJEEV (Core Systems, Municipal Report & Database Optimization)
* **Goal:** Build the municipal government deliverables and harden the backend.
* **Files Owned:**
  - `vigilance-prototype/backend/main.py`
  - `vigilance-prototype/backend/poi_data.py`
  - `vigilance-prototype/backend/pdf_report.py` (NEW)
  - `vigilance-prototype/backend/city_config.json` (NEW)
* **Key Tasks:**
  1. Build `/api/reports/pwd-summary` (HTML/PDF & CSV export) calculating budget by road area, grouping by municipal zones, and listing contractor SLAs.
  2. Refactor `poi_data.py` into a dynamic multi-city loader (`city_config.json`) supporting Chennai (Anna Salai, GST Road), Bangalore (Silk Board, ORR), and Delhi (Ring Road, Connaught Place).
  3. Update `_update_fleet_position()` in `main.py` with upsert logic to prevent unbounded table growth.
  4. Document training metrics in `METRICS.md` (mAP50 = 39.89%, Precision = 54.3%, Recall = 37.4%).

---

### 👤 TRACK 2: TEAMMATE 1 (UI/UX Redesign & Edge Hardware Cockpit)
* **Goal:** Transform the dashboard into an elite, stunning "Smart City Mission Control" and build the Edge AI Cockpit.
* **Files Owned:**
  - `vigilance-prototype/dashboard-next/src/app/`
  - `vigilance-prototype/dashboard-next/src/components/` (Header, WebGISMap, EdgeCockpit3D, etc.)
  - `vigilance-prototype/dashboard-next/src/components/HardwareCockpit.tsx` (NEW)
* **Key Tasks:**
  1. **Visual Overhaul:** Apply a modern Cyberpunk/Command Center aesthetic:
     - Matte dark zinc/slate backgrounds (`#090d16`), subtle glassmorphism borders (`border-cyan-500/20`), glowing pill badges for severities.
     - Custom MapLibre styling: Dark matter tiles with pulsing green/amber/red halos for RPI clusters.
  2. **Edge AI Hardware Cockpit (`HardwareCockpit.tsx`):**
     - Add interactive cards for: Model Size (3.2 MB INT8 vs 12.2 MB FP32), Mean Latency (28.4ms), 99.8% Bandwidth Savings metric, and G-force vibration gauge.
  3. **Audio & Haptic Feedback on `/capture`:**
     - Add synthesized Web Audio chime and `navigator.vibrate` when a road defect or license plate is detected.
  4. **City Selector Dropdown:**
     - Add an interactive selector in the Header: `[ Chennai (Active) | Bangalore | Delhi ]`.

---

### 👤 TRACK 3: TEAMMATE 2 (Live Dashcam Video Feeder & Multi-Camera Pipeline)
* **Goal:** Enable live, real-time video processing from actual road footage to prove the AI isn't simulated.
* **Files Owned:**
  - `vigilance-prototype/edge/stream_video.py` (NEW)
  - `vigilance-prototype/edge/video_server.py` (NEW)
  - `vigilance-prototype/edge/detector.py`
  - `vigilance-prototype/edge/traffic_detector.py`
  - `vigilance-prototype/edge/anpr_detector.py`
* **Key Tasks:**
  1. Build `stream_video.py`:
     - Reads any MP4 dashcam video file.
     - Pipelines all 3 models: `RoadDamageDetector` + `TrafficDetector` + `ANPRDetector`.
     - Annotates frames with colored bounding boxes, class labels, and confidence bars.
     - Outputs to an OpenCV live window AND an MJPEG HTTP stream on `http://localhost:8001/video_feed`.
  2. Create a "Multi-Camera Grid" view in the Next.js dashboard embedding this live stream alongside vehicle telemetry.

---

### 👤 TRACK 4: TEAMMATE 3 (Demo Assets, Fail-Safe Video & Presentation Alignment)
* **Goal:** Prepare rock-solid visual proof, fail-safe recordings, and align the slides with the real codebase.
* **Files Owned:**
  - `assets/demo_samples/` (NEW directory)
  - `SIH26_TEAM_VIGILANCE.pptx`
  - `DEMO_SCRIPT.md` (NEW)
* **Key Tasks:**
  1. **Curate Test Media:** Download 3 high-quality 10-15s clips of Indian road conditions (potholes, city traffic, clear vehicle plates) into `assets/demo_samples/`.
  2. **Printable / Display Test Cards:** Prepare 3 crisp photos of potholes and Indian license plates so the team can demonstrate mobile camera detection live in front of the judges.
  3. **The 90-Second Fail-Safe Video:** Record a high-definition screen recording of the mobile capture syncing with the dashboard map via WebSockets (the ultimate safety net if venue Wi-Fi fails).
  4. **Slide Surgery:** Update `SIH26_TEAM_VIGILANCE.pptx` to replace outdated claims with real metrics (RDD2022 dataset, INT8 quantization, PostGIS 3.3, OASIS MQTT v2, FHWA Congestion Index).

---

## 4. WHAT WE EXPECT CLAUDE TO OUTPUT
When you paste this file to Claude, request:
> *"Generate 4 distinct, production-grade, highly actionable markdown plans (one for Sanjeev, Teammate 1, Teammate 2, and Teammate 3). Include exact code, schemas, UI components with Tailwind CSS classes, and bash commands so each teammate can immediately begin coding."*
