"""
VIGILANCE — Urban Road Intelligence Platform
Demo Seed Data Generator (SIH Grand Finale Pre-Flight)

Generates rich, realistic spatial telemetry for the Chennai arterial grid:
- 70+ georeferenced road defect detections across 10 major corridors
- DBSCAN spatial deduplication with realistic RPI scoring and contractor SLA assignment
- Multi-status cluster lifecycle (open, assigned to PWD, resolved)
- 5 live transit fleet positions (MTC buses / municipal trucks)
- 12 corridor traffic flow & pedestrian density observations
- 8 ANPR vehicle enforcement incidents (rash driving, speeding, plate detections)
"""

import os
import sys
import random
from datetime import datetime, timedelta

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from models import Detection, Cluster, TrafficObservation, IncidentReport, FleetPosition
from dbscan_dedup import run_spatial_deduplication
from poi_data import match_nearest_road

# Chennai Arterial Road Waypoints (Corridor Network)
WAYPOINTS = [
    {"lat": 13.0827, "lon": 80.2707, "road": "Poonamallee High Road, Chennai", "poi": "Kilpauk Medical College"},
    {"lat": 13.0604, "lon": 80.2496, "road": "Anna Salai (Mount Road), Chennai", "poi": "Gemini Flyover / US Consulate"},
    {"lat": 13.0067, "lon": 80.2030, "road": "Guindy Kathipara Junction, Chennai", "poi": "Kathipara Cloverleaf"},
    {"lat": 12.9815, "lon": 80.2180, "road": "Velachery Main Road, Chennai", "poi": "Phoenix Marketcity Junction"},
    {"lat": 12.9516, "lon": 80.1462, "road": "GST Road, Tambaram, Chennai", "poi": "Tambaram Railway Station"},
    {"lat": 12.8231, "lon": 80.0442, "road": "SRM Institute / Potheri Highway", "poi": "SRM Tech Park Entrance"},
    {"lat": 12.9719, "lon": 80.2500, "road": "Old Mahabalipuram Road (OMR IT Corridor)", "poi": "Tidel Park / Thiruvanmiyur"},
    {"lat": 13.0334, "lon": 80.2678, "road": "Mylapore Santhome High Road, Chennai", "poi": "Santhome Basilica Corridor"},
    {"lat": 13.0418, "lon": 80.2341, "road": "T. Nagar Usman Road, Chennai", "poi": "Panagal Park / Usman Road Flyover"},
    {"lat": 13.0878, "lon": 80.2155, "road": "Anna Nagar 2nd Avenue, Chennai", "poi": "Anna Nagar Roundtana"}
]

DEFECT_PROFILES = [
    {"type": "D40", "name": "Pothole", "severity": "critical", "weight": 0.40},
    {"type": "D20", "name": "Alligator Cracking", "severity": "high", "weight": 0.30},
    {"type": "D10", "name": "Transverse Crack", "severity": "medium", "weight": 0.15},
    {"type": "D00", "name": "Longitudinal Crack", "severity": "low", "weight": 0.15},
]

VEHICLES = [
    {"id": "BUS-TN01-1042", "route": "Route 18A: Broadway - Tambaram", "type": "MTC Volvo Electric"},
    {"id": "BUS-TN02-3891", "route": "Route 570: CMBT - Siruseri IT", "type": "MTC Express"},
    {"id": "MUNICIPAL-TRUCK-07", "route": "Zone 10 Road Inspection", "type": "Greater Chennai Corp"},
    {"id": "PATROL-VAN-12", "route": "Traffic Patrol Zone 5", "type": "Chennai Traffic Police"},
    {"id": "BUS-TN22-5501", "route": "Route 23C: Besant Nagar - Ayanavaram", "type": "MTC Ultra Deluxe"}
]

