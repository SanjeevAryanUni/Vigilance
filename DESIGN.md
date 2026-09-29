# 🏛️ VIGILANCE: Design System & Frontend Architecture Specification (DESIGN.md)
*Transforming an Amateur Prototype into an Elite Defense & Municipal Operational Command Center*

---

## Executive Summary & Design Vision

**Project VIGILANCE** (Smart India Hackathon 2026 — Problem Statement SIH26124 for **Bharat Electronics Limited**) is an automated road intelligence and municipal infrastructure defense platform. 

The previous prototype suffered from a common hackathon pitfall: **it spent 80% of its visual budget displaying technical machinery and decorative glows, and only 20% on helping a municipal engineer or defense logistics operator make decisions.**

This document establishes the official **VIGILANCE Design System (VDS v2.0)**. It synthesizes the operational clarity of **Palantir Gotham**, the typographic elegance of **Linear**, and the high-density HUD aesthetics of **Tesla Fleet Telemetry**.

---

## 1. Post-Mortem: Why the Previous UI Looked Amateurish

| Flaw Category | Previous Prototype Mistake | Consequence | VDS v2.0 Correction |
|:---|:---|:---|:---|
| **Visual Clutter** | Every panel had radiant cyan borders, inner box-shadows, backdrop blur, and gradient headers. | Sensory overload. The user couldn't tell which item was critical. | **One visual boundary rule**: 1px subtle slate border (`#1E293B`), solid dark obsidian surfaces, zero nested glows. |
| **Typography** | 90% of the UI used tiny (10–12px) `font-mono` uppercase text. | Hard to read; municipal names and contractor names wrapped awkwardly. | **Dual-font discipline**: Sans-serif (`Geist Sans` / `Inter`) for all labels, titles, and prose; Monospace (`Geist Mono`) *strictly* for IDs, coordinates, speeds, and timestamps. |
| **Fake AI & Gimmicks** | `AgentThoughtStream.tsx` cycled hardcoded strings like "Analyzing Road Surface..." on a timer. | Judges immediately recognized it as a mock ticker and doubted the real ML models. | **Delete fake tickers.** Replace with an authentic **Event Stream** displaying real PostGIS database transactions and WebSocket heartbeats. |
| **Grid & Viewport Spacing** | Hardcoded `height: 100vh`, nested flex containers, and four-column hardware cards squished into a 400px sidebar. | Content clipped off-screen on laptops (1366×768) and iPads. | **Flexible AppShell with independent scroll owners**: 60/40 map-to-queue split on desktop, responsive tabbed view on mobile. |
| **Inconsistent Severity Mapping** | Cyan was used for buttons, telemetry, and potholes; Red and orange were swapped arbitrarily. | Legend stated "Critical (D40)", but low-confidence D40s were orange, confusing the operator. | **Immutable Semantic Palette**: Red is *always* severe defect/incident; Amber is *always* warning/medium; Cyan is *always* active telemetry; Emerald is *always* resolved/safe. |
| **Table Overload** | Work orders table showed 10 columns at once: ID, Ward, POI, Phone, Priority, Lat, Lon, Severity, Status, Actions. | Extreme horizontal scrolling, impossible to use on tablet or mobile. | **Priority 6-Column Layout**: ID, Location, Defect Class, Priority Score, Assignee, Status. Click row to open full **Detail Drawer**. |

---

## 2. Core Design Foundations (Design Tokens)

### 2.1 The Obsidian Palette
Avoid flat muddy grays (`#1F2937`) or generic purple gradients. Use deep cosmic void tones with razor-sharp contrast:

```css
:root {
  /* Surface Layers */
  --bg-void:        #06080F; /* Root canvas background */
  --bg-surface:     #0D1322; /* Primary cards, sidebars, toolbars */
  --bg-raised:      #131B30; /* Active states, table headers, dropdowns */
  --bg-glass:       rgba(13, 19, 34, 0.75); /* Translucent floating overlays */
  
  /* Borders & Dividers */
  --border-subtle:  #1E293B; /* Default component borders */
  --border-active:  #334155; /* Hovered / focused card borders */
  --border-accent:  rgba(6, 182, 212, 0.4); /* Cyan highlight on active selection */

  /* Text & Foreground */
  --text-primary:   #F8FAFC; /* 100% white-slate for headings and primary metrics */
  --text-secondary: #94A3B8; /* Muted gray for labels, descriptions, and metadata */
  --text-disabled:  #64748B; /* Disabled items and subtle hints */

  /* Semantic State Colors */
  --status-critical: #EF4444; /* D40 Pothole, Active Crash, SLA Breached */
  --status-warning:  #F59E0B; /* D20 Alligator Crack, High Congestion, 24h SLA Warning */
  --status-info:     #3B82F6; /* D10 Longitudinal Crack, Route Advisory */
  --status-success:  #10B981; /* D00 Crack Bitumen Repaired, Verified Safe */
  --status-telemetry:#00F2FE; /* Live GPS Beacons, Camera Active, Sensor Synced */
}
```

