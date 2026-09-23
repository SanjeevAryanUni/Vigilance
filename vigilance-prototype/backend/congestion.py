"""
VIGILANCE — Urban Road Intelligence Platform
Congestion Estimation & Heatmap Engine
Computes Congestion Index (CI) and Travel Time Index (TTI) across road corridors.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import TrafficObservation

FREEFLOW_SPEEDS = {
    "GST Road (NH-32)": 60,
    "GST Road, Tambaram (NH-32)": 60,
    "Guindy Kathipara Grade Junction": 40,
    "Guindy Kathipara Junction, Chennai": 40,
    "T. Nagar Usman Road Commercial": 30,
    "T. Nagar Usman Road, Chennai": 30,
    "Anna Salai (Mount Road)": 45,
    "Anna Salai (Mount Road), Chennai": 45,
    "Poonamallee High Road": 45,
    "Poonamallee High Road, Chennai": 45,
    "Old Mahabalipuram Road (OMR)": 55,
    "Velachery Main Road": 35,
    "Anna Nagar 2nd Avenue": 40,
    "SRM Institute / Potheri Highway": 50,
    "Saidapet Bridge, Chennai": 35,
}


def _ci_level(ci: float) -> str:
    if ci <= 0.05:
        return "free_flow"
    if ci < 0.25:
        return "light"
    if ci < 0.50:
        return "moderate"
    if ci < 0.75:
        return "heavy"
    return "gridlock"


def compute_congestion_for_all_roads(db: Session) -> List[Dict[str, Any]]:
    """
    Computes real-time corridor congestion by comparing observed fleet speed
    against historical freeflow design speed.
    """
    since = datetime.utcnow() - timedelta(minutes=60)
    results = db.query(
        TrafficObservation.road_name,
        func.avg(TrafficObservation.speed_kmh).label("avg_speed"),
        func.count(TrafficObservation.id).label("observations"),
    ).filter(
        TrafficObservation.timestamp >= since,
        TrafficObservation.road_name.isnot(None),
    ).group_by(TrafficObservation.road_name).all()

    congestion = []
    seen_roads = set()

    for road_name, avg_speed, obs_count in results:
        if not road_name:
            continue
        seen_roads.add(road_name)
        freeflow = FREEFLOW_SPEEDS.get(road_name, 40)
        speed = float(avg_speed) if avg_speed is not None else freeflow
        ci = max(0.0, 1.0 - (speed / freeflow))
        tti = freeflow / max(speed, 1.0)

        congestion.append({
            "road_name": road_name,
            "avg_speed_kmh": round(speed, 1),
            "freeflow_speed_kmh": freeflow,
            "congestion_index": round(ci, 3),
            "level": _ci_level(ci),
            "tti": round(tti, 2),
            "observations": obs_count,
        })

    # Default fallback for prominent corridors with no recent traffic points
    for road, freeflow in FREEFLOW_SPEEDS.items():
        if road not in seen_roads and len(congestion) < 12:
            congestion.append({
                "road_name": road,
                "avg_speed_kmh": freeflow,
                "freeflow_speed_kmh": freeflow,
                "congestion_index": 0.0,
                "level": "free_flow",
                "tti": 1.0,
                "observations": 0,
            })
            seen_roads.add(road)

    return sorted(congestion, key=lambda x: x["congestion_index"], reverse=True)


def get_congestion_heatmap_points(db: Session) -> List[Dict[str, Any]]:
    """
    Generates geo-weighted coordinates for rendering congestion heatmaps on MapLibre / GIS dashboard.
    """
    since = datetime.utcnow() - timedelta(hours=2)
    obs = db.query(TrafficObservation).filter(
        TrafficObservation.timestamp >= since
    ).limit(300).all()

    points = []
    for o in obs:
        freeflow = FREEFLOW_SPEEDS.get(o.road_name, 40)
        speed = o.speed_kmh if (o.speed_kmh is not None and o.speed_kmh > 0) else freeflow
        ci = max(0.0, 1.0 - (speed / freeflow))
        points.append({
            "lat": o.lat,
            "lon": o.lon,
            "weight": round(ci, 3),
            "level": _ci_level(ci),
            "speed_kmh": speed,
            "road_name": o.road_name or "Chennai Transit Corridor",
            "timestamp": o.timestamp.isoformat() if o.timestamp else datetime.utcnow().isoformat()
        })
    return points
