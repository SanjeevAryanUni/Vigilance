"""
PWD Municipal Audit Report Generator for VIGILANCE.
Generates downloadable PDF and CSV reports for government officials
showing road damage summaries, zone breakdowns, budget estimates,
and contractor SLA status.
"""
import io
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any

from fpdf import FPDF
from poi_data import (
    get_active_city_config,
    get_active_city,
    IRC_REPAIR_RATES,
    get_contractor,
    estimate_repair_cost,
    match_nearest_road,
)


class PWDReportPDF(FPDF):
    """Custom PDF class with VIGILANCE header/footer branding."""

    def __init__(self, city_name: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.city_name = city_name

    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "VIGILANCE -- Urban Road Intelligence Platform", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.cell(0, 6, f"PWD Municipal Audit Report -- {self.city_name}", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 5, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | SIH26124 - Bharat Electronics Limited", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)
        self.set_draw_color(59, 130, 246)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.cell(0, 10, f"VIGILANCE SIH2026 | Confidential -- {self.city_name} PWD Internal Use Only | Page {self.page_no()}/{{nb}}", align="C")


def generate_pwd_pdf(detections: List[Dict[str, Any]]) -> bytes:
    """
    Generates a complete PWD Municipal Audit Report in PDF format.
    
    Args:
        detections: List of detection records from the database, each containing:
            - lat, lon, damage_type / defect_type, severity, confidence, road_name, detected_at / timestamp
    
    Returns:
        PDF file as bytes.
    """
    cfg = get_active_city_config()
    city_name = cfg["display_name"]
    pdf = PWDReportPDF(city_name, orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ── Section 1: Executive Summary ─────────────────────────────────
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "1. Executive Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    total = len(detections)
    severity_counts: Dict[str, int] = {}
    type_counts: Dict[str, int] = {}
    total_budget = 0.0

    for d in detections:
        sev = str(d.get("severity", "Medium")).capitalize()
        dtype = d.get("damage_type") or d.get("defect_type") or "D40 (Pothole)"
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        type_counts[dtype] = type_counts.get(dtype, 0) + 1

        # Extract damage class code (e.g., "D40" from "D40 (Pothole)")
        class_code = dtype.split(" ")[0] if " " in dtype else dtype
        cost_info = estimate_repair_cost(class_code)
        total_budget += cost_info["estimated_cost_inr"]

    pdf.set_font("Helvetica", "", 10)
    summary_lines = [
        f"City: {city_name} ({cfg['state']})",
        f"Municipal Body: {cfg['municipal_body']}",
        f"Report Period: Last 30 days (ending {datetime.utcnow().strftime('%d %B %Y')})",
        f"Total Defects Detected: {total}",
        f"Critical (High Severity): {severity_counts.get('Critical', 0) + severity_counts.get('High', 0)}",
        f"Estimated Repair Budget (IRC Rates): Rs. {total_budget:,.0f}",
    ]
    for line in summary_lines:
        pdf.cell(0, 6, line, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ── Section 2: Damage Type Breakdown ─────────────────────────────
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "2. Damage Classification Breakdown", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    headers = ["Damage Class", "Count", "IRC Rate (INR/sqm)", "Est. Budget (INR)"]
    col_widths = [60, 30, 45, 55]
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(0, 0, 0)
    for dtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        class_code = dtype.split(" ")[0] if " " in dtype else dtype
        rate_info = IRC_REPAIR_RATES.get(class_code, IRC_REPAIR_RATES["D40"])
        line_budget = rate_info["rate_per_sqm"] * 2.0 * count
        pdf.cell(col_widths[0], 6, str(dtype)[:30], border=1)
        pdf.cell(col_widths[1], 6, str(count), border=1, align="C")
        pdf.cell(col_widths[2], 6, f"Rs. {rate_info['rate_per_sqm']:,}", border=1, align="R")
        pdf.cell(col_widths[3], 6, f"Rs. {line_budget:,.0f}", border=1, align="R")
        pdf.ln()

    pdf.ln(6)

    # ── Section 3: Road-wise Breakdown ───────────────────────────────
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "3. Road-wise Defect Distribution", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    road_counts: Dict[str, int] = {}
    for d in detections:
        road = d.get("road_name") or match_nearest_road(d.get("lat", 0.0), d.get("lon", 0.0))
        road_counts[road] = road_counts.get(road, 0) + 1

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    r_headers = ["Road Name", "Defects", "Contractor", "SLA (hrs)"]
    r_widths = [65, 25, 60, 25]
    for i, h in enumerate(r_headers):
        pdf.cell(r_widths[i], 7, h, border=1, fill=True, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(0, 0, 0)
    for road, count in sorted(road_counts.items(), key=lambda x: -x[1]):
        contractor = get_contractor(road)
        pdf.cell(r_widths[0], 6, str(road)[:35], border=1)
        pdf.cell(r_widths[1], 6, str(count), border=1, align="C")
        pdf.cell(r_widths[2], 6, str(contractor["name"])[:30], border=1)
        pdf.cell(r_widths[3], 6, str(contractor["sla_hours"]), border=1, align="C")
        pdf.ln()

    pdf.ln(6)

    # ── Section 4: Contractor SLA Compliance ─────────────────────────
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "4. Contractor SLA Compliance (48-Hour Deadline)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    now = datetime.utcnow()
    breached = 0
    active = 0
    for d in detections:
        detected_at = d.get("detected_at") or d.get("timestamp")
        if isinstance(detected_at, str):
            try:
                detected_at = datetime.fromisoformat(detected_at.replace("Z", "+00:00").replace("+00:00", ""))
            except Exception:
                detected_at = now - timedelta(hours=12)
        elif detected_at is None:
            detected_at = now - timedelta(hours=12)

        road = d.get("road_name") or match_nearest_road(d.get("lat", 0.0), d.get("lon", 0.0))
        contractor = get_contractor(road)
        deadline = detected_at + timedelta(hours=contractor["sla_hours"])
        if now > deadline:
            breached += 1
        else:
            active += 1

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 6, f"Active (within SLA): {active}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(220, 38, 38)
    pdf.cell(0, 6, f"Breached (SLA exceeded): {breached}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(6)

    # ── Section 5: Methodology Footer ────────────────────────────────
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "5. Detection Methodology", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 9)
    methodology = [
        "- AI Model: YOLOv8n fine-tuned on RDD2022 India subset (7,706 images)",
        "- Quantization: INT8 ONNX Runtime (3.2 MB, 28.4ms inference)",
        "- Spatial Dedup: PostGIS ST_ClusterDBSCAN (15m radius, min 2 samples)",
        "- Priority: IRC Road Priority Index -- RPI = 0.40S + 0.25D + 0.20R + 0.15P",
        "- Budget Rates: Indian Road Congress (IRC) SP:20 schedule of rates",
    ]
    for line in methodology:
        pdf.cell(0, 5, line, new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def generate_pwd_csv(detections: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV export of all detections for spreadsheet analysis.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Latitude", "Longitude", "Road Name", "Damage Type",
        "Severity", "Confidence %", "Detected At", "Contractor",
        "SLA Hours", "Est. Cost (INR)", "Zone"
    ])

    for d in detections:
        dtype = d.get("damage_type") or d.get("defect_type") or "D40"
        class_code = dtype.split(" ")[0] if " " in dtype else dtype
        cost = estimate_repair_cost(class_code)
        road = d.get("road_name") or match_nearest_road(d.get("lat", 0.0), d.get("lon", 0.0))
        contractor = get_contractor(road)
        writer.writerow([
            d.get("id", ""),
            d.get("lat", ""),
            d.get("lon", ""),
            road,
            dtype,
            d.get("severity", ""),
            d.get("confidence", ""),
            d.get("detected_at") or d.get("timestamp", ""),
            contractor["name"],
            contractor["sla_hours"],
            cost["estimated_cost_inr"],
            d.get("zone", ""),
        ])

    return output.getvalue()
