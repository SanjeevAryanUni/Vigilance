import os
import cv2
import base64
import random
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional

class RoadDamageDetector:
    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.45):
        self.conf_threshold = conf_threshold
        self.engine_type = "simulated"
        self.session = None
        self.pt_model = None
        
        # 4 Standard RDD2022 Road Damage Classes
        self.class_names = {
            0: "D00 (Longitudinal Crack)",
            1: "D10 (Transverse Crack)",
            2: "D20 (Alligator Crack)",
            3: "D40 (Pothole)"
        }

        # 1. Primary Path: ONNX INT8 Quantized Model
        int8_onnx_path = model_path or os.path.join(os.path.dirname(__file__), "models", "road_damage_yolov8n_int8.onnx")
        fp32_onnx_path = os.path.join(os.path.dirname(__file__), "models", "road_damage_yolov8n.onnx")
        
        try:
            import onnxruntime as ort
            target_onnx = int8_onnx_path if os.path.exists(int8_onnx_path) else (fp32_onnx_path if os.path.exists(fp32_onnx_path) else None)
            if target_onnx:
                sess_opts = ort.SessionOptions()
                sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                self.session = ort.InferenceSession(target_onnx, sess_options=sess_opts, providers=['CPUExecutionProvider'])
                self.input_name = self.session.get_inputs()[0].name
                self.engine_type = "onnx_int8" if "int8" in target_onnx else "onnx_fp32"
                print(f"✓ ONNX Runtime Engine initialized successfully ({self.engine_type}): {os.path.basename(target_onnx)}")
                return
        except Exception as e:
            print(f"! ONNX Runtime initialization skipped ({e})")

        # 2. Secondary Fallback Path: Ultralytics PyTorch Model
        try:
            from ultralytics import YOLO
            pt_path = os.path.join(os.path.dirname(__file__), "models", "road_damage_yolov8n.pt")
            if not os.path.exists(pt_path):
                pt_path = os.path.join(os.path.dirname(__file__), "..", "yolov8n.pt")
            
            if os.path.exists(pt_path):
                self.pt_model = YOLO(pt_path)
                self.engine_type = "pytorch_yolov8"
                print(f"✓ Ultralytics PyTorch Engine initialized: {pt_path}")
                return
        except Exception as e:
            print(f"! Ultralytics PyTorch initialization skipped ({e})")

        print("✓ Using high-fidelity edge perception simulator.")

    def _preprocess_frame(self, frame):
        img = cv2.resize(frame, (640, 640))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype(np.float32) / 255.0
        img = np.transpose(img, (2, 0, 1)) # HWC -> CHW
        return np.expand_dims(img, axis=0) # (1, 3, 640, 640)

    def infer_frame(self, frame=None, lat: float = 13.0067, lon: float = 80.2030, vehicle_id: str = "BUS-TN01-1042") -> List[Dict[str, Any]]:
        """
        Process an image frame through ONNX/PyTorch or fallback simulator.
        Returns structured telemetry payload.
        """
        detections = []

        # Real Camera Feed Processing
        if frame is not None and (self.session is not None or self.pt_model is not None):
            h, w = frame.shape[:2]
            
            if self.session is not None:
                # Run ONNX Runtime
                input_tensor = self._preprocess_frame(frame)
                outputs = self.session.run(None, {self.input_name: input_tensor})
                # Output shape: (1, 84, 8400) -> 4 box coords + 80 class probs or 4 class probs
                raw_out = outputs[0][0] # (84, 8400)
                # Parse boxes
                boxes = raw_out[:4, :].T # (8400, 4) in cx, cy, w, h
                scores_all = raw_out[4:, :].T # (8400, num_classes)
                
                for i in range(len(boxes)):
                    cls_scores = scores_all[i]
                    cls_id = int(np.argmax(cls_scores))
                    conf = float(cls_scores[cls_id])
                    
                    if conf >= self.conf_threshold:
                        cx, cy, bw, bh = boxes[i]
                        x1 = int((cx - bw / 2) * (w / 640.0))
                        y1 = int((cy - bh / 2) * (h / 640.0))
                        x2 = int((cx + bw / 2) * (w / 640.0))
                        y2 = int((cy + bh / 2) * (h / 640.0))
                        
                        bbox_area = ((x2 - x1) * (y2 - y1)) / (w * h)
                        target_cls = cls_id % 4 # Map to 4 standard classes
                        
                        if target_cls == 3:
                            defect_type = "D40"
                            sev = "critical" if bbox_area > 0.03 else "high"
                        elif target_cls == 2:
                            defect_type = "D20"
                            sev = "high" if bbox_area > 0.02 else "medium"
                        elif target_cls == 1:
                            defect_type = "D10"
                            sev = "high" if bbox_area > 0.04 else "medium"
                        else:
                            defect_type = "D00"
                            sev = "medium" if bbox_area > 0.03 else "low"

                        crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                        thumb_b64 = None
                        if crop.size > 0:
                            _, buffer = cv2.imencode('.jpg', crop)
                            thumb_b64 = base64.b64encode(buffer).decode('utf-8')

                        norm_x = round((x1 / w) * 100, 1)
                        norm_y = round((y1 / h) * 100, 1)
                        norm_w = round(((x2 - x1) / w) * 100, 1)
                        norm_h = round(((y2 - y1) / h) * 100, 1)
                        lbl_text = f"{defect_type}: {self.class_names.get(target_cls, defect_type).split('(')[1].rstrip(')') if '(' in self.class_names.get(target_cls, '') else defect_type}"

                        detections.append({
                            "defect_type": defect_type,
                            "confidence": round(conf, 2),
                            "severity": sev,
                            "vehicle_id": vehicle_id,
                            "lat": lat,
                            "lon": lon,
                            "bbox": [x1, y1, x2, y2],
                            "x": norm_x,
                            "y": norm_y,
                            "w": norm_w,
                            "h": norm_h,
                            "label": lbl_text,
                            "timestamp": datetime.utcnow().isoformat(),
                            "thumbnail_b64": thumb_b64
                        })
                        if len(detections) >= 5: # Limit max detections per frame
                            break
                return detections

            elif self.pt_model is not None:
                # Run PyTorch YOLOv8
                results = self.pt_model.predict(source=frame, conf=self.conf_threshold, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0]) % 4
                        conf = float(box.conf[0])
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                        bbox_area = ((x2 - x1) * (y2 - y1)) / (w * h)
                        
                        defect_type = "D40" if cls_id == 3 else ("D20" if cls_id == 2 else ("D10" if cls_id == 1 else "D00"))
                        sev = "critical" if defect_type == "D40" and bbox_area > 0.03 else ("high" if bbox_area > 0.02 else "medium")

                        crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                        thumb_b64 = None
                        if crop.size > 0:
                            _, buffer = cv2.imencode('.jpg', crop)
                            thumb_b64 = base64.b64encode(buffer).decode('utf-8')

                        norm_x = round((x1 / w) * 100, 1)
                        norm_y = round((y1 / h) * 100, 1)
                        norm_w = round(((x2 - x1) / w) * 100, 1)
                        norm_h = round(((y2 - y1) / h) * 100, 1)
                        lbl_text = f"{defect_type}: {self.class_names.get(cls_id, defect_type).split('(')[1].rstrip(')') if '(' in self.class_names.get(cls_id, '') else defect_type}"

                        detections.append({
                            "defect_type": defect_type,
                            "confidence": round(conf, 2),
                            "severity": sev,
                            "vehicle_id": vehicle_id,
                            "lat": lat,
                            "lon": lon,
                            "bbox": [x1, y1, x2, y2],
                            "x": norm_x,
                            "y": norm_y,
                            "w": norm_w,
                            "h": norm_h,
                            "label": lbl_text,
                            "timestamp": datetime.utcnow().isoformat(),
                            "thumbnail_b64": thumb_b64
                        })
                return detections

        # Simulated Perception Loop
        if random.random() < 0.35:
            return self._simulate_detection(lat, lon, vehicle_id)

        return detections

    def _simulate_detection(self, lat: float = 13.0067, lon: float = 80.2030, vehicle_id: str = "BUS-TN01-1042") -> List[Dict[str, Any]]:
        """Generates realistic synthetic perception telemetry for edge simulation and testing."""
        defect_type = random.choice(["D40", "D00", "D10", "D20"])
        conf = round(random.uniform(0.78, 0.96), 2)
        if defect_type == "D40":
            sev = "critical" if random.random() > 0.4 else "high"
        elif defect_type == "D20":
            sev = "high" if random.random() > 0.3 else "medium"
        elif defect_type == "D10":
            sev = "medium" if random.random() > 0.3 else "high"
        else:
            sev = "medium" if random.random() > 0.4 else "low"
        
        return [{
            "defect_type": defect_type,
            "confidence": conf,
            "severity": sev,
            "vehicle_id": vehicle_id,
            "lat": lat + random.gauss(0, 0.00002),
            "lon": lon + random.gauss(0, 0.00002),
            "bbox": [0.35, 0.45, 0.25, 0.20],
            "timestamp": datetime.utcnow().isoformat()
        }]

