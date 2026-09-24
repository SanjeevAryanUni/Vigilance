"""
VIGILANCE — Automated RDD2022 India Dataset Downloader via Hugging Face Hub
Downloads all India road damage images & labels with automatic retry, LFS chunking,
and rate-limit handling.
"""

import os
import sys
import shutil
import glob
from huggingface_hub import snapshot_download

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DATA_DIR = os.path.join(BASE_DIR, "training", "data")
TRAIN_IMG = os.path.join(TARGET_DATA_DIR, "images", "train")
VAL_IMG = os.path.join(TARGET_DATA_DIR, "images", "val")
TRAIN_LBL = os.path.join(TARGET_DATA_DIR, "labels", "train")
VAL_LBL = os.path.join(TARGET_DATA_DIR, "labels", "val")

def main():
    print("==================================================")
    print("📦 VIGILANCE: Downloading RDD2022 India via HF Hub")
    print("==================================================")

    for d in [TRAIN_IMG, VAL_IMG, TRAIN_LBL, VAL_LBL]:
        os.makedirs(d, exist_ok=True)

    print("\n1. Triggering resilient snapshot download from dronefreak/RDD2022...")
    hf_folder = snapshot_download(
        repo_id="dronefreak/RDD2022",
        repo_type="dataset",
        allow_patterns=[
            "data/images/train/*/*India*",
            "data/labels/train/*/*India*",
            "data/images/valid/*/*India*",
            "data/labels/valid/*/*India*",
            "data/data.yaml",
        ],
        max_workers=4,
    )
    print(f"✓ Download completed to HF cache: {hf_folder}")

    print("\n2. Organizing files into YOLOv8 structure...")
    
    # Process Train Images & Labels
    train_imgs = glob.glob(os.path.join(hf_folder, "data", "images", "train", "*", "*India*.jpg"))
    val_imgs = glob.glob(os.path.join(hf_folder, "data", "images", "valid", "*", "*India*.jpg"))

    print(f"  • Found {len(train_imgs)} train images and {len(val_imgs)} validation images.")

    copied_train = 0
    for img_path in train_imgs:
        base = os.path.splitext(os.path.basename(img_path))[0]
        # find matching label in any train shard
        lbl_matches = glob.glob(os.path.join(hf_folder, "data", "labels", "train", "*", f"{base}.txt"))
        if lbl_matches and os.path.exists(lbl_matches[0]):
            dest_img = os.path.join(TRAIN_IMG, f"{base}.jpg")
            dest_lbl = os.path.join(TRAIN_LBL, f"{base}.txt")
            shutil.copy2(img_path, dest_img)
            shutil.copy2(lbl_matches[0], dest_lbl)
            copied_train += 1

    copied_val = 0
    for img_path in val_imgs:
        base = os.path.splitext(os.path.basename(img_path))[0]
        lbl_matches = glob.glob(os.path.join(hf_folder, "data", "labels", "valid", "*", f"{base}.txt"))
        if lbl_matches and os.path.exists(lbl_matches[0]):
            dest_img = os.path.join(VAL_IMG, f"{base}.jpg")
            dest_lbl = os.path.join(VAL_LBL, f"{base}.txt")
            shutil.copy2(img_path, dest_img)
            shutil.copy2(lbl_matches[0], dest_lbl)
            copied_val += 1

    print(f"\n✅ Dataset Preparation Complete:")
    print(f"  • Train: {copied_train} image-label pairs")
    print(f"  • Val:   {copied_val} image-label pairs")
    print(f"Target Directory: {TARGET_DATA_DIR}")

if __name__ == "__main__":
    main()
