"""
VIGILANCE — Automated RDD2022 India Dataset Downloader & Preparer
Downloads high-resolution annotated road damage images from India (D00, D10, D20, D40)
from Hugging Face (edwrdc/RDD2022 labels + dronefreak/RDD2022 images).
"""

import os
import sys
import json
import random
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "training", "data")
TRAIN_IMG_DIR = os.path.join(DATA_DIR, "images", "train")
VAL_IMG_DIR = os.path.join(DATA_DIR, "images", "val")
TRAIN_LBL_DIR = os.path.join(DATA_DIR, "labels", "train")
VAL_LBL_DIR = os.path.join(DATA_DIR, "labels", "val")

CLASS_NAMES = {
    0: "D00 (Longitudinal Crack)",
    1: "D10 (Transverse Crack)",
    2: "D20 (Alligator Crack)",
    3: "D40 (Pothole)",
}

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode())

def download_file(url, dest_path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = res.read()
    with open(dest_path, "wb") as f:
        f.write(data)
    return len(data)

def main():
    print("==================================================")
    print("📦 VIGILANCE: Downloading RDD2022 India Dataset")
    print("Source: Hugging Face (dronefreak/RDD2022 & edwrdc/RDD2022)")
    print(f"Target Directory: {DATA_DIR}")
    print("==================================================")

    for d in [TRAIN_IMG_DIR, VAL_IMG_DIR, TRAIN_LBL_DIR, VAL_LBL_DIR]:
        os.makedirs(d, exist_ok=True)

    print("\n1. Fetching dataset index from Hugging Face APIs...")
    img_repo = fetch_json("https://huggingface.co/api/datasets/dronefreak/RDD2022")
    lbl_repo = fetch_json("https://huggingface.co/api/datasets/edwrdc/RDD2022")

    # Map image basenames to repository paths
    img_map = {}
    for item in img_repo.get("siblings", []):
        rfn = item["rfilename"]
        if "India" in rfn and rfn.endswith(".jpg"):
            basename = os.path.splitext(os.path.basename(rfn))[0]
            img_map[basename] = rfn

    print(f"✓ Found {len(img_map)} total India images in repository index.")

    # Collect labels for train and val
    train_lbl_items = [
        item["rfilename"] for item in lbl_repo.get("siblings", [])
        if item["rfilename"].startswith("labels/train/India/") and item["rfilename"].endswith(".txt")
    ]
    val_lbl_items = [
        item["rfilename"] for item in lbl_repo.get("siblings", [])
        if item["rfilename"].startswith("labels/val/India/") and item["rfilename"].endswith(".txt")
    ]

    print(f"✓ Found {len(train_lbl_items)} train labels and {len(val_lbl_items)} val labels.")

    # Download labels and inspect non-empty samples
    print("\n2. Downloading labels and identifying damaged road instances...")
    
    def fetch_label_text(lbl_rel_path):
        url = f"https://huggingface.co/datasets/edwrdc/RDD2022/raw/main/{lbl_rel_path}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            text = r.read().decode().strip()
        basename = os.path.splitext(os.path.basename(lbl_rel_path))[0]
        return basename, text

    tasks_train = []
    tasks_val = []

    print("Fetching training label metadata...")
    with ThreadPoolExecutor(max_workers=24) as executor:
        futures = {executor.submit(fetch_label_text, rfn): rfn for rfn in train_lbl_items}
        for fut in as_completed(futures):
            try:
                base, content = fut.result()
                if base in img_map:
                    tasks_train.append((base, img_map[base], content))
            except Exception as e:
                pass

    print("Fetching validation label metadata...")
    with ThreadPoolExecutor(max_workers=24) as executor:
        futures = {executor.submit(fetch_label_text, rfn): rfn for rfn in val_lbl_items}
        for fut in as_completed(futures):
            try:
                base, content = fut.result()
                if base in img_map:
                    tasks_val.append((base, img_map[base], content))
            except Exception as e:
                pass

    # Separate damaged vs background
    train_damaged = [(b, p, c) for b, p, c in tasks_train if c]
    train_bg = [(b, p, c) for b, p, c in tasks_train if not c]
    val_damaged = [(b, p, c) for b, p, c in tasks_val if c]
    val_bg = [(b, p, c) for b, p, c in tasks_val if not c]

    # Select balanced background (10% of damaged count)
    random.seed(42)
    num_train_bg = min(len(train_bg), int(len(train_damaged) * 0.10))
    num_val_bg = min(len(val_bg), int(len(val_damaged) * 0.10))
    selected_train = train_damaged + (random.sample(train_bg, num_train_bg) if num_train_bg > 0 else [])
    selected_val = val_damaged + (random.sample(val_bg, num_val_bg) if num_val_bg > 0 else [])

    print(f"\n📊 Balanced Dataset Summary:")
    print(f"  • Train Set: {len(selected_train)} images ({len(train_damaged)} with damage, {len(selected_train)-len(train_damaged)} background)")
    print(f"  • Val Set:   {len(selected_val)} images ({len(val_damaged)} with damage, {len(selected_val)-len(val_damaged)} background)")

    # Download images and write label files
    print("\n3. Downloading images with parallel workers...")
    
    download_queue = []
    for base, img_rfn, content in selected_train:
        img_dest = os.path.join(TRAIN_IMG_DIR, f"{base}.jpg")
        lbl_dest = os.path.join(TRAIN_LBL_DIR, f"{base}.txt")
        download_queue.append((img_rfn, img_dest, lbl_dest, content))

    for base, img_rfn, content in selected_val:
        img_dest = os.path.join(VAL_IMG_DIR, f"{base}.jpg")
        lbl_dest = os.path.join(VAL_LBL_DIR, f"{base}.txt")
        download_queue.append((img_rfn, img_dest, lbl_dest, content))

    total = len(download_queue)
    completed = 0
    total_bytes = 0

    def download_pair(item):
        img_rfn, img_dest, lbl_dest, content = item
        # Write label
        with open(lbl_dest, "w") as f:
            f.write(content + ("\n" if content else ""))
        # Download image if not already present
        if os.path.exists(img_dest) and os.path.getsize(img_dest) > 1000:
            return os.path.getsize(img_dest)
        img_url = f"https://huggingface.co/datasets/dronefreak/RDD2022/resolve/main/{img_rfn}"
        return download_file(img_url, img_dest)

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(download_pair, item): item for item in download_queue}
        for fut in as_completed(futures):
            try:
                b = fut.result()
                total_bytes += b
                completed += 1
                if completed % 250 == 0 or completed == total:
                    pct = (completed / total) * 100
                    mb = total_bytes / (1024 * 1024)
                    print(f"  [{completed}/{total} ({pct:.1f}%)] Downloaded {mb:.1f} MB...")
            except Exception as e:
                pass

    print(f"\n✅ All {completed} images and labels prepared successfully in {DATA_DIR}!")

if __name__ == "__main__":
    main()