### 2.2 Typography Scale
* **Primary Body & Titles:** `Geist Sans` or `Inter` (`font-sans`)
* **Data, Telemetry, IDs & Coordinates:** `Geist Mono` or `JetBrains Mono` (`font-mono`)

```
Display Metric / KPI:   28px / 32px line-height | font-semibold  | font-mono
Page Heading (H1):      22px / 28px line-height | font-semibold  | font-sans
Section Heading (H2):   16px / 24px line-height | font-medium    | font-sans
Card Header (H3):       14px / 20px line-height | font-medium    | font-sans
Body Text:              14px / 20px line-height | font-normal    | font-sans
Metadata / Captions:    12px / 16px line-height | font-normal    | font-sans
Telemetry / Badges:     11px / 14px line-height | font-semibold  | font-mono uppercase
```

### 2.3 Radii, Depth & Elevations
* **Inputs, Buttons, Pills:** `6px` radius (`rounded-md`). Sharp, professional, not bubbly.
* **Panels & Cards:** `10px` radius (`rounded-lg`).
* **Modals & Drawers:** `14px` radius (`rounded-xl`).
* **Elevation Shadows:** Reserved exclusively for floating elements (dropdowns, drawers, dialogs). Cards use solid surfaces with a 1px border.

---

## 3. Atomic Component Library (UI Primitives)

To eliminate repetitive, messy Tailwind inline spaghetti, standard primitives must be used:

