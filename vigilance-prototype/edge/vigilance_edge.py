#!/usr/bin/env python3
"""
VIGILANCE Edge Client - Version 1 (Single-Image Pipeline)
==========================================================
Pipeline: GPS -> YOLO (ONNX) -> Pothole Detection -> POST /api/detections

Runtime: ONNX Runtime with INT8 quantized YOLOv8n road damage model.
         Model: edge/models/road_damage_yolov8n_int8.onnx (3.2 MB)
         Input:  (1, 3, 640, 640) float32
         Output: (1, 8, 8400)
                   rows 0-3 : cx, cy, w, h  (in 640-pixel letterbox space)
                   rows 4-7 : class scores D00, D10, D20, D40

Image preprocessing uses letterbox resize (Pillow + numpy, no cv2 required).

Usage:
    export VIGILANCE_API_URL="http://10.3.x.x:8000/api/detections"
    export VIGILANCE_VEHICLE_ID="ANDROID-PHONE-01"     # optional
    export VIGILANCE_MODEL_PATH="/path/to/model.onnx"  # optional
    python vigilance_edge.py [image_path]

    If image_path is omitted the script requires a real image.
"""

import os
import sys
import json
import subprocess
import threading
import time
import base64
import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple

import numpy as np
import requests
from PIL import Image

# ── Configuration ─────────────────────────────────────────────────────────────

API_URL    = os.getenv("VIGILANCE_API_URL", "http://127.0.0.1:8000/api/detections")
VEHICLE_ID = os.getenv("VIGILANCE_VEHICLE_ID", "ANDROID-PHONE-01")

# Model path: look for INT8 first, then FP32
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_MODEL_ENV    = os.getenv("VIGILANCE_MODEL_PATH", "")
_DEFAULT_INT8 = os.path.join(_SCRIPT_DIR, "models", "road_damage_yolov8n_int8.onnx")
_DEFAULT_FP32 = os.path.join(_SCRIPT_DIR, "models", "road_damage_yolov8n.onnx")

# ── Detection thresholds (easy to change for testing vs production) ────────────
CONF_THRESHOLD = 0.20   # lower during debugging; raise to 0.45 for production
IOU_THRESHOLD  = 0.45   # NMS IoU threshold

# RDD2022 class map — exactly 4 classes, indices 0-3
CLASS_NAMES = {
    0: "D00",   # Longitudinal Crack
    1: "D10",   # Transverse Crack
    2: "D20",   # Alligator Crack
    3: "D40",   # Pothole
}
NUM_CLASSES = 4


# ── GPS acquisition ───────────────────────────────────────────────────────────
# Unchanged from the working implementation.

class GPSTimeout(Exception):
    pass


def _run_location_cmd(cmd: list, timeout_seconds: int):
    """
    Launch termux-location via Popen.
    Shows a live countdown. Kills the subprocess on timeout.
    Returns (stdout, returncode) or raises GPSTimeout / FileNotFoundError.
    """
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    result_box: Dict[str, Any] = {}

    def _reader():
        out, _ = proc.communicate()
        result_box["stdout"]     = out
        result_box["returncode"] = proc.returncode

    reader = threading.Thread(target=_reader, daemon=True)
    reader.start()

    deadline = time.monotonic() + timeout_seconds
    while reader.is_alive():
        remaining = int(deadline - time.monotonic())
        if remaining <= 0:
            break
        print(f"\r  Waiting for fix... {remaining:2d}s remaining", end="", flush=True)
        time.sleep(1)

    print()  # newline after countdown

    if reader.is_alive():
        try:
            proc.kill()
        except OSError:
            pass
        proc.wait()
        raise GPSTimeout(f"No fix within {timeout_seconds}s")

    return result_box.get("stdout", ""), result_box.get("returncode", -1)


def _parse_location(stdout: str) -> Optional[Dict]:
    if not stdout or not stdout.strip():
        return None
    try:
        data = json.loads(stdout)
        lat  = data.get("latitude")
        lon  = data.get("longitude")
        if lat is None or lon is None:
            return None
        return {
            "latitude":  float(lat),
            "longitude": float(lon),
            "accuracy":  float(data.get("accuracy", 0.0)),
            "provider":  str(data.get("provider", "unknown")),
        }
    except json.JSONDecodeError:
        return None


