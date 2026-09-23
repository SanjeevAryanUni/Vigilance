"""
VIGILANCE — Urban Road Intelligence Platform
Route Delay & Travel Time Index (TTI) Estimator
Analyzes transit bottleneck delays relative to baseline schedule standards.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import TrafficObservation
from congestion import FREEFLOW_SPEEDS

# Approximate corridor lengths in km
CORRIDOR_DISTANCES = {
    "GST Road, Tambaram (NH-32)": 12.5,
    "GST Road (NH-32)": 12.5,
    "Anna Salai (Mount Road)": 8.2,
    "Anna Salai (Mount Road), Chennai": 8.2,
    "Old Mahabalipuram Road (OMR)": 15.0,
    "Guindy Kathipara Grade Junction": 3.5,
    "Guindy Kathipara Junction, Chennai": 3.5,
    "T. Nagar Usman Road Commercial": 2.8,
    "T. Nagar Usman Road, Chennai": 2.8,
    "Velachery Main Road": 5.4,
    "Poonamallee High Road": 9.1,
    "Poonamallee High Road, Chennai": 9.1,
    "Anna Nagar 2nd Avenue": 3.2,
    "SRM Institute / Potheri Highway": 14.0,
    "Saidapet Bridge, Chennai": 2.2,
}


def estimate_all_route_delays(db: Session) -> List[Dict[str, Any]]:
    """
    Estimates corridor trip durations, delay deltas in minutes, and Travel Time Index (TTI).
    """
    since = datetime.utcnow() - timedelta(minutes=45)
    speeds = db.query(
        TrafficObservation.road_name,
        func.avg(TrafficObservation.speed_kmh).label("avg_speed"),
    ).filter(
        TrafficObservation.timestamp >= since,
        TrafficObservation.road_name.isnot(None),
    ).group_by(TrafficObservation.road_name).all()

    speed_map = {name: float(spd) for name, spd in speeds if spd is not None and spd > 0}

    delays: List[Dict[str, Any]] = []
    seen_roads = set()

    for road, dist_km in CORRIDOR_DISTANCES.items():
        if road in seen_roads:
            continue
        seen_roads.add(road)

        freeflow = FREEFLOW_SPEEDS.get(road, 40)
        actual = speed_map.get(road, freeflow)

        freeflow_min = (dist_km / freeflow) * 60.0
        actual_min = (dist_km / max(actual, 3.0)) * 60.0
        delay_min = max(0.0, actual_min - freeflow_min)
        tti = actual_min / max(freeflow_min, 0.1)

        if delay_min < 3.0:
            status = "normal"
        elif delay_min < 8.0:
            status = "delayed"
        else:
            status = "severe"

        delays.append({
            "road_name": road,
            "distance_km": dist_km,
            "freeflow_min": round(freeflow_min, 1),
            "actual_min": round(actual_min, 1),
            "delay_min": round(delay_min, 1),
            "tti": round(tti, 2),
            "status": status,
        })

    return sorted(delays, key=lambda x: x["delay_min"], reverse=True)
