"""
VIGILANCE — Live Dashcam Video Stream Processor
================================================
Reads an MP4 dashcam video file, pipelines ALL 3 edge AI models
(Road Damage + Traffic + ANPR) frame-by-frame, and outputs:
  1. A live OpenCV window with annotated bounding boxes
  2. MJPEG frames to a Flask HTTP server (via video_server.py)

Usage:
  python stream_video.py --video ../assets/demo_samples/chennai_road.mp4
  python stream_video.py --video 0  # Use webcam (index 0)

Color Coding:
  - RED boxes:   Road damage (potholes, cracks)
  - BLUE boxes:  Vehicles (cars, trucks, buses)
  - GREEN boxes: License plates (ANPR)
"""
import os
import sys
import cv2
import time
import json
import argparse
import threading
import numpy as np
from datetime import datetime
from typing import Optional, List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Ensure UTF-8 console output on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from detector import RoadDamageDetector
from traffic_detector import TrafficDetector
from anpr_detector import ANPRDetector

import video_server
from video_server import (
    set_latest_frame,
    get_latest_frame,
    update_stats,
    get_stats,
    start_server_thread,
)


# ── Bounding Box Drawing Utilities ───────────────────────────────

# Color scheme: BGR format for OpenCV
COLOR_ROAD_DAMAGE = (0, 0, 255)      # RED
COLOR_VEHICLE = (255, 140, 0)        # BLUE-ish
COLOR_PLATE = (0, 255, 0)            # GREEN
COLOR_BG = (20, 20, 20)              # Dark background for labels


