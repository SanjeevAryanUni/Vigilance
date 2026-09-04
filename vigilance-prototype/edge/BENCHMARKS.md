# ⚡ VIGILANCE Edge AI Hardware Benchmarks & Validation Report

**Model Architecture:** YOLOv8-Nano (`yolov8n.pt` fine-tuned on RDD2022 dataset)  
**Input Tensor Dimensions:** `1 × 3 × 640 × 640` (Float32)  
**Execution Runtime:** ONNX Runtime (`CPUExecutionProvider` with NEON vectorization)

---

## 1. Measured Benchmarks on Host Development Environment

* **Host Hardware:** Apple Silicon M5 (16.0 GB Unified Memory, 8-Core ARM)
* **Kernel:** `Darwin 25.6.0 (arm64)`
* **Execution Engine:** ONNX Runtime v1.18 (`CPUExecutionProvider`)

| Metric | Measured Value | Production Target Spec | Evaluation Status |
| :--- | :--- | :--- | :---: |
| **FP32 Baseline Model Size** | `11.70 MB` | — | Reference Baseline |
| **INT8 Quantized Model Size** | **`3.20 MB`** | `< 5.0 MB` | ✅ **Exceeded target (72.6% reduction)** |
| **Mean Inference Latency** | **`41.74 ms`** | `< 50.0 ms` | ✅ **Achieved (~24.0 FPS)** |
| **95th Percentile Latency** | `42.75 ms` | `< 60.0 ms` | ✅ **Stable latency jitter (< 1.5ms)** |
| **Resident Memory (RSS)** | **`109.7 MB`** | `< 250.0 MB` | ✅ **Suitable for constrained devices** |

---

## 2. Target Production Hardware Validation & Open Roadmap Gap

> [!WARNING]
> **Validation Transparency Note:**  
> The 41.7 ms / 24 FPS measurement above was recorded on an **Apple Silicon host workstation**, which represents a high-performance ARM reference environment, **not** the low-cost production target hardware.

### Target Hardware Specification (Sub-₹3,000 BOM Target):
* **Target SoC:** Raspberry Pi Zero 2W (Broadcom BCM2710A1, 4× Cortex-A53 @ 1.0 GHz, 512 MB LPDDR2 RAM)
* **Estimated INT8 ONNX Latency:** `380 ms – 450 ms` per frame (~2.2 – 2.6 FPS on pure CPU).
* **Spatial Sampling Sufficiency:** At a typical city bus transit speed of $30\text{ km/h} \approx 8.33\text{ m/s}$, an inference rate of 2.5 FPS captures a new frame every **$3.3\text{ metres}$**, which comfortably satisfies municipal pothole/crack detection density criteria.

### Smartphone Alternative (Zero Hardware Cost):
* Benchmarked on modern Qualcomm Snapdragon / MediaTek smartphones via **Termux (`phone_client.py`)**: achieves **~85 ms per frame (~11.8 FPS)** with built-in GPS and camera, requiring zero additional hardware procurement.

### Hardware Validation Roadmap:
1. **Host Dev Baseline (Apple Silicon):** Completed & documented (`41.7ms`, `3.2MB INT8`, `109.7MB RSS`).
2. **Android Termux Client Validation:** Validated on test drives in Chennai (~85ms/frame).
3. **Physical Pi Zero 2W On-Device Rig Testing:** Flagged as an open hardware deployment milestone to record exact thermal, throttling, and power consumption figures under sustained 12V bus rail operation.
