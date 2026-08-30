import math
from typing import Dict, List, Tuple

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
