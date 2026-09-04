# Repair Priority Index (RPI) Methodology

**VIGILANCE Platform — Automated Urban Road Defect Triage & SLA Prioritization**  
*Aligned with Indian Roads Congress (IRC:SP:16-2019 / IRC:82-2015) & MoRTH Guidelines*

---

## 1. Executive Summary

Urban road maintenance authorities frequently face constrained budgetary and operational resources. In traditional workflows, repair scheduling is largely reactive or relies on ad-hoc citizen complaints. The **VIGILANCE Repair Priority Index (RPI)** is a mathematically deterministic, multi-criteria scoring algorithm designed to rank detected road anomalies (potholes, severe rutting, alligator cracking) from **0 to 100**.

By factoring in **defect severity**, **multi-vehicle detection recurrence (density)**, **road network hierarchy**, and **proximity to critical civic infrastructure (POIs)**, the RPI enables municipal engineers to dynamically automate triage, assign contractor SLAs, and minimize accident risks.

---

## 2. Mathematical Formulation

The overall Repair Priority Index ($\text{RPI}$) is defined as a linear weighted combination of four normalized sub-indices:

$$\text{RPI} = 100 \times \left( w_{\text{sev}} \cdot S + w_{\text{dens}} \cdot D + w_{\text{hier}} \cdot H + w_{\text{poi}} \cdot P \right)$$

Where:
- $S \in [0.25, 1.0]$: **Severity Weight** (derived from YOLO defect classification & area estimation)
- $D \in [0.20, 1.0]$: **Recurrence / Cluster Density Factor**
- $H \in [0.40, 1.0]$: **Road Hierarchy Weight** (IRC functional classification)
- $P \in [0.25, 1.0]$: **Critical POI Proximity Factor**

### Weight Constraint:
$$\sum w_i = w_{\text{sev}} + w_{\text{dens}} + w_{\text{hier}} + w_{\text{poi}} = 0.40 + 0.25 + 0.20 + 0.15 = 1.00$$

Since each constituent term is strictly bounded within $[0.0, 1.0]$, the resulting $\text{RPI}$ score is strictly bounded in the range $[0.0, 100.0]$.

---

## 3. Parameter Derivation & IRC Standard Alignment

### 3.1 Severity Score ($S$) — Weight: $40\%$ ($w_{\text{sev}} = 0.40$)
Directly evaluated from edge AI detections and multi-frame bounding box dimension analysis:

| Severity Level | Defect Category (RDD2022 / MoRTH) | Normalized Score ($S$) | Weight Contribution ($S \times 40$) |
| :--- | :--- | :--- | :--- |
| **Critical** | Deep Pothole (D40) > 50mm depth or large area $> 0.1 \text{ m}^2$ | **1.00** | 40.0 pts |
| **High** | Severe Alligator Cracking (D20) / Structural Failure | **0.75** | 30.0 pts |
| **Medium** | Longitudinal / Transverse Cracks (D00, D10) | **0.50** | 20.0 pts |
| **Low** | Minor Surface Wear / Superficial Ravelling | **0.25** | 10.0 pts |

*Standard Reference:* **IRC:82-2015** (*Code of Practice for Maintenance of Bituminous Roads*) classifies road distress by depth and structural impact; pothole depths exceeding 50mm on high-speed corridors represent an immediate hazard to two-wheelers and high-axle vehicles.

---

### 3.2 Recurrence / Density Factor ($D$) — Weight: $25\%$ ($w_{\text{dens}} = 0.25$)
Crowdsourced fleet passes cross-verify the presence of defects across multiple independent vehicles, eliminating transient false positives (e.g. shadows, water reflections).

$$D = \min\left(1.0, \frac{\text{detection\_count}}{5}\right)$$

| Detection Count | Normalized Score ($D$) | Weight Contribution ($D \times 25$) | Statistical Confidence |
| :--- | :--- | :--- | :--- |
| **1 Pass** | 0.20 | 5.0 pts | Single observer |
| **2 Passes** | 0.40 | 10.0 pts | Multi-vehicle confirmed |
| **3 Passes** | 0.60 | 15.0 pts | High persistence |
| **4 Passes** | 0.80 | 20.0 pts | Persistent obstruction |
| **$\ge 5$ Passes** | 1.00 | 25.0 pts | Maximum statistical certainty |

