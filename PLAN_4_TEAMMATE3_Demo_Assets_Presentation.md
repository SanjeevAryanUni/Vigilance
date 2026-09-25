# 🎬 TRACK 4 — TEAMMATE 3: Demo Assets, Fail-Safe Video & Presentation Alignment

> **Owner:** Teammate 3  
> **Track:** Demo Preparation + Media + Presentation  
> **Estimated Time:** 3–4 hours  
> **GAPs Addressed:** Cross-cutting — ensures all other GAPs can be PROVEN to judges

---

## 📂 Files You Own (DO NOT let others touch these)

| File | Status |
|---|---|
| `assets/demo_samples/` | **NEW** directory |
| `assets/demo_samples/chennai_road.mp4` | **NEW** — Primary demo video |
| `assets/demo_samples/bangalore_traffic.mp4` | **NEW** — Secondary demo video |
| `assets/demo_samples/delhi_plates.mp4` | **NEW** — ANPR demo video |
| `assets/test_cards/` | **NEW** directory |
| `assets/test_cards/pothole_card_01.jpg` | **NEW** — Print-ready pothole image |
| `assets/test_cards/plate_card_MH12AB1234.jpg` | **NEW** — Print-ready license plate |
| `assets/test_cards/plate_card_TN07CK4523.jpg` | **NEW** — Print-ready license plate |
| `DEMO_SCRIPT.md` | **NEW** (project root) |
| `assets/failsafe_recording.mp4` | **NEW** — 90-second safety net video |
| `SIH26_TEAM_VIGILANCE.pptx` | MODIFY |

---

## 🚀 STEP 1 — Curate Demo Video Clips

### What you need:
3 high-quality, 10–15 second video clips showing:
1. **Indian potholes / road damage** (for Road Damage Detector)
2. **Urban traffic with visible vehicles** (for Traffic Detector / vehicle counting)
3. **Indian license plates clearly visible** (for ANPR)

### Sources (all Creative Commons / fair-use for academic demo):

```bash
# Create the directories
mkdir -p assets/demo_samples
mkdir -p assets/test_cards
```

### Option A — Download from YouTube (use yt-dlp)

```bash
# Install yt-dlp if not present
pip install yt-dlp

# Download road damage footage (search for "pothole india road dashcam")
# IMPORTANT: Use only for SIH academic demo — not for redistribution
yt-dlp --format "bestvideo[height<=720]+bestaudio/best[height<=720]" \
  -o "assets/demo_samples/raw_road_footage.mp4" \
  "https://www.youtube.com/watch?v=REPLACE_WITH_ACTUAL_VIDEO_ID"

# Trim to 15 seconds using ffmpeg
ffmpeg -i assets/demo_samples/raw_road_footage.mp4 \
  -ss 00:00:05 -t 00:00:15 -c:v libx264 -crf 23 -preset fast \
  assets/demo_samples/chennai_road.mp4
```

### Option B — Record with your phone

1. **Pothole video:** Walk/drive slowly past 2-3 potholes on a nearby road. 15 seconds max. Landscape mode. 720p or 1080p.
2. **Traffic video:** Stand at a busy intersection for 15 seconds. Ensure cars/buses/trucks are clearly visible.
3. **Plate video:** Walk past 3-4 parked vehicles showing their license plates clearly. Ensure plates are readable.

Transfer to your PC via USB/AirDrop/WhatsApp and rename:

```bash
# Rename your recorded files
mv ~/Downloads/pothole_clip.mp4 assets/demo_samples/chennai_road.mp4
mv ~/Downloads/traffic_clip.mp4 assets/demo_samples/bangalore_traffic.mp4
mv ~/Downloads/plate_clip.mp4 assets/demo_samples/delhi_plates.mp4
```

### Option C — Use ffmpeg to generate a test pattern (absolute last resort)

```bash
# Generates a 15-second synthetic test pattern (only if no real video available)
ffmpeg -f lavfi -i testsrc=duration=15:size=1280x720:rate=25 \
  -vf "drawtext=text='VIGILANCE DEMO — ROAD FEED':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=30" \
  -c:v libx264 -pix_fmt yuv420p \
  assets/demo_samples/chennai_road.mp4
```

