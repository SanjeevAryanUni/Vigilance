import os
import sys
from ultralytics import YOLO
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def export_and_quantize(model_path=None):
    if model_path is None:
        model_path = os.path.join(MODELS_DIR, "road_damage_yolov8n.pt")
        if not os.path.exists(model_path):
            model_path = os.path.join(BASE_DIR, "..", "yolov8n.pt")
            if not os.path.exists(model_path):
                model_path = "yolov8n.pt"

    print(f"==================================================")
    print(f"📦 VIGILANCE Edge AI: ONNX INT8 Quantization Pipeline")
    print(f"Source Model: {model_path}")
    print(f"==================================================")

    # 1. Load Model
    model = YOLO(model_path)
    
    # 2. Export to FP32 ONNX
    print("1. Exporting YOLOv8 PyTorch graph to ONNX (Opset 12)...")
    exported_path = model.export(
        format="onnx",
        imgsz=640,
        dynamic=False,
        simplify=True,
        opset=12
    )
    
    fp32_onnx_dest = os.path.join(MODELS_DIR, "road_damage_yolov8n.onnx")
    if os.path.exists(exported_path) and exported_path != fp32_onnx_dest:
        os.replace(exported_path, fp32_onnx_dest)
    
    fp32_size = os.path.getsize(fp32_onnx_dest) / (1024 * 1024)
    print(f"✓ FP32 ONNX generated: {fp32_onnx_dest} ({fp32_size:.2f} MB)")

    # 3. Apply INT8 Dynamic Quantization
    print("2. Applying INT8 Post-Training Dynamic Quantization (QUInt8)...")
    int8_onnx_dest = os.path.join(MODELS_DIR, "road_damage_yolov8n_int8.onnx")
    quantize_dynamic(
        model_input=fp32_onnx_dest,
        model_output=int8_onnx_dest,
        weight_type=QuantType.QUInt8
    )

    int8_size = os.path.getsize(int8_onnx_dest) / (1024 * 1024)
    compression = ((fp32_size - int8_size) / fp32_size) * 100.0
    print(f"✓ INT8 ONNX generated: {int8_onnx_dest} ({int8_size:.2f} MB)")
    print(f"✨ Compression Ratio: {compression:.1f}% size reduction for edge deployment!")
    print(f"==================================================")
    return int8_onnx_dest

if __name__ == "__main__":
    export_and_quantize()
