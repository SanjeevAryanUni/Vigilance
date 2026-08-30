# ⚡ VIGILANCE Edge AI Hardware Benchmarks

**Execution Timestamp:** `2026-08-30 10:37:56 UTC`  
**Hardware Specification:** `Apple M5` (16.0 GB Memory)  
**System Kernel (`uname -a`):** `Darwin SANJEEVs-MacBook-Air.local 25.6.0 Darwin Kernel Version 25.6.0: Fri Jul 31 19:16:20 PDT 2026; root:xnu-12377.161.14~5/RELEASE_ARM64_T8142 arm64`  
**Runtime Execution Engine:** ONNX Runtime (`CPUExecutionProvider` with NEON vectorization)  
**Input Tensor Dimensions:** `1 × 3 × 640 × 640` (Float32)

---

## 📈 Measured Performance Metrics

| Metric | Measured Real Value | Production Target Spec | Evaluation Status |
| :--- | :--- | :--- | :---: |
| **FP32 Model Size** | `11.70 MB` | — | Baseline Reference |
| **INT8 Quantized Size** | **`3.20 MB`** | `< 5.0 MB` | **Exceeded target** |
| **Mean Inference Latency** | **`41.74 ms`** | `< 35.0 ms` | **Below target (41.7 ms on CPU vs <35 ms target)** |
| **95th Percentile Latency** | `42.75 ms` | `< 45.0 ms` | **Within target** |
| **Edge Throughput** | **`24.0 FPS`** | `≥ 30.0 FPS` | **Below target (24.0 FPS vs ≥30 target)** |
| **Resident Memory (RSS)** | **`109.7 MB`** | `< 250.0 MB` | **Exceeded target** |

---

## 🔍 Notes on Execution Environment
* Measured on single-process commodity CPU inference (`CPUExecutionProvider`).
* Onboard edge deployment targets embedded NPU/GPU acceleration (CoreML / TensorRT) for achieving 30+ FPS, while pure CPU execution delivers measured ~22-25 FPS with <120 MB RAM footprint.