---

### 3.3 Road Network Hierarchy ($H$) — Weight: $20\%$ ($w_{\text{hier}} = 0.20$)
Road class dictates average daily traffic volume (PCUs), design operating speed, and public transport density:

| Road Class | Functional Classification (MoRTH / IRC:SP:16) | Normalized Score ($H$) | Weight Contribution ($H \times 20$) |
| :--- | :--- | :--- | :--- |
| **National Expressway / NH / Arterial** | High-speed corridors (GST Road, NH-44, Anna Salai) | **1.00** | 20.0 pts |
| **State Highway / Primary Collector** | Sub-arterial trunk routes (OMR, ECR) | **0.80** | 16.0 pts |
| **Secondary Urban Arterial** | Commercial avenues / feeder links | **0.60** | 12.0 pts |
| **Local / Residential Street** | Low-speed municipal access roads | **0.40** | 8.0 pts |

---

### 3.4 Critical Infrastructure / POI Proximity ($P$) — Weight: $15\%$ ($w_{\text{poi}} = 0.15$)
Proximity to vulnerable zones (trauma centers, school zones, transit terminals) accelerates urgency due to pedestrian vulnerability and emergency vehicle clearance:

| POI Category | Distance Threshold | Normalized Score ($P$) | Weight Contribution ($P \times 15$) |
| :--- | :--- | :--- | :--- |
| **Emergency / Hospital** | $\le 250\text{ m}$ from Trauma Center or General Hospital | **1.00** | 15.0 pts |
| **School / University Zone** | $\le 200\text{ m}$ from Educational Institution | **0.75** | 11.25 pts |
| **Transit Terminal / Metro** | $\le 300\text{ m}$ from Railway or Bus Interchange | **0.50** | 7.5 pts |
| **Standard Urban Corridor** | $> 300\text{ m}$ from designated sensitive POIs | **0.25** | 3.75 pts |

---

## 4. SLA Tier Allocation & Operational Thresholds

The calculated RPI score maps directly to automated work order generation and contractor response SLAs:

```
                  RPI Score Distribution & Automated SLAs
  ┌───────────────┬──────────────┬──────────────────┬─────────────────┐
  │  RPI Range    │  Risk Level  │  Action Trigger  │  Contractor SLA │
  ├───────────────┼──────────────┼──────────────────┼─────────────────┤
  │  80.0 - 100.0 │  CRITICAL    │  Immediate PWD   │  < 12 Hours     │
  │               │              │  Dispatch / SMS  │                 │
  ├───────────────┼──────────────┼──────────────────┼─────────────────┤
  │  65.0 - 79.9  │  HIGH        │  Batch Priority  │  < 24 Hours     │
  │               │              │  Work Order      │                 │
  ├───────────────┼──────────────┼──────────────────┼─────────────────┤
  │  45.0 - 64.9  │  MEDIUM      │  Scheduled Ward  │  < 48 Hours     │
  │               │              │  Patch Cycle     │                 │
  ├───────────────┼──────────────┼──────────────────┼─────────────────┤
  │   0.0 - 44.9  │  LOW         │  Routine Survey  │  7 Days         │
  │               │              │  & Monitoring    │                 │
  └───────────────┴──────────────┴──────────────────┴─────────────────┘
```

---

## 5. Sensitivity & Robustness Analysis

1. **Monotonicity**: Increasing any single factor (e.g. from single detection to 3 passes, or encountering a defect near a hospital rather than a standard zone) strictly increases or preserves the RPI score.
2. **False Positive Resilience**: A single spurious detection on a local street achieves an RPI of at most:
   $$\text{RPI}_{\text{spurious}} = 100 \times (0.50 \times 0.40 + 0.20 \times 0.25 + 0.40 \times 0.20 + 0.25 \times 0.15) = 36.75 \text{ (LOW)}$$
   It will never trigger emergency dispatch without corroborating passes or high structural severity.
3. **Emergency Elevation**: A critical pothole on a national highway outside a major hospital achieves:
   $$\text{RPI}_{\text{emergency}} = 100 \times (1.00 \times 0.40 + 1.00 \times 0.25 + 1.00 \times 0.20 + 1.00 \times 0.15) = 100.0 \text{ (CRITICAL)}$$
   Triggering immediate contractor dispatch and traffic police notification.