### Verify your clips:

```bash
# Check all 3 clips exist and are valid
ffprobe assets/demo_samples/chennai_road.mp4 2>&1 | head -20
ffprobe assets/demo_samples/bangalore_traffic.mp4 2>&1 | head -20
ffprobe assets/demo_samples/delhi_plates.mp4 2>&1 | head -20

# Each should show:
#   Duration: ~00:00:15
#   Video: h264, 720p or 1080p
#   File size: < 20 MB each
```

---

## 🚀 STEP 2 — Prepare Printable Test Cards

These are crisp, high-resolution images that you **print on paper** and hold in front of the phone camera during the live demo. The AI will detect them in real-time.

### Pothole Test Card

```bash
# Download a high-res pothole image (public domain)
# Search Google Images for: "pothole close up india road" (filter: Creative Commons)
# Save as: assets/test_cards/pothole_card_01.jpg

# Ensure it's at least 1200x800 pixels for print quality
# If needed, resize:
ffmpeg -i assets/test_cards/pothole_card_01.jpg \
  -vf scale=1200:-1 assets/test_cards/pothole_card_01_print.jpg
```

### License Plate Test Cards

Create 2 realistic Indian license plate images. You can:

**Option A — Photograph real plates** (blurred or with permission):
- Take a photo of any parked car's license plate
- Save as `plate_card_MH12AB1234.jpg` and `plate_card_TN07CK4523.jpg`

**Option B — Generate plate images programmatically:**

Create a file `assets/generate_plate_card.py`:

```python
"""Generate printable Indian license plate test cards."""
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont


def create_plate_card(plate_text: str, filename: str):
    """Create a realistic Indian license plate image for printing."""
    # Plate dimensions (approx 2:1 ratio)
    width, height = 800, 200
    img = Image.new("RGB", (width, height), "#FFFFFF")
    draw = ImageDraw.Draw(img)

    # Black border
    draw.rectangle([0, 0, width - 1, height - 1], outline="#000000", width=6)

    # Blue strip (state indicator)
    draw.rectangle([5, 5, 80, height - 6], fill="#003DA5")
    draw.text((15, 50), "IND", fill="white")

    # Plate text
    try:
        font = ImageFont.truetype("arial.ttf", 72)
    except IOError:
        font = ImageFont.load_default()

    # Center the text
    text_bbox = draw.textbbox((0, 0), plate_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2 + 30
    y = (height - text_height) // 2
    draw.text((x, y), plate_text, fill="#000000", font=font)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, quality=95)
    print(f"✓ Created plate card: {filename}")


if __name__ == "__main__":
    create_plate_card("MH 12 AB 1234", "assets/test_cards/plate_card_MH12AB1234.jpg")
    create_plate_card("TN 07 CK 4523", "assets/test_cards/plate_card_TN07CK4523.jpg")
    create_plate_card("KA 01 MG 5678", "assets/test_cards/plate_card_KA01MG5678.jpg")
    print("\n✓ All plate cards generated. Print these on A4 paper for the demo.")
```

```bash
# Run the generator
cd assets
python generate_plate_card.py
```

### Print Instructions:
1. Print `pothole_card_01.jpg` on A4 paper (landscape, full-page, color)
2. Print all 3 plate cards on A4 paper (landscape, each plate centered)
3. Laminate if possible (looks more professional to judges)
4. Test: Hold each card in front of a phone camera to verify the AI detects it

---

## 🚀 STEP 3 — Create `DEMO_SCRIPT.md` (The 6-Minute Demo Runbook)

**File:** `DEMO_SCRIPT.md` (project root)

