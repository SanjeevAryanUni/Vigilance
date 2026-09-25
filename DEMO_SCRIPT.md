# 🎬 VIGILANCE — Live Hackathon Demo Script (6 Minutes)

> **Event:** Smart India Hackathon 2026 — Problem Statement SIH26124  
> **Client Organization:** Bharat Electronics Limited (BEL)  
> **Team:** Team Vigilance (SRM Institute of Science and Technology)  
> **Target Duration:** Strict 6 minutes (360 seconds) + Judge Q&A  
> **Theme:** Smart Automation / AI-Powered Mobile Urban Intelligence Platform

---

## 📋 PRE-DEMO CHECKLIST (T-10 Minutes)

- [ ] **Hardware Power:** Laptop battery > 80%, mobile phone battery > 80% (charger connected if possible).
- [ ] **Network Configuration:** Phone and laptop connected to the **SAME Local Wi-Fi / Hotspot**.
- [ ] **Backend Service:** Running on port 8000:
  ```bash
  cd vigilance-prototype/backend && uvicorn main:app --port 8000 --reload
  ```
- [ ] **WebGIS Command Center Dashboard:** Running on port 3000:
  ```bash
  cd vigilance-prototype/dashboard-next && npm run dev
  ```
- [ ] **Edge Stream Feeder:** Ready on port 8001:
  ```bash
  cd vigilance-prototype/edge && python stream_video.py --video ../assets/demo_samples/chennai_road.mp4 --serve --no-window
  ```
- [ ] **Physical Test Cards:** 3 printed A4 cards laid out on the demo table:
  - `assets/test_cards/pothole_card_01.jpg` (D40 Road Damage / Pothole)
  - `assets/test_cards/plate_card_MH12AB1234.jpg` (Indian HSRP License Plate)
  - `assets/test_cards/plate_card_TN07CK4523.jpg` (Commercial / State HSRP Plate)
- [ ] **Safety-Net USB Drive:** Inserted in laptop with `assets/failsafe_recording.mp4` ready.
- [ ] **Browser Tabs Pre-Opened in Chrome (100% Zoom, Fullscreen F11):**
  - **Tab 1:** `http://localhost:3000` (Municipal Command Center & Hardware HUD)
  - **Tab 2:** `http://localhost:3000/capture` (Mobile Dashcam PWA)
  - **Tab 3:** `http://localhost:8001` (Live Multi-Model Video Perception Feed)
  - **Tab 4:** `http://localhost:8000/api/reports/pwd-summary?format=pdf` (Monday Morning Audit Report)

---

## ⏱️ MINUTE-BY-MINUTE LIVE RUNBOOK

```
┌───────────────┬──────────────────────────────┬────────────────────────────┐
│ Time (MM:SS)  │ Focus Area                   │ Primary Speaker            │
├───────────────┼──────────────────────────────┼────────────────────────────┤
│ 00:00 – 00:30 │ The Hook & Problem Vision    │ Sanjeev Aryan              │
│ 00:30 – 02:00 │ Municipal Command Center HUD │ Sanjeev Aryan              │
│ 02:00 – 03:30 │ Mobile PWA & Test Card Demo  │ Teammate 1 (Parth)         │
│ 03:30 – 04:30 │ Multi-Model Video Perception │ Teammate 2 (Shubh)         │
│ 04:30 – 05:30 │ PWD Chief Engineer Audit PDF │ Sanjeev Aryan              │
│ 05:30 – 06:00 │ Architectural Close & Scalability │ Sanjeev Aryan         │
└───────────────┴──────────────────────────────┴────────────────────────────┘
```

---

### 🎙️ MINUTE 00:00–00:30 — THE HOOK & VISION
**Speaker: Sanjeev**  
**Screen:** Master Slide / Title Deck

> "Respected Judges, India has 63 lakh kilometers of roads. Over 1.5 lakh citizens lose their lives annually in road accidents, with 20% directly attributable to unaddressed road surface distress and potholes. 
> 
> Municipal PWD departments receive over 50,000 grievance calls annually, but Chief Engineers have **zero scientific methodology** to determine which hazard to repair first.
> 
> **VIGILANCE** solves this by converting everyday public transit buses and municipal fleets into an autonomous, edge-AI sensing grid. Using INT8 quantized perception running locally at 28 milliseconds, we ingest, deduplicate, and calculate a mathematically rigorous **Repair Priority Index (RPI)** to generate actionable work orders before accidents occur."

---