ANPR_INCIDENTS = [
    {"type": "rash_driving", "plate": "TN09-BZ-4819", "conf": 0.94, "vclass": "car", "speed": 84.5, "road": "Anna Salai (Mount Road), Chennai", "status": "verified"},
    {"type": "speeding", "plate": "TN01-AX-9921", "conf": 0.98, "vclass": "motorcycle", "speed": 92.0, "road": "Old Mahabalipuram Road (OMR IT Corridor)", "status": "actioned"},
    {"type": "wrong_way", "plate": "TN22-CK-1048", "conf": 0.91, "vclass": "auto_rickshaw", "speed": 42.0, "road": "GST Road, Tambaram, Chennai", "status": "reported"},
    {"type": "plate_detected", "plate": "TN07-EF-3312", "conf": 0.96, "vclass": "truck", "speed": 55.0, "road": "Poonamallee High Road, Chennai", "status": "reported"},
    {"type": "rash_driving", "plate": "TN10-AK-7720", "conf": 0.93, "vclass": "motorcycle", "speed": 78.0, "road": "Velachery Main Road, Chennai", "status": "verified"},
    {"type": "speeding", "plate": "TN04-HQ-5511", "conf": 0.97, "vclass": "car", "speed": 88.5, "road": "Guindy Kathipara Junction, Chennai", "status": "reported"},
    {"type": "plate_detected", "plate": "TN11-DD-4009", "conf": 0.89, "vclass": "bus", "speed": 46.0, "road": "T. Nagar Usman Road, Chennai", "status": "actioned"},
    {"type": "hit_and_run", "plate": "TN02-LM-8833", "conf": 0.92, "vclass": "car", "speed": 76.0, "road": "Anna Nagar 2nd Avenue, Chennai", "status": "verified"},
]

