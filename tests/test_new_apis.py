"""
Unit and integration tests for newly added Urban Intelligence APIs:
- /api/traffic & /api/traffic/stats
- /api/congestion & /api/heatmap/congestion
- /api/incidents
- /api/analytics/od-matrix & /api/analytics/delays
- /api/fleet/positions
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vigilance-prototype", "backend")))
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_traffic_ingestion_and_stats(client):
    # Post traffic observation
    payload = {
        "lat": 13.0067,
        "lon": 80.2030,
        "vehicle_count": 15,
        "pedestrian_count": 5,
        "density": "heavy",
        "speed_kmh": 22.5,
        "road_name": "Guindy Kathipara Junction, Chennai",
        "vehicle_id": "TEST-BUS-01"
    }
    res = client.post("/api/traffic", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "success"

    # Query traffic stats
    stats_res = client.get("/api/traffic/stats")
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert "vehicles_24h" in data
    assert "pedestrians_24h" in data
    assert "avg_speed_kmh" in data
    assert data["vehicles_24h"] >= 15


def test_congestion_apis(client):
    res = client.get("/api/congestion")
    assert res.status_code == 200
    corridors = res.json()
    assert isinstance(corridors, list)
    assert len(corridors) > 0
    assert "congestion_index" in corridors[0]
    assert "level" in corridors[0]

    heat_res = client.get("/api/heatmap/congestion")
    assert heat_res.status_code == 200
    assert isinstance(heat_res.json(), list)


def test_incidents_api(client):
    payload = {
        "incident_type": "speeding",
        "plate_text": "TN07AB1234",
        "plate_confidence": 0.92,
        "vehicle_class": "car",
        "lat": 12.9516,
        "lon": 80.1462,
        "speed_kmh": 88.0,
        "road_name": "GST Road (NH-32)"
    }
    res = client.post("/api/incidents", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "success"
    assert res.json()["plate_text"] == "TN07AB1234"

    list_res = client.get("/api/incidents")
    assert list_res.status_code == 200
    incidents = list_res.json()
    assert any(i.get("plate_text") == "TN07AB1234" for i in incidents)


def test_mobility_and_delays(client):
    od_res = client.get("/api/analytics/od-matrix")
    assert od_res.status_code == 200
    od_data = od_res.json()
    assert "pairs" in od_data
    assert "stops" in od_data

    delays_res = client.get("/api/analytics/delays")
    assert delays_res.status_code == 200
    delays = delays_res.json()
    assert isinstance(delays, list)
    assert len(delays) > 0
    assert "delay_min" in delays[0]
    assert "tti" in delays[0]


def test_fleet_positions(client):
    res = client.get("/api/fleet/positions")
    assert res.status_code == 200
    positions = res.json()
    assert isinstance(positions, list)
    assert len(positions) > 0
    assert "vehicle_id" in positions[0]
    assert "lat" in positions[0]
    assert "lon" in positions[0]
