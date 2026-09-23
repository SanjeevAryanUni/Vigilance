"""
VIGILANCE Real MQTT Telemetry Publisher
Publishes road damage detections, traffic observations, and vehicle heartbeats
to Mosquitto broker via paho-mqtt v2.
"""
import os
import sys
import json
import time
import random
import paho.mqtt.client as mqtt
from datetime import datetime

# Ensure edge directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from detector import RoadDamageDetector

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

TOPIC_DETECTION = "vigilance/detections"
TOPIC_TRAFFIC = "vigilance/traffic"
TOPIC_HEARTBEAT = "vigilance/heartbeat"
TOPIC_INCIDENT = "vigilance/incidents"

# Chennai transit route simulation
ROUTE_WAYPOINTS = [
    {"lat": 13.0067, "lon": 80.2030, "road": "Guindy Kathipara Junction, Chennai"},
    {"lat": 13.0180, "lon": 80.2150, "road": "Saidapet Bridge, Chennai"},
    {"lat": 13.0418, "lon": 80.2341, "road": "T. Nagar Usman Road, Chennai"},
    {"lat": 13.0604, "lon": 80.2496, "road": "Anna Salai (Mount Road), Chennai"},
    {"lat": 13.0827, "lon": 80.2707, "road": "Poonamallee High Road, Chennai"},
    {"lat": 12.9516, "lon": 80.1462, "road": "GST Road, Tambaram (NH-32)"},
    {"lat": 12.8231, "lon": 80.0442, "road": "SRM Institute / Potheri Highway"},
]


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code.is_failure:
        print(f"❌ MQTT Connection failed: {reason_code}")
    else:
        print(f"✅ MQTT Connected to {client._host}:{client._port}")


def on_publish(client, userdata, mid, reason_code, properties):
    pass  # Silent on success


def run_mqtt_telemetry(vehicle_id: str = "BUS-TN01-1042", interval: float = 2.0, broker: str = None, port: int = None):
    target_broker = broker or os.getenv("MQTT_BROKER", "localhost")
    target_port = port or int(os.getenv("MQTT_PORT", "1883"))

    print("=" * 60)
    print(f"🚀 VIGILANCE MQTT Telemetry Node: {vehicle_id}")
    print(f"📡 Broker: {target_broker}:{target_port}")
    print(f"📤 Topics: {TOPIC_DETECTION}, {TOPIC_TRAFFIC}, {TOPIC_HEARTBEAT}")
    print("=" * 60)

    # Initialize MQTT client (paho-mqtt v2 API)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"edge-{vehicle_id}-{random.randint(100, 999)}")
    client.on_connect = on_connect
    client.on_publish = on_publish

    # Connect with retry
    connected = False
    for attempt in range(5):
        try:
            client.connect(target_broker, target_port, keepalive=60)
            client.loop_start()
            connected = True
            break
        except Exception as e:
            print(f"⚠️  Connection attempt {attempt+1}/5 failed ({target_broker}:{target_port}): {e}")
            time.sleep(2)

    if not connected:
        print("❌ Could not connect to MQTT broker. Exiting.")
        return

    detector = RoadDamageDetector()
    step = 0
    total_published = 0

    try:
        while True:
            wp = ROUTE_WAYPOINTS[step % len(ROUTE_WAYPOINTS)]
            curr_lat = wp["lat"] + random.gauss(0, 0.0001)
            curr_lon = wp["lon"] + random.gauss(0, 0.0001)
            curr_speed = random.uniform(15, 55)
            road = wp["road"]

            # 1. Publish heartbeat (every cycle)
            heartbeat = {
                "vehicle_id": vehicle_id,
                "lat": round(curr_lat, 6),
                "lon": round(curr_lon, 6),
                "speed_kmh": round(curr_speed, 1),
                "road_name": road,
                "status": "active",
                "timestamp": datetime.utcnow().isoformat(),
            }
            client.publish(TOPIC_HEARTBEAT, json.dumps(heartbeat), qos=1)
            total_published += 1

            # 2. Run detection (frame=None → uses simulator)
            detections = detector.infer_frame(
                frame=None, lat=curr_lat, lon=curr_lon, vehicle_id=vehicle_id
            )
            for det in detections:
                det["road_name"] = road
                client.publish(TOPIC_DETECTION, json.dumps(det), qos=1)
                total_published += 1
                ts = datetime.now().strftime("%H:%M:%S")
                print(
                    f"[{ts}] 📡 MQTT TX: {vehicle_id} → {det['defect_type']} "
                    f"({det['severity'].upper()}) @ {road}"
                )

            # 3. Publish traffic observation (simulated counts)
            traffic = {
                "vehicle_id": vehicle_id,
                "lat": round(curr_lat, 6),
                "lon": round(curr_lon, 6),
                "speed_kmh": round(curr_speed, 1),
                "vehicle_count": random.randint(2, 18),
                "pedestrian_count": random.randint(0, 8),
                "density": "heavy" if curr_speed < 20 else ("moderate" if curr_speed < 35 else "light"),
                "road_name": road,
                "timestamp": datetime.utcnow().isoformat(),
            }
            client.publish(TOPIC_TRAFFIC, json.dumps(traffic), qos=1)
            total_published += 1

            if step % 10 == 0:
                print(f"📊 Total MQTT messages published by {vehicle_id}: {total_published}")

            step += 1
            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"\n🛑 Stopping {vehicle_id}. Total messages published: {total_published}")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--vehicle-id", default="BUS-TN01-1042")
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--broker", default=os.getenv("MQTT_BROKER", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_PORT", "1883")))
    args = parser.parse_args()

    run_mqtt_telemetry(
        vehicle_id=args.vehicle_id,
        interval=args.interval,
        broker=args.broker,
        port=args.port
    )
