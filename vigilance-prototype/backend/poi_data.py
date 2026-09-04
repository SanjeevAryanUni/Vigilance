import math
from typing import Dict, List, Tuple, Any

# Critical Healthcare & Educational POIs in Chennai Arterial Corridor
CHENNAI_POIS = [
    {"name": "SRM Medical College Hospital, Potheri", "lat": 12.8233, "lon": 80.0440, "type": "hospital"},
    {"name": "MIOT International Hospital, Manapakkam", "lat": 13.0105, "lon": 80.1720, "type": "hospital"},
    {"name": "Apollo Hospital, Greams Road", "lat": 13.0619, "lon": 80.2522, "type": "hospital"},
    {"name": "Rajiv Gandhi Government General Hospital", "lat": 13.0785, "lon": 80.2765, "type": "hospital"},
    {"name": "Fortis Malar Hospital, Adyar", "lat": 13.0063, "lon": 80.2575, "type": "hospital"},
    {"name": "Chettinad Super Speciality Hospital, OMR", "lat": 12.8242, "lon": 80.2225, "type": "hospital"},
    {"name": "Anna University Main Campus", "lat": 13.0108, "lon": 80.2354, "type": "school"},
    {"name": "SRM Institute of Science and Technology, Kattankulathur", "lat": 12.8231, "lon": 80.0442, "type": "school"},
    {"name": "IIT Madras (Indian Institute of Technology)", "lat": 12.9916, "lon": 80.2336, "type": "school"},
    {"name": "Madras Medical College", "lat": 13.0802, "lon": 80.2783, "type": "school"},
    {"name": "Kendriya Vidyalaya, CLRI Adyar", "lat": 13.0012, "lon": 80.2565, "type": "school"},
    {"name": "D.A.V. Senior Secondary School, Mogappair", "lat": 13.0895, "lon": 80.1732, "type": "school"}
]

# Official Chennai Road Hierarchy Weights
ROAD_HIERARCHY: Dict[str, float] = {
    "GST Road, Tambaram, Chennai":                    1.00,  # National Highway NH-32 (Heavy freight & transit)
    "Poonamallee High Road, Chennai":                 0.90,  # Major Arterial NH-48 link
    "Anna Salai (Mount Road), Chennai":               0.85,  # Primary Arterial (State Highway 1)
    "Old Mahabalipuram Road (OMR IT Corridor)":       0.85,  # Major High-Density IT Corridor
    "Guindy Kathipara Junction, Chennai":             0.80,  # Major Grade-Separator Junction
    "SRM Institute / Potheri Highway":                0.75,  # Highway Transit Node
    "Saidapet Bridge, Chennai":                       0.70,  # Secondary Arterial Link
    "Velachery Main Road, Chennai":                   0.65,  # Urban Commercial Transit
    "T. Nagar Usman Road, Chennai":                   0.60,  # High-Pedestrian Commercial Corridor
    "Mylapore Santhome High Road, Chennai":           0.55,  # Coastal Urban Link
    "Anna Nagar 2nd Avenue, Chennai":                 0.50,  # Residential / Collector Road
}

def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def get_road_weight(road_name: str) -> float:
    """Returns normalized road hierarchy importance weight (0.4 - 1.0)."""
    return ROAD_HIERARCHY.get(road_name, 0.60)

def get_proximity_weight(lat: float, lon: float) -> Tuple[float, str, float]:
    """
    Computes distance from coordinate to nearest hospital/school POI.
    Returns: (normalized_weight, nearest_poi_name, distance_in_meters)
    """
    min_dist = float('inf')
    nearest_name = "Urban Zone"
    
    for poi in CHENNAI_POIS:
        dist = haversine_meters(lat, lon, poi["lat"], poi["lon"])
        if dist < min_dist:
            min_dist = dist
            nearest_name = poi["name"]

    # Distance scoring thresholds
    if min_dist < 500.0:
        weight = 1.00  # Immediate danger zone to emergency/school transit
    elif min_dist < 1500.0:
        weight = 0.75  # High priority access zone
    elif min_dist < 3000.0:
        weight = 0.50  # Moderate priority zone
    else:
        weight = 0.25  # Standard zone

    return weight, nearest_name, round(min_dist, 1)

