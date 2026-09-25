# 📊 VIGILANCE — Model Training & Inference Metrics

## Road Damage Detection (YOLOv8n)

| Metric | Value |
|---|---|
| **Architecture** | YOLOv8n (Ultralytics) |
| **Training Dataset** | RDD2022 India subset |
| **Training Images** | 7,706 (augmented) |
| **Classes** | D00 (Longitudinal Crack), D10 (Transverse Crack), D20 (Alligator Crack), D40 (Pothole) |
| **mAP@50** | 39.89% |
| **Precision** | 54.3% |
| **Recall** | 37.4% |
| **F1 Score** | 44.1% |
| **Training Epochs** | 100 |
| **Image Size** | 640×640 |

## Model Compression & Edge Deployment

| Variant | File Size | Inference Latency | Speedup |
|---|---|---|---|
| FP32 ONNX | 12.2 MB | 64.2 ms | Baseline |
| **INT8 ONNX** | **3.2 MB** | **28.4 ms** | **2.26×** |
| Compression Ratio | — | — | **72.6%** smaller |

## Bandwidth Optimization (MQTT Telemetry)

| Metric | Value |
|---|---|
| MQTT Payload per Detection | ~200 bytes |
| Raw 1080p Video Stream (alt.) | ~5 Mbps |
| **Bandwidth Savings** | **99.8%** |
| Protocol | OASIS MQTT v5 (paho-mqtt v2) |

## Spatial Database

| Component | Specification |
|---|---|
| Engine | PostgreSQL 17 + PostGIS 3.3 |
| Region | Mumbai (ap-south-1) |
| Deduplication | ST_ClusterDBSCAN (15m radius, min_samples=2) |
| Priority Formula | RPI = 0.40S + 0.25D + 0.20R + 0.15P |
| Congestion Index | FHWA CI = 1 − v/v_freeflow |

## Automated Test Suite

| Metric | Value |
|---|---|
| Total Tests | 46 |
| Pass Rate | 100% |
| Execution Time | 2.08s |
| Coverage | Backend API + Edge AI + Spatial Clustering |
