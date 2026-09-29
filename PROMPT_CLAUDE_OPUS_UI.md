# 🎯 MASTER PROMPT FOR CLAUDE OPUS: COMPLETE UI RE-IMAGINING & IMPLEMENTATION PLAN (VIGILANCE SIH 2026)

> **TARGET MODEL:** Claude Opus (Claude 3.7 Sonnet / Claude Opus 4.6 in Extended Thinking / High Compute Mode)  
> **TASK:** Conduct a rigorous codebase audit of the existing Next.js 14 frontend, diagnose the amateur UI flaws, and produce an exhaustive, file-by-file **Implementation Plan** to re-architect the user interface into an elite, defense-grade tactical command center.  
> **MANDATORY CONSTRAINTS:**  
> 1. **STRICTLY ZERO BLUE OR PURPLE COLOURS** — No generic hackathon cyan glows, blue badges, or purple/indigo gradient accents. Use a tactical obsidian/carbon/amber/emerald palette inspired by defense aerospace and high-contrast terminal software (Linear, Tesla Fleet, Palantir).  
> 2. **ACTUALLY SCROLLABLE & RESPONSIVE LAYOUT** — Permanently eradicate `h-screen overflow-hidden` traps that clip sidebars and hide the incident queue on laptops (1366×768), tablets, and mobile. Every container must have predictable, natural scrolling.  
> 3. **INSPECT CODEBASE FIRST** — Ground every single recommendation on the real, live repository files.

---

### COPY AND PASTE THE COMPLETE PROMPT BELOW INTO CLAUDE OPUS:

```markdown
You are an elite Principal Frontend Architect and Staff Systems Designer with deep expertise in Next.js 14 App Router, Tailwind CSS, MapLibre GL JS, and high-density tactical operations software (inspired by Linear, Vercel, Tesla Fleet Telemetry, and Palantir Gotham).

You are auditing and reimagining the user interface for **Project VIGILANCE** (Smart India Hackathon 2026 — Problem Statement SIH26124 for **Bharat Electronics Limited**, Ministry of Defence). VIGILANCE is an automated road distress detection, edge AI video telemetry, and municipal maintenance dispatch platform.

---

## 🛑 TWO NON-NEGOTIABLE CORE DIRECTIVES

### 1. STRICT COLOR ENFORCEMENT: ZERO BLUE AND ZERO PURPLE
The current prototype looks like a generic student template because it drowns in glowing cyan borders, blue buttons, purple gradients, and indigo badges. **Eliminate all blue and purple from the entire design system.**
* ❌ **BANNED:** Blue (`#3B82F6`, `#2563EB`, `#1D4ED8`, `text-blue-*`, `bg-blue-*`), Cyan (`#06B6D4`, `#00F2FE`), Purple/Violet (`#8B5CF6`, `#A855F7`), Indigo (`#6366F1`).
* ✅ **MANDATORY TACTICAL INDUSTRIAL PALETTE:**
  * **Surfaces:** Deep Carbon & Obsidian (`#090A0C` void canvas, `#111215` panel surface, `#17181D` raised hover, `#23252C` subtle borders).
  * **Typography:** Pure Chalk & Bone White (`#F4F4F5` primary text, `#A1A1AA` secondary labels, `#71717A` muted metadata).
  * **High-Contrast Semantic Accents ONLY:**
    * **Safety Amber / Tactical Orange (`#F59E0B` / `#EA580C`):** Primary system telemetry, active scanning reticles, moderate road defects (`D20`), 24h SLA warnings.
    * **Laser Signal Red (`#EF4444`):** Critical potholes (`D40`), severe traffic crashes, SLA breached alerts.
    * **Phosphor Mint / Terminal Emerald (`#10B981` / `#22C55E`):** Verified repairs, live GPS heartbeats, free-flowing traffic, success states.
    * **Off-White / Zinc Neutral (`#FAFAFA` on `#27272A`):** Primary action buttons (Linear/Vercel style: high-contrast monochrome buttons with clean typography).

### 2. LAYOUT ENFORCEMENT: ACTUALLY SCROLLABLE & VIEWPORT RESILIENT
The current prototype is plagued by `h-screen overflow-hidden` containers, rigid flex-1 traps, and 4-column cards jammed into a 410px sidebar. On standard laptops (1366×768) and iPads, the incident queue and hardware cockpit get cut off and disappear completely.
* ❌ **BANNED:** Outer page `h-screen overflow-hidden` locks that trap the document scroll.
* ✅ **MANDATORY:**
  * Root document uses `min-h-screen` natural flow.
  * In the split-screen GIS workstation, the map can remain sticky or full-height, while the incident queue and telemetry stream have their own **dedicated, clearly scrollable pane** (`overflow-y-auto`, custom 4px minimal scrollbar, zero clipped cards).
  * On laptops (1366×768) and tablets (768×1024), panels must stack gracefully or use responsive tabs (`[Map View]` / `[Queue View]`) so an operator never experiences clipping.
  * Mobile viewports (390×844) must have comfortable 44px touch targets and bottom safe-area padding above the navigation bar.

---

## 🔎 STEP 1: DEEP CODEBASE AUDIT (INSPECT THESE FILES FIRST)

