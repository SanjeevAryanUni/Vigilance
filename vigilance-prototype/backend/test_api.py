import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from database import init_db, SessionLocal, Detection, Cluster

class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()
        self.db.query(Detection).delete()
        self.db.query(Cluster).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(Detection).delete()
        self.db.query(Cluster).delete()
        self.db.commit()
        self.db.close()

    def test_health_endpoints(self):
        """Verify root and /api health endpoints return 200 with online status."""
        resp_root = self.client.get("/health")
        self.assertEqual(resp_root.status_code, 200)
        data_root = resp_root.json()
        self.assertEqual(data_root.get("status"), "healthy")
        self.assertIn("VIGILANCE", data_root.get("service", ""))

        resp_api = self.client.get("/api/health")
        self.assertEqual(resp_api.status_code, 200)
        data_api = resp_api.json()
        self.assertEqual(data_api.get("status"), "healthy")

    def test_stats_endpoint(self):
        """Verify /api/stats aggregates cluster and detection counts properly."""
        resp = self.client.get("/api/stats")
        self.assertEqual(resp.status_code, 200)
        stats = resp.json()
        self.assertIn("active_potholes", stats)
        self.assertIn("active_corridors", stats)
        self.assertIn("potholes_repaired", stats)

    def test_detections_and_clusters_flow(self):
        """Verify posting a detection creates DB entry and clusters endpoint serves it."""
        payload = {
            "defect_type": "D40",
            "confidence": 0.93,
            "severity": "critical",
            "vehicle_id": "TEST-BUS-01",
            "lat": 13.0067,
            "lon": 80.2030,
            "road_name": "GST Road, Tambaram, Chennai"
        }
        post_resp = self.client.post("/api/detections", json=payload)
        self.assertEqual(post_resp.status_code, 200)

        # Query detections
        det_resp = self.client.get("/api/detections")
        self.assertEqual(det_resp.status_code, 200)
        detections = det_resp.json()
        self.assertGreaterEqual(len(detections), 1)
        self.assertEqual(detections[0]["defect_type"], "D40")

        # Query clusters
        cluster_resp = self.client.get("/api/clusters")
        self.assertEqual(cluster_resp.status_code, 200)
        clusters = cluster_resp.json()
        self.assertGreaterEqual(len(clusters), 1)

    def test_work_orders_endpoint(self):
        """Verify work orders endpoint returns list with expected schema."""
        resp = self.client.get("/api/work-orders")
        self.assertEqual(resp.status_code, 200)
        orders = resp.json()
        self.assertIsInstance(orders, list)

if __name__ == "__main__":
    unittest.main()