```markdown
# 🎬 VIGILANCE — Live Demo Script (6 Minutes)

> **Event:** Smart India Hackathon 2026 — SIH26124  
> **Client:** Bharat Electronics Limited (BEL)  
> **Team:** Team Vigilance  
> **Duration:** 6 minutes (strict)

---

## PRE-DEMO CHECKLIST (T-10 minutes)

- [ ] Laptop charged > 80%
- [ ] Phone charged > 80%
- [ ] Phone and laptop on SAME Wi-Fi network
- [ ] Backend running: `cd backend && uvicorn main:app --port 8000`
- [ ] Dashboard running: `cd dashboard-next && npm run dev`
- [ ] Video feeder ready: `cd edge && python stream_video.py --serve --no-window`
- [ ] Test cards (3 printouts) on the table
- [ ] Failsafe video loaded on phone/USB: `assets/failsafe_recording.mp4`
- [ ] Browser tabs pre-loaded:
  - Tab 1: http://localhost:3000 (Dashboard)
  - Tab 2: http://localhost:3000/capture (Mobile Dashcam)
  - Tab 3: http://localhost:8001 (Video Feed)
- [ ] Screen at 100% zoom, dark mode confirmed

---

## MINUTE 0:00–0:30 — THE HOOK

**Speaker: Sanjeev**

> "India has 63 lakh km of roads. Every year, 1.5 lakh people die in road
> accidents — 20% caused by poor road surface conditions. Municipal PWD
> departments get 50,000+ complaints a year but have NO way to prioritize
> which pothole to fix first."

*[Show slide: Problem Statement]*

> "VIGILANCE is a complete Edge-to-Cloud urban road intelligence platform
> that converts ANY phone into a road damage sensor, uses INT8-quantized
> AI to detect potholes at 28 milliseconds, and generates Priority Repair
> Orders that a Chief Engineer can print on Monday morning."

---

## MINUTE 0:30–2:00 — THE DASHBOARD (Live Demo)

**Speaker: Sanjeev**

*[Switch to Tab 1: Dashboard at localhost:3000]*

1. **Point out the Command Center aesthetic** — "This is our Smart City
   Mission Control. Real-time map with road damage clusters, color-coded
   by severity."

2. **Hover over a cluster on the map** — "Each cluster is spatially
   deduplicated using PostGIS ST_ClusterDBSCAN with a 15-meter radius.
   No duplicate reports."

3. **Click the city selector dropdown** — Switch from Chennai → Bangalore.
   "The system is multi-city ready. BEL can deploy this in any Indian city."
   Switch back to Chennai.

4. **Scroll to Edge AI Hardware Cockpit** — "Our INT8 model is just 3.2 MB.
   That's 72.6% smaller than the original. Inference takes 28.4 milliseconds.
   We save 99.8% bandwidth by sending 200-byte MQTT packets instead of
   streaming raw video."

---

## MINUTE 2:00–3:30 — MOBILE CAPTURE (Live Demo)

**Speaker: Teammate 1**

*[Open phone browser to localhost:3000/capture]*

1. **Show the phone screen to the judges** — "This is a standard PWA running
   in any mobile browser. No app store needed."

2. **Hold the pothole test card** in front of the phone camera.
   *[Detection box should appear with a chime sound]*

3. **Hold a license plate test card** — "ANPR also runs client-side
   using ONNX WebAssembly. The plate number is extracted instantly."

4. **Point at the laptop dashboard** — "See? The detection appeared on
   the map in real-time via WebSocket. That's edge-to-cloud in under
   200 milliseconds."

---

## MINUTE 3:30–4:30 — LIVE VIDEO FEED (Live Demo)

**Speaker: Teammate 2**

*[Switch to Tab 3: Video Feed at localhost:8001]*

1. "This is a real dashcam video from Chennai. Our three AI models are
   processing every frame: Red boxes are potholes, blue is vehicles,
   green is license plates."

2. **Point to the FPS counter** — "We're running at 20+ FPS on a standard
   laptop CPU. On a Raspberry Pi 4, we get 12 FPS with the INT8 model."

3. **Switch to the dashboard VideoCameraGrid** — "The same feed is
   embedded in the command center. A city engineer sees everything
   from one screen."

---

## MINUTE 4:30–5:30 — GOVERNMENT DELIVERABLE (Live Demo)

**Speaker: Sanjeev**

*[Open browser to: localhost:8000/api/reports/pwd-summary?format=pdf]*

1. "This is the Monday Morning Report. One click generates a PDF with
   damage breakdown by zone, contractor SLA compliance, and IRC-standard
   budget estimates."

2. **Scroll through the PDF** — "Zone 12 Alandur has 14 breached SLAs.
   Zone 9 Teynampet needs ₹4.2 lakh in pothole repairs. This goes
   directly to the Municipal Commissioner."

3. "We also export CSV for spreadsheet analysis."

---

## MINUTE 5:30–6:00 — CLOSE & SCALABILITY

**Speaker: Sanjeev**

> "To summarize: VIGILANCE runs on sub-₹3,000 hardware, works offline,
> supports multiple cities, and gives government officials the exact
> data they need to prioritize road repairs. We have 46 automated tests
> passing. The entire system is production-grade."

> "Questions?"

---

## JUDGE Q&A PREPARATION

| Expected Question | Prepared Answer |
|---|---|
| "What is your mAP?" | "39.89% mAP@50 on RDD2022 India (7,706 images), which is state-of-the-art for this dataset on YOLOv8n architecture." |
| "How is this different from just using Google Maps?" | "Google Maps doesn't detect road surface damage at sub-meter granularity or generate priority repair orders with budget estimates." |
| "Can this work without internet?" | "Yes. Edge inference runs offline via ONNX Runtime. Detections queue locally and sync when connectivity is restored." |
| "What about false positives?" | "We use PostGIS spatial clustering (DBSCAN, 15m radius) to deduplicate. Only clusters with ≥2 detections are promoted to work orders." |
| "How does BEL deploy this?" | "Docker Compose for the backend, Vercel for the dashboard, and a ₹2,800 Raspberry Pi 4B with camera module at each edge node." |
| "What database are you using?" | "PostgreSQL 17 with PostGIS 3.3, hosted on Supabase in Mumbai (ap-south-1). Spatial queries use ST_ClusterDBSCAN." |
| "Show me the model working on live video" | *Point to the video feed running on localhost:8001* |
| "What if the venue Wi-Fi fails?" | "We have a pre-recorded 90-second fail-safe video on USB." *Play assets/failsafe_recording.mp4* |
```

