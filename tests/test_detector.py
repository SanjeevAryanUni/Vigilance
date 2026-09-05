"""
VIGILANCE — Unit Tests for Edge AI Road Damage Detector
"""

import os
import pytest
import numpy as np
from detector import RoadDamageDetector


@pytest.fixture
def detector():
    return RoadDamageDetector(conf_threshold=0.25)


def test_detector_initialization(detector):
    """Verify detector initializes with fine-tuned ONNX or fallback engine."""
    assert detector is not None
    assert detector.engine_type in ["onnx_int8", "onnx_fp32", "pytorch_yolov8", "simulator"]
    assert 0 in detector.class_names
    assert 3 in detector.class_names
    assert "Pothole" in detector.class_names[3]


def test_frame_preprocessing(detector):
    """Verify image preprocessing resizes to 640x640, normalizes to [0,1], and transposes to NCHW."""
    # Create dummy 1080p BGR image (1080, 1920, 3)
    dummy_frame = np.random.randint(0, 256, (1080, 1920, 3), dtype=np.uint8)
    preprocessed = detector._preprocess_frame(dummy_frame)

    assert preprocessed.shape == (1, 3, 640, 640)
    assert preprocessed.dtype == np.float32
    assert preprocessed.min() >= 0.0
    assert preprocessed.max() <= 1.0


def test_simulator_detection_payload_format(detector):
    """Verify simulated detections match edge telemetry schema."""
    sim_detections = detector._simulate_detection(lat=13.0067, lon=80.2030, vehicle_id="TEST-BUS-99")
    
    assert isinstance(sim_detections, list)
    if len(sim_detections) > 0:
        det = sim_detections[0]
        assert "defect_type" in det
        assert det["defect_type"] in ["D00", "D10", "D20", "D40"]
        assert "confidence" in det
        assert 0.0 <= det["confidence"] <= 1.0
        assert "severity" in det
        assert det["severity"] in ["low", "medium", "high", "critical"]
        assert "bbox" in det
        assert len(det["bbox"]) == 4
        assert det["vehicle_id"] == "TEST-BUS-99"


def test_inference_on_dummy_frame(detector):
    """Verify infer_frame executes without crashing on a real image array."""
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    results = detector.infer_frame(frame=dummy_frame, lat=12.8231, lon=80.0442, vehicle_id="TEST-BUS-01")
    assert isinstance(results, list)
