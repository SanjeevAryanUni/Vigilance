#!/usr/bin/env python3
"""
VIGILANCE - Termux Android Client (Real GPS Telemetry Node)
Sends real GPS location from Android phone via termux-location to FastAPI backend.

Usage on Android Phone:
1. Install Termux & Termux:API from F-Droid
2. In Termux terminal run:
   pkg update && pkg install -y python termux-api
   pip install requests
3. Set your laptop's LAN IP address:
   export VIGILANCE_API_URL="http://10.3.53.20:8000/api/detections"
4. Run:
   python termux_client.py
"""

import os
import sys
import json
import subprocess
import requests

def get_termux_location():
    """
    Executes 'termux-location' to get real Android device location coordinates.
    Tries network, passive, default, and satellite providers with graceful timeouts.
    Returns a dict with 'latitude', 'longitude', 'accuracy', and 'provider'.
    """
    # Provider strategies (network provider is fastest indoors)
    provider_cmds = [
        ["termux-location", "-p", "network", "-r", "once"],
        ["termux-location", "-p", "passive", "-r", "once"],
        ["termux-location", "-r", "once"],
        ["termux-location", "-p", "gps", "-r", "once"],
    ]

    termux_api_installed = False
    for cmd in provider_cmds:
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            termux_api_installed = True
            if res.returncode == 0 and res.stdout.strip():
                data = json.loads(res.stdout)
                lat = data.get("latitude")
                lon = data.get("longitude")
                if lat is not None and lon is not None:
                    return {
                        "latitude": float(lat),
                        "longitude": float(lon),
                        "accuracy": float(data.get("accuracy", 0.0)),
                        "provider": str(data.get("provider", "android-location"))
                    }
        except FileNotFoundError:
            raise RuntimeError(
                "Command 'termux-location' not found.\n"
                "Please install termux-api package in Termux:\n"
                "  pkg install termux-api"
            )
        except (subprocess.TimeoutExpired, Exception):
            continue

    if not termux_api_installed:
        raise RuntimeError("Command 'termux-location' not found. Please run: pkg install termux-api")

    raise RuntimeError(
        "termux-location returned no data from network/GPS providers.\n"
        "Please verify on your Android phone:\n"
        "  1. Location / GPS toggle is turned ON in phone Quick Settings.\n"
        "  2. Open Android Settings -> Apps -> Termux:API -> Permissions -> Allow Location.\n"
        "  3. Open Android Settings -> Apps -> Termux -> Permissions -> Allow Location."
    )

def main():
    api_url = os.getenv("VIGILANCE_API_URL", "http://127.0.0.1:8000/api/detections")
    
    if not api_url.endswith("/api/detections"):
        api_url = api_url.rstrip("/") + "/api/detections"

    vehicle_id = os.getenv("VIGILANCE_VEHICLE_ID", "ANDROID-TERMUX-01")

    print("=" * 60)
    print(" VIGILANCE - TERMUX REAL GPS TELEMETRY CLIENT")
    print("=" * 60)
    print(f" Target Backend: {api_url}")
    print(f" Sensing Node:   {vehicle_id}")
    print("-" * 60)

    print("[GPS] Requesting real GPS coordinates from Termux API...")
    try:
        loc = get_termux_location()
        lat = loc["latitude"]
        lon = loc["longitude"]
        accuracy = loc["accuracy"]
        provider = loc["provider"]
        print(f"  [OK] Location Acquired: Lat={lat}, Lon={lon} (Accuracy: {accuracy}m, Provider: {provider})")
    except Exception as err:
        print(f"\n[ERROR] GPS Failure: {err}")
        sys.exit(1)

    payload = {
        "defect_type": "D40",
        "confidence": 0.92,
        "severity": "critical",
        "vehicle_id": vehicle_id,
        "lat": lat,
        "lon": lon,
        "road_name": None,
        "thumbnail_b64": None
    }

    print(f"\n[POST] Sending payload to {api_url}...")
    print(f"       Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        print("-" * 60)
        print(f"[RECV] HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            resp_data = response.json()
            print(f"  [OK] Response: {json.dumps(resp_data)}")
            print("\n[SUCCESS] Detection transmitted successfully! Check your WebGIS Dashboard.")
        else:
            print(f"  [ERROR] Server Returned Error: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] HTTP Connection Failed: {e}")
        print(f"        Check that your laptop's backend is running on 0.0.0.0:8000 and that your phone is on the same Wi-Fi network.")
        sys.exit(1)

if __name__ == "__main__":
    main()
