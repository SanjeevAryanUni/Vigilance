import os
import sys
import argparse
from ultralytics import YOLO

TRAINING_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_YAML = os.path.join(TRAINING_DIR, "data", "rdd2022.yaml")
SMOKE_YAML = os.path.join(TRAINING_DIR, "data", "smoke_test.yaml")
RUNS_DIR = os.path.join(TRAINING_DIR, "runs")
TARGET_PT = os.path.join(TRAINING_DIR, "..", "vigilance-prototype", "edge", "models", "road_damage_yolov8n.pt")

def check_dataset_exists():
    train_dir = os.path.join(TRAINING_DIR, "data", "images", "train")
    return os.path.exists(train_dir) and len(os.listdir(train_dir)) > 0

def run_fine_tuning(epochs=20, imgsz=640, device="mps", smoke_test=False):
    print("==================================================")
    print("🚗 VIGILANCE: Road Damage Detection Training Suite")
    print(f"Target: YOLOv8n on 4 Classes (D00, D10, D20, D40)")
    print(f"Device: {device} | Image Size: {imgsz}")
    print("==================================================")

    if smoke_test:
        print("⚠️  Running synthetic pipeline smoke test...")
        yaml_path = os.path.join(TRAINING_DIR, "data", "synthetic_smoke_test", "smoke_test.yaml")
        project_name = "synthetic_smoke_test"
    else:
        if not check_dataset_exists():
            print("⚠️  No real RDD2022 data found in training/data/images/train/.")
            print("👉 Please download the RDD2022 India dataset as described in training/README.md.")
            print("👉 Or run with --smoke-test to validate the pipeline on synthetic test samples.")
            return
        yaml_path = DATA_YAML
        project_name = "rdd_yolov8n"

    model = YOLO("yolov8n.pt")
    model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        device=device,
        project=RUNS_DIR,
        name=project_name,
        exist_ok=True
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--device", type=str, default="mps")
    parser.add_argument("--smoke-test", action="store_true", help="Run with synthetic test data")
    args = parser.parse_args()

    run_fine_tuning(epochs=args.epochs, device=args.device, smoke_test=args.smoke_test)
