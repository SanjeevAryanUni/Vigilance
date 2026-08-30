import time
import threading
from telemetry_publisher import run_edge_telemetry_stream

FLEET_BUSES = [
    ("BUS-TN01-1042", 2.5),
    ("BUS-TN02-3891", 3.0),
    ("MUNICIPAL-TRUCK-07", 3.5),
    ("PATROL-VAN-12", 4.0),
    ("BUS-TN22-5501", 2.0)
]

def start_fleet_simulation():
    print("==========================================================")
    print("🚌 Starting Multi-Vehicle VIGILANCE Fleet Simulation (5 Nodes)")
    print("==========================================================")
    
    threads = []
    for vid, interval in FLEET_BUSES:
        t = threading.Thread(target=run_edge_telemetry_stream, args=(vid, interval), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.5)

    print("✓ All 5 virtual buses active and reporting real-time road defects.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Fleet simulation stopped.")

if __name__ == "__main__":
    start_fleet_simulation()
