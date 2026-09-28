# VIGILANCE — Demo and recovery runbook

This is a proposed rehearsal guide. Follow the gates below before claiming an integrated live demo; the audited build does not yet pass them. No official SIH presentation duration has been established.

## Five-minute core and two-minute cut

**Format assumption:** five minutes, plus separately allotted questions. The repository’s “strict six minutes” is an internal runbook claim, not a verified SIH timing rule. Confirm the actual round slot. Rehearse a two-minute cut and a five-minute core; add a technical minute only if allowed.

**Release gate:** the sequence below is the target after the Must Fix items. It is not a claim that today’s build supports every step. Existing labels are quoted exactly; proposed additions are marked **NEW**. The source frame/observation receipt/evidence drawer and stable identity demonstration require implementation and acceptance before inclusion.

| Time | Click / screen | Judge should see | Suggested words | Technical proof and problem solved | Gate |
|---|---|---|---|---|---|
| 0:00–0:30 | One problem slide, then Command Center | One road scene and operator decision, no statistics wall | “Buses repeatedly travel the same roads. We want those journeys to produce reviewable evidence of road problems, so an engineer can decide what to inspect first.” | Defines beneficiary, input and decision | State no unverified national savings/fatalities |
| 0:30–1:00 | Show city and source; select a prepared issue (**NEW evidence drawer**) | Actual source frame, time, vehicle pseudonym and model version | “This is a recorded input processed by the running software. We label replay separately from live capture.” Or say live only if it is live. | Provenance and honesty | Source/health state fixed; prepared fixture authorized |
| 1:00–1:30 | “Mobile Dashcam” → “Upload Photo”, choose a validated road image; or rehearsed “Enable Smartphone Camera” | Real inference result and **NEW server acknowledgment receipt** | “The model proposes a defect. The server acknowledges this observation; that ID is now available to review.” | Actual model→API→DB, without pretending fixture coordinates are GPS | Device/sample validated; correct auth; no simulation fallback |
| 1:30–2:00 | Return “Command Center”; select the new observation/issue | Same event ID, correct map position, raw observation separated from repair issue | “Multiple sightings need not create multiple repair jobs. We retain evidence while grouping observations of the same issue.” | Persistence and spatial aggregation | Stream/poll path tested; stable identity repaired |
| 2:00–2:30 | **NEW “Evidence” list**: show repeated observations and a nearby distinct defect | Known fixture groups; the nearby defect remains separate | “Here are repeated sightings of one defect; this nearby defect remains independent. This counterexample guards against unsafe merging.” | Dedup quality, not just an animation | Regression including the 20 m status case passes |
| 2:30–3:00 | “RPI Formula” or **NEW “Why this priority?”** | Actual factor values and policy version | “This transparent prioritization policy combines severity, observation density, road importance and nearby facilities. It is a heuristic for review, not a validated accident prediction.” | Explainability and decision support | Values derive from selected issue; assumptions labelled |
| 3:00–3:30 | “Work Orders” → select “ASSIGNED”; refresh once | Acknowledged, persisted status; **NEW decision history** if implemented | “The operator records the decision. Today this demonstrates status tracking; it is not a message to a real contractor.” | Workflow persistence and human control | No accidental production dispatch; correct actor/history claim |
| 3:30–4:00 | “Export PWD Dispatch (CSV)” for client list, or preopened corrected municipal PDF | Correct city/time scope, distinct repair population, assumptions | “This report reconciles to the reviewed issues. Estimated cost uses stated rates and area assumptions; it is not a procurement sanction.” | Actionable, traceable output | Distinguish client CSV from backend PDF; semantic fixtures pass |
| 4:00–4:30 | Evidence slide with actual results only | Device benchmark, evaluated cases and operator task results; unknowns explicit | “These are the conditions we measured. Wet/night performance, broader infrastructure classes and fleet deployment remain separate validation work.” | Scientific/operational discipline | No invented pilot metrics; use verification results if pilot unavailable |
| 4:30–5:00 | Architecture/capability and next-step slide | Supported path, missing PS obligations, next pilot gate | “The next step is an agreed route pilot with reviewed labels, cost and reliability measurements. We will expand coverage only after those checks.” | Feasible progression and scope awareness | No claim of complete PS/Plan 3 or national readiness |

The same-time live capture and printed-card spectacle should be dropped if it remains unreliable. A clearly labelled prerecorded input processed by the actual model is a legitimate software demonstration; a drawn animation pretending to be the app is not.

### Honest five-minute fallback with the current audited build

If no fixes are made, do **not** execute the target script unchanged. Describe a research prototype. Show the labelled dashboard UI, then the verified local HTTP persistence/RPI/status path with prepared fixtures and clearly identify the manual/API input. Show the actual model execution separately and disclose the prepared card miss. Do not claim camera-to-map, offline queue, secure deployment, automated contractor dispatch, valid municipal budgets or all-PS completion. Present reproduced failures and the repair plan. This is defensible, but it is a weaker competition entry than a repaired end-to-end demonstration.