def seed_demo_data(force: bool = False, count: int = 72):
    init_db()
    db = SessionLocal()
    
    existing_detections = db.query(Detection).count()
    if existing_detections > 20 and not force:
        print(f"[*] Database already contains {existing_detections} detections. Re-running spatial consensus & RPI calculations.")
        run_spatial_deduplication(db)
        db.close()
        return

    if force:
        print("[!] Force reset requested: purging existing tables for clean SIH demo state...")
        db.query(Detection).delete()
        db.query(Cluster).delete()
        db.query(TrafficObservation).delete()
        db.query(IncidentReport).delete()
        db.query(FleetPosition).delete()
        db.commit()

    print(f"[*] Seeding {count} realistic georeferenced road distress detections across Chennai...")

    # We distribute detections around clusters at waypoints (3-6 detections per cluster to demonstrate spatial consensus)
    cluster_centers = []
    for wp in WAYPOINTS:
        # Create 1-2 distinct defect hot spots per arterial waypoint
        num_spots = 2 if "GST" in wp["road"] or "Anna Salai" in wp["road"] or "OMR" in wp["road"] else 1
        for s in range(num_spots):
            offset_lat = (s * 0.0007) - 0.0003
            offset_lon = (s * 0.0007) - 0.0003
            profile = random.choices(DEFECT_PROFILES, weights=[p["weight"] for p in DEFECT_PROFILES])[0]
            cluster_centers.append({
                "lat": wp["lat"] + offset_lat,
                "lon": wp["lon"] + offset_lon,
                "road": wp["road"],
                "poi": wp["poi"],
                "profile": profile
            })

    # Generate detections around each cluster center
    for center in cluster_centers:
        passes = random.randint(3, 7)  # 3-7 bus passes confirming the defect
        for p in range(passes):
            # Jitter within 3-10 meters (0.00003 - 0.00008 deg)
            lat_jitter = random.gauss(0, 0.000045)
            lon_jitter = random.gauss(0, 0.000045)
            
            conf = round(random.uniform(0.78, 0.98), 2)
            vehicle = random.choice(VEHICLES)["id"]
            mins_ago = random.randint(5, 720)
            
            det = Detection(
                defect_type=center["profile"]["type"],
                confidence=conf,
                severity=center["profile"]["severity"],
                vehicle_id=vehicle,
                lat=center["lat"] + lat_jitter,
                lon=center["lon"] + lon_jitter,
                road_name=center["road"],
                timestamp=datetime.utcnow() - timedelta(minutes=mins_ago)
            )
            db.add(det)

    db.commit()
    print(f"[+] Committed {db.query(Detection).count()} detections.")

    # 2. Run DBSCAN Clustering & RPI Formulation
    print("[*] Running DBSCAN Great-Circle spatial consensus...")
    clusters_created = run_spatial_deduplication(db)
    print(f"[+] Formed {clusters_created} high-confidence incident clusters.")

    # 3. Simulate realistic SLA lifecycle: mark some clusters as assigned and resolved
    all_clusters = db.query(Cluster).all()
    for idx, c in enumerate(all_clusters):
        if idx % 5 == 1:
            c.status = "assigned"
            c.contractor_name = "L&T Infrastructure Maintenance"
            c.contractor_contact = "+91 44 2846 1100"
            c.sla_hours = 24
        elif idx % 5 == 3:
            c.status = "resolved"
            c.contractor_name = "Greater Chennai PWD - Zone 10"
            c.contractor_contact = "+91 44 2538 4520"
            c.sla_hours = 48
    db.commit()

    # 4. Seed Live Fleet Positions
    print("[*] Seeding 5 active public transit fleet positions...")
    for idx, v in enumerate(VEHICLES):
        wp = WAYPOINTS[idx * 2 % len(WAYPOINTS)]
        fleet_pos = FleetPosition(
            vehicle_id=v["id"],
            lat=wp["lat"] + random.uniform(-0.001, 0.001),
            lon=wp["lon"] + random.uniform(-0.001, 0.001),
            speed_kmh=round(random.uniform(22.0, 58.0), 1),
            heading=round(random.uniform(0.0, 360.0), 1),
            road_name=wp["road"],
            status="active",
            last_detection_type="D40" if idx % 2 == 0 else "D20",
            timestamp=datetime.utcnow() - timedelta(seconds=random.randint(5, 45))
        )
        db.add(fleet_pos)

    # 5. Seed Traffic Observations along major corridors
    print("[*] Seeding 12 corridor traffic flow & pedestrian observations...")
    for i, wp in enumerate(WAYPOINTS):
        vehicles = random.randint(110, 420)
        peds = random.randint(12, 85)
        speed = round(random.uniform(24.0, 52.0), 1)
        density = "heavy" if speed < 30 else "moderate" if speed < 45 else "free_flow"
        
        obs = TrafficObservation(
            lat=wp["lat"],
            lon=wp["lon"],
            vehicle_count=vehicles,
            pedestrian_count=peds,
            density=density,
            speed_kmh=speed,
            road_name=wp["road"],
            vehicle_id=random.choice(VEHICLES)["id"],
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(2, 60))
        )
        db.add(obs)

    # 6. Seed ANPR Enforcement Incidents
    print("[*] Seeding 8 ANPR enforcement incidents...")
    for inc in ANPR_INCIDENTS:
        wp = next((w for w in WAYPOINTS if inc["road"].startswith(w["road"][:10])), WAYPOINTS[0])
        report = IncidentReport(
            incident_type=inc["type"],
            plate_text=inc["plate"],
            plate_confidence=inc["conf"],
            vehicle_class=inc["vclass"],
            lat=wp["lat"] + random.uniform(-0.0005, 0.0005),
            lon=wp["lon"] + random.uniform(-0.0005, 0.0005),
            road_name=inc["road"],
            speed_kmh=inc["speed"],
            reporter_vehicle_id=random.choice(VEHICLES)["id"],
            status=inc["status"],
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(5, 120))
        )
        db.add(report)

    db.commit()
    db.close()

    print("\n" + "=" * 60)
    print("  VIGILANCE SIH DEMO PRE-SEED COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print(f"  • Raw Detections:          {db.query(Detection).count() if 'db' in locals() else count}")
    print(f"  • Incident Clusters (RPI): {clusters_created}")
    print(f"  • Fleet Telematics Nodes:  {len(VEHICLES)}")
    print(f"  • Corridor Flow Records:   {len(WAYPOINTS)}")
    print(f"  • ANPR Enforcement Logs:   {len(ANPR_INCIDENTS)}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    force_mode = "--force" in sys.argv or "--reset" in sys.argv
    seed_demo_data(force=force_mode)
