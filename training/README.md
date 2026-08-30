# 🚗 Road Damage Detection (RDD2022 / CRDDC2022) Training Suite

> [!WARNING]
> **⚠️ No real RDD2022 dataset is checked into this repository.**  
> The training pipeline has only been smoke-tested using synthetic placeholder data located in `training/data/synthetic_smoke_test/`. Do not cite metrics (`results.csv`, `confusion_matrix.png`) from that smoke run as a real-world accuracy measurement. To perform real-world fine-tuning, download the official RDD2022 dataset as instructed below.

---

## 📥 Official Dataset Download Instructions

VIGILANCE targets 4 primary road distress categories defined by the IEEE Big Data Road Damage Detection Challenge (CRDDC2022):

| Class ID | Defect Code | Classification Type | Severity Impact |
| :--- | :--- | :--- | :--- |
| **0** | `D00` | Longitudinal Crack | Medium |
| **1** | `D10` | Transverse Crack | Medium |
| **2** | `D20` | Alligator / Crocodile Crack | High |
| **3** | `D40` | Pothole / Road Depression | Critical |

### Download Options:
1. **Official Figshare Dataset (12.5 GB):** [CRDDC2022 Official Release](https://figshare.com/articles/dataset/RDD2022_The_multi-national_road_damage_dataset_released_for_the_Crowdsensing-based_Road_Damage_Detection_Challenge_CRDDC2022_/21431547)
2. **India Subset (Recommended for Fine-Tuning):** Download the `Country_India.tar.gz` archive and extract into `training/data/images/train` and `training/data/images/val`.

---

## 🛠️ Running the Training Pipeline

### Option 1: Fine-Tune on Real RDD2022 Dataset
Once extracted into `training/data/`:
```bash
python3 training/train_road_damage.py --epochs 50 --batch 16 --device mps
```

### Option 2: Run Pipeline Smoke-Test (Synthetic Data)
```bash
python3 training/train_road_damage.py --smoke-test --epochs 5
```
Smoke test results and artifacts will be isolated in `training/runs/synthetic_smoke_test/`.
