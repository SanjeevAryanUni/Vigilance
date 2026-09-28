"""
VIGILANCE — Unit Tests for API Security, Key Authentication, and Rate Limiting
"""

import os
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def sec_client():
    return TestClient(app)


def test_api_key_enforcement(sec_client, monkeypatch):
    """Verify that when API_KEY is configured in env, mutations reject unauthorized requests."""
    monkeypatch.setenv("API_KEY", "test_secret_sih_key_2026")

    # Attempt mutation without API key
    payload = {
        "defect_type": "D40",
        "confidence": 0.88,
        "severity": "high",
        "vehicle_id": "TEST-VEHICLE-01",
        "lat": 13.0067,
        "lon": 80.2030,
        "road_name": "Guindy Kathipara"
    }
    unauth_resp = sec_client.post("/api/detections", json=payload)
    assert unauth_resp.status_code == 401
    assert "Invalid or missing API key" in unauth_resp.json()["detail"]

    # Attempt mutation with invalid API key
    bad_resp = sec_client.post("/api/detections", json=payload, headers={"x-api-key": "wrong_key"})
    assert bad_resp.status_code == 401

    # Attempt mutation with valid API key
    valid_resp = sec_client.post("/api/detections", json=payload, headers={"x-api-key": "test_secret_sih_key_2026"})
    assert valid_resp.status_code == 201


def test_public_endpoints_unrestricted(sec_client, monkeypatch):
    """Verify read-only endpoints remain accessible without API keys."""
    monkeypatch.setenv("API_KEY", "test_secret_sih_key_2026")
    res = sec_client.get("/api/health")
    assert res.status_code == 200

    res_stats = sec_client.get("/api/stats")
    assert res_stats.status_code == 200


def test_cors_preflight(sec_client):
    """Verify CORS preflight responds with proper headers for allowed origins."""
    headers = {
        "Origin": "https://vigilance-sih.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, X-API-Key"
    }
    resp = sec_client.options("/api/detections", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "https://vigilance-sih.vercel.app"


def test_websocket_token_auth(sec_client):
    """Verify WebSocket connection handles tokens properly without NameError."""
    # Connecting without token or with matching token works
    with sec_client.websocket_connect("/ws") as ws:
        ws.send_text("ping")
        # Connection succeeds without crash

    with sec_client.websocket_connect("/ws?token=vigilance_sih_2026") as ws:
        ws.send_text("ping")
        # Connection succeeds with matching token
