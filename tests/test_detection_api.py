"""
VIGILANCE — Integration Tests for FastAPI REST Endpoints & Security Validation
"""

import pytest


def test_health_endpoints(client):
    """Verify system health check endpoints return 200 and online status."""
    resp_root = client.get("/health")
    assert resp_root.status_code == 200
    assert resp_root.json().get("status") == "healthy"
    assert "VIGILANCE" in resp_root.json().get("service", "")

    resp_api = client.get("/api/health")
    assert resp_api.status_code == 200
    assert resp_api.json().get("status") == "healthy"


def test_create_and_query_detections(client):
    """Verify POST /api/detections ingests telemetry and triggers deduplication."""
    payload = {
        "defect_type": "D40",
        "confidence": 0.94,
        "severity": "critical",
        "vehicle_id": "TEST-BUS-01",
        "lat": 13.0067,
        "lon": 80.2030,
        "road_name": "GST Road, Tambaram, Chennai"
    }
    post_resp = client.post("/api/detections", json=payload)
    assert post_resp.status_code in [200, 201]
    data = post_resp.json()
    assert data["status"] == "success"
    assert "id" in data

    # Verify GET /api/detections
    get_resp = client.get("/api/detections")
    assert get_resp.status_code == 200
    detections = get_resp.json()
    assert len(detections) >= 1
    assert detections[0]["defect_type"] == "D40"
    assert detections[0]["severity"] == "critical"

    # Verify GET /api/clusters
    cluster_resp = client.get("/api/clusters")
    assert cluster_resp.status_code == 200
    clusters = cluster_resp.json()
    assert len(clusters) >= 1
    assert clusters[0]["rpi_score"] >= 10.0


def test_stats_endpoint(client):
    """Verify GET /api/stats computes summary metrics without runtime errors."""
    # Seed 2 detections
    d1 = {"defect_type": "D40", "confidence": 0.9, "severity": "critical", "vehicle_id": "BUS-01", "lat": 13.0067, "lon": 80.2030}
    d2 = {"defect_type": "D20", "confidence": 0.8, "severity": "high", "vehicle_id": "BUS-02", "lat": 13.0604, "lon": 80.2496}
    client.post("/api/detections", json=d1)
    client.post("/api/detections", json=d2)

    resp = client.get("/api/stats")
    assert resp.status_code == 200
    stats = resp.json()

    assert stats["total_detections"] >= 2
    assert stats["potholes"] >= 1
    assert stats["cracks"] >= 1
    assert stats["active_vehicles"] >= 2
    assert "vehicle_ids" in stats
    assert "active_corridors" in stats


def test_invalid_coordinates_validation(client):
    """Verify input validation rejects coordinates outside valid geographic range."""
    invalid_lat_payload = {
        "defect_type": "D40",
        "confidence": 0.9,
        "severity": "critical",
        "vehicle_id": "BUS-01",
        "lat": 135.0,  # Invalid latitude (> 90.0)
        "lon": 80.2030
    }
    resp_lat = client.post("/api/detections", json=invalid_lat_payload)
    assert resp_lat.status_code == 422

    invalid_lon_payload = {
        "defect_type": "D40",
        "confidence": 0.9,
        "severity": "critical",
        "vehicle_id": "BUS-01",
        "lat": 13.0067,
        "lon": 250.0  # Invalid longitude (> 180.0)
    }
    resp_lon = client.post("/api/detections", json=invalid_lon_payload)
    assert resp_lon.status_code == 422


def test_cluster_status_update_patch_and_post(client):
    """Verify both PATCH and POST update operational cluster status and validate inputs."""
    # Create detection to produce a cluster
    payload = {
        "defect_type": "D40",
        "confidence": 0.95,
        "severity": "critical",
        "vehicle_id": "BUS-01",
        "lat": 13.0067,
        "lon": 80.2030
    }
    client.post("/api/detections", json=payload)
    clusters = client.get("/api/clusters").json()
    cluster_id = clusters[0]["id"]

    # Test PATCH to 'assigned'
    patch_resp = client.patch(f"/api/clusters/{cluster_id}/status?status=assigned")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["new_status"] == "assigned"

    # Test POST to 'resolved'
    post_resp = client.post(f"/api/clusters/{cluster_id}/status?status=resolved")
    assert post_resp.status_code == 200
    assert post_resp.json()["new_status"] == "resolved"

    # Test invalid status returns 422
    invalid_resp = client.patch(f"/api/clusters/{cluster_id}/status?status=invalid_status")
    assert invalid_resp.status_code == 422

    # Test non-existent cluster returns 404
    not_found_resp = client.patch("/api/clusters/99999/status?status=resolved")
    assert not_found_resp.status_code == 404


def test_detect_image_size_limit(client):
    """Verify DoS / memory-exhaustion protection rejects oversized base64 images."""
    oversized_payload = {
        "image_b64": "A" * (11 * 1024 * 1024),  # 11MB string (> 10MB limit)
        "lat": 13.0067,
        "lon": 80.2030
    }
    resp = client.post("/api/detect", json=oversized_payload)
    assert resp.status_code == 413
    assert "Payload too large" in resp.json()["detail"]


def test_trigger_dedup_endpoint(client):
    """Verify manual deduplication trigger returns success."""
    resp = client.post("/api/trigger-dedup")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert "clusters_updated" in resp.json()
