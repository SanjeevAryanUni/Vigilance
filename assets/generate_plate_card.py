"""
VIGILANCE — Printable Test Card Generator
Generates realistic Indian HSRP license plates and print-ready road damage test cards
for in-room live camera testing with the VIGILANCE mobile PWA capture.
"""

import os
from PIL import Image, ImageDraw, ImageFont


def create_hsrp_plate(plate_text: str, filename: str, is_commercial: bool = False):
    """
    Creates a realistic Indian High Security Registration Plate (HSRP) card.
    Standard Indian aspect ratio ~4:1 (800x200 px).
    """
    width, height = 800, 200
    bg_color = "#FACC15" if is_commercial else "#FFFFFF"  # Yellow for taxi/bus, White for private
    text_color = "#000000"

    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([0, 0, width - 1, height - 1], outline="#000000", width=7)
    draw.rectangle([6, 6, width - 7, height - 7], outline="#334155", width=2)

    # Left Blue Strip (State/Country Indicator)
    blue_width = 85
    draw.rectangle([8, 8, blue_width, height - 9], fill="#003DA5")

    # Ashoka chakra / hologram placeholder
    draw.ellipse([30, 28, 62, 60], outline="#E2E8F0", width=2)
    draw.ellipse([43, 41, 49, 47], fill="#E2E8F0")

    # "IND" Text
    try:
        ind_font = ImageFont.truetype("arial.ttf", 24)
    except IOError:
        ind_font = ImageFont.load_default()
    draw.text((26, 75), "IND", fill="#FFFFFF", font=ind_font)

    # Main Plate Number Text
    try:
        font = ImageFont.truetype("arialbd.ttf", 74)
    except IOError:
        try:
            font = ImageFont.truetype("arial.ttf", 74)
        except IOError:
            font = ImageFont.load_default()

    text_bbox = draw.textbbox((0, 0), plate_text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]

    # Center the alphanumeric string in the remaining space
    x = blue_width + ((width - blue_width) - text_w) // 2
    y = (height - text_h) // 2 - 8
    draw.text((x, y), plate_text, fill=text_color, font=font)

    # HSRP Security laser code at bottom-left
    try:
        sec_font = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        sec_font = ImageFont.load_default()
    draw.text((blue_width + 15, height - 26), "AA202688194", fill="#475569", font=sec_font)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, quality=95)
    print(f"[OK] Generated Plate Card: {filename}")


def create_pothole_test_card(source_img_path: str, output_path: str):
    """
    Creates an A4-optimized 1200x800 printable pothole card with classification header.
    """
    card_w, card_h = 1200, 800
    card = Image.new("RGB", (card_w, card_h), "#0B0F19")
    draw = ImageDraw.Draw(card)

    # Outer border
    draw.rectangle([0, 0, card_w - 1, card_h - 1], outline="#38BDF8", width=6)

    # Header Bar
    draw.rectangle([6, 6, card_w - 7, 75], fill="#0F172A")
    try:
        h_font = ImageFont.truetype("arialbd.ttf", 26)
        sub_font = ImageFont.truetype("arial.ttf", 16)
    except IOError:
        h_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()

    draw.text((25, 18), "VIGILANCE ROAD DEFECT TEST CARD  [CLASS: D40 POTHOLE]", fill="#38BDF8", font=h_font)
    draw.text((25, 48), "Target: Edge AI Perception (INT8 ONNX) | Dataset: RDD2022 India | Standard: IRC:82-2015", fill="#94A3B8", font=sub_font)

    # Load source pothole image if present, or generate a realistic texture
    target_photo_box = (25, 90, card_w - 25, card_h - 60)
    photo_w = target_photo_box[2] - target_photo_box[0]
    photo_h = target_photo_box[3] - target_photo_box[1]

    if os.path.exists(source_img_path):
        src = Image.open(source_img_path).convert("RGB")
        # Center crop and resize to photo area
        src_w, src_h = src.size
        scale = max(photo_w / src_w, photo_h / src_h)
        new_w, new_h = int(src_w * scale), int(src_h * scale)
        src_resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - photo_w) // 2
        top = (new_h - photo_h) // 2
        cropped = src_resized.crop((left, top, left + photo_w, top + photo_h))
        card.paste(cropped, (target_photo_box[0], target_photo_box[1]))
    else:
        # Fallback asphalt grey patch
        draw.rectangle(target_photo_box, fill="#334155")
        draw.text((photo_w // 2 - 100, photo_h // 2), "ROAD DISTRESS SAMPLE", fill="#F1F5F9", font=h_font)

    # Subtle target reticle over defect
    cx = target_photo_box[0] + photo_w // 2
    cy = target_photo_box[1] + photo_h // 2
    r = 140
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline="#EF4444", width=3)
    draw.line([cx - r - 20, cy, cx + r + 20, cy], fill="#EF4444", width=2)
    draw.line([cx, cy - r - 20, cx, cy + r + 20], fill="#EF4444", width=2)
    draw.text((cx - 90, cy - r - 30), "DETECT ZONE: SEV 4.5", fill="#EF4444", font=sub_font)

    # Footer
    draw.rectangle([6, card_h - 55, card_w - 7, card_h - 7], fill="#0F172A")
    draw.text((25, card_h - 40), "Print on standard A4 paper. Hold at 0.5m-1.5m from mobile camera during /capture demo.", fill="#94A3B8", font=sub_font)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    card.save(output_path, quality=95)
    print(f"[OK] Generated Pothole Card: {output_path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cards_dir = os.path.join(base_dir, "test_cards")

    # Generate License Plates
    create_hsrp_plate("MH 12 AB 1234", os.path.join(cards_dir, "plate_card_MH12AB1234.jpg"), is_commercial=False)
    create_hsrp_plate("TN 07 CK 4523", os.path.join(cards_dir, "plate_card_TN07CK4523.jpg"), is_commercial=False)
    create_hsrp_plate("KA 01 MG 5678", os.path.join(cards_dir, "plate_card_KA01MG5678.jpg"), is_commercial=False)
    create_hsrp_plate("TN 09 BK 4481", os.path.join(cards_dir, "plate_card_TN09BK4481_comm.jpg"), is_commercial=True)

    # Generate Pothole Card
    source_pothole = os.path.join(os.path.dirname(base_dir), "images", "indian_road_potholes.jpg")
    create_pothole_test_card(source_pothole, os.path.join(cards_dir, "pothole_card_01.jpg"))

    print("\n[SUCCESS] All printable demo test cards generated in assets/test_cards/")