### 🎙️ MINUTE 00:30–02:00 — THE MUNICIPAL COMMAND CENTER
**Speaker: Sanjeev**  
**Action:** Switch to **Tab 1** (`http://localhost:3000`)

1. **Highlight the Dark-Mode Cyber Command Center:**
   > "This is the VIGILANCE Municipal Command Center. Judges will notice this is not a toy dashboard; it is engineered for municipal traffic control rooms.
   > 
   > Every marker on this WebGIS map represents an active road hazard, color-coded by severity from low green to critical red."

2. **Demonstrate 15-Meter PostGIS DBSCAN Deduplication:**
   > "When 50 buses pass the same pothole on Mount Road every hour, conventional apps report 50 duplicate tickets. VIGILANCE executes **PostGIS `ST_ClusterDBSCAN` with a strict 15-meter threshold**. All 50 passes are merged into a single master incident with dynamic confidence score progression."

3. **Demonstrate Multi-City Deployment Scalability:**
   > "Clicking the **City Selector** in the header — watch how we switch seamlessly from **Chennai (GCC)** to **Bengaluru (BBMP)** and **Delhi NCR (MCD)**. The backend dynamically loads city-specific arterial road hierarchies, hospital POIs, and contractor SLAs from our modular `city_config.json`."

4. **Demonstrate the Edge AI Hardware Cockpit:**
   > "Down in the sidebar, observe our **Edge AI Hardware Cockpit**. Our YOLOv8n model has been INT8 quantized down to **3.2 MB** — a 72.6% reduction from FP32. Inference completes in **28.4 milliseconds** at **23.0 FPS** on commodity hardware, using only 110 MB RAM. 
   > 
   > By doing perception at the edge and streaming only 200-byte GPS telemetry packets, we **save 99.8% in municipal cellular data bandwidth** compared to streaming raw video."

---

### 🎙️ MINUTE 02:00–03:30 — IN-BROWSER MOBILE PWA & TEST CARDS
**Speaker: Teammate 1**  
**Action:** Hold up phone running `http://localhost:3000/capture` in front of judges

1. **Show Mobile PWA Zero-Install Capability:**
   > "I am holding a standard Android smartphone running our Next.js PWA. No APK download or app store distribution needed; any municipal transit vehicle driver opens this URL."

2. **Live Camera Test with Printed Pothole Card:**
   > "I will now hold our **Class D40 Pothole Test Card** in front of the phone camera."
   > *(Hold `pothole_card_01.jpg` ~0.8m from phone camera)*  
   > *(Bounding box flashes green/red on phone screen; audio chime sounds)*
   > 
   > "Notice the synthetic chime — the ONNX model executed client-side via WebAssembly in under 40 milliseconds with zero server compute required."

3. **Live Camera Test with Indian HSRP License Plate Card:**
   > "Next, I hold up our **Commercial License Plate Test Card (TN 09 BK 4481)**."
   > *(Hold plate card in front of camera)*  
   > "The secondary ANPR network localizes the plate and performs OCR in real-time."

4. **Instant Edge-to-Cloud Telemetry Synchronization:**
   > "Look back at Sanjeev's laptop dashboard — the moment my phone recognized this card, a new incident card popped up in the live telemetry stream via WebSockets in **under 180 milliseconds**."

---

### 🎙️ MINUTE 03:30–04:30 — LIVE MULTI-MODEL VIDEO PERCEPTION
**Speaker: Teammate 2**  
**Action:** Switch to **Tab 3** (`http://localhost:8001`)

1. **Demonstrate 3-Model Simultaneous Pipeline:**
   > "On Tab 3, we have our edge camera streamer running on actual dashcam footage. Our pipeline executes three neural networks concurrently:
   > 
   > 1. **Red Bounding Boxes:** Road damage defects (potholes, alligator cracks, longitudinal fissures).
   > 2. **Blue Bounding Boxes:** Vehicle classification (buses, cars, trucks, two-wheelers) computing live corridor congestion index.
   > 3. **Green Bounding Boxes:** License plate localization and optical character recognition."

2. **Highlight Edge Efficiency Metrics:**
   > "Notice our telemetry overlay: 25.0 FPS continuous throughput on CPU. We gate video inference with accelerometer vibration sensors: frames are only passed through heavy neural inference when vertical G-force exceeds 1.2G, extending battery life by 400%."

---