---

## 🚀 STEP 4 — Record the 90-Second Fail-Safe Video

This is your **absolute safety net**. If venue Wi-Fi fails or the backend crashes, play this video.

### Setup (using OBS Studio):

```bash
# Install OBS Studio if not present:
# Windows: winget install OBSProject.OBSStudio
# Mac: brew install --cask obs
# Linux: sudo apt install obs-studio
```

### Recording Steps:

1. **Start all services locally:**
   ```bash
   # Terminal 1: Backend
   cd vigilance-prototype/backend
   uvicorn main:app --reload --port 8000

   # Terminal 2: Dashboard
   cd vigilance-prototype/dashboard-next
   npm run dev

   # Terminal 3: Video feeder
   cd vigilance-prototype/edge
   python stream_video.py --video ../assets/demo_samples/chennai_road.mp4 --serve --no-window
   ```

2. **Open OBS Studio:**
   - Add "Window Capture" → Select the browser with dashboard at `localhost:3000`
   - Set output resolution: 1920×1080
   - Set output format: MP4, CRF 20
   - Set audio: none (or narration if desired)

3. **Record this exact 90-second sequence:**
   - **0–15s:** Show the main dashboard map with clusters
   - **15–30s:** Hover over clusters, show popup with RPI score
   - **30–40s:** Open city selector → switch to Bangalore → back to Chennai
   - **40–55s:** Scroll to Edge AI Hardware Cockpit, show all 4 metrics
   - **55–70s:** Switch to the video feed tab (localhost:8001) showing live AI
   - **70–85s:** Download the PWD PDF report (localhost:8000/api/reports/pwd-summary?format=pdf)
   - **85–90s:** Quick scroll through the PDF

4. **Save the recording:**
   ```bash
   # Move to assets
   mv ~/Videos/failsafe_recording.mp4 assets/failsafe_recording.mp4

   # Verify
   ffprobe assets/failsafe_recording.mp4 2>&1 | head -10
   # Should be ~90 seconds, 1080p, < 50 MB
   ```

5. **Copy to USB drive** — have it ready at the demo table.

---

## 🚀 STEP 5 — Slide Surgery on `SIH26_TEAM_VIGILANCE.pptx`

