"""
VIGILANCE MQTT Backend Listener
Subscribes to all vigilance/* topics and ingests telemetry into PostgreSQL/SQLite.
Run alongside the FastAPI server.
"""
import os
import sys
import json
import argparse
import paho.mqtt.client as mqtt
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from models import Detection, TrafficObservation, FleetPosition, IncidentReport
from dbscan_dedup import run_spatial_deduplication
from poi_data import match_nearest_road

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))


def _handle_detection(payload):
    """Insert road damage detection into DB and trigger dedup."""
    db = SessionLocal()
    try:
        data = json.loads(payload)
        lat = float(data["lat"])
        lon = float(data["lon"])
        road_name = data.get("road_name") or match_nearest_road(lat, lon)

        det = Detection(
            defect_type=data.get("defect_type", "D40"),
            confidence=float(data.get("confidence", 0.5)),
            severity=data.get("severity", "medium"),
            lat=lat,
            lon=lon,
            vehicle_id=data.get("vehicle_id", "UNKNOWN"),
            road_name=road_name,
            thumbnail_b64=data.get("thumbnail_b64"),
            timestamp=datetime.utcnow(),
        )
        db.add(det)
        db.commit()

        # Trigger spatial deduplication
        run_spatial_deduplication(db)
        print(f"  ✅ Detection ingested: {det.defect_type} ({det.severity}) @ {det.road_name}")
    except Exception as e:
        db.rollback()
        print(f"  ❌ Detection error: {e}")
    finally:
        db.close()


def _handle_traffic(payload):
    """Insert traffic observation into DB."""
    db = SessionLocal()
    try:
        data = json.loads(payload)
        lat = float(data["lat"])
        lon = float(data["lon"])
        road_name = data.get("road_name") or match_nearest_road(lat, lon)

        obs = TrafficObservation(
            lat=lat,
            lon=lon,
            vehicle_count=int(data.get("vehicle_count", 0)),
            pedestrian_count=int(data.get("pedestrian_count", 0)),
            density=data.get("density", "free_flow"),
            speed_kmh=float(data["speed_kmh"]) if data.get("speed_kmh") is not None else None,
            road_name=road_name,
            vehicle_id=data.get("vehicle_id"),
            timestamp=datetime.utcnow(),
        )
        db.add(obs)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"  ❌ Traffic error: {e}")
    finally:
        db.close()


def _handle_heartbeat(payload):
    """Update fleet position."""
    db = SessionLocal()
    try:
        data = json.loads(payload)
        lat = float(data["lat"])
        lon = float(data["lon"])
        vehicle_id = data.get("vehicle_id", "UNKNOWN")
        road_name = data.get("road_name") or match_nearest_road(lat, lon)

        pos = FleetPosition(
            vehicle_id=vehicle_id,
            lat=lat,
            lon=lon,
            speed_kmh=float(data.get("speed_kmh", 0)),
            road_name=road_name,
            status=data.get("status", "active"),
            timestamp=datetime.utcnow(),
        )
        db.add(pos)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"  ❌ Heartbeat error: {e}")
    finally:
        db.close()


def _handle_incident(payload):
    """Insert safety incident into DB."""
    db = SessionLocal()
    try:
        data = json.loads(payload)
        lat = float(data.get("lat", 13.0067))
        lon = float(data.get("lon", 80.2030))
        road_name = data.get("road_name") or match_nearest_road(lat, lon)

        inc = IncidentReport(
            incident_type=data.get("incident_type", "speeding"),
            plate_text=data.get("plate_text"),
            plate_confidence=float(data["plate_confidence"]) if data.get("plate_confidence") is not None else None,
            vehicle_class=data.get("vehicle_class"),
            lat=lat,
            lon=lon,
            road_name=road_name,
            speed_kmh=float(data["speed_kmh"]) if data.get("speed_kmh") is not None else None,
            reporter_vehicle_id=data.get("reporter_vehicle_id") or data.get("vehicle_id"),
            image_b64=data.get("image_b64"),
            timestamp=datetime.utcnow(),
            status="reported",
        )
        db.add(inc)
        db.commit()
        print(f"  🚨 Incident ingested: {inc.incident_type} (Plate: {inc.plate_text or 'N/A'}) @ {inc.road_name}")
    except Exception as e:
        db.rollback()
        print(f"  ❌ Incident error: {e}")
    finally:
        db.close()


TOPIC_HANDLERS = {
    "vigilance/detections": _handle_detection,
    "vigilance/traffic": _handle_traffic,
    "vigilance/heartbeat": _handle_heartbeat,
    "vigilance/incidents": _handle_incident,
}


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code.is_failure:
        print(f"❌ MQTT Listener connection failed: {reason_code}")
    else:
        print(f"✅ MQTT Listener connected to {client._host}:{client._port}")
        client.subscribe("vigilance/#", qos=1)
        print("📥 Subscribed to vigilance/# (all topics)")


def on_message(client, userdata, message):
    topic = message.topic
    payload = message.payload.decode("utf-8")
    handler = TOPIC_HANDLERS.get(topic)
    if handler:
        handler(payload)
    else:
        print(f"  ⚠️ Unknown topic: {topic}")


def start_listener(broker: str = None, port: int = None):
    target_broker = broker or os.getenv("MQTT_BROKER", "localhost")
    target_port = port or int(os.getenv("MQTT_PORT", "1883"))

    print("=" * 60)
    print("📥 VIGILANCE MQTT Backend Listener")
    print(f"📡 Broker: {target_broker}:{target_port}")
    print("=" * 60)

    init_db()

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="backend-listener")
    client.on_connect = on_connect
    client.on_message = on_message

    connected = False
    for attempt in range(5):
        try:
            client.connect(target_broker, target_port, keepalive=60)
            connected = True
            break
        except Exception as e:
            print(f"⚠️  MQTT connect attempt {attempt+1}/5 failed ({target_broker}:{target_port}): {e}")
            import time
            time.sleep(2)

    if not connected:
        print("❌ Could not connect to MQTT broker. Exiting.")
        return

    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n🛑 MQTT Listener stopped.")
        client.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--broker", default=os.getenv("MQTT_BROKER", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_PORT", "1883")))
    args = parser.parse_args()

    start_listener(broker=args.broker, port=args.port)