def get_location() -> Dict:
    """
    GPS acquisition pipeline (fresh data only — never gps -r last):
      1. Fresh GPS     (30s timeout) -- 2-5 m accuracy
      2. Fresh Network (30s timeout) -- 50-100 m accuracy, fallback
    """
    print("[GPS]  Trying fresh GPS fix (up to 30s)...")
    try:
        stdout, _ = _run_location_cmd(
            ["termux-location", "-p", "gps", "-r", "once"],
            timeout_seconds=30,
        )
        loc = _parse_location(stdout)
        if loc:
            loc["source_quality"] = "GPS-FRESH"
            print(f"  [OK]  GPS fix  lat={loc['latitude']:.6f}  lon={loc['longitude']:.6f}  "
                  f"accuracy={loc['accuracy']:.1f}m  provider={loc['provider']}")
            return loc
        print("  [WARN] GPS returned empty data.")
    except FileNotFoundError:
        print("\n[ERROR] termux-location not found. Run: pkg install termux-api")
        sys.exit(1)
    except GPSTimeout:
        print("  [WARN] GPS timed out (30s). Trying network fallback...")

    print("[NET]  Trying fresh network location (up to 30s)...")
    try:
        stdout, _ = _run_location_cmd(
            ["termux-location", "-p", "network", "-r", "once"],
            timeout_seconds=30,
        )
        loc = _parse_location(stdout)
        if loc:
            loc["source_quality"] = "NETWORK-FRESH"
            print(f"  [OK]  Net fix  lat={loc['latitude']:.6f}  lon={loc['longitude']:.6f}  "
                  f"accuracy={loc['accuracy']:.1f}m  provider={loc['provider']}")
            return loc
        print("  [WARN] Network location returned empty data.")
    except GPSTimeout:
        print("  [WARN] Network location also timed out (30s).")

    print("\n[ERROR] Could not acquire a location fix from any provider.")
    print("        Check: Location toggle ON | Termux:API location permission = Allow all the time")
    sys.exit(1)


# ── Model loading ─────────────────────────────────────────────────────────────

