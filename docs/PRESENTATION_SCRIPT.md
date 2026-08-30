# TEAM VIGILANCE — Presentation Script
### SIH26124: AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet
**Target time: ~6–7 minutes pitch + Q&A**

> Delivery tip: don't read this word-for-word on stage. Read it aloud 3–4 times until the *ideas* stick, not the sentences. Judges can tell memorized scripts apart from understood ideas — understood ideas survive interruptions and follow-up questions; memorized ones fall apart.

---

## SLIDE 1 — Title (20 seconds)

"Good [morning/afternoon] judges. We are Team Vigilance, presenting our solution for Problem Statement SIH26124 — an AI-powered mobile urban intelligence platform using public transport fleets, proposed under Bharat Electronics Limited.

In one line: **we turn the buses and municipal vehicles already driving through every city, every day, into a live road-inspection network.**"

*(Pause. Let that line land — it's your hook. Move to Slide 2.)*

---

## SLIDE 2 — Idea Title / Proposed Solution (60–75 seconds)

"Here's the problem in plain terms: potholes, cracks, and damaged manholes are usually reported *after* someone gets hurt — a complaint, a news story, a viral photo. Municipal bodies have no continuous, low-cost way to know the real-time condition of their roads.

Our solution, **Vigilance**, is an Edge-AI powered real-time road anomaly detection and spatial repair prioritization system. Here's how it works, in five steps:

1. Cameras already mounted on municipal vehicles — buses, garbage trucks, patrol vans — detect potholes, cracks, ravelling, and damaged manholes using Edge-AI, **as the vehicle drives its normal route**. No special inspection trips needed.
2. Each defect gets smart-geotagged — GPS location, defect type, and severity — building a live road-condition map.
3. Because multiple vehicles pass the same road, we use spatial clustering to merge repeated detections into a single verified issue — so the same pothole doesn't get reported five times.
4. We rank every defect using our **Repair Prioritization Index — RPI** — based on severity, traffic importance, and proximity to critical locations like hospitals or schools.
5. And the whole thing works offline-first and low-cost, so it holds up even in low-connectivity areas.

The core innovation isn't a new sensor — it's that **we don't need new infrastructure**. We convert vehicles the city already owns into a continuous, self-funding inspection system."

---

## SLIDE 3 — Technical Approach (75–90 seconds)

"Let me walk you through the pipeline end to end — this is a 9-step flow, but it moves fast once you see it.

**Capture to detection:** A camera-equipped municipal vehicle streams footage. We run **YOLOv8-Nano** — a lightweight, edge-optimized object detection model — locally, on-device, using ONNX Runtime, so it detects and classifies road anomalies in real time without needing constant cloud access. It estimates both the type and severity of the defect.

**Geotagging to transmission:** Each detection is stamped with GPS and timestamp, then transmitted via **MQTT** — a lightweight IoT messaging protocol built exactly for low-bandwidth, unreliable-connectivity situations.

**Storage to action:** Data lands in **PostgreSQL with PostGIS** — a spatial database — where we run **DBSCAN clustering** to eliminate duplicate reports from different vehicles seeing the same pothole. The RPI engine then ranks everything, and it all surfaces on a **live GIS dashboard** that municipal authorities can actually act on.

On the stack side — we're using Python, PyTorch and OpenCV for the AI layer, FastAPI and WebSockets for the backend, React or Flutter for the interface, and SQLite for offline caching on the vehicle itself.

Four things I want to underline, because they answer questions before you ask them: local inference means we're not dependent on constant internet; spatial clustering means one pothole is one entry, not fifty; RPI means authorities aren't guessing what to fix first; and offline caching means we don't lose data in dead zones."

---

## SLIDE 4 — Feasibility and Viability (50–60 seconds)

"Is this actually buildable, and is it going to survive contact with the real world? Two honest answers.

**Feasibility:** every component we're using is off-the-shelf and proven — commodity cameras or smartphones, lightweight edge-AI models that run on modest hardware, PostGIS for geospatial tracking, and offline caching for connectivity gaps. We're not inventing new hardware; we're integrating existing, mature technology in a new configuration. And because we reuse vehicles the city already operates, deployment and inspection costs stay low.

**Challenges, and how we handle them** — and I want to be upfront about these rather than pretend they don't exist:
- Camera vibration on a moving vehicle — we solve this with accelerometer-based frame gating, so we only process stable frames.
- Poor lighting, rain, night conditions — solved through night and wet-road data augmentation during training.
- Limited connectivity — solved by the SQLite offline caching and MQTT sync I mentioned.
- Duplicate reports from multiple vehicles — solved by DBSCAN clustering.
- Accuracy across varied road conditions — solved through continuous dataset expansion and periodic model validation, not a one-time training run.

The bottom line: the system is feasible with current technology, scalable to more vehicles and more cities without redesign, low-cost because it reuses existing assets, and offline-ready for exactly the kind of Indian road and connectivity conditions this needs to survive in."

---

## SLIDE 5 — Impact and Benefits (50–60 seconds)

"Why does this matter beyond the technology?

**Socially** — safer roads, especially for two-wheeler riders who are disproportionately affected by potholes; faster government response because authorities get precise location and severity data instead of relying on manual complaints; and better public infrastructure overall through continuous, not one-time, monitoring.

**Economically and environmentally** — lower inspection costs since we're not deploying dedicated survey vehicles; prioritized repairs so limited maintenance budgets go to the most critical defects first, not the loudest complaints; and preventive maintenance — catching small cracks early is dramatically cheaper than large-scale road repair later, which also means less material waste and disruption.

So this isn't just a detection tool — it's a resource-allocation tool for cities that are always working with constrained maintenance budgets."

---

## SLIDE 6 — Research & References (20–30 seconds)

"Our approach is grounded in existing, credible work — not built in isolation. We reference the RDD2022 road-damage dataset for training data, Ultralytics YOLO documentation for our detection and edge-deployment workflow, and PostgreSQL/PostGIS and OGC API standards for the spatial and interoperability layer. Our design basis is straightforward: **Edge-AI plus fleet aggregation plus GIS analytics plus secure incident handling equals an end-to-end urban intelligence workflow.**"

---

## CLOSING (15–20 seconds)

"To summarize in one sentence: Team Vigilance turns every municipal vehicle already on the road into a continuous, low-cost road-inspection sensor — detecting problems before they become accidents, and helping cities fix the right roads first.

We're happy to take any questions."