### Two-minute cut

0:00–0:20 problem/beneficiary; 0:20–0:55 one traceable observation and source; 0:55–1:25 repeated-sighting grouping and explainable priority; 1:25–1:45 acknowledged human status; 1:45–2:00 actual measurement plus explicit limitations. Skip analytics tours, 3D, city-switch spectacle and provider integrations. If the event gives more time, use it for a counterexample and recovery proof, not more decorative screens.

### Canonical presentation structure

Follow the organizer’s required template/slide limit when supplied. Within it, allocate content in this order: problem/operator; actual capability boundary; short input→decision demo; evidence/technical tradeoffs; measured results and limitations; pilot/cost/next step. Keep detailed formula/model/dependency/security/data-study material in an appendix. One principal speaker narrates; one operates; technical owners answer their areas without interrupting. Avoid a handoff for every screen.

Replace “zero infrastructure” with “uses existing journeys”; “verified dispatch” with the exact recorded action; “state-of-the-art accuracy” with the evaluated metric/split; “real time” with measured latency conditions; and “all cities ready” with the actual isolated cities and tested workload. Never memorize an answer claiming a fix that has not been verified.

## Failure and backup procedure

This is a **proposed operating procedure**. The repository does not yet provide every fallback. The current synthetic failsafe must be replaced before it can serve as proof of execution.

Use three clearly labelled levels: **A: live input through the verified system**; **B: recorded input replayed through the same verified local pipeline**; **C: an actual recording of a successful session**, visibly dated and tied to a build. A fourth static UI/sample walkthrough can explain design, but it is not equivalent evidence. Move down a level explicitly; never silently fill live screens with sample data.

| Failure | Current vulnerability | Professional response and exact disclosure | Preparation / gate |
|---|---|---|---|
| Slow internet | Cold backend and external assets; ambiguous seed fallback | One bounded retry; show last-success age. “The service is slow; we’ll use the local replay instance.” | Measure readiness; cache approved assets/models; rehearse local path |
| API down | Capture mutations may disappear or UI switches to seed | Stop claiming accepted events. “These observations have not been acknowledged.” | Durable outbox after implementation; otherwise pause capture and switch to isolated local profile |
| Database down | Silent SQLite fallback can change truth | Mark service not ready; disable mutations. “Persistence is unavailable; this is the separate replay database.” | Explicit profile and dataset IDs; never silent database replacement |
| External government API fails | Stub/static fallback can masquerade as integration | “External lookup unavailable”; continue core road workflow | Optional adapters with timeout/config status; no sample RC data presented as real |
| Auth expires/fails | 401 swallowed or retries without clear action | “Session expired”; sign in privately or use preverified local test identity | Rehearse expiration; no credentials on projector; no bypassing auth to save demo |
| Model/camera fails | Synthetic fallback, permission denial or card miss | “Camera/model unavailable on this device; this next input is recorded.” | Validated replay path and known samples, with negative sample retained |
| Browser refresh | Local memory/Next store state may disappear | Restore last acknowledged state; label unsent draft truthfully | Restart/refresh acceptance; persistent DB/outbox where claimed |
| Laptop changes | Dependencies/assets/auth/config not reproducible | Switch to rehearsed spare machine or real recording | Second-machine clean start; local model hashes, locked packages and protected config |
| Deployment URL fails | Separate mirror/revision and tunnel dependence | “We’re switching from hosted to the verified local build.” | Release manifest ties source/mirror/build; preopened local tabs |
| Map tiles unavailable | External basemap missing despite app cache | Keep issue list/evidence operational; say basemap unavailable | Authorized offline basemap only if prepared; preserve attribution; test air-gapped list workflow |
| Duplicate submission/reconnect | No stable event identity/outbox | Stop automatic replay if it can create duplicates | Event UUID/unique constraint and acknowledgment regression before enabling retry |
| One non-core feature fails | Presenter can lose time debugging | State limitation once; return to the core issue/evidence/action story | Operator knows a safe exit; avoid non-core features until validated |
| Local build also fails | Current animation is not proof | “This is a recording of build [hash] from [date], not a live session.” | Actual recorded successful demo and offline player checked on both laptops |

**Proposed preflight:** day before, freeze exact build/model/data versions and finish regressions; two hours before, run production build/start and actual-device camera/location/model checks; 15 minutes before, verify source labels, correct dataset/city, acknowledgment, export and backup playback. Five minutes before, close debug/secret tabs and notifications, check projector readability and battery/power. These are preparation intervals, not SIH rules.

**Stop conditions:** do not present a live integrated claim if secrets remain exposed, data changes corrupt status, test events cannot be acknowledged, the report cannot reconcile, or output cannot be distinguished from simulation. Reduce scope and disclose; never disable controls or invent a success message.

**Runbook acceptance:** repeat the core path twice from a clean start, once after refresh, once with internet disconnected, and once on the spare machine. Record actual times/failures and fix them. This is a proposed minimum rehearsal exercise, not a claim that these successful runs have occurred.