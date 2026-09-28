"""
Add Government Integration & Sovereign AI Slides to SIH26_TEAM_VIGILANCE.pptx
"""
import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

NAVY_BLUE = RGBColor(0x12, 0x3D, 0x6E)
ACCENT_BLUE = RGBColor(0x00, 0x6D, 0xBD)
SAFFRON = RGBColor(0xEC, 0x74, 0x1F)
DARK_TEXT = RGBColor(0x1C, 0x23, 0x2A)
MUTED_TEXT = RGBColor(0x5A, 0x6B, 0x7C)
CARD_BG = RGBColor(0xF0, 0xF4, 0xF8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BORDER_COLOR = RGBColor(0xCF, 0xD8, 0xDC)

def build_card(slide, left, top, width, height, title, subtitle, bullets, badge_text, badge_color):
    # Card Background Shape
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = BORDER_COLOR
    card.line.width = Pt(1.2)

    # Text container
    tx_box = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.15), width - Inches(0.36), height - Inches(0.3))
    tf = tx_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    # Badge + Title
    p_title = tf.paragraphs[0]
    p_title.text = title
    p_title.font.name = "Arial"
    p_title.font.size = Pt(14)
    p_title.font.bold = True
    p_title.font.color.rgb = NAVY_BLUE
    p_title.space_after = Pt(2)

    p_sub = tf.add_paragraph()
    p_sub.text = subtitle
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(10)
    p_sub.font.bold = True
    p_sub.font.color.rgb = badge_color
    p_sub.space_after = Pt(8)

    for b in bullets:
        p_bullet = tf.add_paragraph()
        p_bullet.text = f"•  {b}"
        p_bullet.font.name = "Arial"
        p_bullet.font.size = Pt(9.5)
        p_bullet.font.color.rgb = DARK_TEXT
        p_bullet.space_after = Pt(4)


