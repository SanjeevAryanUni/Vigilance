"""
VIGILANCE — End-to-End System Pipeline Integration Test
"""

import pytest


def test_full_urban_intelligence_pipeline(client):
    """
    Validates complete end-to-end operational flow:
    1. Multiple transit nodes stream detections to /api/detections
    2. Spatial deduplication automatically clusters reports within 15m radius
    3. Dynamic RPI ranks clusters by composite risk
    4. Municipal command center retrieves stats and work orders
    5. PWD operator updates status and workflow continuity is preserved
    """
    # Step 1: Bus 1042 detects critical pothole on GST Road
    det1 = {
        "defect_type": "D40",
        "confidence": 0.91,
        "severity": "critical",
        "vehicle_id": "BUS-TN01-1042",
        "lat": 13.006700,
        "lon": 80.203000,
        "road_name": "GST Road, Tambaram, Chennai"
    }
    r1 = client.post("/api/detections", json=det1)
    assert r1.status_code in [200, 201]

    # Step 2: Bus 2098 passes same spot 10 minutes later (6 meters away)
    det2 = {
        "defect_type": "D40",
        "confidence": 0.94,
        "severity": "critical",
        "vehicle_id": "BUS-TN01-2098",
        "lat": 13.006740,
        "lon": 80.203030,
        "road_name": "GST Road, Tambaram, Chennai"
    }
    r2 = client.post("/api/detections", json=det2)
    assert r2.status_code in [200, 201]

    # Step 3: Bus 3011 detects minor crack on Poonamallee High Road (several km away)
    det3 = {
        "defect_type": "D00",
        "confidence": 0.75,
        "severity": "low",
        "vehicle_id": "BUS-TN01-3011",
        "lat": 13.082700,
        "lon": 80.270700,
        "road_name": "Poonamallee High Road, Chennai"
    }
    r3 = client.post("/api/detections", json=det3)
    assert r3.status_code in [200, 201]

    # Step 4: Verify Clusters
    clusters_resp = client.get("/api/clusters")
    assert clusters_resp.status_code == 200
    clusters = clusters_resp.json()

    # Must produce exactly 2 clusters: GST Road (2 merged detections) and Poonamallee (1 detection)
    assert len(clusters) == 2

    # Verify RPI ordering (GST Road critical pothole must outrank minor crack)
    gst_cluster = next(c for c in clusters if "GST Road" in c["road_name"])
    poon_cluster = next(c for c in clusters if "Poonamallee" in c["road_name"])

    assert gst_cluster["detection_count"] == 2
    assert gst_cluster["dominant_type"] == "D40"
    assert gst_cluster["max_severity"] == "critical"
    assert gst_cluster["rpi_score"] > poon_cluster["rpi_score"], "Critical pothole on highway must have higher RPI than low crack"
    assert gst_cluster["sla_hours"] == 24
    assert "L&T" in gst_cluster["contractor_name"]

    # Step 5: Verify Command Center Stats
    stats_resp = client.get("/api/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_detections"] == 3
    assert stats["deduplicated_clusters"] == 2
    assert stats["potholes"] == 2
    assert stats["cracks"] == 1
    assert stats["active_vehicles"] == 3

    # Step 6: Operator marks GST Road cluster as 'assigned' to contractor
    patch_resp = client.patch(f"/api/clusters/{gst_cluster['id']}/status?status=assigned")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["new_status"] == "assigned"

    # Step 7: Trigger spatial deduplication again (simulating subsequent batch run)
    dedup_resp = client.post("/api/trigger-dedup")
    assert dedup_resp.status_code == 200

    # Step 8: Verify status was preserved
    clusters_after = client.get("/api/clusters").json()
    gst_after = next(c for c in clusters_after if "GST Road" in c["road_name"])
    assert gst_after["status"] == "assigned", "Status must remain 'assigned' across reclustering runs"

    # Step 9: Verify Work Orders matches clusters
    wo_resp = client.get("/api/work-orders")
    assert wo_resp.status_code == 200
    assert len(wo_resp.json()) == 2
