import time
import json
import random
import requests
from datetime import datetime
from detector import RoadDamageDetector

# Chennai transit route simulation (Guindy -> Anna Salai -> SRM Corridor)
ROUTE_WAYPOINTS = [
    {"lat": 13.0067, "lon": 80.2030, "road": "Guindy Kathipara Junction, Chennai"},
    {"lat": 13.0180, "lon": 80.2150, "road": "Saidapet Bridge, Chennai"},
    {"lat": 13.0418, "lon": 80.2341, "road": "T. Nagar Usman Road, Chennai"},
    {"lat": 13.0604, "lon": 80.2496, "road": "Anna Salai (Mount Road), Chennai"},
    {"lat": 13.0827, "lon": 80.2707, "road": "Poonamallee High Road, Chennai"},
    {"lat": 12.9516, "lon": 80.1462, "road": "GST Road, Tambaram, Chennai"},
    {"lat": 12.8231, "lon": 80.0442, "road": "SRM Institute / Potheri Highway"}
]

API_URL = "http://localhost:8000/api/detections"

def run_edge_telemetry_stream(vehicle_id: str = "BUS-TN01-1042", interval: float = 2.0):
    print(f"==================================================")
    print(f"🚀 VIGILANCE Edge AI Telemetry Node Started")
    print(f"Vehicle Node: {vehicle_id} | Ingest Target: {API_URL}")
    print(f"==================================================")

    detector = RoadDamageDetector()
    step = 0

    while True:
        wp = ROUTE_WAYPOINTS[step % len(ROUTE_WAYPOINTS)]
        # Simulate small trajectory progression
        curr_lat = wp["lat"] + random.gauss(0, 0.0001)
        curr_lon = wp["lon"] + random.gauss(0, 0.0001)
        road = wp["road"]

        # Generate defect via detector (frame=None safely handled)
        defect_list = detector.infer_frame(frame=None, lat=curr_lat, lon=curr_lon, vehicle_id=vehicle_id)
        
        for det in defect_list:
            det["road_name"] = road
            try:
                res = requests.post(API_URL, json=det, timeout=3.0)
                if res.status_code == 200:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] 📡 {vehicle_id} -> Transmitted {det['defect_type']} ({det['severity'].upper()}) @ {road} [Lat: {curr_lat:.4f}, Lon: {curr_lon:.4f}]")
                else:
                    print(f"! Failed to send detection: HTTP {res.status_code}")
            except Exception as e:
                print(f"! Ingestion server offline ({e}). Buffering telemetry packet...")

        step += 1
        time.sleep(interval)

if __name__ == "__main__":
    run_edge_telemetry_stream()