Before writing the implementation plan, inspect the following files in the repository:
1. `vigilance-prototype/dashboard-next/src/app/globals.css` — Observe the glowing cyan `.glass-panel`, purple tokens, and root variables.
2. `vigilance-prototype/dashboard-next/src/app/page.tsx` — Observe the `overflow-hidden` containers (lines 230-238), the 4-column KPI grid squashed into 410px, and the fake `<AgentThoughtStream />` string cycler.
3. `vigilance-prototype/dashboard-next/src/components/Header.tsx` — Observe button styling, city dropdown layout, and navigation overflow on tablet screens.
4. `vigilance-prototype/dashboard-next/src/components/WebGISMap.tsx` — Check MapLibre GL layer styling and popup styling.
5. `vigilance-prototype/dashboard-next/src/components/ClusterTable.tsx` & `IncidentFeed.tsx` — Check table layouts, severity badges, and scrolling behavior.
6. `vigilance-prototype/dashboard-next/src/app/work-orders/page.tsx` — Observe the 10-column table that overflows horizontally.
7. `vigilance-prototype/dashboard-next/src/app/capture/page.tsx` — Check dashcam camera viewport, accelerometer threshold meter, and offline queue.
8. `docs/audits/2026-09-28/VIGILANCE_Audit.md` & `DESIGN.md` — Review the jury audit findings.

---

## 📋 STEP 2: WHAT TO AUDIT & CRITIQUE IN YOUR ANALYSIS

Provide a sharp, technical critique of the current UI covering:
1. **The "Glow Trap"**: Why the nested glass borders, multi-color card borders, and radiant box-shadows make the site look like an amateur hackathon project rather than a BEL defense tool.
2. **The "Monospace Font Overload"**: Why 10px all-caps monospace paragraphs destroy reading velocity and cause municipal road names to wrap awkwardly.
3. **The "Viewport Clipping Disaster"**: The exact CSS classes and container structures in `page.tsx` and `globals.css` that prevent vertical scrolling on laptops and tablets.
4. **The "Fake AI Ticker"**: Why `AgentThoughtStream.tsx`cycling hardcoded strings looks phony to judges and how replacing it with real database/WebSocket transaction streams builds instant credibility.

---

## 🛠️ STEP 3: THE COMPREHENSIVE IMPLEMENTATION PLAN

Deliver a phased, production-grade Implementation Plan structured as follows:

### Phase 1: Design Tokens & Global CSS Purge
* Exact replacement code for `globals.css` and `tailwind.config.ts`.
* Complete removal of blue/cyan/purple variables.
* Implementation of the Carbon/Obsidian/Amber/Emerald token architecture.
* Clean, non-intrusive custom scrollbar styling (`::-webkit-scrollbar`).

### Phase 2: AppShell, Typography & Core Primitives
* Refactoring `layout.tsx` and `Header.tsx`:
  * Streamlined 50px header with amber live beacon `[● LIVE POSTGIS]`.
  * Typography division: `Geist Sans` / `Inter` for prose and headings; `Geist Mono` / `JetBrains Mono` strictly for telemetry IDs, coordinates, speeds, and timestamps.
* Reusable tactical UI primitives:
  * `<TacticalButton>` (Monochrome high-contrast default, amber outline secondary, red danger).
  * `<TelemetryHUDStrip>` (Replaces the 4 squished KPI cards with a horizontal high-density telemetry bar).
  * `<DataTable>` (Sticky header, 44px rows, zebra hover, responsive card transformation).
  * `<DetailDrawer>` (420px slide-in panel for inspecting a defect without leaving the map).

### Phase 3: Main Command Center HUD (`src/app/page.tsx`)
* Architectural layout wireframe (ASCII diagram).
* Eradication of `overflow-hidden` traps; implementation of independent scroll owners.
* Deletion of `AgentThoughtStream.tsx` fake ticker $\rightarrow$ replaced with authentic real-time mutation feed.
* MapLibre GL dark vector integration (Carto Dark Matter vector tiles with amber/red defect pins).
* Synchronized bidirectional interaction: clicking a queue item flies the map to the coordinates; clicking a map marker highlights the queue card.

### Phase 4: Secondary Pages Re-architecture
1. **Municipal Work Orders (`/work-orders`):**
   * Simplify from 10 columns down to the **essential 6 columns** (ID, Location, Defect Class, Priority Score, Contractor, Status).
   * Slide-in drawer for full POI, phone, coordinates, and photo evidence.
   * Real-time IRC maintenance repair cost calculator ($₹4,500/\text{m}^2$ for D40 Pothole, $₹1,800/\text{m}^2$ for D20 Alligator, $₹650/\text{m}$ for D10 Crack).
   * SLA countdown timer with amber/red warnings.
2. **Mobile Windshield HUD (`/capture`):**
   * High-contrast tactical HUD with amber crosshairs.
   * Canvas bounding boxes (Red for potholes, Amber for plates, Green for clear road).
   * G-Force dynamic shockwave meter with haptic vibration feedback.
   * Offline IndexedDB queueing badge.
3. **Urban Mobility Analytics (`/analytics`):**
   * Corridor Congestion Index table ($CI = 1 - \frac{v}{v_{\text{freeflow}}}$).
   * Origin-Destination transit interchange matrix.
4. **Transit Fleet Command (`/fleet`):**
   * Fleet roster grid with last-seen heartbeats and route delay tracker.
   * Cellular bandwidth savings proof: $36\text{ KB/hr}$ telemetry vs $2.25\text{ GB/hr}$ video ($99.998\%$ saved).

### Phase 5: Verification, Accessibility & Responsive Matrix
* Viewport testing matrix: 1920×1080 (Desktop), 1366×768 (Standard Laptop), 768×1024 (Tablet), 390×844 (Mobile).
* WCAG 2.1 AA contrast ratio verification on all text/background pairs.
* Zero build errors (`npm run build`) and 63/63 passing backend tests (`pytest`).

---

Provide complete, production-ready code snippets and file modifications rather than generic advice. Every recommendation must be immediately executable by an engineering team.
```
