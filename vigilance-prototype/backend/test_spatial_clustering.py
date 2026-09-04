import os
import sys
import unittest
import math

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, SessionLocal, Detection, Cluster, run_spatial_deduplication, compute_rpi
from poi_data import haversine_meters, get_road_weight, get_proximity_weight, match_nearest_road

class TestSpatialClustering(unittest.TestCase):
    def setUp(self):
        init_db()
        self.db = SessionLocal()
        # Clean test tables
        self.db.query(Detection).delete()
        self.db.query(Cluster).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(Detection).delete()
        self.db.query(Cluster).delete()
        self.db.commit()
        self.db.close()

    def test_haversine_distance_accuracy(self):
        """Verify haversine distance calculation matches known metric standards."""
        # Chennai Kathipara (13.0067, 80.2030) to Guindy Station (13.0085, 80.2120) ~1.0 km
        dist = haversine_meters(13.0067, 80.2030, 13.0085, 80.2120)
        self.assertTrue(950 <= dist <= 1050, f"Expected ~1000m, got {dist}m")

        # Zero distance
        self.assertAlmostEqual(haversine_meters(13.0, 80.0, 13.0, 80.0), 0.0, places=2)

    def test_spatial_clustering_within_15m_threshold(self):
        """
        Verify that multiple vehicle passes within 15m radius are merged into 1 cluster.
        13.006700, 80.203000 to 13.006750, 80.203050 is ~7.8 meters apart (<15m).
        """
        lat_base = 13.006700
        lon_base = 80.203000

        # Point 1: Base coordinate
        d1 = Detection(
            defect_type="D40",
            confidence=0.92,
            severity="critical",
            vehicle_id="BUS-TN01-1042",
            lat=lat_base,
            lon=lon_base,
            road_name="GST Road, Tambaram, Chennai"
        )
        # Point 2: 7.8m away (< 15m)
        d2 = Detection(
            defect_type="D40",
            confidence=0.88,
            severity="critical",
            vehicle_id="BUS-TN02-3891",
            lat=lat_base + 0.000050,
            lon=lon_base + 0.000050,
            road_name="GST Road, Tambaram, Chennai"
        )
        # Point 3: 11.2m away (< 15m)
        d3 = Detection(
            defect_type="D20",
            confidence=0.85,
            severity="high",
            vehicle_id="MUNICIPAL-TRUCK-07",
            lat=lat_base + 0.000080,
            lon=lon_base + 0.000060,
            road_name="GST Road, Tambaram, Chennai"
        )

        self.db.add_all([d1, d2, d3])
        self.db.commit()

        num_clusters = run_spatial_deduplication(self.db)
        self.assertEqual(num_clusters, 1, f"Expected 3 detections within 15m to merge into 1 cluster, got {num_clusters}")

        cluster = self.db.query(Cluster).first()
        self.assertIsNotNone(cluster)
        self.assertEqual(cluster.detection_count, 3)
        self.assertEqual(cluster.max_severity, "critical")
        self.assertEqual(cluster.dominant_type, "D40")

    def test_spatial_clustering_distinct_clusters_over_15m(self):
        """
        Verify that detections > 15m apart form distinct clusters.
        Point 1: GST Road (13.0067, 80.2030)
        Point 2: Anna Salai (13.0619, 80.2522) - ~8.0 km away
        """
        d1 = Detection(
            defect_type="D40",
            confidence=0.94,
            severity="critical",
            vehicle_id="BUS-TN01-1042",
            lat=13.0067,
            lon=80.2030,
            road_name="GST Road, Tambaram, Chennai"
        )
        d2 = Detection(
            defect_type="D00",
            confidence=0.81,
            severity="medium",
            vehicle_id="BUS-TN02-3891",
            lat=13.0619,
            lon=80.2522,
            road_name="Anna Salai (Mount Road), Chennai"
        )

        self.db.add_all([d1, d2])
        self.db.commit()

        num_clusters = run_spatial_deduplication(self.db)
        self.assertEqual(num_clusters, 2, f"Expected 2 distinct clusters, got {num_clusters}")

        clusters = self.db.query(Cluster).all()
        self.assertEqual(len(clusters), 2)
        # Verify both have distinct centroid coordinates
        self.assertNotEqual(clusters[0].centroid_lat, clusters[1].centroid_lat)

    def test_rpi_formula_normalization_and_bounds(self):
        """
        Verify that RPI formula produces values strictly between 10.0 and 100.0
        and scales correctly with severity, density, hierarchy, and POI proximity.
        """
        # Highest possible priority: Critical severity (1.0), 5+ passes (1.0), Highway (1.0), Hospital proximity (1.0)
        # RPI = 1.0*40 + 1.0*25 + 1.0*20 + 1.0*15 = 100.0
        max_rpi = compute_rpi(severity="critical", count=8, road_type_weight=1.0, proximity_weight=1.0)
        self.assertEqual(max_rpi, 100.0)

        # Lowest typical priority: Low severity (0.25), 1 pass (0.2), Local road (0.5), Standard zone (0.25)
        # RPI = 0.25*40 (10) + 0.2*25 (5) + 0.5*20 (10) + 0.25*15 (3.75) = 28.8
        min_rpi = compute_rpi(severity="low", count=1, road_type_weight=0.5, proximity_weight=0.25)
        self.assertTrue(10.0 <= min_rpi <= 40.0)

        # Verify monotonicity: critical severity > medium severity under same conditions
        rpi_crit = compute_rpi("critical", 3, 0.8, 0.5)
        rpi_med = compute_rpi("medium", 3, 0.8, 0.5)
        self.assertGreater(rpi_crit, rpi_med)

    def test_status_preservation_across_reclustering(self):
        """
        Verify that when a cluster is marked 'assigned' or 'resolved' by an operator,
        re-running spatial deduplication on subsequent bus passes preserves that status.
        """
        d1 = Detection(
            defect_type="D40",
            confidence=0.90,
            severity="critical",
            vehicle_id="BUS-TN01-1042",
            lat=13.0067,
            lon=80.2030,
            road_name="GST Road, Tambaram, Chennai"
        )
        self.db.add(d1)
        self.db.commit()
        run_spatial_deduplication(self.db)

        # Operator assigns work order
        cluster = self.db.query(Cluster).first()
        cluster.status = "assigned"
        self.db.commit()

        # Another bus passes and logs new detection at same spot
        d2 = Detection(
            defect_type="D40",
            confidence=0.95,
            severity="critical",
            vehicle_id="BUS-TN22-5501",
            lat=13.00671,
            lon=80.20301,
            road_name="GST Road, Tambaram, Chennai"
        )
        self.db.add(d2)
        self.db.commit()

        # Re-run deduplication
        run_spatial_deduplication(self.db)
        res_cluster = self.db.query(Cluster).first()
        self.assertEqual(res_cluster.status, "assigned", "Expected cluster status 'assigned' to be preserved across re-clustering passes")

if __name__ == "__main__":
    unittest.main()