### 3.1 AppShell & Navigation Header
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] VIGILANCE  [City: Chennai v]  [Source: LIVE POSTGIS *]    |  Overview  Analytics  Fleet  Work-Orders |  [Export Audit v]  [Help] |
+---------------------------------------------------------------------------------------------------------+
```
* **Compact Height:** `52px` fixed.
* **Persistent Telemetry Pill:** Shows `[● LIVE CLOUD POSTGIS]` (green beacon) or `[○ HISTORICAL BENCHMARK]` (amber beacon).
* **City Selector:** Seamless dropdown with quick keyboard shortcut (`Cmd+K`).
* **Active Navigation Indicator:** Subtle 2px bottom border under active route, not a garish pill.

### 3.2 Metric HUD Pill (Replaces bloated KPICard)
Instead of 4 huge vertical cards that take up half the screen, use a horizontal high-density telemetry strip:
```
+---------------------------------------------------------------------------------------------------------+
| TOTAL LOGGED: 4,812   |  ACTIVE CLUSTERS: 142   |  SLA BREACHED: 8 [!]  |  AVG SPEED: 24.2 km/h  |  CI: 0.38 (Flowing) |
+---------------------------------------------------------------------------------------------------------+
```
* Height: `40px`.
* Numerical values animated smoothly via `<RollingNumber />`.
* Critical alarms pulse gently (1.5s interval), never rapid strobing.

### 3.3 The Data Table Primitive (`<DataTable />`)
* **Header:** Sticky top, `bg-raised`, 11px uppercase `font-mono`.
* **Row Height:** `44px` on desktop (easy click target), zebra hover (`hover:bg-slate-800/40`).
* **Click Action:** Clicking any row opens the **Detail Drawer** from the right side of the screen without leaving the page.
* **Responsive Mode:** On screens `< 768px`, automatically morphs from multi-column table into compact stacked cards.

### 3.4 The Detail Drawer (`<DetailSheet />`)
When an operator clicks a road defect cluster or a fleet bus, a 420px drawer slides in smoothly from the right:
* High-res cropped defect thumbnail with bounding box overlay.
* Exact GPS Coordinates (`12.8231° N, 80.0442° E`) with copy button.
* IRC Maintenance Cost Breakdown (calculated dynamically).
* Contractor Assignment dropdown with confirmation.
* Status update button (`Mark In-Progress` $\rightarrow$ `Resolve`).

---

## 4. Page-by-Page Architectural Blueprints

### 4.1 Command Center (`/`) — The Primary WebGIS HUD

```
+---------------------------------------------------------------------------------------------------------+
| [Header]: Logo | City Selector | Connection Status | Navigation Tabs                     | PWD Audit Btn |
+---------------------------------------------------------------------------------------------------------+
| [Telemetry HUD Bar]: 4,812 Detected | 142 Verified Clusters | 8 Critical Potholes | 98.4% Transit Health  |
+-----------------------------------------------------------------------+---------------------------------+
|                                                                       | INCIDENT QUEUE (RPI DESCENDING) |
|                                                                       | Search road / ward...    [Sort] |
|                                                                       +---------------------------------+
|                                                                       | [!] D40 POTHOLE - RPI: 89.4     |
|                      WEBGIS MAPLIBRE CANVAS                           | GST Road near Tambaram Overpass |
|                      (Carto Dark Vector Base)                         | 3 Observations | 14m cluster    |
|                                                                       | Due: Today (GCC Zone 12)        |
|  - Glowing defect pins (Red = Critical, Amber = Medium)               +---------------------------------+
|  - Transit fleet markers with live speed tooltips                     | [*] D20 ALLIGATOR CRACK - 72.1  |
|  - Corridor Congestion Polylines (Color-coded CI)                     | Anna Salai, Teynampet Junction  |
|  - ISRO Bhuvan Satellite Layer Toggle Button                          | Assigned: L&T Infra | Due: 48h  |
|                                                                       +---------------------------------+
|                                                                       | [*] D00 LONGITUDINAL - 54.0     |
|                                                                       | OMR Road, Sholinganallur        |
|                                                                       | Reported: 2h ago (Bus 102)      |
|                                                                       +---------------------------------+
|                                                                       | [TAB 2: ANPR] [TAB 3: EDGE BOM] |
+-----------------------------------------------------------------------+---------------------------------+
| [Footer Status Bar]: 63/63 Tests Passing | Edge INT8 Latency: 41.7ms | Bandwidth Saved: 99.998%         |
+---------------------------------------------------------------------------------------------------------+
```

#### Key Functional Upgrades:
1. **Synchronized Map-List State:** Clicking an item in the right-hand queue smoothly flies the MapLibre camera to the coordinates (`map.flyTo({ center: [lon, lat], zoom: 16, pitch: 45 })`) and highlights the pin.
2. **Defect Clustering:** Solitary single-camera detections show as small translucent dots (unverified); points clustered by PostGIS DBSCAN ($\ge 2$ within 15m) form an official pulsing polygon with an RPI badge.
3. **Audio Alert:** When a new `D40` (pothole) event arrives over WebSocket, play a clean Web Audio synthesizer chime (two-tone sine wave at 440Hz $\rightarrow$ 880Hz, 80ms duration).

---

### 4.2 Mobile Windshield Dashcam (`/capture`)

Designed to be mounted on a bus or municipal truck dashboard inside a phone holder.

```
+-------------------------------------------------------------------+
| [REC] LIVE WINDSHIELD SCANNER                 GPS: 3D FIX (4m) [x]|
+-------------------------------------------------------------------+
|                                                                   |
|                  +-----------------------+                        |
|                  | [D40 POTHOLE 92%]     |                        |
|                  |                       |                        |
|                  |                       |                        |
|                  +-----------------------+                        |
|                                                                   |
|                             +----------------+                    |
|                             | TN 01 AB 1234  |                    |
|                             +----------------+                    |
|                                                                   |
+-------------------------------------------------------------------+
| G-FORCE SHOCKWAVE METER (DYNAMIC ACCELEROMETER)                   |
| Normal: [|||||||||||||||||               ] 1.2 m/s²               |
| Impact: [||||||||||||||||||||||||||||||||] 4.8 m/s² [SHOCK GATE!] |
+-------------------------------------------------------------------+
| [Camera: FRONT v]   [OFFLINE QUEUE: 0 SYNCED]   [STOP SCANNING]   |
+-------------------------------------------------------------------+
```

#### Key Functional Upgrades:
1. **Zero-Lag Model Overlay:** Bounding boxes drawn on an overlay `<canvas>` directly synced to `<video>` frame timestamps.
2. **Dynamic G-Force Gating:** Device accelerometer monitors $Z$-axis spikes. When shock $> 3.5 \text{ m/s}^2$, trigger haptic vibration (`navigator.vibrate([70, 40, 70])`), flash an amber border, and stamp the detection as `vibration_verified: true`.
3. **Offline IndexedDB Vault:** If the vehicle drives through a tunnel or cellular dead zone, detections are stored locally in IndexedDB. When connection is re-established, the queue auto-flushes to `/api/detections`.

---

### 4.3 Municipal Work Orders & PWD Dispatch (`/work-orders`)

Designed for executive municipal engineers and road maintenance contractors.

```
+---------------------------------------------------------------------------------------------------------+
| MUNICIPAL WORK ORDERS & SLA AUDIT                          [Filter Ward v] [Status v] [Export PDF / CSV]|
+---------------------------------------------------------------------------------------------------------+
| WORK ORDER ID | CORRIDOR / LOCATION       | DEFECT TYPE   | RPI  | ASSIGNED CONTRACTOR | SLA REMAINING  |
+---------------+---------------------------+---------------+------+---------------------+----------------+
| WO-CHN-8821   | GST Road, Tambaram        | D40 Pothole   | 92.4 | Chennai PWD Div-4   | 14h (ON TRACK) |
| WO-CHN-8819   | Anna Salai, Guindy        | D20 Alligator | 78.0 | L&T Infra Projects  | -6h (BREACHED) |
| WO-CHN-8814   | OMR Express, Perungudi    | D40 Pothole   | 88.1 | Unassigned          | 42h (PENDING)  |
| WO-CHN-8802   | Poonamallee High Road     | D10 Linear    | 46.2 | Apex Roadworks      | RESOLVED [OK]  |
+---------------------------------------------------------------------------------------------------------+
| [PAGINATION: Page 1 of 12]                     [SHOWING 1-15 OF 174 ORDERS]                             |
+---------------------------------------------------------------------------------------------------------+
```

#### Key Functional Upgrades:
1. **IRC-Standard Repair Estimates:**
   Each work order auto-computes budgetary cost based on Indian Road Congress (IRC) rates:
   * **D40 (Pothole):** $1.2\text{ m}^2 \times ₹4,500/\text{m}^2 = ₹5,400$
   * **D20 (Alligator):** $4.5\text{ m}^2 \times ₹1,800/\text{m}^2 = ₹8,100$
   * **D10 (Crack):** $8.0\text{ m} \times ₹650/\text{m} = ₹5,200$
2. **Contractor SLA Countdown:** Shows real-time remaining hours before 48-hour municipal penalty applies.
3. **One-Click Audit PDF:** Generates official government-formatted PDF report including SHA-256 integrity hash and PWD seal.

---

### 4.4 Urban Mobility & Analytics (`/analytics`)

* **Corridor Congestion Index (CI):** Table ranking Chennai/Bangalore corridors by FHWA Congestion Index ($CI = 1 - \frac{v}{v_{\text{freeflow}}}$).
* **Origin-Destination (OD) Matrix:** Heatmap matrix displaying transit interchange load between major hubs (Central, Guindy, Koyambedu, Airport, Tambaram).
* **Transparent Data Provenance:** When displaying real historical data vs simulated traffic observations, explicit badge: `Calculated from 1,240 bus GPS traces`.

---

### 4.5 Transit Fleet Live Radar (`/fleet`)

* **Active Vehicle Roster:** Grid of transit nodes (Buses 101, 102, 21G, 29C, 570) with last seen timestamp, current speed, driver camera status, and route status.
* **Cellular Bandwidth Counter:** Real-time counter showing:
  $$\text{Bandwidth Used: } 36\text{ KB/hr} \quad \text{vs} \quad \text{Raw Video: } 2.25\text{ GB/hr} \quad (99.998\% \text{ Savings})$$
* **Hardware BOM Inspection Tab:** Technical specs of the sub-₹3,000 edge hardware (RPi Zero 2W, Hailo-8L / INT8 ONNX acceleration, USB Dashcam).

---

## 5. What to Delete / Prune Immediately

To remove the amateur hackathon feel, the following files and components must be **purged or replaced**:

1. ❌ **Delete fake cycling tickers (`AgentThoughtStream.tsx`):** Do not fake AI reasoning with a hardcoded `setInterval`. Replace with real PostgreSQL event triggers.
2. ❌ **Remove duplicate mock stores (`serverStore.ts`):** Rely on the FastAPI/Supabase backend as the single source of truth.
3. ❌ **Eliminate redundant CSS:** Clean out conflicting glassmorphism definitions, multi-colored border gradients, and unused animation keyframes from `globals.css`.
4. ❌ **Remove non-essential decorative graphics:** Remove fake 3D wireframe canvases that burn GPU without displaying real telemetry.

---

## 6. Verification Checklist Before SIH Jury Presentation

Before demoing to BEL or SIH judges, verify that:
* [ ] Background is deep obsidian void (`#06080F`), never light gray or generic blue.
* [ ] Typography strictly follows the Sans-serif (copy) and Monospace (data) division.
* [ ] Clicking any road cluster on the map highlights it in the queue, and vice-versa.
* [ ] No button says "Clicked" or performs a dummy `alert()`; all buttons open functional drawers or trigger real API calls.
* [ ] PWD Report generator exports a clean, legible PDF with real defect counts and IRC cost figures.
* [ ] Mobile windshield view (`/capture`) responds to physical device orientation and shows realistic G-force shockwave spikes.
* [ ] All 63 backend tests pass and `npm run build` compiles with 0 errors.

---

*Authored for Team VIGILANCE — Smart India Hackathon 2026 (SIH26124).*
