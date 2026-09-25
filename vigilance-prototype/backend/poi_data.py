"""
Multi-city POI data loader for VIGILANCE.
Reads city_config.json and provides dynamic road matching, POI proximity,
and contractor lookup for Chennai, Bangalore, and Delhi.
"""
import os
import json
import math
from typing import Dict, List, Tuple, Any, Optional

# ── Load city configuration ──────────────────────────────────────────
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "city_config.json")

with open(_CONFIG_PATH, "r", encoding="utf-8") as _f:
    _FULL_CONFIG: Dict[str, Any] = json.load(_f)

CITY_CONFIGS: Dict[str, Any] = _FULL_CONFIG["cities"]
IRC_REPAIR_RATES: Dict[str, Any] = _FULL_CONFIG["irc_repair_rates"]
DEFAULT_CITY: str = _FULL_CONFIG.get("default_city", "chennai")

# ── Active city state (can be switched via API) ──────────────────────
_active_city: str = DEFAULT_CITY

# Backwards compatibility exports for existing unit tests
ROAD_HIERARCHY: Dict[str, float] = {r["name"]: r["weight"] for r in CITY_CONFIGS.get("chennai", {}).get("roads", [])}
CHENNAI_POIS: List[Dict[str, Any]] = CITY_CONFIGS.get("chennai", {}).get("pois", [])
ROAD_CONTRACTORS: Dict[str, Dict[str, Any]] = CITY_CONFIGS.get("chennai", {}).get("contractors", {})


def set_active_city(city_key: str) -> str:
    """Switch the active city. Returns the display name."""
    global _active_city
    key = city_key.lower().strip()
    if key not in CITY_CONFIGS:
        raise ValueError(f"Unknown city '{city_key}'. Available: {list(CITY_CONFIGS.keys())}")
    _active_city = key
    return CITY_CONFIGS[key]["display_name"]


def get_active_city() -> str:
    return _active_city


def get_active_city_config() -> Dict[str, Any]:
    return CITY_CONFIGS[_active_city]


def get_all_cities_summary() -> List[Dict[str, Any]]:
    """Returns a summary of all available cities for the frontend dropdown."""
    return [
        {
            "key": key,
            "display_name": cfg["display_name"],
            "state": cfg["state"],
            "center": cfg["center"],
            "zoom": cfg["zoom"],
            "municipal_body": cfg["municipal_body"],
            "is_active": key == _active_city,
        }
        for key, cfg in CITY_CONFIGS.items()
    ]


# ── Haversine distance ──────────────────────────────────────────────
def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


# ── Road matching (uses active city) ────────────────────────────────
def get_road_weight(road_name: str) -> float:
    """Returns normalized road hierarchy importance weight (0.4–1.0)."""
    cfg = get_active_city_config()
    road_map = {r["name"]: r["weight"] for r in cfg["roads"]}
    return road_map.get(road_name, 0.60)


def match_nearest_road(lat: float, lon: float, city_key: Optional[str] = None) -> str:
    """Auto-matches (lat, lon) to the nearest arterial road segment."""
    cfg = CITY_CONFIGS.get(city_key or _active_city, CITY_CONFIGS[_active_city])
    min_dist = float("inf")
    best_road = cfg["roads"][0]["name"] if cfg["roads"] else "Unknown Road"
    for road in cfg["roads"]:
        wp = road["waypoint"]
        dist = haversine_meters(lat, lon, wp[0], wp[1])
        if dist < min_dist:
            min_dist = dist
            best_road = road["name"]
    return best_road


# ── POI proximity (uses active city) ────────────────────────────────
def get_proximity_weight(lat: float, lon: float) -> Tuple[float, str, float]:
    """
    Computes distance to nearest hospital/school POI.
    Returns: (normalized_weight, nearest_poi_name, distance_in_meters)
    """
    cfg = get_active_city_config()
    min_dist = float("inf")
    nearest_name = "Urban Zone"
    for poi in cfg["pois"]:
        dist = haversine_meters(lat, lon, poi["lat"], poi["lon"])
        if dist < min_dist:
            min_dist = dist
            nearest_name = poi["name"]

    if min_dist < 500.0:
        weight = 1.00
    elif min_dist < 1500.0:
        weight = 0.75
    elif min_dist < 3000.0:
        weight = 0.50
    else:
        weight = 0.25

    return weight, nearest_name, round(min_dist, 1)


# ── Contractor lookup ───────────────────────────────────────────────
def get_contractor(road_name: str) -> Dict[str, Any]:
    """Returns road maintenance contractor and SLA specs."""
    cfg = get_active_city_config()
    default_name = (
        "Greater Chennai Public Works Dept (PWD)"
        if _active_city == "chennai"
        else f"{cfg['municipal_body']} General Works"
    )
    default = {
        "name": default_name,
        "contact": "+91 44 2538 4520" if _active_city == "chennai" else "N/A",
        "email": "pwd-general@gov.in",
        "sla_hours": 48,
    }
    return cfg.get("contractors", {}).get(road_name, default)


# ── IRC Budget Estimation ───────────────────────────────────────────
def estimate_repair_cost(damage_class: str, area_sqm: float = 2.0) -> Dict[str, Any]:
    """
    Estimates repair cost using IRC standard rates.
    Default area = 2.0 m² per pothole/crack instance.
    """
    rate_info = IRC_REPAIR_RATES.get(damage_class, IRC_REPAIR_RATES["D40"])
    total = rate_info["rate_per_sqm"] * area_sqm
    return {
        "damage_class": damage_class,
        "description": rate_info["desc"],
        "rate_per_sqm_inr": rate_info["rate_per_sqm"],
        "estimated_area_sqm": area_sqm,
        "estimated_cost_inr": round(total, 2),
    }
