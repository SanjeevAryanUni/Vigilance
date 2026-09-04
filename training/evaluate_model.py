"""
VIGILANCE — YOLOv8n Road Damage Model Evaluation
==================================================
Runs Ultralytics val() on the existing validation split.
Does NOT retrain, modify, or export the model.

Dataset   : training/data/synthetic_smoke_test  (val split, 30 images)
Model     : vigilance-prototype/edge/models/road_damage_yolov8n.pt
Classes   : 0=D00  1=D10  2=D20  3=D40
"""

import os
import sys
import pathlib

# ── Resolve paths relative to this script ────────────────────────────────────
SCRIPT_DIR  = pathlib.Path(__file__).resolve().parent          # training/
MODEL_PATH  = SCRIPT_DIR / ".." / "vigilance-prototype" / "edge" / "models" / "road_damage_yolov8n.pt"
DATA_YAML   = SCRIPT_DIR / "data" / "eval_val.yaml"            # written below
DATASET_DIR = SCRIPT_DIR / "data" / "synthetic_smoke_test"

MODEL_PATH  = MODEL_PATH.resolve()
DATA_YAML   = DATA_YAML.resolve()
DATASET_DIR = DATASET_DIR.resolve()

print("=" * 60)
print("  VIGILANCE  YOLOv8n Road Damage — Evaluation")
print("=" * 60)
print(f"  Model      : {MODEL_PATH}")
print(f"  Dataset    : {DATASET_DIR}")

# ── Sanity checks ─────────────────────────────────────────────────────────────
if not MODEL_PATH.exists():
    print(f"\n[STOP] Model not found: {MODEL_PATH}")
    sys.exit(1)

val_img_dir = DATASET_DIR / "images" / "val"
val_lbl_dir = DATASET_DIR / "labels" / "val"

if not val_img_dir.exists() or not val_lbl_dir.exists():
    print(f"\n[STOP] Validation split not found.")
    print(f"       Expected images : {val_img_dir}")
    print(f"       Expected labels : {val_lbl_dir}")
    sys.exit(1)

n_images = len(list(val_img_dir.glob("*")))
n_labels = len(list(val_lbl_dir.glob("*.txt")))
print(f"  Val images : {n_images}")
print(f"  Val labels : {n_labels}")

# ── Count per-class annotations in val split ──────────────────────────────────
class_names = {0: "D00 (Longitudinal Crack)",
               1: "D10 (Transverse Crack)",
               2: "D20 (Alligator Crack)",
               3: "D40 (Pothole)"}
class_counts = {0: 0, 1: 0, 2: 0, 3: 0}

for lbl_file in val_lbl_dir.glob("*.txt"):
    for line in lbl_file.read_text().strip().splitlines():
        parts = line.strip().split()
        if parts:
            cls_id = int(parts[0])
            if cls_id in class_counts:
                class_counts[cls_id] += 1

print("\n  Val annotation counts:")
for cls_id, name in class_names.items():
    print(f"    {name}: {class_counts[cls_id]}")

# ── Write a temporary dataset YAML pointing at the local split ────────────────
# The original rdd2022.yaml uses a relative path that only works on the
# original training machine (/Users/sanjeev/...). We write a corrected
# absolute-path YAML for this evaluation run only.
yaml_content = f"""# Auto-generated for evaluation only — do not commit
path: {DATASET_DIR.as_posix()}
train: images/train
val:   images/val

nc: 4
names:
  0: D00
  1: D10
  2: D20
  3: D40
"""
DATA_YAML.write_text(yaml_content)
print(f"\n  Eval YAML  : {DATA_YAML}  (written for this run)")

# ── Run validation ────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Running ultralytics model.val() ...")
print("=" * 60 + "\n")

from ultralytics import YOLO

model   = YOLO(str(MODEL_PATH))
metrics = model.val(
    data=str(DATA_YAML),
    split="val",
    imgsz=640,
    conf=0.001,      # low conf so recall is not artificially cut; standard eval practice
    iou=0.50,        # COCO standard IoU for mAP@50
    batch=8,
    device="cpu",    # CPU so it runs on any machine without GPU
    verbose=True,
    plots=True,
    save_json=False,
)

# ── Print structured report ───────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  EVALUATION RESULTS")
print("=" * 60)

box = metrics.box
print(f"\n  {'Metric':<25} {'Value':>10}")
print("  " + "-" * 36)
print(f"  {'mAP@50 (all classes)':<25} {box.map50:>10.4f}")
print(f"  {'mAP@50-95 (all classes)':<25} {box.map:>10.4f}")
print(f"  {'Precision (mean)':<25} {box.mp:>10.4f}")
print(f"  {'Recall (mean)':<25} {box.mr:>10.4f}")

print("\n  Per-class results:")
print(f"  {'Class':<28} {'P':>7} {'R':>7} {'mAP50':>8} {'mAP50-95':>10}")
print("  " + "-" * 62)

cls_ids   = [0, 1, 2, 3]
cls_short = ["D00", "D10", "D20", "D40"]

# box.ap_class_index maps class indices to positions in results arrays
for i, cls_id in enumerate(box.ap_class_index):
    name  = f"{cls_short[cls_id]} ({class_names[cls_id].split('(')[1].rstrip(')')})"
    p     = float(box.p[i])
    r     = float(box.r[i])
    ap50  = float(box.ap50[i])
    ap    = float(box.ap[i])
    marker = " <-- POTHOLE" if cls_id == 3 else ""
    print(f"  {name:<28} {p:>7.4f} {r:>7.4f} {ap50:>8.4f} {ap:>10.4f}{marker}")

print("\n" + "=" * 60)
print("  D40 (Pothole) Summary")
print("=" * 60)
d40_pos = list(box.ap_class_index).index(3) if 3 in box.ap_class_index else None
if d40_pos is not None:
    print(f"  Precision  : {float(box.p[d40_pos]):.4f}")
    print(f"  Recall     : {float(box.r[d40_pos]):.4f}")
    print(f"  mAP@50     : {float(box.ap50[d40_pos]):.4f}")
    print(f"  mAP@50-95  : {float(box.ap[d40_pos]):.4f}")
else:
    print("  D40 not present in ap_class_index — no D40 predictions or labels found.")

print("\n  NOTE: Training dataset is 'synthetic_smoke_test' (30 val images,")
print("        ~7 D40 annotations). This is a toy/smoke-test dataset, not")
print("        the full RDD2022 dataset. Metrics reflect performance on")
print("        this synthetic set only. Do not interpret as production accuracy.")
print("=" * 60)
