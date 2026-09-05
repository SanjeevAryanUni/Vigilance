import os
import sys

TRAINING_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ["YOLO_CONFIG_DIR"] = os.path.join(TRAINING_DIR, ".config")
os.makedirs(os.environ["YOLO_CONFIG_DIR"], exist_ok=True)

import shutil
import argparse
from ultralytics import YOLO

PROJECT_ROOT = os.path.dirname(TRAINING_DIR)
DATA_YAML = os.path.join(TRAINING_DIR, "data", "rdd2022.yaml")
RUNS_DIR = os.path.join(TRAINING_DIR, "runs")
BASE_WEIGHTS = os.path.join(PROJECT_ROOT, "yolov8n.pt")
TARGET_DIR = os.path.join(PROJECT_ROOT, "vigilance-prototype", "edge", "models")
TARGET_PT = os.path.join(TARGET_DIR, "road_damage_yolov8n.pt")

def check_dataset_exists():
    train_dir = os.path.join(TRAINING_DIR, "data", "images", "train")
    return os.path.exists(train_dir) and len(os.listdir(train_dir)) > 0

def run_fine_tuning(epochs=15, imgsz=640, batch=16, device="mps", weights=None, resume=False, smoke_test=False):
    print("==================================================")
    print("🚗 VIGILANCE: RDD2022 Road Damage Model Training")
    print(f"Target: YOLOv8n on 4 Classes (D00, D10, D20, D40)")
    print(f"Epochs: {epochs} | Batch: {batch} | Image Size: {imgsz}")
    print(f"Device: {device}")
    print("==================================================")

    if smoke_test:
        print("⚠️  Running synthetic pipeline smoke test...")
        yaml_path = os.path.join(TRAINING_DIR, "data", "synthetic_smoke_test", "smoke_test.yaml")
        project_name = "synthetic_smoke_test"
    else:
        if not check_dataset_exists():
            print("❌ No RDD2022 data found in training/data/images/train/.")
            print("👉 Run python3 training/prepare_rdd2022_india.py first!")
            return
        yaml_path = DATA_YAML
        project_name = "rdd_yolov8n"

    # Select base weights
    if weights is None:
        best_existing = os.path.join(RUNS_DIR, project_name, "weights", "best.pt")
        if os.path.exists(best_existing):
            weights = best_existing
            print(f"🔄 Continuing training from existing best checkpoint: {weights}")
        else:
            weights = BASE_WEIGHTS if os.path.exists(BASE_WEIGHTS) else "yolov8n.pt"
            print(f"🌱 Starting initial training from base weights: {weights}")

    model = YOLO(weights)

    # Check device availability
    import torch
    if device == "mps" and not torch.backends.mps.is_available():
        print("⚠️  MPS not available, falling back to CPU.")
        device = "cpu"

    print(f"\n🚀 Launching fine-tuning on {device.upper()} (resume={resume})...")
    if resume:
        train_results = model.train(resume=True)
    else:
        train_results = model.train(
            data=yaml_path,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=device,
            project=RUNS_DIR,
            name=project_name,
            patience=8,
            save=True,
            exist_ok=True,
            workers=2,
            plots=True,
            lr0=0.001,
            lrf=0.01,
        )

    best_pt = os.path.join(RUNS_DIR, project_name, "weights", "best.pt")
    if os.path.exists(best_pt):
        os.makedirs(TARGET_DIR, exist_ok=True)
        shutil.copy2(best_pt, TARGET_PT)
        print(f"\n✅ Fine-tuning completed!")
        print(f"🏆 Best model weights saved to: {best_pt}")
        print(f"📦 Deployed to edge: {TARGET_PT} ({os.path.getsize(TARGET_PT) / (1024*1024):.2f} MB)")

        # Run ONNX export and quantization
        export_script = os.path.join(PROJECT_ROOT, "vigilance-prototype", "edge", "export_onnx.py")
        if os.path.exists(export_script):
            print("\n🔄 Exporting to ONNX FP32 and INT8...")
            try:
                sys.path.insert(0, os.path.dirname(export_script))
                from export_onnx import export_and_quantize
                export_and_quantize(TARGET_PT)
            except Exception as e:
                print(f"⚠️  ONNX export warning: {e}")
    else:
        print(f"⚠️  Warning: {best_pt} was not found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--device", type=str, default="mps")
    parser.add_argument("--weights", type=str, default=None, help="Path to checkpoint weights")
    parser.add_argument("--resume", action="store_true", help="Resume training from last.pt")
    parser.add_argument("--smoke-test", action="store_true")
    args = parser.parse_args()

    run_fine_tuning(
        epochs=args.epochs,
        batch=args.batch,
        device=args.device,
        weights=args.weights,
        resume=args.resume,
        smoke_test=args.smoke_test
    )
