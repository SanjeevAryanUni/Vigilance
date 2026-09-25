"""
VIGILANCE — Demo Dashcam Video Generator
=========================================
Generates a realistic 12-second (300 frames @ 25 FPS) dashcam video:
  - Realistic road perspective with asphalt texture, lane markings, and road defects
  - Real potholes and cracks (D40, D10, D20) mapped to the roadway
  - Leading and passing Indian vehicles (bus, sedan, auto-rickshaw)
  - Indian license plates (e.g. TN-01-AB-1234, TN-09-CD-5678)
  - Natural camera vibration and motion dynamics

Outputs:
  - assets/demo_samples/chennai_road.mp4
  - vigilance-prototype/assets/demo_samples/chennai_road.mp4
"""
import os
import sys
import math
import random
import cv2
import numpy as np

def generate_chennai_dashcam_video(
    output_path: str,
    duration_sec: float = 12.0,
    fps: int = 25,
    width: int = 1280,
    height: int = 720
):
    total_frames = int(duration_sec * fps)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    if not writer.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Base background image if available
    base_img_path = os.path.join(os.path.dirname(__file__), "..", "..", "images", "indian_road_potholes.jpg")
    base_bg = None
    if os.path.exists(base_img_path):
        raw = cv2.imread(base_img_path)
        if raw is not None:
            base_bg = cv2.resize(raw, (width, height))

    print(f"Generating {total_frames} frames ({duration_sec}s @ {fps}fps) to {output_path}...")

    # Horizon line
    horizon_y = int(height * 0.45)

    # Road perspective parameters
    road_top_left = int(width * 0.42)
    road_top_right = int(width * 0.58)
    road_bot_left = int(width * 0.05)
    road_bot_right = int(width * 0.95)

    # Vehicles list: [type, color, initial_dist, speed, lane]
    # dist: 0 (far horizon) to 1.0 (close)
    vehicles = [
        {"type": "bus", "color": (40, 90, 200), "dist": 0.35, "speed": 0.0018, "lane": 0.65, "plate": "TN 01 G 4590"},
        {"type": "car", "color": (190, 180, 170), "dist": 0.55, "speed": 0.0028, "lane": 0.35, "plate": "TN 09 BZ 8421"},
        {"type": "auto", "color": (20, 160, 220), "dist": 0.20, "speed": 0.0015, "lane": 0.78, "plate": "TN 07 AQ 1102"},
    ]

    # Road damage instances [dist, lane_offset, type]
    defects = [
        {"dist": 0.2, "offset": 0.42, "type": "D40 Pothole", "size": 35},
        {"dist": 0.5, "offset": 0.58, "type": "D10 Transverse", "size": 45},
        {"dist": 0.8, "offset": 0.38, "type": "D40 Pothole", "size": 50},
        {"dist": 1.1, "offset": 0.62, "type": "D20 Alligator", "size": 60},
    ]

    dash_speed = 0.035
    dash_offset = 0.0

    for f in range(total_frames):
        # Progress camera vibration / bounce
        vibration_y = int(2.0 * math.sin(f * 0.8) + 1.0 * math.cos(f * 1.5))
        vibration_x = int(1.0 * math.sin(f * 0.4))

        if base_bg is not None:
            # Scroll base road slightly to simulate forward motion
            shift_y = int((f * 4) % 40)
            frame = np.roll(base_bg, shift_y, axis=0)
            # Smooth blend top and bottom
            frame[:horizon_y - 20] = base_bg[:horizon_y - 20]
        else:
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            # Sky
            frame[:horizon_y] = (210, 180, 140)
            # Road
            road_poly = np.array([
                [road_top_left, horizon_y],
                [road_top_right, horizon_y],
                [road_bot_right, height],
                [road_bot_left, height]
            ], np.int32)
            cv2.fillPoly(frame, [road_poly], (50, 52, 55))

        dash_offset = (dash_offset + dash_speed) % 1.0

        # Draw road lane markings (perspective dashes)
        for i in range(12):
            progress = ((i / 12.0) + dash_offset / 12.0) % 1.0
            if progress < 0.05:
                continue
            curr_y = int(horizon_y + (height - horizon_y) * (progress ** 1.8))
            curr_w = int(3 + 18 * progress)
            curr_h = int(6 + 32 * progress)
            curr_x = int(width * 0.5)
            cv2.rectangle(frame, (curr_x - curr_w // 2, curr_y),
                          (curr_x + curr_w // 2, curr_y + curr_h), (240, 240, 240), -1)

        # Draw road defects (approaching camera)
        for defect in defects:
            d_dist = (defect["dist"] - (f * 0.0035)) % 1.2
            if 0.15 < d_dist < 0.95:
                p_y = int(horizon_y + (height - horizon_y) * (d_dist ** 1.6)) + vibration_y
                # Road width at this Y
                factor = (p_y - horizon_y) / float(height - horizon_y)
                left_x = road_top_left + (road_bot_left - road_top_left) * factor
                right_x = road_top_right + (road_bot_right - road_top_right) * factor
                p_x = int(left_x + (right_x - left_x) * defect["offset"]) + vibration_x
                sz = int(defect["size"] * (factor ** 1.2))

                if "Pothole" in defect["type"]:
                    # Draw realistic pothole: dark core with rough asphalt perimeter
                    cv2.ellipse(frame, (p_x, p_y), (int(sz * 1.3), int(sz * 0.65)),
                                -8, 0, 360, (22, 24, 28), -1)
                    cv2.ellipse(frame, (p_x, p_y), (int(sz * 1.3), int(sz * 0.65)),
                                -8, 0, 360, (15, 15, 18), 3)
                    # Texture inside
                    cv2.ellipse(frame, (p_x - int(sz * 0.2), p_y + int(sz * 0.1)),
                                (int(sz * 0.8), int(sz * 0.35)), -8, 0, 360, (10, 10, 12), -1)
                elif "Transverse" in defect["type"]:
                    # Crack lines
                    pts = np.array([
                        [p_x - sz, p_y - sz // 4],
                        [p_x - sz // 3, p_y + sz // 6],
                        [p_x + sz // 4, p_y - sz // 8],
                        [p_x + sz, p_y + sz // 4]
                    ], np.int32)
                    cv2.polylines(frame, [pts], False, (18, 18, 20), max(2, int(4 * factor)))
                else: # Alligator crack
                    cv2.ellipse(frame, (p_x, p_y), (int(sz * 1.1), int(sz * 0.5)),
                                0, 0, 360, (30, 30, 32), -1)
                    for k in range(5):
                        ang = k * 0.6
                        cv2.line(frame, (p_x - int(sz * 0.5 * math.cos(ang)), p_y - int(sz * 0.25 * math.sin(ang))),
                                 (p_x + int(sz * 0.5 * math.cos(ang)), p_y + int(sz * 0.25 * math.sin(ang))),
                                 (15, 15, 15), 2)

        # Draw Vehicles and License Plates (approaching or leading)
        for veh in vehicles:
            v_dist = (veh["dist"] + (f * veh["speed"])) % 1.1
            if 0.12 < v_dist < 0.92:
                vy = int(horizon_y + (height - horizon_y) * (v_dist ** 1.3)) + vibration_y
                factor = (vy - horizon_y) / float(height - horizon_y)
                left_x = road_top_left + (road_bot_left - road_top_left) * factor
                right_x = road_top_right + (road_bot_right - road_top_right) * factor
                vx = int(left_x + (right_x - left_x) * veh["lane"]) + vibration_x

                if veh["type"] == "bus":
                    bw = int(180 * factor)
                    bh = int(140 * factor)
                    bx = vx - bw // 2
                    by = vy - bh
                    # Bus body
                    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), veh["color"], -1)
                    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (30, 30, 30), 2)
                    # Rear windshield
                    cv2.rectangle(frame, (bx + int(bw * 0.1), by + int(bh * 0.15)),
                                  (bx + int(bw * 0.9), by + int(bh * 0.55)), (80, 110, 130), -1)
                    # Taillights
                    cv2.rectangle(frame, (bx + int(bw * 0.08), by + int(bh * 0.72)),
                                  (bx + int(bw * 0.22), by + int(bh * 0.88)), (0, 0, 220), -1)
                    cv2.rectangle(frame, (bx + int(bw * 0.78), by + int(bh * 0.72)),
                                  (bx + int(bw * 0.92), by + int(bh * 0.88)), (0, 0, 220), -1)
                    # Indian License Plate (White background with black text)
                    pw = int(bw * 0.42)
                    ph = int(bh * 0.15)
                    px = bx + (bw - pw) // 2
                    py = by + int(bh * 0.75)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (250, 250, 250), -1)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (10, 10, 10), 1)
                    # IND blue band on left
                    cv2.rectangle(frame, (px, py), (px + max(2, int(pw * 0.12)), py + ph), (180, 60, 20), -1)
                    font_scale = max(0.25, 0.55 * factor)
                    cv2.putText(frame, veh["plate"], (px + int(pw * 0.15), py + int(ph * 0.75)),
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale, (15, 15, 15), 1, cv2.LINE_AA)

                elif veh["type"] == "car":
                    cw = int(140 * factor)
                    ch = int(85 * factor)
                    cx = vx - cw // 2
                    cy = vy - ch
                    # Car body
                    cv2.rectangle(frame, (cx, cy + int(ch * 0.35)), (cx + cw, cy + ch), veh["color"], -1)
                    cv2.rectangle(frame, (cx + int(cw * 0.15), cy), (cx + int(cw * 0.85), cy + int(ch * 0.5)), veh["color"], -1)
                    # Rear windshield
                    cv2.rectangle(frame, (cx + int(cw * 0.2), cy + int(ch * 0.08)),
                                  (cx + int(cw * 0.8), cy + int(ch * 0.45)), (50, 70, 90), -1)
                    # Taillights
                    cv2.rectangle(frame, (cx + 4, cy + int(ch * 0.45)), (cx + int(cw * 0.2), cy + int(ch * 0.65)), (0, 0, 240), -1)
                    cv2.rectangle(frame, (cx + cw - int(cw * 0.2), cy + int(ch * 0.45)), (cx + cw - 4, cy + int(ch * 0.65)), (0, 0, 240), -1)
                    # Indian License Plate
                    pw = int(cw * 0.38)
                    ph = int(ch * 0.22)
                    px = cx + (cw - pw) // 2
                    py = cy + int(ch * 0.65)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (250, 250, 250), -1)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (10, 10, 10), 1)
                    cv2.rectangle(frame, (px, py), (px + max(2, int(pw * 0.12)), py + ph), (180, 60, 20), -1)
                    font_scale = max(0.22, 0.48 * factor)
                    cv2.putText(frame, veh["plate"], (px + int(pw * 0.15), py + int(ph * 0.75)),
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale, (10, 10, 10), 1, cv2.LINE_AA)

                elif veh["type"] == "auto":
                    aw = int(95 * factor)
                    ah = int(90 * factor)
                    ax = vx - aw // 2
                    ay = vy - ah
                    # Auto rickshaw yellow roof & dark body
                    cv2.rectangle(frame, (ax, ay), (ax + aw, ay + int(ah * 0.45)), (30, 210, 240), -1)
                    cv2.rectangle(frame, (ax, ay + int(ah * 0.45)), (ax + aw, ay + ah), (20, 20, 20), -1)
                    # Yellow license plate for commercial vehicle
                    pw = int(aw * 0.42)
                    ph = int(ah * 0.18)
                    px = ax + (aw - pw) // 2
                    py = ay + int(ah * 0.65)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (0, 220, 255), -1)
                    cv2.rectangle(frame, (px, py), (px + pw, py + ph), (10, 10, 10), 1)
                    font_scale = max(0.2, 0.4 * factor)
                    cv2.putText(frame, veh["plate"], (px + int(pw * 0.08), py + int(ph * 0.75)),
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale, (10, 10, 10), 1, cv2.LINE_AA)

        # Vehicle dashboard bottom bezel (dashcam perspective hood)
        hood_pts = np.array([
            [0, height],
            [int(width * 0.15), int(height * 0.92) + vibration_y],
            [int(width * 0.85), int(height * 0.92) + vibration_y],
            [width, height]
        ], np.int32)
        cv2.fillPoly(frame, [hood_pts], (22, 24, 28))
        cv2.polylines(frame, [hood_pts], False, (40, 44, 52), 2)

        writer.write(frame)

    writer.release()
    print(f"✓ Video successfully generated: {output_path} ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    targets = [
        os.path.join(os.path.dirname(__file__), "..", "..", "assets", "demo_samples", "chennai_road.mp4"),
        os.path.join(os.path.dirname(__file__), "..", "assets", "demo_samples", "chennai_road.mp4"),
    ]
    for t in targets:
        generate_chennai_dashcam_video(t, duration_sec=12.0, fps=25)
