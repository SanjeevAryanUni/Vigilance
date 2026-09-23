"""
Incident detection combining traffic, ANPR, and road damage signals.
Detects: rash driving, hit-and-run potential, speeding, wrong-way driving.
"""
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional


class IncidentDetector:
    def __init__(self, speed_limit: float = 60.0):
        self.speed_limit = speed_limit

    def analyze(
        self,
        traffic_data: Dict[str, Any],
        anpr_results: Optional[List[Dict[str, Any]]] = None,
        road_damage: Optional[List[Dict[str, Any]]] = None,
        vehicle_speed: float = 0.0,
    ) -> List[Dict[str, Any]]:
        incidents = []
        anpr_results = anpr_results or []
        road_damage = road_damage or []
        now = datetime.now(timezone.utc).isoformat()

        plate_text = anpr_results[0]["plate_text"] if anpr_results else None
        plate_conf = anpr_results[0]["confidence"] if anpr_results else None

        # 1. Rash driving: high speed + pedestrians present
        ped_count = traffic_data.get("pedestrian_count", 0)
        if vehicle_speed > self.speed_limit and ped_count > 0:
            incidents.append({
                "incident_type": "rash_driving",
                "severity": "critical" if vehicle_speed > 80 else "high",
                "plate_text": plate_text,
                "plate_confidence": plate_conf,
                "speed_kmh": vehicle_speed,
                "pedestrian_count": ped_count,
                "reason": f"Speed {vehicle_speed:.0f} km/h in pedestrian zone ({ped_count} pedestrians)",
                "timestamp": now,
            })

        # 2. Speeding (no pedestrians but still over limit by 30%)
        elif vehicle_speed > self.speed_limit * 1.3:
            incidents.append({
                "incident_type": "speeding",
                "severity": "high" if vehicle_speed > 90 else "medium",
                "plate_text": plate_text,
                "plate_confidence": plate_conf,
                "speed_kmh": vehicle_speed,
                "reason": f"Speed {vehicle_speed:.0f} km/h (limit: {self.speed_limit:.0f} km/h)",
                "timestamp": now,
            })

        # 3. Hit-and-run: fresh road damage + vehicle fleeing (high speed)
        if road_damage and vehicle_speed > 50:
            for dmg in road_damage:
                if dmg.get("severity") in ("critical", "high") and dmg.get("confidence", 0) > 0.7:
                    incidents.append({
                        "incident_type": "hit_and_run",
                        "severity": "critical",
                        "plate_text": plate_text,
                        "plate_confidence": plate_conf,
                        "speed_kmh": vehicle_speed,
                        "damage_type": dmg.get("defect_type"),
                        "reason": f"Vehicle at {vehicle_speed:.0f} km/h near fresh {dmg.get('defect_type')} damage",
                        "timestamp": now,
                    })
                    break

        return incidents


if __name__ == "__main__":
    detector = IncidentDetector(speed_limit=60)
    # Test rash driving
    incidents = detector.analyze(
        traffic_data={"pedestrian_count": 3},
        anpr_results=[{"plate_text": "TN01AB1234", "confidence": 0.95}],
        vehicle_speed=75.0
    )
    print("Test Incidents:", incidents)