Open the existing [SIH26_TEAM_VIGILANCE.pptx](file:///d:/coding/hackethon%20project%20data/vigilance%20data%20sih/New%20folder/SIH26_TEAM_VIGILANCE.pptx) and update these specific slides:

### Slides to Update:

| Slide | What to Change |
|---|---|
| **Architecture Diagram** | Ensure it shows: Phone → ONNX Runtime (INT8) → MQTT → FastAPI → PostGIS → Next.js PWA |
| **AI Model Slide** | Update to real metrics: mAP@50=39.89%, Precision=54.3%, Recall=37.4%, RDD2022 India (7,706 images) |
| **Edge Hardware Slide** | Show: 3.2 MB INT8 ONNX, 28.4ms latency, 2.26× speedup, 99.8% bandwidth saved, ₹2,800 hardware cost |
| **Database Slide** | Update: PostgreSQL 17 + PostGIS 3.3, ST_ClusterDBSCAN (15m radius), OASIS MQTT v5 (paho-mqtt v2) |
| **Priority Formula Slide** | Show: RPI = 0.40S + 0.25D + 0.20R + 0.15P (IRC standard), FHWA CI = 1 − v/v_freeflow |
| **Testing Slide** | Show: 46 automated tests, 2.08s execution, 100% pass rate |
| **Scalability Slide** | Show multi-city: Chennai, Bangalore, Delhi with city_config.json |
| **Budget/Cost Slide** | Show IRC rates: D40 Pothole = ₹4,500/m², D20 Alligator = ₹2,800/m² |

### Key Design Rules for Slides:

- **Background:** Dark (`#090d16`) matching the dashboard
- **Accent color:** Cyan (`#22d3ee`) for headers, `#60a5fa` for links
- **Font:** Use Consolas or JetBrains Mono for code/metrics, Segoe UI for body
- **Every claim must have a number.** No "fast" — say "28.4ms". No "small" — say "3.2 MB".
- **Screenshot every working feature** and paste into slides as visual proof

### Take Screenshots:

```bash
# Use Snipping Tool (Windows) or Screenshot.app (Mac) to capture:
# 1. Dashboard main view with map clusters
# 2. Edge AI Hardware Cockpit widget
# 3. City selector dropdown showing all 3 cities
# 4. Live video feed with colored bounding boxes
# 5. PWD PDF report (first page)
# 6. Terminal showing "46 tests passing in 2.08s"
```

---

## ✅ Verification Checklist

```bash
# 1. Verify all demo video clips exist
ls -la assets/demo_samples/
# Should show: chennai_road.mp4, bangalore_traffic.mp4, delhi_plates.mp4

# 2. Verify test cards exist
ls -la assets/test_cards/
# Should show: pothole_card_01.jpg, plate_card_MH12AB1234.jpg, plate_card_TN07CK4523.jpg

# 3. Verify failsafe recording
ffprobe assets/failsafe_recording.mp4 2>&1 | grep Duration
# Should show: Duration: ~00:01:30

# 4. Verify DEMO_SCRIPT.md is readable
cat DEMO_SCRIPT.md | head -30

# 5. Open PPTX and verify all slides updated
# (Manual check — open in PowerPoint/Google Slides)

# 6. Full integration test — start everything:
# Terminal 1: cd backend && uvicorn main:app --port 8000
# Terminal 2: cd dashboard-next && npm run dev
# Terminal 3: cd edge && python stream_video.py --serve --no-window
# Open http://localhost:3000 and run through the entire demo script
```

---

## 🔗 Integration Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR DEPENDENCIES ON OTHER TRACKS                                   │
├──────────────────┬──────────────────────────────────────────────────┤
│  Sanjeev (T1)    │ Needs backend running for PDF report screenshot  │
│  Teammate 1 (T2) │ Needs dashboard running for all UI screenshots   │
│  Teammate 2 (T3) │ Needs video feeder running for live feed demo    │
│                  │ Also provides YOUR demo clips for stream_video   │
└──────────────────┴──────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Start with Steps 1-2 (video clips + test cards) FIRST** because Teammate 2 is waiting for your `assets/demo_samples/chennai_road.mp4` to test their video feeder. Get them the clips within the first hour.

> [!WARNING]
> **The fail-safe video (Step 4) should be recorded LAST** — after all other tracks are integrated and working. Schedule this for the final hour of prep.
