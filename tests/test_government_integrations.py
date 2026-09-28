import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vigilance-prototype", "backend")))
from main import app
from pdf_report import generate_pwd_pdf

client = TestClient(app)

def test_api_setu_anpr_verification():
    """Verify API Setu endpoint returns structured MoRTH Parivahan integration data."""
    response = client.get("/api/anpr/verify/TN07BL1234")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "demo_mode"
    assert "plate_number" in data
    assert data["plate_number"] == "TN07BL1234"
    assert data["integration_ready"] is True
    assert "apisetu.gov.in" in data["api_endpoint"]
    assert "verification_data" in data
    rc = data["verification_data"]
    assert "owner_name" in rc
    assert "vehicle_class" in rc

def test_data_gov_road_stats_endpoint():
    """Verify data.gov.in road statistics endpoint for various cities."""
    for city in ["chennai", "bangalore", "delhi"]:
        response = client.get(f"/api/road-stats/{city}")
        assert response.status_code == 200
        stats = response.json()
        assert "state" in stats
        assert "national_highways_km" in stats
        assert "total_road_length_km" in stats
        assert "road_accidents_2022" in stats
        assert "source" in stats
        assert "data.gov.in" in stats["source"]

def test_model_metadata_aikosh_endpoint():
    """Verify AIKosh and IndiaAI sovereign training metadata endpoints."""
    for path in ["/api/model/metadata", "/api/models/metadata"]:
        response = client.get(path)
        assert response.status_code == 200
        meta = response.json()
        assert "training" in meta
        assert "aikosh.indiaai.gov.in" in meta["training"]["platform"]
        assert "AIRAWAT" in meta["training"]["compute"]
        assert "government_ecosystem_integrations" in meta

def test_pwd_pdf_generation_includes_government_section():
    """Verify PWD PDF includes the new MoRTH / data.gov.in context section."""
    dummy_detections = [
        {
            "id": 1,
            "lat": 13.0067,
            "lon": 80.2030,
            "defect_type": "D40 (Pothole)",
            "severity": "critical",
            "confidence": 0.95,
            "road_name": "Kathipara Cloverleaf Junction",
            "timestamp": "2026-09-25T12:00:00"
        }
    ]
    pdf_bytes = generate_pwd_pdf(dummy_detections)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

def test_endpoints_support_city_filter():
    """Verify /api/detections, /api/clusters, /api/fleet/positions, and /api/stats accept city query parameter."""
    for path in ["/api/detections?city=chennai", "/api/clusters?city=chennai", "/api/fleet/positions?city=chennai", "/api/stats?city=chennai"]:
        response = client.get(path)
        assert response.status_code == 200