def add_slides(pptx_path):
    prs = pptx.Presentation(pptx_path)
    blank_layout = prs.slide_layouts[6]

    # Check if slides already added
    for s in prs.slides:
        for sh in s.shapes:
            if sh.has_text_frame and "SOVEREIGN GOVERNMENT PLATFORM INTEGRATION" in sh.text_frame.text:
                print("[*] Government integration slide already exists in presentation.")
                return

    # ── SLIDE 8: GOVERNMENT PLATFORM INTEGRATION ───────────────────────
    slide8 = prs.slides.add_slide(blank_layout)

    # Top Header Box
    h_box = slide8.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.1))
    htf = h_box.text_frame
    htf.word_wrap = True
    htf.margin_left = htf.margin_top = 0

    p_main = htf.paragraphs[0]
    p_main.text = "SOVEREIGN GOVERNMENT PLATFORM INTEGRATION"
    p_main.font.name = "Arial"
    p_main.font.size = Pt(24)
    p_main.font.bold = True
    p_main.font.color.rgb = NAVY_BLUE

    p_sub = htf.add_paragraph()
    p_sub.text = "Embedded in India's Digital Public Infrastructure (DPI) & Bharat Electronics Limited (BEL) Mission"
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(12)
    p_sub.font.color.rgb = SAFFRON

    # 4 Columns for the 4 Government Integrations
    card_w = Inches(2.75)
    card_h = Inches(5.1)
    gap = Inches(0.2)
    start_left = Inches(0.8)
    top_pos = Inches(1.6)

    # Card 1: ISRO Bhuvan
    build_card(
        slide8, start_left, top_pos, card_w, card_h,
        "ISRO Bhuvan",
        "Sovereign Geospatial Core",
        [
            "High-resolution Indian satellite imagery via NRSC WMS web service.",
            "Eliminates dependency on foreign commercial map tile CDNs for defense/BEL deployments.",
            "Integrates CartoDem elevation layers for road gradient & slope modeling.",
            "Fully complies with National Geospatial Policy (NGP 2022)."
        ],
        "Geospatial Infrastructure", ACCENT_BLUE
    )

    # Card 2: API Setu / Parivahan
    build_card(
        slide8, start_left + (card_w + gap), top_pos, card_w, card_h,
        "API Setu (MoRTH)",
        "Automated Vehicle Registry",
        [
            "Real-time ANPR verification against National Parivahan Vahan registry.",
            "OAuth2.0 token-gated consent architecture for automated enforcement.",
            "Retrieves registered vehicle owner, class, insurance, & fitness validity.",
            "Enables swift municipal action on rogue & overloaded transport trucks."
        ],
        "Identity & Auth", SAFFRON
    )

    # Card 3: data.gov.in
    build_card(
        slide8, start_left + (card_w + gap) * 2, top_pos, card_w, card_h,
        "data.gov.in (OGD)",
        "Official Road Benchmarks",
        [
            "Open Government Data (OGD) Platform India dataset integration.",
            "State-level road network statistics (NH, SH, and rural road length).",
            "Embeds annual road accident & casualty figures into executive PWD PDF audit reports.",
            "Quantifies infrastructure repair ROI against state mortality benchmarks."
        ],
        "Open Government Data", ACCENT_BLUE
    )

    # Card 4: AIKosh & IndiaAI
    build_card(
        slide8, start_left + (card_w + gap) * 3, top_pos, card_w, card_h,
        "AIKosh & IndiaAI",
        "Sovereign Model Retraining",
        [
            "Retraining pipeline roadmap leveraging AIKosh road safety data repositories.",
            "Trained on AIRAWAT / Yotta Shakti GPU supercluster under IndiaAI Mission.",
            "Path to scale from RDD2022 (39.89% mAP@50) to 65%+ with diverse Indian road datasets.",
            "Zero foreign API dependency; quantized INT8 weights deployed directly on edge."
        ],
        "National AI Supercluster", SAFFRON
    )

    # Footer note
    f_box = slide8.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.7), Inches(0.4))
    ftf = f_box.text_frame
    fp = ftf.paragraphs[0]
    fp.text = "VIGILANCE  •  SMART INDIA HACKATHON 2026 GRAND FINALE  •  BEL PROBLEM STATEMENT SIH26124"
    fp.font.name = "Arial"
    fp.font.size = Pt(8.5)
    fp.font.color.rgb = MUTED_TEXT

    # ── SLIDE 9: SCALABILITY & DEFENSE READINESS ──────────────────────
    slide9 = prs.slides.add_slide(blank_layout)

    h_box2 = slide9.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.1))
    htf2 = h_box2.text_frame
    htf2.word_wrap = True
    htf2.margin_left = htf2.margin_top = 0

    p_main2 = htf2.paragraphs[0]
    p_main2.text = "SCALABILITY, SECURITY & DEFENSE READINESS"
    p_main2.font.name = "Arial"
    p_main2.font.size = Pt(24)
    p_main2.font.bold = True
    p_main2.font.color.rgb = NAVY_BLUE

    p_sub2 = htf2.add_paragraph()
    p_sub2.text = "Architected for Sovereign Municipal Scale, Tactical Fleets & Critical Road Networks"
    p_sub2.font.name = "Arial"
    p_sub2.font.size = Pt(12)
    p_sub2.font.color.rgb = SAFFRON

    # 3 Strategic Pillars
    card_w3 = Inches(3.7)
    card_h3 = Inches(5.1)
    gap3 = Inches(0.25)
    start_left3 = Inches(0.8)

    build_card(
        slide9, start_left3, top_pos, card_w3, card_h3,
        "Low-Cost Edge Ubiquity",
        "Pan-City Transit Fleet Mesh",
        [
            "Sub-₹3,000 edge hardware BOM (Raspberry Pi Zero 2W or existing driver Android phones).",
            "5Hz continuous perception with INT8 quantization (28.4ms latency, 110MB RAM).",
            "99.8% bandwidth reduction via 200-byte OASIS MQTT v5 telemetry packets.",
            "Zero extra vehicle power requirement; runs directly off 5V/2A bus USB ports.",
            "Offline-first store-and-forward architecture caches telemetry in no-network zones."
        ],
        "Hardware Economics", ACCENT_BLUE
    )

    build_card(
        slide9, start_left3 + (card_w3 + gap3), top_pos, card_w3, card_h3,
        "Sovereign Security & Zero-Trust",
        "Air-Gapped & BEL Tactical Ready",
        [
            "Full on-premise deployment: PostGIS, Redis, Mosquitto MQTT & FastAPI running offline.",
            "Zero cloud telemetry leakage; zero foreign CDN dependency for map tiles or fonts.",
            "Role-based API key authentication on all mutation and dispatch endpoints.",
            "Tamper-resistant database audit trails with cryptographic hash verification.",
            "Can operate on secure tactical intranet networks for defense logistics corridors."
        ],
        "Cybersecurity Posture", SAFFRON
    )

    build_card(
        slide9, start_left3 + (card_w3 + gap3) * 2, top_pos, card_w3, card_h3,
        "Multi-City Federation",
        "Closed-Loop PWD SLA Governance",
        [
            "Seamless multi-city switching: Chennai (GCC), Bengaluru (BBMP), Delhi (MCD).",
            "PostGIS ST_ClusterDBSCAN merges multi-bus passes with 15-meter consensus.",
            "Automated Repair Prioritization Index (RPI = 0.40S + 0.25D + 0.20R + 0.15P).",
            "Automatic contractor dispatch with IRC SP:20 repair budgeting & 48h SLA countdowns.",
            "Generates Chief Engineer Monday Morning PDF Municipal Audits automatically."
        ],
        "Municipal Governance", ACCENT_BLUE
    )

    f_box2 = slide9.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.7), Inches(0.4))
    ftf2 = f_box2.text_frame
    fp2 = ftf2.paragraphs[0]
    fp2.text = "VIGILANCE  •  SMART INDIA HACKATHON 2026 GRAND FINALE  •  BEL PROBLEM STATEMENT SIH26124"
    fp2.font.name = "Arial"
    fp2.font.size = Pt(8.5)
    fp2.font.color.rgb = MUTED_TEXT

    prs.save(pptx_path)
    print(f"\n[SUCCESS] Successfully added Government Integration and Scalability slides to {pptx_path}")

if __name__ == "__main__":
    deck = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SIH26_TEAM_VIGILANCE.pptx")
    add_slides(deck)
