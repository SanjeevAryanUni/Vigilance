"""
VIGILANCE — Unit Tests for Spatial Deduplication & Clustering
"""

import pytest
from models import Detection, Cluster
from dbscan_dedup import run_spatial_deduplication
from poi_data import haversine_meters


def test_spatial_clustering_within_15m_threshold(db_session):
    """
    Verify that multiple vehicle passes within 15m radius are merged into 1 cluster.
    (13.006700, 80.203000) to (13.006750, 80.203050) is ~7.8 meters apart (<15m).
    """
    lat_base = 13.006700
    lon_base = 80.203000

    # Verify physical distance is well under 15m
    dist = haversine_meters(lat_base, lon_base, 13.006750, 80.203050)
    assert dist < 15.0, f"Distance {dist}m should be < 15m"

    # Bus 1 pass
    d1 = Detection(
        defect_type="D40",
        confidence=0.88,
        severity="high",
        vehicle_id="BUS-TN01-1042",
        lat=lat_base,
        lon=lon_base,
        road_name="GST Road, Tambaram, Chennai"
    )
    # Bus 2 pass (approx 7.8m away)
    d2 = Detection(
        defect_type="D40",
        confidence=0.92,
        severity="critical",
        vehicle_id="BUS-TN01-2098",
        lat=13.006750,
        lon=80.203050,
        road_name="GST Road, Tambaram, Chennai"
    )

    db_session.add_all([d1, d2])
    db_session.commit()

    # Execute spatial deduplication
    cluster_count = run_spatial_deduplication(db_session, eps_meters=15.0)

    assert cluster_count == 1, f"Expected 1 merged cluster, got {cluster_count}"
    clusters = db_session.query(Cluster).all()
    assert len(clusters) == 1

    c = clusters[0]
    assert c.detection_count == 2
    assert c.max_severity == "critical"  # Max severity upgraded from critical + high
    assert c.dominant_type == "D40"


def test_spatial_clustering_distinct_clusters_over_15m(db_session):
    """
    Verify that detections separated by more than 15m form separate distinct clusters.
    (13.0067, 80.2030) and (13.0085, 80.2120) are ~1000m apart.
    """
    d1 = Detection(
        defect_type="D40",
        confidence=0.85,
        severity="medium",
        vehicle_id="BUS-01",
        lat=13.0067,
        lon=80.2030,
        road_name="Guindy Kathipara Junction, Chennai"
    )
    d2 = Detection(
        defect_type="D20",
        confidence=0.82,
        severity="high",
        vehicle_id="BUS-02",
        lat=13.0085,
        lon=80.2120,
        road_name="Guindy Station Link, Chennai"
    )

    db_session.add_all([d1, d2])
    db_session.commit()

    cluster_count = run_spatial_deduplication(db_session, eps_meters=15.0)
    assert cluster_count == 2, f"Expected 2 separate clusters, got {cluster_count}"

    clusters = db_session.query(Cluster).all()
    assert len(clusters) == 2


def test_centroid_accuracy(db_session):
    """Verify that cluster centroid is the mathematical average of member coordinates."""
    lat1, lon1 = 13.006700, 80.203000
    lat2, lon2 = 13.006740, 80.203040

    d1 = Detection(defect_type="D40", confidence=0.9, severity="high", vehicle_id="B1", lat=lat1, lon=lon1)
    d2 = Detection(defect_type="D40", confidence=0.9, severity="high", vehicle_id="B2", lat=lat2, lon=lon2)
    db_session.add_all([d1, d2])
    db_session.commit()

    run_spatial_deduplication(db_session, eps_meters=15.0)

    cluster = db_session.query(Cluster).first()
    expected_lat = (lat1 + lat2) / 2.0
    expected_lon = (lon1 + lon2) / 2.0

    assert cluster.centroid_lat == pytest.approx(expected_lat, abs=1e-5)
    assert cluster.centroid_lon == pytest.approx(expected_lon, abs=1e-5)


