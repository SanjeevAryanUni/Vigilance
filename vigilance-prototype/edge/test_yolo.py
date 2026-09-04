#!/usr/bin/env python3
"""
VIGILANCE - YOLOv8 Diagnostic Test Script
==========================================
Tests the INT8 ONNX model and prints per-class max scores
to diagnose whether D40 is being scored low by the model
or whether post-processing is incorrectly filtering it.

Usage (on phone):
    python test_yolo.py ~/vigilance/IMG-20260904-WA0004.jpg

Does NOT POST to any backend.
"""

import os
import sys
import time
import io
import numpy as np
from PIL import Image
from typing import Tuple, List, Dict

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL = os.path.join(SCRIPT_DIR, "models", "road_damage_yolov8n_int8.onnx")
MODEL_PATH    = os.getenv("VIGILANCE_MODEL_PATH", DEFAULT_MODEL)

CONF_THRESHOLD = 0.20
IOU_THRESHOLD  = 0.45

CLASS_NAMES = {0: "D00", 1: "D10", 2: "D20", 3: "D40"}
NUM_CLASSES  = 4


# ── Letterbox preprocessing ───────────────────────────────────────────────────

def letterbox(pil_img: Image.Image, target: int = 640) -> Tuple[np.ndarray, float, int, int]:
    orig_w, orig_h = pil_img.size
    scale  = min(target / orig_w, target / orig_h)
    new_w  = int(round(orig_w * scale))
    new_h  = int(round(orig_h * scale))
    resized = pil_img.resize((new_w, new_h), Image.BILINEAR)
    pad_left = (target - new_w) // 2
    pad_top  = (target - new_h) // 2
    canvas   = Image.new("RGB", (target, target), (114, 114, 114))
    canvas.paste(resized, (pad_left, pad_top))
    return np.array(canvas, dtype=np.uint8), scale, pad_left, pad_top


def preprocess(image_path: str) -> Tuple[np.ndarray, int, int, float, int, int]:
    pil_img          = Image.open(image_path).convert("RGB")
    orig_w, orig_h   = pil_img.size
    lb, scale, pl, pt = letterbox(pil_img, 640)
    arr    = lb.astype(np.float32) / 255.0
    arr    = np.transpose(arr, (2, 0, 1))
    tensor = np.expand_dims(arr, axis=0)
    return tensor, orig_w, orig_h, scale, pl, pt


# ── NMS ───────────────────────────────────────────────────────────────────────

