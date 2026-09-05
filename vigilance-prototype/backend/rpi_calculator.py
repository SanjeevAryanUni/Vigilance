"""
VIGILANCE — Urban Road Intelligence Platform
Dynamic Repair Prioritization Index (RPI) Engine

Mathematical Formulation:
--------------------------
RPI = (W_severity * S_severity) + (W_density * D_density) + (W_traffic * T_traffic) + (W_poi * P_poi)

Weights:
  - Severity Weight (W_severity)       : 40% (0.40)
  - Density Weight (W_density)         : 25% (0.25)
  - Traffic Importance (W_traffic)     : 20% (0.20)
  - POI Proximity Score (W_poi)        : 15% (0.15)
  Total Weight                         : 100% (1.00)

Score Bounds: [10.0, 100.0]
"""

from typing import Dict, Any


# Standardized Severity Value Mapping
SEVERITY_SCORES: Dict[str, float] = {
    "critical": 1.00,  # 40.0 pts (Severe crater / high axle hazard)
    "high":     0.75,  # 30.0 pts (Significant pothole / alligator mesh)
    "medium":   0.50,  # 20.0 pts (Moderate distress / longitudinal crack)
    "low":      0.25   # 10.0 pts (Minor surface fissure)
}

WEIGHT_SEVERITY = 40.0
WEIGHT_DENSITY  = 25.0
WEIGHT_TRAFFIC  = 20.0
WEIGHT_POI      = 15.0


def get_severity_score(severity: str) -> float:
    """Returns normalized severity coefficient in [0.25, 1.00]."""
    return SEVERITY_SCORES.get(str(severity).strip().lower(), 0.50)


def compute_rpi(severity: str, count: int, road_type_weight: float = 0.60, proximity_weight: float = 0.50) -> float:
    """
    Computes composite Repair Prioritization Index (RPI) from defect telemetry and spatial factors.

    Args:
        severity: Dominant defect severity string ('critical', 'high', 'medium', 'low')
        count: Number of deduplicated vehicle passes detecting this defect (density)
        road_type_weight: Normalized road hierarchy factor [0.40, 1.00] (NH-32 = 1.0, Arterial = 0.85, etc.)
        proximity_weight: Normalized emergency/educational POI proximity factor [0.25, 1.00]

    Returns:
        float: Normalized RPI score bounded between 10.0 and 100.0 rounded to 1 decimal place.
    """
    s_val = get_severity_score(severity)
    density_val = min(1.0, max(0.2, count / 5.0))
    road_val = min(1.0, max(0.0, float(road_type_weight)))
    poi_val = min(1.0, max(0.0, float(proximity_weight)))

    raw_rpi = (
        (s_val * WEIGHT_SEVERITY) +
        (density_val * WEIGHT_DENSITY) +
        (road_val * WEIGHT_TRAFFIC) +
        (poi_val * WEIGHT_POI)
    )

    return round(min(100.0, max(10.0, raw_rpi)), 1)


def get_rpi_breakdown(severity: str, count: int, road_type_weight: float = 0.60, proximity_weight: float = 0.50) -> Dict[str, Any]:
    """
    Provides full component-level audit trail for an RPI score calculation.
    """
    s_val = get_severity_score(severity)
    density_val = min(1.0, max(0.2, count / 5.0))
    road_val = min(1.0, max(0.0, float(road_type_weight)))
    poi_val = min(1.0, max(0.0, float(proximity_weight)))

    sev_pts = round(s_val * WEIGHT_SEVERITY, 2)
    dens_pts = round(density_val * WEIGHT_DENSITY, 2)
    traffic_pts = round(road_val * WEIGHT_TRAFFIC, 2)
    poi_pts = round(poi_val * WEIGHT_POI, 2)
    total_rpi = compute_rpi(severity, count, road_type_weight, proximity_weight)

    return {
        "rpi_score": total_rpi,
        "components": {
            "severity": {"weight": 0.40, "normalized_value": s_val, "points": sev_pts, "max_points": 40.0},
            "density": {"weight": 0.25, "normalized_value": density_val, "points": dens_pts, "max_points": 25.0, "detections": count},
            "traffic": {"weight": 0.20, "normalized_value": road_val, "points": traffic_pts, "max_points": 20.0},
            "poi_proximity": {"weight": 0.15, "normalized_value": poi_val, "points": poi_pts, "max_points": 15.0}
        }
    }
