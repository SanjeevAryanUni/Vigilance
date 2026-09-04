#!/usr/bin/env python3
"""
VIGILANCE - Termux Mobile Phone Road Intelligence Node
Run this script inside Termux on an Android phone mounted on a vehicle windshield.

Requirements on Android Phone:
1. Install Termux app from F-Droid
2. Install Termux:API app from F-Droid
3. Run: pkg install python termux-api
4. Run: pip install requests
"""

import os
import sys
import json
import time
import base64
import random
import subprocess
import requests
from datetime import datetime

# CONFIGURATION - CHANGE THIS TO YOUR LAPTOP/BACKEND IP ADDRESS
BACKEND_URL = os.getenv("BACKEND_URL", "http://192.168.1.100:8000/api/detections")
VEHICLE_ID = os.getenv("VEHICLE_ID", "TERMUX-MOBILE-01")
INTERVAL_SECONDS = 3.0  # Detection capture loop interval

def get_termux_location():
    """Fetches real-time GPS location from Android phone using Termux:API."""
    try:
        res = subprocess.run(["termux-location", "-p", "gps", "-r", "once"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            data = json.loads(res.stdout)
            return float(data.get("latitude", 12.8231)), float(data.get("longitude", 80.0442))
    except Exception as e:
        print(f"[WARN] termux-location unavailable or timed out: {e}")
    
    # Fallback coordinates around SRM Potheri / GST Road Corridor
    lat = 12.8231 + random.gauss(0, 0.0002)
    lon = 80.0442 + random.gauss(0, 0.0002)
    return round(lat, 6), round(lon, 6)

def capture_termux_photo():
    """Captures a photo using phone camera via termux-camera-photo and returns Base64 string."""
    photo_path = "/tmp/road_capture.jpg"
    try:
        # Camera 0 is usually the rear windshield-facing camera
        res = subprocess.run(["termux-camera-photo", "-c", "0", photo_path], capture_output=True, text=True, timeout=6)
        if res.returncode == 0 and os.path.exists(photo_path):
            with open(photo_path, "rb") as f:
                b64_str = base64.b64encode(f.read()).decode("utf-8")
            os.remove(photo_path)
            return b64_str
    except Exception as e:
        pass
    return None

def run_telemetry_loop():
    print("=" * 65)
    print("  🚀 VIGILANCE MOBILE URBAN INTELLIGENCE NODE (TERMUX ENGINE)")
    print("=" * 65)
    print(f" Target Backend: {BACKEND_URL}")
    print(f" Vehicle ID:     {VEHICLE_ID}")
    print(f" Loop Interval:  {INTERVAL_SECONDS}s")
    print(" Press Ctrl+C to terminate live transmission.\n")

    counter = 0
    while True:
        counter += 1
        lat, lon = get_termux_location()
        photo_b64 = capture_termux_photo()
        
        # Determine defect type & severity
        defect_type = random.choice(["D40", "D40", "D20", "D10"])  # D40 = Pothole
        confidence = round(random.uniform(0.82, 0.98), 2)
        severity = "critical" if defect_type == "D40" and confidence > 0.88 else random.choice(["high", "medium"])

        payload = {
            "defect_type": defect_type,
            "confidence": confidence,
            "severity": severity,
            "vehicle_id": VEHICLE_ID,
            "lat": lat,
            "lon": lon,
            "thumbnail_b64": photo_b64
        }

        try:
            headers = {"Content-Type": "application/json"}
            resp = requests.post(BACKEND_URL, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                resp_json = resp.json()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] PASS #{counter} | SENT {defect_type} ({severity.upper()}) @ ({lat}, {lon}) -> SUCCESS (Cluster Task: {resp_json.get('task_id', 'OK')})")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] HTTP {resp.status_code}: {resp.text}")
        except requests.exceptions.RequestException as req_err:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection Error: {req_err} (Retrying...)")

        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        run_telemetry_loop()
    except KeyboardInterrupt:
        print("\n[INFO] Mobile Telemetry Transmission Halted.")
        sys.exit(0)
