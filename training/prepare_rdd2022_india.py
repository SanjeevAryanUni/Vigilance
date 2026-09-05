import os
import sys
import random
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(BASE_DIR, "RDD2022", "India.zip")
OUTPUT_DIR = os.path.join(BASE_DIR, "training", "data")

CLASS_MAP = {
    "D00": 0,  # Longitudinal Crack
    "D10": 1,  # Transverse Crack
    "D20": 2,  # Alligator Crack
    "D40": 3,  # Pothole
    "D01": 0,  # Longitudinal joint/crack
    "D11": 1,  # Transverse joint/crack
}

CLASS_NAMES = {
    0: "D00 (Longitudinal Crack)",
    1: "D10 (Transverse Crack)",
    2: "D20 (Alligator Crack)",
    3: "D40 (Pothole)",
}

def prepare_dataset(val_ratio=0.15, max_background_ratio=0.10, seed=42):
    random.seed(seed)
    print("==================================================")
    print("📦 Preparing RDD2022 India Dataset for YOLOv8")
    print(f"Archive: {ZIP_PATH}")
    print(f"Output: {OUTPUT_DIR}")
    print("==================================================")

    if not os.path.exists(ZIP_PATH):
        raise FileNotFoundError(f"RDD2022 India.zip not found at {ZIP_PATH}")

    # Create target directories
    for split in ["train", "val"]:
        os.makedirs(os.path.join(OUTPUT_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(OUTPUT_DIR, "labels", split), exist_ok=True)

    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        all_files = set(z.namelist())

        # Collect train XML files
        xml_files = [f for f in all_files if f.startswith("India/train/annotations/xmls/") and f.endswith(".xml")]
        print(f"Found {len(xml_files)} annotation XML files.")

        annotated_samples = []
        background_samples = []
        class_counter = Counter()

        for xml_path in xml_files:
            basename = os.path.splitext(os.path.basename(xml_path))[0]
            img_path = f"India/train/images/{basename}.jpg"
            if img_path not in all_files:
                continue

            try:
                xml_content = z.read(xml_path)
                root = ET.fromstring(xml_content)
            except Exception as e:
                continue

            size_elem = root.find("size")
            if size_elem is not None:
                try:
                    width = float(size_elem.find("width").text)
                    height = float(size_elem.find("height").text)
                except (TypeError, ValueError, AttributeError):
                    width, height = 720.0, 720.0
            else:
                width, height = 720.0, 720.0

            if width <= 0 or height <= 0:
                width, height = 720.0, 720.0

            yolo_lines = []
            for obj in root.findall("object"):
                name_elem = obj.find("name")
                if name_elem is None or not name_elem.text:
                    continue
                cls_raw = name_elem.text.strip()
                if cls_raw not in CLASS_MAP:
                    continue

                cls_id = CLASS_MAP[cls_raw]
                bndbox = obj.find("bndbox")
                if bndbox is None:
                    continue

                try:
                    xmin = float(bndbox.find("xmin").text)
                    ymin = float(bndbox.find("ymin").text)
                    xmax = float(bndbox.find("xmax").text)
                    ymax = float(bndbox.find("ymax").text)
                except (TypeError, ValueError, AttributeError):
                    continue

                # Clamp and normalize
                xmin = max(0.0, min(width, xmin))
                xmax = max(0.0, min(width, xmax))
                ymin = max(0.0, min(height, ymin))
                ymax = max(0.0, min(height, ymax))

                bw = xmax - xmin
                bh = ymax - ymin
                if bw <= 1.0 or bh <= 1.0:
                    continue

                x_center = (xmin + bw / 2.0) / width
                y_center = (ymin + bh / 2.0) / height
                norm_w = bw / width
                norm_h = bh / height

                # Validate ranges
                if 0 < x_center < 1 and 0 < y_center < 1 and 0 < norm_w <= 1 and 0 < norm_h <= 1:
                    yolo_lines.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}")
                    class_counter[cls_id] += 1

            if yolo_lines:
                annotated_samples.append((basename, img_path, yolo_lines))
            else:
                background_samples.append((basename, img_path, []))

        print(f"\n📊 Extraction Summary:")
        print(f"  • Total Images Evaluated: {len(annotated_samples) + len(background_samples)}")
        print(f"  • Images with Damage: {len(annotated_samples)}")
        print(f"  • Background (Clean Road) Images: {len(background_samples)}")
        print(f"  • Class Distribution (Bounding Boxes):")
        for cid, count in sorted(class_counter.items()):
            print(f"    - Class {cid} [{CLASS_NAMES.get(cid, 'Unknown')}]: {count} instances")

        # Select background images (e.g. 10% of annotated count to avoid bias)
        num_bg = min(len(background_samples), int(len(annotated_samples) * max_background_ratio))
        selected_bg = random.sample(background_samples, num_bg)
        all_dataset = annotated_samples + selected_bg
        random.shuffle(all_dataset)

        num_val = int(len(all_dataset) * val_ratio)
        val_set = all_dataset[:num_val]
        train_set = all_dataset[num_val:]

        print(f"\n📁 Splitting into:")
        print(f"  • Train Set: {len(train_set)} images")
        print(f"  • Validation Set: {len(val_set)} images")

        # Write files
        for split_name, dataset in [("train", train_set), ("val", val_set)]:
            img_dest_dir = os.path.join(OUTPUT_DIR, "images", split_name)
            lbl_dest_dir = os.path.join(OUTPUT_DIR, "labels", split_name)

            for idx, (basename, img_zip_path, yolo_lines) in enumerate(dataset):
                # Extract image
                img_data = z.read(img_zip_path)
                out_img_path = os.path.join(img_dest_dir, f"{basename}.jpg")
                with open(out_img_path, "wb") as f:
                    f.write(img_data)

                # Write label
                out_lbl_path = os.path.join(lbl_dest_dir, f"{basename}.txt")
                with open(out_lbl_path, "w") as f:
                    f.write("\n".join(yolo_lines) + ("\n" if yolo_lines else ""))

                if (idx + 1) % 500 == 0 or (idx + 1) == len(dataset):
                    print(f"  [{split_name.upper()}] Processed {idx + 1}/{len(dataset)}...")

    print("\n✅ RDD2022 India dataset preparation completed successfully!")

if __name__ == "__main__":
    prepare_dataset()
