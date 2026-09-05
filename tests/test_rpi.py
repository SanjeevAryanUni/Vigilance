"""
VIGILANCE — Unit Tests for Dynamic Repair Prioritization Index (RPI)
"""

import pytest
from rpi_calculator import (
    compute_rpi,
    get_rpi_breakdown,
    get_severity_score,
    WEIGHT_SEVERITY,
    WEIGHT_DENSITY,
    WEIGHT_TRAFFIC,
    WEIGHT_POI,
)


def test_rpi_weights_sum_to_100():
    """Verify that all four core pillars of the RPI formula sum to 100 points."""
    total_weight = WEIGHT_SEVERITY + WEIGHT_DENSITY + WEIGHT_TRAFFIC + WEIGHT_POI
    assert total_weight == 100.0, f"Expected total weights to equal 100.0, got {total_weight}"


def test_rpi_score_bounds():
    """Verify that RPI scores are strictly bounded within [10.0, 100.0]."""
    # Minimum possible inputs
    min_score = compute_rpi(severity="low", count=1, road_type_weight=0.0, proximity_weight=0.0)
    assert 10.0 <= min_score <= 100.0
    assert min_score >= 10.0

    # Maximum possible inputs
    max_score = compute_rpi(severity="critical", count=20, road_type_weight=1.0, proximity_weight=1.0)
    assert max_score == 100.0

    # Boundary test with out-of-range inputs
    clamped_score = compute_rpi(severity="critical", count=100, road_type_weight=2.5, proximity_weight=3.0)
    assert clamped_score == 100.0


def test_severity_monotonicity():
    """Verify that higher defect severities strictly produce higher RPI scores."""
    rpi_crit = compute_rpi(severity="critical", count=3, road_type_weight=0.8, proximity_weight=0.5)
    rpi_high = compute_rpi(severity="high", count=3, road_type_weight=0.8, proximity_weight=0.5)
    rpi_med  = compute_rpi(severity="medium", count=3, road_type_weight=0.8, proximity_weight=0.5)
    rpi_low  = compute_rpi(severity="low", count=3, road_type_weight=0.8, proximity_weight=0.5)

    assert rpi_crit > rpi_high, f"Expected critical ({rpi_crit}) > high ({rpi_high})"
    assert rpi_high > rpi_med,  f"Expected high ({rpi_high}) > medium ({rpi_med})"
    assert rpi_med > rpi_low,   f"Expected medium ({rpi_med}) > low ({rpi_low})"


def test_road_hierarchy_impact():
    """Verify that defects on National Highways (NH-32) receive higher priority than collector roads."""
    rpi_highway = compute_rpi(severity="high", count=2, road_type_weight=1.00, proximity_weight=0.5)
    rpi_collector = compute_rpi(severity="high", count=2, road_type_weight=0.40, proximity_weight=0.5)

    assert rpi_highway > rpi_collector
    assert (rpi_highway - rpi_collector) == pytest.approx(12.0, abs=0.5)  # (1.0 - 0.4) * 20 pts = 12.0 pts


def test_poi_proximity_impact():
    """Verify that proximity to critical facilities (hospitals/schools) elevates RPI."""
    rpi_near_hospital = compute_rpi(severity="high", count=2, road_type_weight=0.7, proximity_weight=1.00)
    rpi_standard_zone = compute_rpi(severity="high", count=2, road_type_weight=0.7, proximity_weight=0.25)

    assert rpi_near_hospital > rpi_standard_zone
    assert (rpi_near_hospital - rpi_standard_zone) == pytest.approx(11.25, abs=0.5)  # (1.0 - 0.25) * 15 pts = 11.25 pts


def test_density_scaling():
    """Verify that multiple vehicle passes (density) increase confidence and priority up to saturation."""
    rpi_1_pass = compute_rpi(severity="medium", count=1, road_type_weight=0.5, proximity_weight=0.5)
    rpi_3_pass = compute_rpi(severity="medium", count=3, road_type_weight=0.5, proximity_weight=0.5)
    rpi_5_pass = compute_rpi(severity="medium", count=5, road_type_weight=0.5, proximity_weight=0.5)
    rpi_10_pass = compute_rpi(severity="medium", count=10, road_type_weight=0.5, proximity_weight=0.5)

    assert rpi_1_pass < rpi_3_pass < rpi_5_pass
    # Saturation at 5 detections (10 detections should match 5 detections)
    assert rpi_5_pass == rpi_10_pass


def test_rpi_breakdown_audit_trail():
    """Verify that get_rpi_breakdown returns accurate subcomponent values matching the total score."""
    breakdown = get_rpi_breakdown(severity="critical", count=4, road_type_weight=0.9, proximity_weight=0.75)

    assert "rpi_score" in breakdown
    assert "components" in breakdown

    comps = breakdown["components"]
    recomputed_total = (
        comps["severity"]["points"] +
        comps["density"]["points"] +
        comps["traffic"]["points"] +
        comps["poi_proximity"]["points"]
    )
    assert round(recomputed_total, 1) == breakdown["rpi_score"]