def test_status_preservation_across_recurring_passes(db_session):
    """
    Verify that when an operator assigns or resolves a cluster,
    subsequent bus passes do not reset its status back to 'open'.
    """
    d1 = Detection(
        defect_type="D40",
        confidence=0.90,
        severity="critical",
        vehicle_id="BUS-TN01-1042",
        lat=13.0067,
        lon=80.2030,
        road_name="GST Road, Tambaram, Chennai"
    )
    db_session.add(d1)
    db_session.commit()

    run_spatial_deduplication(db_session)
    cluster = db_session.query(Cluster).first()
    assert cluster.status == "open"

    # PWD Operator marks cluster as assigned
    cluster.status = "assigned"
    db_session.commit()

    # Later: Another bus detects the same pothole
    d2 = Detection(
        defect_type="D40",
        confidence=0.95,
        severity="critical",
        vehicle_id="BUS-TN01-3011",
        lat=13.00672,
        lon=80.20302,
        road_name="GST Road, Tambaram, Chennai"
    )
    db_session.add(d2)
    db_session.commit()

    # Re-run spatial deduplication
    run_spatial_deduplication(db_session)
    updated_cluster = db_session.query(Cluster).first()

    assert updated_cluster.status == "assigned", f"Expected 'assigned' status preserved, got '{updated_cluster.status}'"
    assert updated_cluster.detection_count == 2


def test_distinct_defects_20m_apart_retain_independent_status_r09(db_session):
    """
    R09 Audit Regression Test:
    Two distinct defects ~20m apart (greater than 15m DBSCAN threshold).
    Resolve the first defect ('resolved'). The second defect is 'open'.
    Rerunning deduplication must NOT transfer the resolved status to the nearby open defect.
    """
    lat1, lon1 = 13.006700, 80.203000
    # ~20.0 meters away along latitude (0.00018 deg lat ~ 20.0m)
    lat2, lon2 = 13.006880, 80.203000
    dist = haversine_meters(lat1, lon1, lat2, lon2)
    assert 18.0 <= dist <= 22.0, f"Test fixture requires ~20m distance, got {dist}m"

    d1 = Detection(
        defect_type="D40",
        confidence=0.92,
        severity="critical",
        vehicle_id="BUS-01",
        lat=lat1,
        lon=lon1,
        road_name="GST Road, Tambaram, Chennai"
    )
    d2 = Detection(
        defect_type="D40",
        confidence=0.89,
        severity="high",
        vehicle_id="BUS-02",
        lat=lat2,
        lon=lon2,
        road_name="GST Road, Tambaram, Chennai"
    )
    db_session.add_all([d1, d2])
    db_session.commit()

    run_spatial_deduplication(db_session, eps_meters=15.0)
    clusters = db_session.query(Cluster).all()
    assert len(clusters) == 2, "Expected 2 distinct clusters"

    # Mark cluster 1 as resolved
    c1 = next(c for c in clusters if haversine_meters(c.centroid_lat, c.centroid_lon, lat1, lon1) < 5.0)
    c2 = next(c for c in clusters if haversine_meters(c.centroid_lat, c.centroid_lon, lat2, lon2) < 5.0)
    c1.status = "resolved"
    c2.status = "open"
    db_session.commit()

    # Rerun deduplication
    run_spatial_deduplication(db_session, eps_meters=15.0)

    re_clusters = db_session.query(Cluster).all()
    assert len(re_clusters) == 2

    re_c1 = next(c for c in re_clusters if haversine_meters(c.centroid_lat, c.centroid_lon, lat1, lon1) < 5.0)
    re_c2 = next(c for c in re_clusters if haversine_meters(c.centroid_lat, c.centroid_lon, lat2, lon2) < 5.0)

    assert re_c1.status == "resolved", f"Cluster 1 should be 'resolved', got '{re_c1.status}'"
    assert re_c2.status == "open", f"Cluster 2 should remain 'open', got '{re_c2.status}' (R09 regression: status stolen)"
