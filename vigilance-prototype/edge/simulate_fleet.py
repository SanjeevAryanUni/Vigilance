"""
Fleet simulation: 5 buses running Chennai routes via MQTT.
Each bus runs in its own thread, publishing detections + traffic + heartbeats.
"""
import os
import sys
import time
import argparse
import threading

sys.path.insert(0, os.path.dirname(__file__))

from mqtt_publisher import run_mqtt_telemetry

FLEET = [
    {"vehicle_id": "BUS-TN01-1042", "interval": 2.0},
    {"vehicle_id": "BUS-TN02-3891", "interval": 2.5},
    {"vehicle_id": "MUNICIPAL-TRUCK-07", "interval": 3.0},
    {"vehicle_id": "PATROL-VAN-12", "interval": 2.8},
    {"vehicle_id": "BUS-TN22-5501", "interval": 3.2},
]


def main():
    parser = argparse.ArgumentParser(description="VIGILANCE Multi-Vehicle MQTT Fleet Simulator")
    parser.add_argument("--broker", default=os.getenv("MQTT_BROKER", "localhost"), help="MQTT broker host")
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_PORT", "1883")), help="MQTT broker port")
    args = parser.parse_args()

    print("=" * 60)
    print("🚌 VIGILANCE Fleet Simulation — 5 Vehicles via MQTT")
    print(f"📡 Broker: {args.broker}:{args.port}")
    print("=" * 60)

    threads = []
    for bus in FLEET:
        t = threading.Thread(
            target=run_mqtt_telemetry,
            kwargs={
                "vehicle_id": bus["vehicle_id"],
                "interval": bus["interval"],
                "broker": args.broker,
                "port": args.port,
            },
            daemon=True,
        )
        t.start()
        threads.append(t)
        print(f"  🚐 Started {bus['vehicle_id']} (interval: {bus['interval']}s)")
        time.sleep(0.5)  # Stagger starts

    print(f"\n✅ {len(threads)} vehicles publishing to MQTT")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Fleet simulation stopped.")


if __name__ == "__main__":
    main()