# Official Road Contractor & Maintenance Zone Assignments
ROAD_CONTRACTORS: Dict[str, Dict[str, Any]] = {
    "GST Road, Tambaram, Chennai": {"name": "L&T Highways Infra Ltd", "contact": "+91 98401 22345", "email": "pwd-ops@lthighways.in", "sla_hours": 24},
    "GST Road, Tambaram (NH-32)": {"name": "L&T Highways Infra Ltd", "contact": "+91 98401 22345", "email": "pwd-ops@lthighways.in", "sla_hours": 24},
    "Poonamallee High Road, Chennai": {"name": "Tamil Nadu PWD Division 4", "contact": "+91 94440 11223", "email": "ee-pwd-north@tn.gov.in", "sla_hours": 48},
    "Poonamallee High Road": {"name": "Tamil Nadu PWD Division 4", "contact": "+91 94440 11223", "email": "ee-pwd-north@tn.gov.in", "sla_hours": 48},
    "Anna Salai (Mount Road), Chennai": {"name": "GMR Urban Highways Ltd", "contact": "+91 98840 77890", "email": "annasalai@gmrgroup.in", "sla_hours": 24},
    "Anna Salai (Mount Road)": {"name": "GMR Urban Highways Ltd", "contact": "+91 98840 77890", "email": "annasalai@gmrgroup.in", "sla_hours": 24},
    "Old Mahabalipuram Road (OMR IT Corridor)": {"name": "Tamil Nadu Road Dev Corp (TNRDC)", "contact": "+91 99400 33445", "email": "support@tnrdc.com", "sla_hours": 48},
    "Old Mahabalipuram Road (OMR)": {"name": "Tamil Nadu Road Dev Corp (TNRDC)", "contact": "+91 99400 33445", "email": "support@tnrdc.com", "sla_hours": 48},
    "Guindy Kathipara Junction, Chennai": {"name": "NHAI Metro Division Chennai", "contact": "+91 91760 55667", "email": "ro-chennai@nhai.org", "sla_hours": 12},
    "Guindy Kathipara Grade Junction": {"name": "NHAI Metro Division Chennai", "contact": "+91 91760 55667", "email": "ro-chennai@nhai.org", "sla_hours": 12},
    "SRM Institute / Potheri Highway": {"name": "Chettinad Road Infra Pvt Ltd", "contact": "+91 97900 88990", "email": "potheri@chettinadinfra.com", "sla_hours": 24},
    "SRM / Potheri Corridor": {"name": "Chettinad Road Infra Pvt Ltd", "contact": "+91 97900 88990", "email": "potheri@chettinadinfra.com", "sla_hours": 24},
    "Velachery Main Road, Chennai": {"name": "Chennai Corp Zone 13 (Adyar)", "contact": "+91 94451 90013", "email": "zone13@chennaicorporation.gov.in", "sla_hours": 72},
    "Velachery Main Road": {"name": "Chennai Corp Zone 13 (Adyar)", "contact": "+91 94451 90013", "email": "zone13@chennaicorporation.gov.in", "sla_hours": 72},
    "T. Nagar Usman Road, Chennai": {"name": "Chennai Corp Zone 10 (T.Nagar)", "contact": "+91 94451 90010", "email": "zone10@chennaicorporation.gov.in", "sla_hours": 48},
    "T. Nagar Usman Road Commercial": {"name": "Chennai Corp Zone 10 (T.Nagar)", "contact": "+91 94451 90010", "email": "zone10@chennaicorporation.gov.in", "sla_hours": 48},
    "Anna Nagar 2nd Avenue, Chennai": {"name": "Chennai Corp Zone 8 (Anna Nagar)", "contact": "+91 94451 90008", "email": "zone8@chennaicorporation.gov.in", "sla_hours": 72},
    "Anna Nagar 2nd Avenue": {"name": "Chennai Corp Zone 8 (Anna Nagar)", "contact": "+91 94451 90008", "email": "zone8@chennaicorporation.gov.in", "sla_hours": 72}
}

def get_contractor(road_name: str) -> Dict[str, Any]:
    """Returns road maintenance contractor and SLA specs."""
    return ROAD_CONTRACTORS.get(road_name, {
        "name": "Greater Chennai Public Works Dept (PWD)",
        "contact": "+91 44 2538 4520",
        "email": "pwd-central@tn.gov.in",
        "sla_hours": 48
    })

def match_nearest_road(lat: float, lon: float) -> str:
    """
    Auto-matches (lat, lon) coordinates to nearest Chennai arterial corridor segment.
    """
    waypoints = [
        (12.8231, 80.0442, "SRM Institute / Potheri Highway"),
        (12.9516, 80.1462, "GST Road, Tambaram, Chennai"),
        (13.0067, 80.2030, "Guindy Kathipara Junction, Chennai"),
        (13.0604, 80.2496, "Anna Salai (Mount Road), Chennai"),
        (12.9719, 80.2500, "Old Mahabalipuram Road (OMR IT Corridor)"),
        (13.0827, 80.2707, "Poonamallee High Road, Chennai"),
        (12.9815, 80.2180, "Velachery Main Road, Chennai"),
        (13.0418, 80.2341, "T. Nagar Usman Road, Chennai"),
        (13.0878, 80.2155, "Anna Nagar 2nd Avenue, Chennai"),
        (13.0334, 80.2678, "Mylapore Santhome High Road, Chennai")
    ]
    
    min_dist = float('inf')
    best_road = "GST Road, Chennai"
    for w_lat, w_lon, road in waypoints:
        dist = haversine_meters(lat, lon, w_lat, w_lon)
        if dist < min_dist:
            min_dist = dist
            best_road = road
            
    return best_road

