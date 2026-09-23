"""
Unit and Integration Tests for Track A2 Components:
- MQTT Listener & Ingestion
- Edge Traffic Detector
- ANPR Plate Reader
- Multi-Signal Incident Detector
"""
import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vigilance-prototype", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vigilance-prototype", "edge")))

from database import SessionLocal, init_db
from models import Detection, TrafficObservation, FleetPosition, IncidentReport, Cluster
from traffic_detector import TrafficDetector
from anpr_detector import ANPRDetector
from incident_detector import IncidentDetector
from mqtt_listener import _handle_detection, _handle_traffic, _handle_heartbeat, _handle_incident


def test_traffic_detector_simulation():
    td = TrafficDetector()
    res = td.detect(frame=None, lat=13.0067, lon=80.2030, vehicle_id="BUS-TEST-01")
    assert "vehicle_count" in res
    assert "pedestrian_count" in res
    assert "density" in res
    assert res["density"] in ["free_flow", "light", "moderate", "heavy", "gridlock"]
    assert res["vehicle_id"] == "BUS-TEST-01"


def test_incident_detector_logic():
    detector = IncidentDetector(speed_limit=60.0)

    # 1. Rash Driving: speed > 60 with pedestrians
    rash = detector.analyze(
        traffic_data={"pedestrian_count": 2},
        anpr_results=[{"plate_text": "TN01AB1234", "confidence": 0.95}],
        vehicle_speed=75.0,
    )
    assert len(rash) == 1
    assert rash[0]["incident_type"] == "rash_driving"
    assert rash[0]["plate_text"] == "TN01AB1234"

    # 2. Speeding: speed > 60 * 1.3 (78km/h) without pedestrians
    speeding = detector.analyze(
        traffic_data={"pedestrian_count": 0},
        anpr_results=[{"plate_text": "TN02CD5678", "confidence": 0.90}],
        vehicle_speed=82.0,
    )
    assert len(speeding) == 1
    assert speeding[0]["incident_type"] == "speeding"

    # 3. Hit and Run: road damage + speed > 50
    hit_run = detector.analyze(
        traffic_data={"pedestrian_count": 0},
        anpr_results=[{"plate_text": "TN09EF9012", "confidence": 0.92}],
        road_damage=[{"defect_type": "D40", "severity": "critical", "confidence": 0.85}],
        vehicle_speed=65.0,
    )
    assert len(hit_run) == 1
    assert hit_run[0]["incident_type"] == "hit_and_run"


def test_anpr_detector_regex():
    anpr = ANPRDetector()
    plates = anpr.detect_plates(frame=None)
    assert isinstance(plates, list)


def test_mqtt_listener_ingestion(client):
    init_db()

    # Ingest detection
    det_payload = json.dumps({
        "defect_type": "D40",
        "confidence": 0.95,
        "severity": "critical",
        "lat": 13.0604,
        "lon": 80.2496,
        "vehicle_id": "BUS-TN02-3891",
        "road_name": "Anna Salai (Mount Road)"
    })
    _handle_detection(det_payload)

    # Ingest traffic
    traffic_payload = json.dumps({
        "vehicle_id": "BUS-TN02-3891",
        "lat": 13.0604,
        "lon": 80.2496,
        "vehicle_count": 14,
        "pedestrian_count": 2,
        "density": "heavy",
        "speed_kmh": 22.5,
        "road_name": "Anna Salai (Mount Road)"
    })
    _handle_traffic(traffic_payload)

    # Ingest heartbeat
    heartbeat_payload = json.dumps({
        "vehicle_id": "BUS-TN02-3891",
        "lat": 13.0604,
        "lon": 80.2496,
        "speed_kmh": 22.5,
        "road_name": "Anna Salai (Mount Road)",
        "status": "active"
    })
    _handle_heartbeat(heartbeat_payload)

    # Ingest incident
    incident_payload = json.dumps({
        "incident_type": "rash_driving",
        "plate_text": "TN02CD5678",
        "plate_confidence": 0.92,
        "lat": 13.0604,
        "lon": 80.2496,
        "speed_kmh": 74.0,
        "road_name": "Anna Salai (Mount Road)"
    })
    _handle_incident(incident_payload)

    db = SessionLocal()
    assert db.query(Detection).filter(Detection.vehicle_id == "BUS-TN02-3891").count() >= 1
    assert db.query(TrafficObservation).filter(TrafficObservation.vehicle_id == "BUS-TN02-3891").count() >= 1
    assert db.query(FleetPosition).filter(FleetPosition.vehicle_id == "BUS-TN02-3891").count() >= 1
    assert db.query(IncidentReport).filter(IncidentReport.plate_text == "TN02CD5678").count() >= 1
    db.close()
