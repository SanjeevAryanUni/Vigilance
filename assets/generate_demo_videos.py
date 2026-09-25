"""
VIGILANCE Demo Sample Video Generator
Generates three 15-second 720p 25fps video clips for live hackathon demonstration:
1. assets/demo_samples/chennai_road.mp4      (Road distress & potholes for damage detector)
2. assets/demo_samples/bangalore_traffic.mp4 (Multi-vehicle urban flow for COCO detector)
3. assets/demo_samples/delhi_plates.mp4      (Clear Indian HSRP plates for ANPR detector)
"""

import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def draw_hud(frame, city_name, lat, lon, speed_kmh, frame_idx, total_frames, vehicle_id):
    """Overlays high-tech dashcam HUD telemetry banner onto frame."""
    h, w = frame.shape[:2]
    # Top banner bar
    cv2.rectangle(frame, (0, 0), (w, 42), (15, 23, 42), -1)
    cv2.line(frame, (0, 42), (w, 42), (56, 189, 248), 1)

    time_sec = frame_idx / 25.0
    rec_dot = (0, 0, 255) if (frame_idx // 12) % 2 == 0 else (100, 100, 100)
    cv2.circle(frame, (20, 21), 6, rec_dot, -1)
    cv2.putText(frame, "REC  ONBOARD-AI-NODE", (35, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    # City & Corridor
    cv2.putText(frame, f"{city_name} CORRIDOR | {vehicle_id}", (300, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (148, 163, 184), 1, cv2.LINE_AA)

    # GPS & Speed
    gps_str = f"GPS: {lat:.4f} N, {lon:.4f} E | SPEED: {speed_kmh:.1f} KM/H"
    cv2.putText(frame, gps_str, (w - 430, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (56, 189, 248), 1, cv2.LINE_AA)

    # Bottom status bar
    cv2.rectangle(frame, (0, h - 30), (w, h), (15, 23, 42), -1)
    cv2.line(frame, (0, h - 30), (w, h - 30), (51, 65, 85), 1)
    pts = f"FRAME: {frame_idx:04d}/{total_frames:04d} | TIME: 00:{int(time_sec):02d}.{int((time_sec % 1)*100):02d} | INT8 EDGE QUANTIZED"
    cv2.putText(frame, pts, (20, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)
    cv2.putText(frame, "SIH2026 - BEL - TEAM VIGILANCE", (w - 310, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (34, 197, 94), 1, cv2.LINE_AA)


def generate_chennai_road(output_path, pothole_img_path, duration_sec=15, fps=25):
    """
    Simulates dashcam view of Chennai GST Road / Anna Salai with road surface,
    lane markings, and multiple potholes scrolling toward the vehicle.
    """
    w, h = 1280, 720
    total_frames = duration_sec * fps
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, float(fps), (w, h))

    # Load pothole texture if available
    pothole_tex = None
    if os.path.exists(pothole_img_path):
        raw = cv2.imread(pothole_img_path)
        if raw is not None:
            pothole_tex = cv2.resize(raw, (320, 240))

    # Horizon at y=280
    horizon_y = 280

    for f in range(total_frames):
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Sky gradient
        for y in range(horizon_y):
            ratio = y / horizon_y
            r = int(120 + 60 * ratio)
            g = int(160 + 50 * ratio)
            b = int(220 + 30 * ratio)
            frame[y, :] = (b, g, r)

        # Urban skyline / trees backdrop
        cv2.rectangle(frame, (0, horizon_y - 40), (w, horizon_y), (40, 60, 50), -1)
        for b_x in range(40, w, 90):
            b_h = 30 + (b_x * 7) % 50
            cv2.rectangle(frame, (b_x, horizon_y - b_h), (b_x + 60, horizon_y), (60, 75, 70), -1)

        # Road surface (asphalt)
        frame[horizon_y:, :] = (50, 52, 55)

        # Road shoulders / kerbs
        left_vanish = (w // 2 - 40, horizon_y)
        right_vanish = (w // 2 + 40, horizon_y)
        road_pts = np.array([left_vanish, right_vanish, (w + 150, h), (-150, h)], np.int32)
        cv2.fillPoly(frame, [road_pts], (45, 48, 52))

        # Lane markings scrolling forward
        scroll_offset = (f * 18) % 120
        for y_dash in range(horizon_y + 10, h + 100, 70):
            cur_y = y_dash + scroll_offset
            if cur_y >= h:
                cur_y -= (h - horizon_y + 60)
            if cur_y < horizon_y + 15:
                continue

            t = (cur_y - horizon_y) / float(h - horizon_y)
            center_x = int(w // 2)
            dash_w = max(4, int(18 * t))
            dash_h = max(6, int(35 * t))

            # Left dashed line & Right dashed line
            lane_offset = int(260 * t)
            cv2.rectangle(frame, (center_x - lane_offset - dash_w, int(cur_y)),
                          (center_x - lane_offset + dash_w, int(cur_y + dash_h)), (240, 240, 240), -1)
            cv2.rectangle(frame, (center_x + lane_offset - dash_w, int(cur_y)),
                          (center_x + lane_offset + dash_w, int(cur_y + dash_h)), (240, 240, 240), -1)

        # Road Potholes passing by at periodic intervals
        # Pothole 1 cycles every 120 frames, Pothole 2 cycles every 160 frames
        for p_idx, (cycle_len, p_x_lane, p_type) in enumerate([(125, -90, "D40 Pothole"), (175, 120, "D20 Alligator Crack")]):
            phase = (f + p_idx * 60) % cycle_len
            t = phase / float(cycle_len)
            if t > 0.05:
                py = int(horizon_y + (h - horizon_y - 40) * (t ** 1.8))
                px = int(w // 2 + p_x_lane * (py - horizon_y) / float(h - horizon_y))
                pw = int(30 + 170 * t)
                ph = int(15 + 75 * t)

                if 0 <= py < h - 20 and 0 <= px < w - 20:
                    # Draw distressed road defect patch
                    if pothole_tex is not None:
                        pw_c = max(10, min(pw, w - px))
                        ph_c = max(8, min(ph, h - py))
                        patch = cv2.resize(pothole_tex, (pw_c, ph_c))
                        # Blend into asphalt
                        alpha = min(0.9, 0.4 + 0.5 * t)
                        roi = frame[py:py + ph_c, px:px + pw_c]
                        frame[py:py + ph_c, px:px + pw_c] = cv2.addWeighted(patch, alpha, roi, 1 - alpha, 0)
                    else:
                        cv2.ellipse(frame, (px + pw // 2, py + ph // 2), (pw // 2, ph // 2), 0, 0, 360, (20, 20, 22), -1)
                        cv2.ellipse(frame, (px + pw // 2, py + ph // 2), (pw // 2, ph // 2), 0, 0, 360, (80, 80, 90), 2)

        # Speed slight variance (38-44 km/h)
        speed = 41.5 + 2.5 * math.sin(f * 0.05)
        lat = 13.0604 + (f / float(total_frames)) * 0.003
        lon = 80.2496 + (f / float(total_frames)) * 0.002
        draw_hud(frame, "CHENNAI ANNA SALAI", lat, lon, speed, f, total_frames, "BUS-TN02-3891")

        out.write(frame)

    out.release()
    print(f"[OK] Generated: {output_path} ({duration_sec}s @ {fps}fps)")


def generate_bangalore_traffic(output_path, duration_sec=15, fps=25):
    """
    Simulates urban traffic video for vehicle detection and flow estimation.
    Shows multiple moving vehicles (buses, cars, motorbikes).
    """
    w, h = 1280, 720
    total_frames = duration_sec * fps
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, float(fps), (w, h))

    horizon_y = 260

    # Define moving traffic agents
    # (speed_factor, lane_offset_base, color, label, size_ratio)
    vehicles = [
        {"speed": 1.1, "lane_x": -180, "color": (190, 40, 40), "type": "CAR", "w": 180, "h": 120, "start_f": 0},
        {"speed": 0.85, "lane_x": 130, "color": (30, 140, 220), "type": "BUS", "w": 260, "h": 190, "start_f": 30},
        {"speed": 1.3, "lane_x": -60, "color": (40, 180, 60), "type": "AUTO", "w": 110, "h": 100, "start_f": 90},
        {"speed": 0.95, "lane_x": 240, "color": (210, 210, 210), "type": "CAR", "w": 170, "h": 110, "start_f": 150},
    ]

    for f in range(total_frames):
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Bengaluru cloudy daytime sky
        for y in range(horizon_y):
            r = int(140 + 40 * (y / horizon_y))
            g = int(170 + 40 * (y / horizon_y))
            b = int(210 + 30 * (y / horizon_y))
            frame[y, :] = (b, g, r)

        # Metro viaduct / pillars in background
        cv2.rectangle(frame, (0, horizon_y - 65), (w, horizon_y - 45), (100, 110, 120), -1)
        for p in range(50, w, 180):
            cv2.rectangle(frame, (p, horizon_y - 45), (p + 35, horizon_y), (85, 95, 105), -1)

        # Road surface
        frame[horizon_y:, :] = (55, 58, 62)

        # Lane dividers
        scroll = (f * 15) % 100
        for y_dash in range(horizon_y, h + 80, 60):
            cur_y = y_dash + scroll
            if cur_y >= h:
                cur_y -= (h - horizon_y + 40)
            if cur_y < horizon_y + 10:
                continue
            t = (cur_y - horizon_y) / float(h - horizon_y)
            for lane_x_ratio in [-0.25, 0.0, 0.25]:
                cx = int(w // 2 + lane_x_ratio * w * (1 + 0.4 * t))
                dw = max(3, int(12 * t))
                dh = max(5, int(28 * t))
                cv2.rectangle(frame, (cx - dw, int(cur_y)), (cx + dw, int(cur_y + dh)), (220, 220, 220), -1)

        # Draw vehicle flows ahead
        for v in vehicles:
            rel_f = (f + v["start_f"]) % 200
            t = rel_f / 200.0
            if 0.1 <= t <= 0.95:
                # Perspective scaling
                scale = 0.2 + 0.9 * (t ** 1.5)
                vw = int(v["w"] * scale)
                vh = int(v["h"] * scale)
                vy = int(horizon_y + (h - horizon_y - 120) * t)
                vx = int(w // 2 + v["lane_x"] * (1 + t * 0.8) - vw // 2)

                if 0 <= vy < h - 40 and 0 <= vx < w - 40:
                    # Vehicle body
                    cv2.rectangle(frame, (vx, vy), (vx + vw, vy + vh), v["color"], -1)
                    # Windshield
                    cv2.rectangle(frame, (vx + int(vw * 0.1), vy + int(vh * 0.15)),
                                  (vx + int(vw * 0.9), vy + int(vh * 0.45)), (30, 35, 40), -1)
                    # Wheels
                    ww = max(4, int(vw * 0.15))
                    wh = max(8, int(vh * 0.25))
                    cv2.rectangle(frame, (vx + 4, vy + vh - wh), (vx + 4 + ww, vy + vh), (10, 10, 10), -1)
                    cv2.rectangle(frame, (vx + vw - 4 - ww, vy + vh - wh), (vx + vw - 4, vy + vh), (10, 10, 10), -1)
                    # Vehicle label
                    cv2.putText(frame, v["type"], (vx + 5, vy - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.4 * scale + 0.2, (255, 255, 255), 1)

        speed = 32.0 + 3.0 * math.sin(f * 0.08)
        lat = 12.9716 + (f / float(total_frames)) * 0.0025
        lon = 77.5946 + (f / float(total_frames)) * 0.0018
        draw_hud(frame, "BENGALURU OUTER RING ROAD", lat, lon, speed, f, total_frames, "BMTC-KA01-5520")

        out.write(frame)

    out.release()
    print(f"[OK] Generated: {output_path} ({duration_sec}s @ {fps}fps)")


def generate_delhi_plates(output_path, plate_card_paths, duration_sec=15, fps=25):
    """
    Simulates ANPR enforcement view showing approaching vehicle rear bumpers
    with crisp, readable Indian registration plates for EasyOCR / Plate Detector.
    """
    w, h = 1280, 720
    total_frames = duration_sec * fps
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, float(fps), (w, h))

    # Preload generated plate cards
    loaded_plates = []
    for p_path in plate_card_paths:
        if os.path.exists(p_path):
            img = cv2.imread(p_path)
            if img is not None:
                loaded_plates.append(img)

    horizon_y = 240

    # 3 vehicles with license plates cycle across the 15-second sequence
    plates_meta = [
        {"text": "DL 1C AA 2026", "car_color": (35, 45, 160), "start_f": 0, "duration": 130},
        {"text": "MH 12 AB 1234", "car_color": (160, 40, 40), "start_f": 115, "duration": 130},
        {"text": "TN 07 CK 4523", "car_color": (40, 140, 150), "start_f": 230, "duration": 140},
    ]

    for f in range(total_frames):
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Delhi NCR afternoon sky
        for y in range(horizon_y):
            frame[y, :] = (200, 215, 230)

        # Road surface
        frame[horizon_y:, :] = (52, 54, 58)

        # Lane markings
        scroll = (f * 16) % 90
        for y_dash in range(horizon_y, h + 80, 55):
            cur_y = y_dash + scroll
            if cur_y >= h:
                cur_y -= (h - horizon_y + 35)
            if cur_y < horizon_y + 10:
                continue
            t = (cur_y - horizon_y) / float(h - horizon_y)
            cv2.rectangle(frame, (w // 2 - int(8 * t), int(cur_y)), (w // 2 + int(8 * t), int(cur_y + 24 * t)), (240, 240, 240), -1)

        # Active vehicle with license plate
        for idx, pm in enumerate(plates_meta):
            if pm["start_f"] <= f < pm["start_f"] + pm["duration"]:
                rel_f = f - pm["start_f"]
                progress = rel_f / float(pm["duration"])

                # Approach motion from horizon toward camera
                t = 0.15 + 0.85 * (progress ** 1.3)
                car_w = int(240 + 380 * t)
                car_h = int(160 + 260 * t)
                car_y = int(horizon_y + (h - horizon_y - 200) * t - car_h // 2)
                car_x = int(w // 2 - car_w // 2)

                if car_y > 40 and car_x > 0 and car_x + car_w < w and car_y + car_h < h - 40:
                    # Vehicle rear bumper
                    cv2.rectangle(frame, (car_x, car_y), (car_x + car_w, car_y + car_h), pm["car_color"], -1)
                    # Rear windshield
                    cv2.rectangle(frame, (car_x + int(car_w * 0.1), car_y + int(car_h * 0.1)),
                                  (car_x + int(car_w * 0.9), car_y + int(car_h * 0.45)), (25, 30, 35), -1)
                    # Tail lights
                    tl_w = int(car_w * 0.18)
                    tl_h = int(car_h * 0.12)
                    cv2.rectangle(frame, (car_x + 10, car_y + int(car_h * 0.5)),
                                  (car_x + 10 + tl_w, car_y + int(car_h * 0.5) + tl_h), (0, 0, 230), -1)
                    cv2.rectangle(frame, (car_x + car_w - 10 - tl_w, car_y + int(car_h * 0.5)),
                                  (car_x + car_w - 10, car_y + int(car_h * 0.5) + tl_h), (0, 0, 230), -1)

                    # Bumper License Plate
                    plate_w = int(car_w * 0.46)
                    plate_h = int(plate_w * 0.28)
                    plate_x = car_x + (car_w - plate_w) // 2
                    plate_y = car_y + int(car_h * 0.68)

                    # Paste high-res plate card if available
                    plate_img = loaded_plates[idx % len(loaded_plates)] if loaded_plates else None
                    if plate_img is not None:
                        resized_plate = cv2.resize(plate_img, (plate_w, plate_h))
                        frame[plate_y:plate_y + plate_h, plate_x:plate_x + plate_w] = resized_plate
                    else:
                        cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (255, 255, 255), -1)
                        cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (0, 0, 0), 2)
                        cv2.putText(frame, pm["text"], (plate_x + 10, plate_y + int(plate_h * 0.7)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.45 * t + 0.3, (0, 0, 0), 2)

                    # Target ANPR Lock Reticle
                    if progress > 0.4:
                        cv2.rectangle(frame, (plate_x - 6, plate_y - 6), (plate_x + plate_w + 6, plate_y + plate_h + 6), (34, 197, 94), 2)
                        cv2.putText(frame, f"ANPR LOCKED: {pm['text']} [CONF 96.4%]",
                                    (plate_x - 10, plate_y - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (34, 197, 94), 1, cv2.LINE_AA)

        speed = 44.0 + 1.5 * math.sin(f * 0.1)
        lat = 28.6139 + (f / float(total_frames)) * 0.002
        lon = 77.2090 + (f / float(total_frames)) * 0.001
        draw_hud(frame, "DELHI RING ROAD ENFORCEMENT", lat, lon, speed, f, total_frames, "PATROL-VAN-12")

        out.write(frame)

    out.release()
    print(f"[OK] Generated: {output_path} ({duration_sec}s @ {fps}fps)")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    samples_dir = os.path.join(base_dir, "demo_samples")
    cards_dir = os.path.join(base_dir, "test_cards")
    images_dir = os.path.join(os.path.dirname(base_dir), "images")

    os.makedirs(samples_dir, exist_ok=True)

    # 1. Chennai Road Video (Road damage & potholes)
    chennai_path = os.path.join(samples_dir, "chennai_road.mp4")
    pothole_img = os.path.join(images_dir, "indian_road_potholes.jpg")
    generate_chennai_road(chennai_path, pothole_img)

    # 2. Bangalore Traffic Video (Urban vehicle counting)
    bangalore_path = os.path.join(samples_dir, "bangalore_traffic.mp4")
    generate_bangalore_traffic(bangalore_path)

    # 3. Delhi Plates Video (ANPR registration plate recognition)
    delhi_path = os.path.join(samples_dir, "delhi_plates.mp4")
    plate_cards = [
        os.path.join(cards_dir, "plate_card_MH12AB1234.jpg"),
        os.path.join(cards_dir, "plate_card_TN07CK4523.jpg"),
        os.path.join(cards_dir, "plate_card_KA01MG5678.jpg"),
    ]
    generate_delhi_plates(delhi_path, plate_cards)

    print("\n[SUCCESS] All three 15-second demo video clips generated successfully!")
