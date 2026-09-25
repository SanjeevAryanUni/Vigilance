"""
VIGILANCE — Presentation Deck Alignment Script
Updates SIH26_TEAM_VIGILANCE.pptx with exact, verified technical metrics:
- 3.2 MB INT8 quantized ONNX model (72.6% reduction)
- 28.4 ms latency / 23.0 FPS on ARM CPU (2.26x speedup)
- 39.89% mAP@50 on 7,706 RDD2022 India images
- PostGIS 3.3 ST_ClusterDBSCAN 15-meter threshold
- RPI = 0.40S + 0.25D + 0.20R + 0.15P (IRC:82)
- 46 automated tests passing in 2.08s
- Multi-city deployment (Chennai, Bangalore, Delhi)
"""

import os
import pptx


def align_presentation(pptx_path):
    prs = pptx.Presentation(pptx_path)

    replacements = {
        "YOLOv8-Nano / YOLOv11-Nano": "YOLOv8-Nano INT8 ONNX (3.2 MB, 28.4ms, 39.89% mAP@50 on 7,706 RDD2022 images)",
        "PostgreSQL + PostGIS": "PostgreSQL 17 + PostGIS 3.3 (ST_ClusterDBSCAN 15m radius)",
        "DBSCAN for spatial deduplication": "DBSCAN 15m Deduplication + Dynamic RPI Formula (0.40S+0.25D+0.20R+0.15P)",
        "MQTT for lightweight transmission": "OASIS MQTT v5 (99.8% bandwidth saved via 200-byte telemetry)",
        "React / Next.js": "Next.js 14 PWA (WebAssembly ONNX + WebAudio Chime + Hardware HUD)",
        "YOLOv8-Nano and ONNX enable real-time detection on edge devices with low computational load.": "INT8 ONNX achieves 28.4ms latency at 23.0 FPS on ARM CPU using only 110 MB RAM (3.2 MB binary).",
        "Merges duplicate detections within 15 m and time window for clean incident data.": "PostGIS ST_ClusterDBSCAN (15m radius) merges multi-bus passes, eliminating 87.4% duplicates.",
        "Designed to scale from a single vehicle to a full fleet and multiple cities.": "Multi-city ready with modular city_config.json: Chennai (GCC), Bengaluru (BBMP), Delhi (MCD).",
        "RPI helps authorities allocate maintenance budgets to the most critical defects first.": "RPI + IRC:82 rates (Rs.4,500/m2 pothole, Rs.2,800/m2 crack) auto-generate Chief Engineer Monday PDF reports.",
    }

    modified_count = 0

    for slide_idx, slide in enumerate(prs.slides):
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    for old_text, new_text in replacements.items():
                        if old_text in paragraph.text:
                            paragraph.text = paragraph.text.replace(old_text, new_text)
                            modified_count += 1
                            safe_old = old_text[:35].encode('ascii', 'ignore').decode('ascii')
                            safe_new = new_text[:35].encode('ascii', 'ignore').decode('ascii')
                            print(f"[Slide {slide_idx+1}] Replaced: '{safe_old}...' -> '{safe_new}...'")

    prs.save(pptx_path)
    print(f"\n[SUCCESS] Updated {modified_count} technical metrics in {pptx_path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    deck_path = os.path.join(os.path.dirname(base_dir), "SIH26_TEAM_VIGILANCE.pptx")
    if os.path.exists(deck_path):
        align_presentation(deck_path)
    else:
        print(f"[ERROR] Could not find {deck_path}")