def load_model():
    """
    Load the ONNX model (INT8 preferred, FP32 fallback).
    Returns (session, input_name, model_label).
    Note: ONNX Runtime prints "Unsupported platform (android)" on Android —
          this is a harmless warning; inference still works correctly.
    """
    import onnxruntime as ort

    if _MODEL_ENV and os.path.exists(_MODEL_ENV):
        model_path = _MODEL_ENV
    elif os.path.exists(_DEFAULT_INT8):
        model_path = _DEFAULT_INT8
    elif os.path.exists(_DEFAULT_FP32):
        model_path = _DEFAULT_FP32
    else:
        print("\n[ERROR] No ONNX model found.")
        print("        Expected at:", _DEFAULT_INT8)
        print("        Transfer the model from your laptop:")
        print("          curl -o ~/vigilance/models/road_damage_yolov8n_int8.onnx \\")
        print("               http://<laptop_ip>:8080/edge/models/road_damage_yolov8n_int8.onnx")
        print("        Or set VIGILANCE_MODEL_PATH=/path/to/model.onnx")
        sys.exit(1)

    label   = "INT8" if "int8" in os.path.basename(model_path) else "FP32"
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"[MODEL] Loading {label} ONNX model: {os.path.basename(model_path)} ({size_mb:.1f} MB)")

    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.intra_op_num_threads = 4   # use up to 4 CPU cores on the phone

    session    = ort.InferenceSession(model_path, sess_options=opts, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    print(f"  [OK]  Model loaded. Input: {session.get_inputs()[0].shape}  Engine: CPUExecutionProvider")
    return session, input_name, label


# ── Letterbox preprocessing ───────────────────────────────────────────────────

def letterbox_image(pil_img: Image.Image, target: int = 640) -> Tuple[np.ndarray, float, int, int]:
    """
    Resize image to target×target with letterbox padding (grey, value=114).
    Preserves aspect ratio.

    Returns:
        letterboxed  : np.ndarray (target, target, 3) uint8
        scale        : float — scale factor applied to original image
        pad_left     : int   — horizontal padding added (pixels)
        pad_top      : int   — vertical padding added (pixels)
    """
    orig_w, orig_h = pil_img.size
    scale  = min(target / orig_w, target / orig_h)
    new_w  = int(round(orig_w * scale))
    new_h  = int(round(orig_h * scale))

    resized = pil_img.resize((new_w, new_h), Image.BILINEAR)

    pad_left = (target - new_w) // 2
    pad_top  = (target - new_h) // 2

    canvas = Image.new("RGB", (target, target), (114, 114, 114))
    canvas.paste(resized, (pad_left, pad_top))

    return np.array(canvas, dtype=np.uint8), scale, pad_left, pad_top


def preprocess_image(image_path: str) -> Tuple[np.ndarray, int, int, float, int, int]:
    """
    Load image from file path, apply letterbox resize, normalise, return tensor.

    Returns:
        tensor   : np.ndarray (1, 3, 640, 640) float32
        orig_w   : int
        orig_h   : int
        scale    : float
        pad_left : int
        pad_top  : int
    """
    print(f"[IMG]  Loading image: {image_path}")
    pil_img = Image.open(image_path).convert("RGB")
    orig_w, orig_h = pil_img.size
    print(f"[IMG]  Original size: {orig_w}x{orig_h}")

    lb_arr, scale, pad_left, pad_top = letterbox_image(pil_img, target=640)

    arr    = lb_arr.astype(np.float32) / 255.0   # normalise [0, 1]
    arr    = np.transpose(arr, (2, 0, 1))         # HWC -> CHW
    tensor = np.expand_dims(arr, axis=0)          # (1, 3, 640, 640)

    print(f"[IMG]  Tensor shape: {tensor.shape}  scale={scale:.4f}  "
          f"pad=({pad_left}, {pad_top})")
    return tensor, orig_w, orig_h, scale, pad_left, pad_top


# ── NMS (per-class) ───────────────────────────────────────────────────────────

def _iou(box_a: np.ndarray, box_b: np.ndarray) -> float:
    """Compute IoU between two xyxy boxes."""
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def nms_per_class(candidates: List[Dict], iou_threshold: float = IOU_THRESHOLD) -> List[Dict]:
    """
    Non-Maximum Suppression applied independently per class.
    Input:  list of dicts with keys: cls_id, conf, box_lb (xyxy in letterbox space)
    Output: filtered list, highest-confidence boxes kept.
    """
    from collections import defaultdict
    by_class: Dict[int, List[Dict]] = defaultdict(list)
    for c in candidates:
        by_class[c["cls_id"]].append(c)

    kept = []
    for cls_id, boxes in by_class.items():
        # Sort descending by confidence
        boxes.sort(key=lambda x: x["conf"], reverse=True)
        suppressed = [False] * len(boxes)
        for i in range(len(boxes)):
            if suppressed[i]:
                continue
            kept.append(boxes[i])
            for j in range(i + 1, len(boxes)):
                if suppressed[j]:
                    continue
                if _iou(boxes[i]["box_lb"], boxes[j]["box_lb"]) >= iou_threshold:
                    suppressed[j] = True

    # Re-sort by confidence descending
    kept.sort(key=lambda x: x["conf"], reverse=True)
    return kept


# ── Severity mapping (mirrors detector.py) ────────────────────────────────────

def _severity(defect_type: str, bbox_area_fraction: float) -> str:
    if defect_type == "D40":
        return "critical" if bbox_area_fraction > 0.03 else "high"
    if defect_type == "D20":
        return "high"     if bbox_area_fraction > 0.02 else "medium"
    if defect_type == "D10":
        return "high"     if bbox_area_fraction > 0.04 else "medium"
    # D00
    return "medium"       if bbox_area_fraction > 0.03 else "low"


# ── Thumbnail encoding ────────────────────────────────────────────────────────

def _encode_crop(orig_rgb: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> Optional[str]:
    """Encode detection crop as base64 JPEG using Pillow (no cv2 needed)."""
    try:
        crop = orig_rgb[max(0, y1):y2, max(0, x1):x2]
        if crop.size == 0:
            return None
        buf = io.BytesIO()
        Image.fromarray(crop).save(buf, format="JPEG", quality=75)
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return None


# ── ONNX inference ────────────────────────────────────────────────────────────

def run_inference(
    session,
    input_name: str,
    image_path: str,
    vehicle_id: str,
    lat: float,
    lon: float,
) -> List[Dict]:
    """
    Full inference pipeline:
      1. Letterbox preprocess
      2. ONNX run
      3. Parse (1,8,8400) output — 4 box rows + 4 class score rows
      4. Filter by CONF_THRESHOLD
      5. NMS per class
      6. Reverse letterbox transform -> original image coordinates
      7. Build backend-compatible detection dicts

    Returns list of detection dicts (may be empty — never returns synthetic data).
    """
    # ── 1. Preprocess ─────────────────────────────────────────────────────────
    tensor, orig_w, orig_h, scale, pad_left, pad_top = preprocess_image(image_path)

    # Keep original RGB for thumbnail crops
    orig_rgb = np.array(Image.open(image_path).convert("RGB"))

    # ── 2. Run ONNX ───────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    outputs = session.run(None, {input_name: tensor})
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"[YOLO] Inference completed in {elapsed_ms:.1f} ms")

    raw = outputs[0]                 # (1, 8, 8400)
    print(f"[YOLO] Raw output shape: {raw.shape}")
    raw = raw[0]                     # (8, 8400)  — remove batch dim

    # ── 3. Split box coords and class scores ──────────────────────────────────
    # Rows 0-3: cx, cy, w, h  (in 640x640 letterbox pixel space)
    # Rows 4-7: class scores for D00, D10, D20, D40
    boxes_cxcywh = raw[:4, :].T      # (8400, 4)
    class_scores = raw[4:, :].T      # (8400, NUM_CLASSES=4)

    # ── 4. Confidence filtering ───────────────────────────────────────────────
    candidates: List[Dict] = []
    for i in range(boxes_cxcywh.shape[0]):
        scores  = class_scores[i]           # length-4 array
        cls_id  = int(np.argmax(scores))    # 0-3 direct, no modulo
        conf    = float(scores[cls_id])

        if conf < CONF_THRESHOLD:
            continue

        cx, cy, bw, bh = boxes_cxcywh[i]
        # xyxy in letterbox space (640x640)
        box_lb = np.array([
            cx - bw / 2,
            cy - bh / 2,
            cx + bw / 2,
            cy + bh / 2,
        ])

        candidates.append({
            "cls_id": cls_id,
            "conf":   conf,
            "box_lb": box_lb,
        })

    print(f"[YOLO] Candidates above {CONF_THRESHOLD}: {len(candidates)}")

    # ── 5. NMS per class ──────────────────────────────────────────────────────
    kept = nms_per_class(candidates, iou_threshold=IOU_THRESHOLD)
    print(f"[YOLO] Detections after NMS: {len(kept)}")

    # ── 6. Reverse letterbox -> original image coordinates ────────────────────
    detections: List[Dict] = []
    for det in kept:
        cls_id = det["cls_id"]
        conf   = det["conf"]
        x1_lb, y1_lb, x2_lb, y2_lb = det["box_lb"]

        # Remove padding, divide by scale, clip to original dimensions
        x1 = int(np.clip((x1_lb - pad_left) / scale, 0, orig_w))
        y1 = int(np.clip((y1_lb - pad_top)  / scale, 0, orig_h))
        x2 = int(np.clip((x2_lb - pad_left) / scale, 0, orig_w))
        y2 = int(np.clip((y2_lb - pad_top)  / scale, 0, orig_h))

        defect_type = CLASS_NAMES[cls_id]
        bbox_area   = ((x2 - x1) * (y2 - y1)) / max(1, orig_w * orig_h)
        severity    = _severity(defect_type, bbox_area)
        thumb_b64   = _encode_crop(orig_rgb, x1, y1, x2, y2)

        print(f"  [DET] {defect_type}  conf={conf:.4f}  severity={severity}  "
              f"bbox=[{x1},{y1},{x2},{y2}]")

        detections.append({
            "defect_type":   defect_type,
            "confidence":    round(conf, 4),
            "severity":      severity,
            "vehicle_id":    vehicle_id,
            "lat":           lat,
            "lon":           lon,
            "road_name":     None,        # auto-matched by backend
            "thumbnail_b64": thumb_b64,
            # Private fields — stripped before POST
            "_bbox":         [x1, y1, x2, y2],
            "_timestamp":    datetime.now(timezone.utc).isoformat(),
        })

    return detections


# ── Backend POST ──────────────────────────────────────────────────────────────

def post_detection(api_url: str, detection: Dict) -> bool:
    """
    POST a single detection to the FastAPI backend.
    Strips private _-prefixed keys before sending.
    Returns True on HTTP 200.

    Every exception branch prints the actual error message so the real
    failure cause is always visible (not hidden behind a generic label).
    """
    payload = {k: v for k, v in detection.items() if not k.startswith("_")}

    print(f"\n[POST] Sending to {api_url}")
    print(f"       defect={payload['defect_type']}  conf={payload['confidence']}  "
          f"severity={payload['severity']}  vehicle={payload['vehicle_id']}")
    print(f"       lat={payload['lat']:.6f}  lon={payload['lon']:.6f}")
    print(f"       payload keys: {list(payload.keys())}")

    try:
        resp = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"[RECV] HTTP {resp.status_code}")
        if resp.status_code == 200:
            print(f"  [OK] {resp.json()}")
            return True
        else:
            print(f"  [ERROR] HTTP {resp.status_code}")
            print(f"          Body: {resp.text[:500]}")
            return False

    except requests.exceptions.ConnectionError as e:
        print(f"\n[ERROR] ConnectionError — could not reach {api_url}")
        print(f"        Cause: {e}")
        print(f"        Detail: {repr(e)}")
        print("        Check: FastAPI running? Same Wi-Fi? Correct IP and port?")
        return False

    except requests.exceptions.Timeout as e:
        print(f"\n[ERROR] Timeout — no response from backend within 10s")
        print(f"        Cause: {repr(e)}")
        return False

    except requests.exceptions.RequestException as e:
        # Catches any other requests error (SSL, invalid URL, etc.)
        print(f"\n[ERROR] RequestException: {type(e).__name__}")
        print(f"        Cause: {e}")
        print(f"        Detail: {repr(e)}")
        return False

    except Exception as e:
        # Catch-all for unexpected errors (e.g. JSON serialisation failures)
        print(f"\n[ERROR] Unexpected error during POST: {type(e).__name__}")
        print(f"        Cause: {e}")
        print(f"        Detail: {repr(e)}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    image_path = sys.argv[1] if len(sys.argv) > 1 else None

    print("=" * 60)
    print(" VIGILANCE EDGE CLIENT  v1  (Single-Image Pipeline)")
    print("=" * 60)
    print(f" Backend  : {API_URL}")
    print(f" Vehicle  : {VEHICLE_ID}")
    print(f" Image    : {image_path or '(no image — provide path as argument)'}")
    print(f" Conf thr : {CONF_THRESHOLD}  IoU thr: {IOU_THRESHOLD}")
    print("-" * 60)

    if image_path is None:
        print("\n[ERROR] No image path provided.")
        print("        Usage: python vigilance_edge.py <image_path>")
        print("        Take a photo first:")
        print("          termux-camera-photo -c 0 /sdcard/road.jpg")
        print("          python vigilance_edge.py /sdcard/road.jpg")
        sys.exit(1)

    if not os.path.exists(image_path):
        print(f"\n[ERROR] Image not found: {image_path}")
        sys.exit(1)

    # ── Step 1: GPS ────────────────────────────────────────────────────────
    print("\n[STEP 1/4] Acquiring GPS location...")
    loc            = get_location()
    lat            = loc["latitude"]
    lon            = loc["longitude"]
    source_quality = loc["source_quality"]

    # ── Step 2: Load model ────────────────────────────────────────────────
    print("\n[STEP 2/4] Loading YOLO ONNX model...")
    session, input_name, model_label = load_model()

    # ── Step 3: Run inference ─────────────────────────────────────────────
    print("\n[STEP 3/4] Running YOLO inference...")
    detections = run_inference(session, input_name, image_path, VEHICLE_ID, lat, lon)

    print(f"\n  Total detections after NMS: {len(detections)}")

    pothole_found = any(d["defect_type"] == "D40" for d in detections)
    if pothole_found:
        print("  *** D40 POTHOLE DETECTED ***")
    else:
        print("  No D40 pothole in this frame.")

    # ── Step 4: POST to backend ───────────────────────────────────────────
    print("\n[STEP 4/4] Posting to backend...")
    if not detections:
        print("  [INFO] No real YOLO detections — nothing to POST.")
        print("         Try a real road image or lower CONF_THRESHOLD further.")
        print("\n" + "=" * 60)
        print(" [DONE] No detections found. Backend not contacted.")
        print("=" * 60)
        return

    all_ok = True
    for det in detections:
        ok = post_detection(API_URL, det)
        if not ok:
            all_ok = False

    print("\n" + "=" * 60)
    if all_ok:
        print(" [SUCCESS] Pipeline complete!")
        print(f"   GPS source  : {source_quality}")
        print(f"   Model       : YOLOv8n-RDD2022 ({model_label} ONNX)")
        print(f"   Detections  : {len(detections)} sent to backend")
        print(f"   D40 pothole : {'YES' if pothole_found else 'no'}")
        print(f"   Dashboard   : check WebGIS map for new markers")
    else:
        print(" [PARTIAL] Some detections failed to POST. See errors above.")
    print("=" * 60)


if __name__ == "__main__":
    main()
