"""
VIGILANCE — Urban Road Intelligence Platform
Spatial Deduplication Engine (DBSCAN & PostGIS ST_ClusterDBSCAN)

Algorithm Details:
  - Metric: Haversine great-circle distance (Earth radius R = 6,371,000m)
  - Distance Threshold (Epsilon): 15.0 meters
  - Minimum Samples: 1 (captures standalone high-severity detections)
  - Centroid Calculation: Mathematical mean (latitude, longitude)
  - Status Continuity: 25m centroid matching against historical clusters
"""

import math
from datetime import datetime
from typing import List, Tuple, Dict, Any

from sqlalchemy import text

from models import Detection, Cluster
from poi_data import (
    haversine_meters,
    get_road_weight,
    get_proximity_weight,
    get_contractor,
)
from rpi_calculator import compute_rpi

# Scikit-learn and Numpy imports with pure-Python fallback
try:
    import numpy as np
    from sklearn.cluster import DBSCAN
    SKLEARN_AVAILABLE = True
    NUMPY_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    NUMPY_AVAILABLE = False


def run_spatial_deduplication(db_session, eps_meters: float = 15.0) -> int:
    """
    Runs spatial deduplication across all detections in the database.
    - If PostGIS is active, executes native PostGIS ST_ClusterDBSCAN.
    - If SQLite is active, executes Haversine DBSCAN with BallTree or pure-Python leader clustering fallback.
    - Clusters detections within eps_meters (default 15.0m).
    - Preserves user-assigned status ('assigned', 'resolved') across repeat vehicle passes.
    - Computes dynamic Repair Prioritization Index (RPI) for each deduplicated cluster.

    Returns:
        int: Number of unique clusters generated.
    """
    detections = db_session.query(Detection).order_by(Detection.id.asc()).all()
    if not detections:
        return 0

    # 1. Snapshot previous cluster statuses and centroids for continuity
    previous_clusters = db_session.query(Cluster).all()
    prev_status_map: List[Tuple[float, float, str, datetime]] = [
        (c.centroid_lat, c.centroid_lon, c.status, c.created_at) for c in previous_clusters
    ]

    labels = []

    # Try PostGIS ST_ClusterDBSCAN if running against PostgreSQL/PostGIS
    try:
        bind = db_session.get_bind()
        is_postgres = "postgresql" in str(bind.url)
        if is_postgres:
            sql = text(f"""
                SELECT id,
                       ST_ClusterDBSCAN(ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857), eps := {eps_meters}, minpoints := 1) OVER () as cluster_id
                FROM detections
                ORDER BY id ASC;
            """)
            result = db_session.execute(sql).fetchall()
            postgis_map = {r[0]: (r[1] if r[1] is not None else 0) for r in result}
            labels = [postgis_map.get(d.id, 0) for d in detections]
    except Exception:
        labels = []

    # Scikit-Learn Haversine BallTree DBSCAN
    if not labels:
        if SKLEARN_AVAILABLE and NUMPY_AVAILABLE and len(detections) > 0:
            coords = np.array([[d.lat, d.lon] for d in detections])
            coords_rad = np.radians(coords)
            epsilon_rad = eps_meters / 6371000.0  # Earth radius in meters
            db = DBSCAN(eps=epsilon_rad, min_samples=1, metric='haversine', algorithm='ball_tree')
            raw_labels = db.fit_predict(coords_rad)
            labels = [int(lbl) for lbl in raw_labels]
        else:
            # Pure-Python Leader Clustering Fallback (zero third-party dependency)
            cluster_centers: List[Tuple[float, float]] = []
            for d in detections:
                matched_idx = -1
                for c_idx, (clat, clon) in enumerate(cluster_centers):
                    if haversine_meters(d.lat, d.lon, clat, clon) <= eps_meters:
                        matched_idx = c_idx
                        break
                if matched_idx >= 0:
                    labels.append(matched_idx)
                else:
                    new_idx = len(cluster_centers)
                    cluster_centers.append((d.lat, d.lon))
                    labels.append(new_idx)

    # Clear existing clusters table before populating deduplicated clusters
    db_session.query(Cluster).delete()

    clusters_map: Dict[int, List[Detection]] = {}
    for idx, raw_label in enumerate(labels):
        det = detections[idx]
        cluster_id_1indexed = int(raw_label) + 1 if raw_label is not None and raw_label >= 0 else 1
        det.cluster_id = cluster_id_1indexed

        if cluster_id_1indexed not in clusters_map:
            clusters_map[cluster_id_1indexed] = []
        clusters_map[cluster_id_1indexed].append(det)

    created_clusters = 0
    for c_id, det_list in clusters_map.items():
        lats = [d.lat for d in det_list]
        lons = [d.lon for d in det_list]
        center_lat = float(sum(lats) / len(lats))
        center_lon = float(sum(lons) / len(lons))

        types = [d.defect_type for d in det_list]
        dominant_type = max(set(types), key=types.count)

        sev_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        severities = [d.severity.lower() for d in det_list if d.severity]
        max_sev = max(severities, key=lambda s: sev_rank.get(s, 1)) if severities else "medium"

        road_name = det_list[0].road_name or "GST Road, Tambaram, Chennai"
        road_wt = get_road_weight(road_name)
        prox_wt, nearest_poi, poi_dist = get_proximity_weight(center_lat, center_lon)
        contractor = get_contractor(road_name)

        rpi = compute_rpi(max_sev, len(det_list), road_type_weight=road_wt, proximity_weight=prox_wt)

        # Match centroid to nearest previous cluster within 25m to preserve operational workflow status
        matched_status = "open"
        created_time = datetime.utcnow()
        for prev_lat, prev_lon, prev_status, prev_created in prev_status_map:
            dist = haversine_meters(center_lat, center_lon, prev_lat, prev_lon)
            if dist <= 25.0:
                matched_status = prev_status
                created_time = prev_created
                break

        cluster = Cluster(
            id=int(c_id),
            centroid_lat=center_lat,
            centroid_lon=center_lon,
            detection_count=len(det_list),
            dominant_type=dominant_type,
            max_severity=max_sev,
            rpi_score=rpi,
            status=matched_status,
            road_name=road_name,
            nearest_poi=nearest_poi,
            poi_distance_m=poi_dist,
            contractor_name=contractor.get("name", "Greater Chennai PWD"),
            contractor_contact=contractor.get("contact", "+91 44 2538 4520"),
            sla_hours=contractor.get("sla_hours", 48),
            created_at=created_time,
            updated_at=datetime.utcnow()
        )
        db_session.add(cluster)
        created_clusters += 1

    db_session.commit()
    return created_clusters
