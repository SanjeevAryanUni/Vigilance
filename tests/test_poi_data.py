"""
VIGILANCE — Unit Tests for Chennai GIS POI & Road Hierarchy Engine
"""

import pytest
from poi_data import (
    haversine_meters,
    get_road_weight,
    get_proximity_weight,
    get_contractor,
    match_nearest_road,
    ROAD_HIERARCHY,
    CHENNAI_POIS
)


def test_haversine_known_distances():
    """Verify Haversine distance calculation matches known metric ground truth."""
    # Zero distance
    assert haversine_meters(13.0, 80.0, 13.0, 80.0) == 0.0

    # Chennai Kathipara (13.0067, 80.2030) to Guindy Station (13.0085, 80.2120) ~1.0 km
    dist_guindy = haversine_meters(13.0067, 80.2030, 13.0085, 80.2120)
    assert 950 <= dist_guindy <= 1050, f"Expected ~1000m, got {dist_guindy}m"

    # SRM Potheri (12.8231, 80.0442) to IIT Madras (12.9916, 80.2336) ~28-30 km
    dist_srm_iit = haversine_meters(12.8231, 80.0442, 12.9916, 80.2336)
    assert 27000 <= dist_srm_iit <= 32000, f"Expected ~29km, got {dist_srm_iit}m"


def test_road_hierarchy_weights():
    """Verify official road hierarchy importance weights."""
    assert get_road_weight("GST Road, Tambaram, Chennai") == 1.00
    assert get_road_weight("Poonamallee High Road, Chennai") == 0.90
    assert get_road_weight("Anna Salai (Mount Road), Chennai") == 0.85
    assert get_road_weight("Non-Existent Minor Street") == 0.60  # Default fallback


def test_poi_proximity_scoring():
    """Verify nearest POI distance and importance weight tiers."""
    # Coordinate right next to SRM Medical College Hospital (12.8233, 80.0440)
    wt, poi_name, dist_m = get_proximity_weight(12.8233, 80.0441)
    assert wt == 1.00  # < 500m -> 1.00
    assert "SRM Medical" in poi_name
    assert dist_m < 50.0

    # Coordinate far away in remote Bay of Bengal coordinates
    wt_remote, _, dist_remote = get_proximity_weight(13.0000, 80.5000)
    assert wt_remote == 0.25  # > 3000m -> 0.25
    assert dist_remote > 3000.0


def test_contractor_sla_mapping():
    """Verify road-to-contractor SLA mapping."""
    contractor = get_contractor("GST Road, Tambaram, Chennai")
    assert "L&T" in contractor["name"]
    assert contractor["sla_hours"] == 24

    pwd = get_contractor("Poonamallee High Road, Chennai")
    assert "PWD" in pwd["name"]
    assert pwd["sla_hours"] == 48

    default_corp = get_contractor("Unknown Alleyway")
    assert "Greater Chennai Public Works" in default_corp["name"]


def test_match_nearest_road():
    """Verify nearest road waypoint snapping from raw GPS coordinates."""
    # Near SRM
    road_srm = match_nearest_road(12.8230, 80.0440)
    assert "SRM" in road_srm

    # Near Kathipara
    road_kathipara = match_nearest_road(13.0065, 80.2032)
    assert "Kathipara" in road_kathipara

    # Near Anna Salai
    road_anna_salai = match_nearest_road(13.0600, 80.2500)
    assert "Anna Salai" in road_anna_salai