def draw_detection_box(
    frame: np.ndarray,
    x1: int, y1: int, x2: int, y2: int,
    label: str, confidence: float,
    color: tuple, thickness: int = 2
) -> np.ndarray:
    """Draw a bounding box with label and confidence bar."""
    h, w = frame.shape[:2]
    x1, y1 = max(0, min(w - 1, x1)), max(0, min(h - 1, y1))
    x2, y2 = max(0, min(w - 1, x2)), max(0, min(h - 1, y2))
    if x2 <= x1 or y2 <= y1:
        return frame

    # Bounding box
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

    # Label background
    label_text = f"{label} {confidence:.0%}"
    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    label_top = max(0, y1 - th - 10)
    cv2.rectangle(frame, (x1, label_top), (min(w, x1 + tw + 8), y1), color, -1)
    cv2.putText(frame, label_text, (x1 + 4, max(th + 2, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Confidence bar under the box
    bar_width = x2 - x1
    bar_fill = int(bar_width * max(0.0, min(1.0, confidence)))
    bar_y = min(h - 6, y2 + 4)
    cv2.rectangle(frame, (x1, bar_y), (x2, bar_y + 5), (40, 40, 40), -1)
    cv2.rectangle(frame, (x1, bar_y), (x1 + bar_fill, bar_y + 5), color, -1)

    return frame


def draw_hud_overlay(frame: np.ndarray, fps: float, counts: Dict[str, int], frame_num: int) -> np.ndarray:
    """Draw a heads-up display with FPS, model status, and detection counts."""
    h, w = frame.shape[:2]

    # Top-left: VIGILANCE branding
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (min(w, 340), min(h, 95)), (10, 10, 10), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    cv2.putText(frame, "VIGILANCE EDGE AI", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (34, 211, 238), 2)
    cv2.putText(frame, f"FPS: {fps:.1f} | Frame: {frame_num}", (10, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
    cv2.putText(frame, f"Damage: {counts.get('road_damage', 0)} | Vehicles: {counts.get('vehicles', 0)} | Plates: {counts.get('plates', 0)}", (10, 62), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

    # Timestamp
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(frame, ts, (10, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 150, 150), 1)

    # Bottom: Model status indicators
    bar_y = max(15, h - 20)
    models = [
        ("ROAD-DMG INT8", COLOR_ROAD_DAMAGE),
        ("TRAFFIC YOLO", COLOR_VEHICLE),
        ("ANPR OCR", COLOR_PLATE),
    ]
    for i, (name, color) in enumerate(models):
        x = 10 + i * 160
        if x + 120 < w:
            cv2.circle(frame, (x, bar_y), 5, color, -1)
            cv2.putText(frame, name, (x + 12, bar_y + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, color, 1)

    return frame


# ── Main Video Processing Loop ───────────────────────────────────

def process_video(
    video_source: str,
    show_window: bool = True,
    loop: bool = True,
    max_fps: float = 25.0,
    target_width: int = 960,
):
    """
    Main processing loop. Reads video, runs 3 detectors, annotates, and streams.

    Args:
        video_source: Path to MP4 file, or "0" for webcam.
        show_window: Whether to show an OpenCV window.
        loop: Whether to loop the video when it ends.
        max_fps: Max frame rate to process at.
        target_width: Resize width for processing efficiency.
    """
    global _stats

    # Initialize detectors
    print("=" * 60)
    print("  VIGILANCE EDGE AI — Video Stream Processor")
    print("=" * 60)

    print("\n[1/3] Loading Road Damage Detector (INT8 ONNX)...")
    road_detector = RoadDamageDetector()

    print("[2/3] Loading Traffic/Vehicle Detector (YOLOv8n COCO)...")
    traffic_detector = TrafficDetector()

    print("[3/3] Loading ANPR Detector (Plate Localizer + OCR)...")
    anpr_detector = ANPRDetector()

    print(f"\n✓ All 3 models loaded. Opening video: {video_source}")

    # Resolve video source path if relative
    if not str(video_source).isdigit():
        if not os.path.exists(video_source):
            # Check relative to repo root or assets
            possible_paths = [
                os.path.abspath(video_source),
                os.path.join(os.path.dirname(__file__), video_source),
                os.path.join(os.path.dirname(__file__), "..", video_source),
                os.path.join(os.path.dirname(__file__), "..", "assets", "demo_samples", os.path.basename(video_source)),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    video_source = p
                    break

    # Open video source
    source = int(video_source) if str(video_source).isdigit() else video_source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"✗ ERROR: Cannot open video source: {video_source}")
        sys.exit(1)

    src_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"  Source: {src_fps:.0f} FPS, {total_frames} frames")

    frame_delay = 1.0 / min(max_fps, src_fps if src_fps > 0 else 25.0)
    frame_count = 0
    fps_counter = 0
    fps_timer = time.time()
    current_fps = 0.0
    update_stats({"status": "running"})

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                if loop and not str(video_source).isdigit():
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    break

            frame_count += 1

            # Resize for performance
            h_orig, w_orig = frame.shape[:2]
            scale = target_width / w_orig
            target_height = max(1, int(h_orig * scale))
            frame = cv2.resize(frame, (target_width, target_height))

            # ── Run all 3 detectors ──────────────────────────────
            counts = {"road_damage": 0, "vehicles": 0, "plates": 0}

            # 1. Road Damage Detection
            try:
                if hasattr(road_detector, "infer_frame"):
                    road_result = road_detector.infer_frame(frame=frame)
                else:
                    road_result = road_detector.detect(frame)
                if road_result:
                    road_dets = road_result.get("detections", []) if isinstance(road_result, dict) else road_result
                    for det in road_dets:
                        bbox = det.get("bbox", det.get("box", []))
                        if len(bbox) == 4:
                            x1, y1, x2, y2 = bbox
                            # Handle normalized (0-1) vs pixel coordinates
                            if isinstance(x1, float) and x1 <= 1.0 and x2 <= 1.0 and y1 <= 1.0 and y2 <= 1.0:
                                x1 = int(x1 * target_width)
                                x2 = int(x2 * target_width)
                                y1 = int(y1 * target_height)
                                y2 = int(y2 * target_height)
                            else:
                                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                            label = det.get("defect_type", det.get("class_name", det.get("label", "Damage")))
                            conf = det.get("confidence", det.get("conf", 0.5))
                            frame = draw_detection_box(frame, x1, y1, x2, y2, label, conf, COLOR_ROAD_DAMAGE)
                            counts["road_damage"] += 1
            except Exception as e:
                pass  # Silently handle detection failures

            # 2. Traffic / Vehicle Detection
            try:
                traffic_result = traffic_detector.detect(frame)
                if traffic_result and isinstance(traffic_result, dict):
                    traffic_dets = traffic_result.get("vehicles", []) + traffic_result.get("pedestrians", []) + traffic_result.get("detections", [])
                    for det in traffic_dets:
                        bbox = det.get("bbox", det.get("box", []))
                        if len(bbox) == 4:
                            x1, y1, x2, y2 = [int(v) for v in bbox]
                            label = det.get("class", det.get("class_name", det.get("label", "Vehicle")))
                            conf = det.get("confidence", det.get("conf", 0.5))
                            frame = draw_detection_box(frame, x1, y1, x2, y2, label, conf, COLOR_VEHICLE)
                            counts["vehicles"] += 1
            except Exception as e:
                pass

            # 3. ANPR (License Plate) Detection
            try:
                if hasattr(anpr_detector, "detect_plates"):
                    anpr_result = anpr_detector.detect_plates(frame)
                else:
                    anpr_result = anpr_detector.detect(frame)

                if anpr_result:
                    anpr_dets = anpr_result.get("detections", anpr_result.get("plates", [])) if isinstance(anpr_result, dict) else anpr_result
                    for det in anpr_dets:
                        bbox = det.get("bbox", det.get("box", []))
                        plate_text = det.get("plate_text", det.get("text", ""))
                        if len(bbox) == 4:
                            x1, y1, x2, y2 = [int(v) for v in bbox]
                            label = f"PLATE: {plate_text}" if plate_text else "Plate"
                            conf = det.get("confidence", det.get("conf", 0.5))
                            frame = draw_detection_box(frame, x1, y1, x2, y2, label, conf, COLOR_PLATE)
                            counts["plates"] += 1
            except Exception as e:
                pass

            # ── Draw HUD overlay ─────────────────────────────────
            frame = draw_hud_overlay(frame, current_fps, counts, frame_count)

            # ── FPS calculation ──────────────────────────────────
            fps_counter += 1
            elapsed = time.time() - fps_timer
            if elapsed >= 1.0:
                current_fps = fps_counter / elapsed
                fps_counter = 0
                fps_timer = time.time()

            # ── Update global stats ──────────────────────────────
            update_stats({
                "fps": round(current_fps, 1),
                "frame_count": frame_count,
                "detections": counts,
                "status": "running",
            })

            # ── Encode frame for MJPEG streaming ─────────────────
            _, jpeg_bytes = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            set_latest_frame(jpeg_bytes.tobytes())

            # ── Show local OpenCV window ─────────────────────────
            if show_window:
                cv2.imshow("VIGILANCE Edge AI — Live Feed", frame)
                key = cv2.waitKey(max(1, int(frame_delay * 1000))) & 0xFF
                if key == ord('q') or key == 27:  # 'q' or ESC
                    break
            else:
                time.sleep(frame_delay)

    except KeyboardInterrupt:
        print("\n[VIGILANCE] Stream stopped by user.")
    finally:
        update_stats({"status": "stopped"})
        cap.release()
        if show_window:
            cv2.destroyAllWindows()
        print(f"\n✓ Processed {frame_count} frames. Exiting.")


# ── CLI Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VIGILANCE Edge AI — Live Dashcam Video Processor")
    parser.add_argument("--video", "-v", type=str, default="../assets/demo_samples/chennai_road.mp4",
                        help="Path to video file or webcam index (e.g., '0')")
    parser.add_argument("--no-window", action="store_true",
                        help="Disable OpenCV window (headless mode for server)")
    parser.add_argument("--no-loop", action="store_true",
                        help="Don't loop the video when it ends")
    parser.add_argument("--max-fps", type=float, default=25.0,
                        help="Maximum frames per second to process")
    parser.add_argument("--width", type=int, default=960,
                        help="Resize width for processing")
    parser.add_argument("--serve", action="store_true",
                        help="Also start the MJPEG HTTP server on port 8001")

    args = parser.parse_args()

    if args.serve:
        # Start video server in a background thread
        from video_server import start_server_thread
        start_server_thread(port=8001)
        print("✓ MJPEG server started on http://localhost:8001/video_feed")

    process_video(
        video_source=args.video,
        show_window=not args.no_window,
        loop=not args.no_loop,
        max_fps=args.max_fps,
        target_width=args.width,
    )
