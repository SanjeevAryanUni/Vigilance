"""
Unit and Integration Tests for Track 1 (Plan 1):
- Multi-City Configuration and Switching
- PWD Municipal Audit Report Generation (JSON, PDF, CSV)
- Fleet Position Upsert Logic
- IRC Schedule of Rates Budget Estimation
"""
import io
import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vigilance-prototype", "backend")))

from poi_data import (
    set_active_city,
    get_active_city,
    get_all_cities_summary,
    get_active_city_config,
    estimate_repair_cost,
    match_nearest_road,
    CITY_CONFIGS,
    IRC_REPAIR_RATES,
)
from pdf_report import generate_pwd_pdf, generate_pwd_csv
from database import SessionLocal, init_db
from models import FleetPosition, Detection


def test_city_config_integrity():
    """Verify city_config contains Chennai, Bangalore, and Delhi with required keys."""
    assert "chennai" in CITY_CONFIGS
    assert "bangalore" in CITY_CONFIGS
    assert "delhi" in CITY_CONFIGS

    for city in ["chennai", "bangalore", "delhi"]:
        cfg = CITY_CONFIGS[city]
        assert "display_name" in cfg
        assert "center" in cfg
        assert "lat" in cfg["center"]
        assert "lon" in cfg["center"]
        assert "municipal_body" in cfg
        assert "roads" in cfg
        assert len(cfg["roads"]) > 0
        assert "pois" in cfg
        assert len(cfg["pois"]) > 0
        assert "contractors" in cfg


def test_multi_city_switching():
    """Verify dynamic switching of active city."""
    original_city = get_active_city()

    # Switch to Bangalore
    name_blr = set_active_city("bangalore")
    assert name_blr == "Bangalore"
    assert get_active_city() == "bangalore"
    blr_road = match_nearest_road(12.9352, 77.6245)
    assert "Outer Ring Road" in blr_road

    # Switch to Delhi
    name_del = set_active_city("delhi")
    assert name_del == "Delhi"
    assert get_active_city() == "delhi"
    del_road = match_nearest_road(28.6100, 77.2400)
    assert "Ring Road" in del_road

    # Invalid city should raise ValueError
    with pytest.raises(ValueError):
        set_active_city("atlantis")

    # Restore Chennai
    set_active_city(original_city)
    assert get_active_city() == "chennai"


def test_irc_repair_budget_estimation():
    """Verify IRC:SP:20 repair rate calculation across defect types."""
    d40 = estimate_repair_cost("D40", area_sqm=2.0)
    assert d40["damage_class"] == "D40"
    assert d40["rate_per_sqm_inr"] == 4500
    assert d40["estimated_cost_inr"] == 9000.0

    d20 = estimate_repair_cost("D20", area_sqm=3.0)
    assert d20["damage_class"] == "D20"
    assert d20["rate_per_sqm_inr"] == 2800
    assert d20["estimated_cost_inr"] == 8400.0

    d00 = estimate_repair_cost("D00", area_sqm=1.0)
    assert d00["rate_per_sqm_inr"] == 850
    assert d00["estimated_cost_inr"] == 850.0


def test_pdf_report_generation():
    """Verify PDF generator produces a valid binary PDF document."""
    sample_detections = [
        {
            "id": 101,
            "lat": 13.0067,
            "lon": 80.2030,
            "road_name": "Guindy Kathipara Junction, Chennai",
            "damage_type": "D40 (Pothole)",
            "severity": "Critical",
            "confidence": 0.94,
            "detected_at": "2026-09-25T12:00:00"
        }
    ]
    pdf_bytes = generate_pwd_pdf(sample_detections)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")


def test_csv_report_generation():
    """Verify CSV generator produces properly formatted table with headers."""
    sample_detections = [
        {
            "id": 201,
            "lat": 12.9516,
            "lon": 80.1462,
            "road_name": "GST Road, Tambaram, Chennai",
            "damage_type": "D20",
            "severity": "High",
            "confidence": 0.88,
            "detected_at": "2026-09-25T11:30:00"
        }
    ]
    csv_str = generate_pwd_csv(sample_detections)
    lines = csv_str.strip().splitlines()
    assert len(lines) == 2
    assert "ID,Latitude,Longitude,Road Name" in lines[0]
    assert "201,12.9516,80.1462" in lines[1]
    assert "L&T" in lines[1]


def test_fleet_position_upsert(client):
    """Verify _update_fleet_position updates existing records without row duplication."""
    from main import _update_fleet_position

    db = SessionLocal()
    test_bus_id = "TEST-UPSERT-BUS-99"

    try:
        # First position ping
        _update_fleet_position(db, test_bus_id, 13.0067, 80.2030, speed_kmh=30.0)
        p1 = db.query(FleetPosition).filter(FleetPosition.vehicle_id == test_bus_id).all()
        assert len(p1) == 1
        assert p1[0].lat == 13.0067
        assert p1[0].speed_kmh == 30.0

        # Second position ping from same vehicle
        _update_fleet_position(db, test_bus_id, 13.0100, 80.2100, speed_kmh=45.0)
        p2 = db.query(FleetPosition).filter(FleetPosition.vehicle_id == test_bus_id).all()
        # Row count MUST remain 1 (upsert, not insert)
        assert len(p2) == 1
        assert p2[0].lat == 13.0100
        assert p2[0].speed_kmh == 45.0
    finally:
        db.query(FleetPosition).filter(FleetPosition.vehicle_id == test_bus_id).delete()
        db.commit()
        db.close()


def test_api_reports_pwd_summary_endpoints(client):
    """Verify /api/reports/pwd-summary returns JSON, PDF, and CSV responses."""
    # 1. JSON
    r_json = client.get("/api/reports/pwd-summary?format=json")
    assert r_json.status_code == 200
    data = r_json.json()
    assert "city" in data
    assert "total_defects" in data
    assert "estimated_total_budget_inr" in data

    # 2. PDF
    r_pdf = client.get("/api/reports/pwd-summary?format=pdf")
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert r_pdf.content.startswith(b"%PDF")

    # 3. CSV
    r_csv = client.get("/api/reports/pwd-summary?format=csv")
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]
    assert b"ID,Latitude,Longitude,Road Name" in r_csv.content


def test_api_city_endpoints(client):
    """Verify /api/cities, /api/cities/switch, and /api/cities/config endpoints."""
    # List cities
    r_list = client.get("/api/cities")
    assert r_list.status_code == 200
    res = r_list.json()
    assert "cities" in res
    assert len(res["cities"]) >= 3

    # Switch city to bangalore
    r_switch = client.post("/api/cities/switch?city_key=bangalore")
    assert r_switch.status_code == 200
    s_data = r_switch.json()
    assert s_data["active_city"] == "bangalore"

    # Get config for bangalore
    r_cfg = client.get("/api/cities/config")
    assert r_cfg.status_code == 200
    c_data = r_cfg.json()
    assert c_data["city"] == "bangalore"
    assert "BBMP" in c_data["municipal_body"]

    # Switch back to chennai
    client.post("/api/cities/switch?city_key=chennai")
