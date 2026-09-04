#!/usr/bin/env python3
"""
VIGILANCE - Termux Android Client (Real GPS Telemetry Node)
Sends real GPS location from Android phone via termux-location to FastAPI backend.

Location strategy (in priority order):
  1. Fresh GPS   (-p gps  -r once, up to 30s) -- highest accuracy, 2-5m
  2. Fresh Network (-p network -r once, up to 30s) -- fallback, 50-100m
  Never: gps -r last (stale/cached data is rejected by design)

Usage on Android Phone:
  pkg update && pkg install -y python termux-api
  pip install requests
  export VIGILANCE_API_URL="http://10.3.53.20:8000/api/detections"
  python termux_client.py
"""

import os
import sys
import json
import subprocess
import threading
import time
import requests


# ── Location acquisition ────────────────────────────────────────────────────

class GPSTimeout(Exception):
    pass


def _run_with_timeout(cmd, timeout_seconds):
    """
    Launch cmd via Popen and capture stdout while showing a live countdown.
    On timeout the subprocess is killed (proc.kill + proc.wait) so no ghost
    processes are left behind.
    Returns (stdout, returncode) or raises GPSTimeout / FileNotFoundError.
    """
    # Popen gives us a real process handle we can kill later.
    # FileNotFoundError propagates naturally if termux-location is missing.
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    result_box = {}

    def _reader():
        # communicate() reads all output and waits for the process to exit.
        out, _ = proc.communicate()
        result_box["stdout"]     = out
        result_box["returncode"] = proc.returncode

    reader = threading.Thread(target=_reader, daemon=True)
    reader.start()

    # Live countdown in the main thread while the reader thread waits.
    deadline = time.monotonic() + timeout_seconds
    while reader.is_alive():
        remaining = int(deadline - time.monotonic())
        if remaining <= 0:
            break
        print(f"\r  Waiting for fix... {remaining:2d}s remaining", end="", flush=True)
        time.sleep(1)

    print()  # newline after countdown

    if reader.is_alive():
        # Timeout reached — terminate the child process for real.
        try:
            proc.kill()
        except OSError:
            pass          # already exited between our check and the kill
        proc.wait()       # reap the zombie so no leaked processes remain
        raise GPSTimeout(f"No fix within {timeout_seconds}s")

    return result_box.get("stdout", ""), result_box.get("returncode", -1)


def _parse_location(stdout):
    """Parse JSON from termux-location output. Returns dict or None."""
    if not stdout or not stdout.strip():
        return None
    try:
        data = json.loads(stdout)
        lat = data.get("latitude")
        lon = data.get("longitude")
        if lat is None or lon is None:
            return None
        return {
            "latitude": float(lat),
            "longitude": float(lon),
            "accuracy": float(data.get("accuracy", 0.0)),
            "provider": str(data.get("provider", "unknown")),
        }
    except json.JSONDecodeError:
        return None


def get_location():
    """
    Location acquisition pipeline:
      1. Fresh GPS  (30s timeout) → preferred
      2. Fresh Network (30s timeout) → fallback
      Never uses cached/last-known data.

    Returns dict: latitude, longitude, accuracy, provider, source_quality
    """

    # ── Strategy 1: Fresh GPS ───────────────────────────────────────────────
    print("[GPS]  Trying fresh GPS fix (up to 30s)...")
    try:
        stdout, returncode = _run_with_timeout(
            ["termux-location", "-p", "gps", "-r", "once"],
            timeout_seconds=30,
        )
        loc = _parse_location(stdout)
        if loc:
            loc["source_quality"] = "GPS-FRESH"
            print(f"  [OK]  GPS fix acquired (provider={loc['provider']}, accuracy={loc['accuracy']}m)")
            return loc
        else:
            print("  [WARN] GPS returned empty or invalid data.")
    except FileNotFoundError:
        print("\n[ERROR] 'termux-location' command not found.")
        print("        Please run:  pkg install termux-api")
        sys.exit(1)
    except GPSTimeout:
        print(f"  [WARN] GPS timed out (30s). No outdoor satellite fix available.")

    # ── Strategy 2: Fresh Network location ─────────────────────────────────
    print("[NET]  Trying fresh network location (up to 30s)...")
    try:
        stdout, returncode = _run_with_timeout(
            ["termux-location", "-p", "network", "-r", "once"],
            timeout_seconds=30,
        )
        loc = _parse_location(stdout)
        if loc:
            loc["source_quality"] = "NETWORK-FRESH"
            print(f"  [OK]  Network location acquired (provider={loc['provider']}, accuracy={loc['accuracy']}m)")
            return loc
        else:
            print("  [WARN] Network location returned empty or invalid data.")
    except GPSTimeout:
        print("  [WARN] Network location also timed out (30s).")

    # ── No fix available ────────────────────────────────────────────────────
    print("\n[ERROR] Could not acquire a fresh location from any provider.")
    print("        Please check:")
    print("          1. Location / GPS toggle is ON in phone Quick Settings.")
    print("          2. Android Settings -> Apps -> Termux:API -> Permissions -> Location -> Allow all the time.")
    print("          3. Android Settings -> Apps -> Termux -> Permissions -> Location -> Allow all the time.")
    print("          4. Go outdoors or near a window for GPS signal.")
    sys.exit(1)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    api_url = os.getenv("VIGILANCE_API_URL", "http://127.0.0.1:8000/api/detections")
    if not api_url.endswith("/api/detections"):
        api_url = api_url.rstrip("/") + "/api/detections"

    vehicle_id = os.getenv("VIGILANCE_VEHICLE_ID", "ANDROID-TERMUX-01")

    print("=" * 60)
    print(" VIGILANCE - TERMUX REAL GPS TELEMETRY CLIENT")
    print("=" * 60)
    print(f" Target Backend  : {api_url}")
    print(f" Vehicle Node ID : {vehicle_id}")
    print("-" * 60)

    # Acquire location
    loc = get_location()

    lat            = loc["latitude"]
    lon            = loc["longitude"]
    accuracy       = loc["accuracy"]
    provider       = loc["provider"]
    source_quality = loc["source_quality"]

    print()
    print(f"  Lat           : {lat}")
    print(f"  Lon           : {lon}")
    print(f"  Accuracy      : {accuracy} m")
    print(f"  Provider      : {provider}")
    print(f"  Source Quality: {source_quality}")
    print("-" * 60)

    # Build detection payload using existing backend DetectionIn schema
    payload = {
        "defect_type": "D40",          # test value — will come from YOLO later
        "confidence":  0.92,           # test value — will come from YOLO later
        "severity":    "critical",     # test value — will come from YOLO later
        "vehicle_id":  vehicle_id,
        "lat":         lat,
        "lon":         lon,
        "road_name":   None,           # auto-matched by backend using match_nearest_road()
        "thumbnail_b64": None,
    }

    print(f"[POST] Sending to {api_url} ...")
    print(f"       {json.dumps(payload)}")

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print("-" * 60)
        print(f"[RECV] HTTP {response.status_code}")

        if response.status_code == 200:
            print(f"  [OK] {response.json()}")
            print()
            print("[SUCCESS] Detection sent! Open your dashboard to see it on the map.")
        else:
            print(f"  [ERROR] {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot reach backend.")
        print(f"        Is 'python -m uvicorn main:app --host 0.0.0.0 --port 8000' running on the laptop?")
        print(f"        Is the phone on the same Wi-Fi network as the laptop?")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print("\n[ERROR] Request to backend timed out.")
        sys.exit(1)


if __name__ == "__main__":
    main()