def iou(a: np.ndarray, b: np.ndarray) -> float:
    x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
    x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = (a[2]-a[0]) * (a[3]-a[1])
    area_b = (b[2]-b[0]) * (b[3]-b[1])
    union  = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def nms(candidates: List[Dict], iou_thr: float) -> List[Dict]:
    from collections import defaultdict
    by_cls: Dict[int, List[Dict]] = defaultdict(list)
    for c in candidates:
        by_cls[c["cls_id"]].append(c)
    kept = []
    for cls_dets in by_cls.values():
        cls_dets.sort(key=lambda x: x["conf"], reverse=True)
        sup = [False] * len(cls_dets)
        for i in range(len(cls_dets)):
            if sup[i]:
                continue
            kept.append(cls_dets[i])
            for j in range(i+1, len(cls_dets)):
                if not sup[j] and iou(cls_dets[i]["box"], cls_dets[j]["box"]) >= iou_thr:
                    sup[j] = True
    kept.sort(key=lambda x: x["conf"], reverse=True)
    return kept


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not image_path or not os.path.exists(image_path):
        print("[ERROR] Provide a valid image path:")
        print("        python test_yolo.py ~/vigilance/IMG-20260904-WA0004.jpg")
        sys.exit(1)

    print("=" * 60)
    print(" VIGILANCE - YOLOv8 DIAGNOSTIC TEST")
    print("=" * 60)
    print(f" Image : {image_path}")
    print(f" Model : {MODEL_PATH}")
    print(f" Conf  : {CONF_THRESHOLD}   IoU: {IOU_THRESHOLD}")
    print("=" * 60)

    # ── Load model ────────────────────────────────────────────────────────────
    import onnxruntime as ort
    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.intra_op_num_threads = 4
    session    = ort.InferenceSession(MODEL_PATH, sess_options=opts, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    print(f"\n[MODEL] Loaded: {os.path.basename(MODEL_PATH)}")
    print(f"        Input : {session.get_inputs()[0].shape}")

    # ── Preprocess ────────────────────────────────────────────────────────────
    pil_img = Image.open(image_path).convert("RGB")
    orig_w, orig_h = pil_img.size
    tensor, _, _, scale, pad_left, pad_top = preprocess(image_path)
    print(f"\n[IMG]  Original : {orig_w} x {orig_h}")
    print(f"       Scale    : {scale:.4f}   Pad: left={pad_left} top={pad_top}")
    print(f"       Tensor   : {tensor.shape}")

    # ── Inference ─────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    outputs    = session.run(None, {input_name: tensor})
    elapsed_ms = (time.perf_counter() - t0) * 1000
    raw = outputs[0]                  # (1, 8, 8400)
    print(f"\n[YOLO] Inference : {elapsed_ms:.1f} ms")
    print(f"       Raw output : {raw.shape}")

    raw = raw[0]                      # (8, 8400)
    boxes_cxcywh = raw[:4, :].T      # (8400, 4)
    class_scores = raw[4:, :].T      # (8400, 4)  — D00 D10 D20 D40

    # ══════════════════════════════════════════════════════════════════════════
    # DIAGNOSTIC SECTION
    # Print the maximum confidence score found anywhere in the image
    # for each class, plus which anchor index produced it.
    # ══════════════════════════════════════════════════════════════════════════
    print("\n" + "─" * 60)
    print("  DIAGNOSTIC: Per-class max score across all 8400 anchors")
    print("─" * 60)
    for cls_id in range(NUM_CLASSES):
        col        = class_scores[:, cls_id]   # (8400,)
        max_score  = float(col.max())
        max_anchor = int(col.argmax())
        cx, cy, bw, bh = boxes_cxcywh[max_anchor]
        print(f"  {CLASS_NAMES[cls_id]} max score: {max_score:.4f}   "
              f"at anchor #{max_anchor}   "
              f"box cx={cx:.1f} cy={cy:.1f} w={bw:.1f} h={bh:.1f}")

    # Also print the overall top-5 anchors sorted by winning class confidence
    print("\n  Top-10 anchors by best class score (any class):")
    print(f"  {'Rank':<5} {'Anchor':<8} {'D00':>7} {'D10':>7} {'D20':>7} {'D40':>7}  {'Winner':<4} {'WinConf':>8}")
    print("  " + "-" * 60)
    # Compute per-anchor best score
    best_scores = class_scores.max(axis=1)          # (8400,)
    top10_idx   = np.argsort(best_scores)[::-1][:10]
    for rank, anchor_i in enumerate(top10_idx, start=1):
        s   = class_scores[anchor_i]
        win = int(np.argmax(s))
        print(f"  {rank:<5} {anchor_i:<8} {s[0]:>7.4f} {s[1]:>7.4f} {s[2]:>7.4f} {s[3]:>7.4f}  "
              f"{CLASS_NAMES[win]:<4} {s[win]:>8.4f}")

    print("─" * 60)

    # ── Standard candidate filtering ─────────────────────────────────────────
    candidates: List[Dict] = []
    for i in range(boxes_cxcywh.shape[0]):
        scores = class_scores[i]
        cls_id = int(np.argmax(scores))
        conf   = float(scores[cls_id])
        if conf < CONF_THRESHOLD:
            continue
        cx, cy, bw, bh = boxes_cxcywh[i]
        box_lb = np.array([cx - bw/2, cy - bh/2, cx + bw/2, cy + bh/2])
        candidates.append({"cls_id": cls_id, "conf": conf, "box": box_lb, "anchor": i})

    print(f"\n[NMS]  Candidates above {CONF_THRESHOLD}: {len(candidates)}")
    if candidates:
        print(f"       Class breakdown:")
        for cls_id in range(NUM_CLASSES):
            n = sum(1 for c in candidates if c["cls_id"] == cls_id)
            if n:
                print(f"         {CLASS_NAMES[cls_id]}: {n}")

    kept = nms(candidates, IOU_THRESHOLD)
    print(f"       After NMS : {len(kept)}")

    # ── Reverse letterbox ─────────────────────────────────────────────────────
    print("\n[DET]  Final detections:")
    if not kept:
        print("       (none)")
    for det in kept:
        x1_lb, y1_lb, x2_lb, y2_lb = det["box"]
        x1 = int(np.clip((x1_lb - pad_left) / scale, 0, orig_w))
        y1 = int(np.clip((y1_lb - pad_top)  / scale, 0, orig_h))
        x2 = int(np.clip((x2_lb - pad_left) / scale, 0, orig_w))
        y2 = int(np.clip((y2_lb - pad_top)  / scale, 0, orig_h))
        name = CLASS_NAMES[det["cls_id"]]
        print(f"       {name}  conf={det['conf']:.4f}  bbox=[{x1},{y1},{x2},{y2}]  anchor={det['anchor']}")

    # ── D40 summary ───────────────────────────────────────────────────────────
    print("\n" + "─" * 60)
    d40_max = float(class_scores[:, 3].max())
    d40_candidates = [c for c in candidates if c["cls_id"] == 3]
    d40_kept = [k for k in kept if k["cls_id"] == 3]

    print(f"  D40 (Pothole) Summary:")
    print(f"    Max raw score anywhere in image : {d40_max:.4f}")
    print(f"    Candidates above {CONF_THRESHOLD}              : {len(d40_candidates)}")
    print(f"    Survived NMS                    : {len(d40_kept)}")
    if d40_max < CONF_THRESHOLD:
        print(f"\n  CONCLUSION: Model is genuinely scoring D40 below {CONF_THRESHOLD}.")
        print( "              The model does not recognise this image as a pothole.")
        print( "              This is a MODEL confidence issue, NOT a post-processing bug.")
    elif d40_candidates and not d40_kept:
        print(f"\n  CONCLUSION: D40 had candidates above {CONF_THRESHOLD} but all were")
        print( "              suppressed by NMS (overlapped by higher-conf D20).")
        print( "              Post-processing is working correctly — D20 won the overlap.")
    elif d40_kept:
        print(f"\n  CONCLUSION: D40 IS in the final output. Check vigilance_edge.py.")
    else:
        print(f"\n  CONCLUSION: D40 raw score too low. Model confidence issue.")
    print("─" * 60)
    print("\n[DONE] No backend POST performed — diagnostic only.")


if __name__ == "__main__":
    main()
