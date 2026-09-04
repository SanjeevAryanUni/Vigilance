import os
import sys
import random
from datetime import datetime, timedelta, timezone

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(__file__))

from database import SessionLocal, Detection, run_spatial_deduplication, init_db
from poi_data import ROAD_HIERARCHY

# Chennai Arterial Road Waypoints (GST Road / Anna Salai / OMR Corridor)
BASE_WAYPOINTS = [
    (13.0827, 80.2707, "Poonamallee High Road, Chennai"),
    (13.0604, 80.2496, "Anna Salai (Mount Road), Chennai"),
    (13.0067, 80.2030, "Guindy Kathipara Junction, Chennai"),
    (12.9815, 80.2180, "Velachery Main Road, Chennai"),
    (12.9516, 80.1462, "GST Road, Tambaram, Chennai"),
    (12.8231, 80.0442, "SRM Institute / Potheri Highway"),
    (12.9719, 80.2500, "Old Mahabalipuram Road (OMR IT Corridor)"),
    (13.0334, 80.2678, "Mylapore Santhome High Road, Chennai"),
    (13.0418, 80.2341, "T. Nagar Usman Road, Chennai"),
    (13.0878, 80.2155, "Anna Nagar 2nd Avenue, Chennai")
]

DEFECT_TYPES = ["D40", "D00", "D10", "D20"]
VEHICLES = ["BUS-TN01-1042", "BUS-TN02-3891", "MUNICIPAL-TRUCK-07", "PATROL-VAN-12", "BUS-TN22-5501"]

def seed_demo_data(count: int = 60):
    init_db()
    db = SessionLocal()
    
    existing = db.query(Detection).count()
    if existing > 20:
        print(f"Database already contains {existing} detections. Re-running spatial clustering with dynamic RPI.")
        run_spatial_deduplication(db)
        db.close()
        return

    print(f"Seeding {count} realistic Chennai road defect detections...")
    
    for i in range(count):
        base_lat, base_lon, road_name = random.choice(BASE_WAYPOINTS)
        
        # Jitter within 5-15 meters
        lat_jitter = random.gauss(0, 0.00008)
        lon_jitter = random.gauss(0, 0.00008)
        
        defect = random.choice(DEFECT_TYPES)
        if defect == "D40":
            severity = random.choices(["critical", "high", "medium"], weights=[0.4, 0.4, 0.2])[0]
        else:
            severity = random.choices(["high", "medium", "low"], weights=[0.3, 0.4, 0.3])[0]
            
        conf = round(random.uniform(0.72, 0.98), 2)
        vehicle = random.choice(VEHICLES)
        time_offset = random.randint(1, 180)
        
        det = Detection(
            defect_type=defect,
            confidence=conf,
            severity=severity,
            vehicle_id=vehicle,
            lat=base_lat + lat_jitter,
            lon=base_lon + lon_jitter,
            road_name=road_name,
            timestamp=datetime.now(timezone.utc) - timedelta(minutes=time_offset)
        )
        db.add(det)

    db.commit()
    clusters_created = run_spatial_deduplication(db)
    print(f"Successfully seeded detections! Created {clusters_created} deduplicated incident clusters with real RPI.")
    db.close()

if __name__ == "__main__":
    seed_demo_data(60)
