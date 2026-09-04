# 🤝 Team VIGILANCE — Contribution & Git Workflow Guide

Welcome to the **VIGILANCE** SIH 2026 repository! This document outlines our branch naming conventions, workflow, and pull request process so everyone on the team can collaborate smoothly without merge conflicts.

---

## 🌳 Branch Hierarchy

```
main (Production / Presentation-Ready)
  │
  └── dev (Active Integration Branch)
        ├── feature/edge-ai         (Parth / Edge vision & YOLO models)
        ├── feature/backend-gis     (Shubh / Dhiti / FastAPI, PostGIS, DBSCAN)
        ├── feature/dashboard-ui    (Prakhar / WebGIS, Leaflet, Tailwind)
        └── docs/presentation       (Sanjeev / Pitch decks & documentation)
```

### 1. `main` (Protected)
* Stable, presentation-ready code and official PPT decks.
* Direct commits to `main` should be restricted. Merge into `main` only from `dev` when a release or demo milestone is reached.

### 2. `dev` (Default Development Branch)
* All team members create feature branches from `dev` and merge their completed work back into `dev`.

### 3. Feature & Topic Branches
* `feature/edge-ai` — Onboard camera processing, YOLOv8 fine-tuning, RDD2022 dataset handling, edge telemetry.
* `feature/backend-gis` — FastAPI endpoints, spatial database models, PostGIS queries, DBSCAN clustering, and RPI engine.
* `feature/dashboard-ui` — MapLibre GL WebGIS vector interface, real-time WebSocket feeds, Tailwind frosted glass layout, and ApexCharts analytics.
* `docs/presentation` — Presentation decks, pitch scripts, diagrams, and project documentation.

---

## 🚀 Daily Git Workflow

### 1. Clone & Check Out Development Branch
```bash
git clone git@github.com:SanjeevAryanUni/VIGILANCE.git
cd VIGILANCE
git checkout dev
```

### 2. Create a Feature Branch
```bash
# Example: working on edge AI
git checkout -b feature/edge-ai

# Or for a specific feature:
git checkout -b feature/your-feature-name
```

### 3. Commit Your Changes
Make meaningful, descriptive commits:
```bash
git add .
git commit -m "feat(edge): add real-time frame gating for camera vibration"
```

### 4. Keep Your Branch Up to Date with `dev`
Before opening a PR or pushing:
```bash
git fetch origin
git merge origin/dev
```

### 5. Push to GitHub
```bash
git push -u origin feature/your-feature-name
```

### 6. Create a Pull Request (PR)
* Open a Pull Request from `feature/your-feature-name` into `dev`.
* Have at least one teammate review the PR before merging.