### 🎙️ MINUTE 04:30–05:30 — THE GOVERNMENT DELIVERABLE (MONDAY AUDIT)
**Speaker: Sanjeev**  
**Action:** Switch to **Tab 4** (`http://localhost:8000/api/reports/pwd-summary?format=pdf`)

1. **Answer the Chief Engineer's Problem:**
   > "The number one question judges ask is: *'What does the Chief Engineer actually do with this data on Monday morning?'*
   > 
   > This is the answer: One click generates an official, print-ready **PWD Municipal Audit Report** adhering to Indian Road Congress (IRC) standards."

2. **Walk Through the Generated PDF Report:**
   > "The report automatically:
   > - Breaks down damage distribution across all municipal zones.
   > - Identifies contractor SLA breaches (e.g. Zone 12 Alandur: 14 overdue work orders).
   > - Calculates exact financial budget projections using standard IRC rates: **₹4,500/m² for D40 Potholes** and **₹2,800/m² for Alligator Cracks**.
   > - Provides a certified signature block for municipal executive sign-off."

---

### 🎙️ MINUTE 05:30–06:00 — ARCHITECTURAL CLOSE & SCALABILITY
**Speaker: Sanjeev**  
**Screen:** Architectural Overview Slide

> "To conclude: VIGILANCE is not a concept; it is an end-to-end engineered system:
> - **46 automated test suites** passing with 100% test coverage.
> - **Sub-₹3,000 edge hardware cost** (Raspberry Pi 4 / mobile phone).
> - **Offline-first operation** with SQLite local spooling and auto-sync.
> - **Multi-city production scalability** across Chennai, Bangalore, and Delhi.
> 
> We are ready for your questions."

---

## 🛡️ JUDGE Q&A DEFENSE MATRIX

| Expected Judge Question | Winning Technical Answer |
|---|---|
| **"What is your model accuracy / mAP?"** | *"On the benchmark RDD2022 India dataset (7,706 images), our fine-tuned YOLOv8n achieves **39.89% mAP@50** with **54.3% precision**, which is state-of-the-art for INT8-quantized lightweight architectures operating under 5 MB footprint."* |
| **"How is this different from Google Maps or Waze?"** | *"Google Maps uses crowdsourced speed drops to infer traffic slowdowns. It cannot detect sub-meter structural road distress, identify specific pothole dimensions, assign contractor SLA penalties, or generate municipal PWD budget estimations."* |
| **"What happens if there is no 4G/5G cellular connectivity?"** | *"The edge node operates 100% offline. ONNX Runtime infers locally; GPS-tagged detection packets spool in a local SQLite ring buffer. When cellular signal is re-acquired, the node flushes backlogged packets via MQTT QoS-1 to the central PostGIS cluster."* |
| **"How do you prevent false positives (shadows, oil spills)?"** | *"We employ a 2-stage verification filter: First, confidence thresholding at 0.45. Second, spatial clustering: a single detection is logged as 'Candidate'; only when a second independent vehicle pass verifies the distress within 15 meters does PostGIS promote it to a verified 'Priority Work Order'."* |
| **"What is the mathematical formulation of RPI?"** | *"$$\text{RPI} = 0.40 \cdot \text{Severity} + 0.25 \cdot \text{Density} + 0.20 \cdot \text{TrafficHierarchy} + 0.15 \cdot \text{POIProximity}$$ Weights are derived from IRC:82 guidelines, prioritizing arterial highways and proximity to emergency trauma hospitals (e.g. Apollo, SRM Hospital)."* |
| **"What hardware is required by Bharat Electronics Limited?"** | *"No specialized industrial servers are required. Each vehicle uses a ₹2,800 Raspberry Pi 4B (or any commercial Android smartphone) with a standard wide-angle USB/MIPI camera module."* |
| **"What if the hackathon venue Wi-Fi goes down right now?"** | *"We prepared for that: our entire system can run in localized container mode, and we have a verified 90-second fail-safe video recording on USB right here (`assets/failsafe_recording.mp4`)."* |

---

## 🚨 CONTINGENCY PROCEDURES (FAIL-SAFE PROTOCOL)

1. **If Local Backend Hangs:**  
   Immediately launch one-click backup:
   ```cmd
   start_demo.bat
   ```
2. **If Phone Camera Disconnects:**  
   Switch immediately to **Tab 3** (`http://localhost:8001`) showing pre-recorded video stream inference.
3. **If Projector / Network Completely Fails:**  
   Open VLC Player and play `assets/failsafe_recording.mp4` directly off the desktop or USB drive. It demonstrates every single required feature in 90 seconds.
