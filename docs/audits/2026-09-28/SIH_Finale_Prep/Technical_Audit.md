# VIGILANCE — End-to-end audit

**Verdict: do not approve the current build for production or present its full six-minute script as a verified live demonstration.** There is a useful working prototype underneath the presentation layer, but serious data-integrity, security, integration and reporting defects remain. A narrower, explicitly labelled demo can be made credible without rewriting the project.

Audited on **28 September 2026**, against `SanjeevAryanUni/Vigilance` main commit **ae9ec7ba678feb4db366a1058fa55509761fb9e9**. Source links below are pinned to that commit. The published [Vercel application](https://vigilance-sih.vercel.app/) was inspected, and the pinned source was built and run locally. The live deployment’s exact commit could not be independently established; local reproductions are therefore identified separately. GitHub’s signed-in side-browser session shows that the account owns the repository; that session is the account context for further GitHub operations in this chat. No GitHub writes or production-data mutations were performed.

**Four-plan sign-off is blocked by missing evidence:** Plans 1, 2 and 4 were found and audited. Plan 3 was absent from available branch/history file inventories and was not supplied separately. Its implementation cannot be graded against an invented specification. The video/edge code was still audited as functionality.

Read the [complete 89-row requirement matrix](SIH_Requirement_Matrix.md) alongside this report. It maps every enumerated requirement to current behavior, status, evidence, gap and fix. Machine-readable counts and sanitized local reproductions are in `evidence/`.

## 1. Product and architecture understood

The product aims to turn public-transit and municipal vehicles into recurring road-survey devices. Drivers or field operators provide camera/GPS observations; municipal dispatchers inspect defects and prioritize repairs; contractors receive assignments; engineers export maintenance summaries. Traffic/ANPR, congestion, origin–destination and route-delay views extend the road-repair workflow.

The intended chain is **capture → actual inference → authenticated ingestion → durable observation → spatial deduplication → priority calculation → review/assignment → repair verification → correctly scoped report**. The present implementation covers some middle steps reliably in a local, single-process setup, but does not complete every link.

| Layer | Current implementation | Assessment |
|---|---|---|
| Web application | Next.js 14 App Router, React, TypeScript, Tailwind; five pages; MapLibre; PWA configuration; several chart/animation libraries | Adequate technology. No rewrite needed. Shared visual vocabulary exists, but data provenance and layout are weak. |
| Browser perception | `/capture`, ONNX/WASM integration, traffic/OCR paths, camera/GPS, manual/synthetic controls | Actual model artifacts exist. Camera/hardware performance is not verified; auth omissions break two telemetry paths. |
| Python edge | ONNX road detector, traffic detector, ANPR adapter, MP4/MJPEG processor, telemetry simulators | Road model executes on this host. The video processor does not ingest its results into the road database. Some fallback paths fabricate output. |
| Main backend | FastAPI, Pydantic, SQLAlchemy, in-process WebSocket manager, optional Celery/Redis | Valid local HTTP ingestion and status update exist. WebSocket raises NameError; repeated full-history clustering and global city state are unsafe. |
| Data | PostgreSQL/PostGIS configuration with SQLite fallback; five ORM tables | Useful observation schema, incomplete operational workflow/history and tenancy. Silent fallback can conceal loss of the intended data store. |
| Parallel backend | Next API routes and process-global `serverStore` | Duplicates Python state and clustering with different behavior. Serverless/global-memory lifetime cannot provide durable municipal records. |
| External integrations | Map tile providers; API Setu client stub; static MoRTH statistics; model metadata | External service names do not prove live integration. API Setu production approval and official model training are unverified. |

The architecture should converge on FastAPI/SQLAlchemy as the one durable application backend. Next route handlers may remain as a thin same-origin proxy. Keep SQLite for an explicit demo/test profile and PostGIS for the intended deployed profile. Do not add microservices, Kafka, another frontend framework or a new GIS engine to fix these defects.

## 2. What was actually verified

### Evidence ledger

| Evidence ID | Verification | Result and limit |
|---|---|---|
| E01 | Clean frontend dependency install and production build | **PASS.** Next.js 14.2.35 compilation, type checking and page generation succeeded. First-load JS: dashboard 187 kB, analytics 290 kB, capture 116 kB, fleet 179 kB, work-orders 175 kB. Build success is not a functional sign-off. |
| E02 | Full Python collection: `pytest tests/ vigilance-prototype/backend/ -q --tb=short` | **61 passed, 1 failed, 121 warnings, 6.50 s.** The legacy detection-flow test expects success without the now-required API key. Installed backend+dev requirements in an isolated environment; this differs from broken CI’s root-only dependency install. |
| E02b | Latest main GitHub CI | [Run 36385380223](https://github.com/SanjeevAryanUni/Vigilance/actions/runs/36385380223) fails importing `slowapi`. Root requirements omit it, while backend requirements include it. |
| E03 | Running UI, source and responsive layouts | Live desktop 1440×900; local laptop 1366×768, tablet 768×1024 and mobile 390×844. All five pages inspected across the session. This is desktop viewport emulation, not a physical handset certification. |
| E04 | Model metadata and real inference smoke | Shipped road INT8/FP32 models have static input 1×3×640×640 and four RDD classes. INT8 executed via ONNX Runtime. No dataset-wide accuracy evaluation was run. |
| E05 | Video/image metadata and sampled frames | Three clips decoded; test cards measured; failsafe sampled. Root clips use FMP4, not H.264. Failsafe is 90 seconds, 720p and programmatically drawn. |
| E06 | Presentation contents | Both decks’ OOXML text and media inventory read. Root deck 9 slides; README canonical deck 7 slides. Entire slide layout was not rendered, so slide visual conformance remains UNVERIFIED. |
| E07 | Static code scan | With the selected audit rules, Ruff emitted 402 findings, including 64 unused imports, 35 broad catches and 3 undefined-name reports representing 2 defects (`API_KEY` twice, `os` once). These are triage indicators, not 402 independently confirmed bugs. |
| E08 | Dependency advisory check | `npm audit` reports 7 vulnerable package entries: 1 critical, 2 high, 4 moderate. These are registry classifications, not proof that every advisory is exploitable here. No exploit attempted. |

### Local reproductions

Tests used local SQLite only. The focused TestClient harness overrides its database session, disables the rate limiter and stubs Celery enqueue to isolate application logic. It does **not** validate a real broker, multiple workers, hosted PostGIS or production credentials. A separate browser session used the running local API/database for the successful order update and city mismatch.

| ID | Action | Observed result |
|---|---|---|
| R01 | Connect `/ws?token=audit-local-key` | `NameError: name 'API_KEY' is not defined`. |
| R02 | POST one valid D40 detection | Missing key→401; valid local key→201; one cluster with RPI 54.8 and a contractor is stored and returned. Single-point promotion contradicts the min 2 documentation. |
| R03 | POST `defect_type=NOT_A_DEFECT`, `severity=banana` | Accepted 201; appears in report and is costed using fallback pothole rate. |
| R04 | Ingest Chennai observations, then switch to Bangalore | Bangalore-labelled report contains Chennai records; `/api/fleet/positions?city=bangalore` returns Chennai vehicle when the filtered set is empty. |
| R05 | Change the test observations to 60 days old | Both remain in the report despite its “Last 30 days” label. |
| R06 | GET report with `format=xml` | Returns 200 JSON; OpenAPI `enum` metadata does not enforce the allowed values. |
| R07 | Generate/download PDF and CSV | PDF 200, 3,124 bytes in the two-row fixture; rendered and legible. CSV puts 0.9 under “Confidence %”; Zone blank. Report contents remain misleading despite file-generation success. |
| R08 | Two position updates for the same vehicle | HTTP helper leaves one position row; OD endpoint then has no trajectory and returns a seeded 226-trip matrix. |
| R09 | Two distinct defects 20.015 m apart; resolve the first; rerun dedup | Statuses change from `[resolved,open]` to `[resolved,resolved]`. The second defect is incorrectly closed. |
| R10 | Run real INT8 model on provided pothole card | Zero boxes at 0.45 and 0.25 confidence thresholds; one host inference roughly 30 ms. This is a negative demo-card smoke test, **not** an accuracy benchmark or a Pi/phone latency measurement. ANPR unavailable in the declared minimal backend profile. |
| R11 | Browser changes a real local work order to ASSIGNED | Database/API confirms assigned; UI renders “Invalid Date” because clusters omit `created_at`. Header still says DEMO DATA on this page. Basic persistence works; provenance/timestamp rendering does not. |
| R12 | Browser switches city to Bangalore then opens dashboard | API active city is Bangalore; UI selector says Bangalore; map caption and POIs remain Chennai. |
| R13 | One isolated telemetry-publisher iteration with a deterministic detector stub | Catches undefined `os`, prints “server offline…Buffering telemetry packet”, sends nothing and has no actual buffer. |

Sanitized results: [API/model reproductions](evidence/reproduction.json), [dedup/publisher/card reproductions](evidence/additional-reproduction.json), [media measurements](evidence/media-summary.json), [dependency audit](evidence/npm-audit.json).

**Not verified:** physical camera/GPS/haptics, printed/laminated cards or USB readiness, target ARM/Android throughput, real training metrics, real API Setu approval/response, cloud PostgreSQL version/region, multi-worker concurrency under load, full external tile availability, PWA installation on physical devices, and the exact live deployment revision. No assurance is implied for those areas.

## 3. Requirement coverage and plan contradictions

| Plan | Requirements | Full | Partial | Missing | Incorrect | Unverified | Strict coverage |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plan 1 | 34 | 22 | 3 | 1 | 6 | 2 | 64.7% |
| Plan 2 | 25 | 15 | 5 | 2 | 2 | 1 | 60.0% |
| Plan 3 | Unknown | — | — | — | — | — | N/A — specification absent |
| Plan 4 | 30 | 8 | 10 | 0 | 5 | 7 | 26.7% |


The calculation is **Full / total enumerated requirements**. No partial credit is hidden in the percentage. Missing Plan 3 is excluded from any denominator, and there is deliberately no overall four-plan percentage. Plan 1 gets credit for its implemented lookup/report scaffolding; that does not offset the severity of wrong report population. Plan 2 gets credit for prescribed simulation and styling even when those choices hurt product quality.

The plans themselves need decisions before implementation resumes:

| Contradiction or ambiguity | Why it matters | Required decision |
|---|---|---|
| Plan 1 report says 30 days but sample fetches latest 500 unrestricted records | Copying the sample creates a false time period | Authoritative filter must be an explicit date interval; show export limits separately. |
| Plan 1 CSV promises Confidence % but example copies 0–1 confidence | Literal implementation violates column semantics | Use 0–100 or rename field. |
| “Full city configuration” docstring returns only counts | Frontend needs actual GIS collections | Define a real response contract; do not infer it from a function name. |
| Zone breakdown prose has no implementation in the sample | Following sample alone omits a promised output | Implement boundaries/assignment or remove the promise explicitly. |
| Global active city in sample vs multi-city application | One user’s selection affects other requests/process behavior | Make city request-scoped and persisted on observations. |
| Fleet latest-position upsert vs OD logic using the same rows as history | Fixing growth removes trajectories | Store latest position separately from bounded historical observations. |
| min_samples=2 in metrics/Q&A vs min_samples=1 in code/tests | A single false observation becomes a work order | Choose a promotion policy; do not merely edit one label. |
| Plan 2 explicitly requests random accelerometer/static benchmarks | Random values are compliant with demo instructions, but are not sensor readings | Keep only behind a visible Simulation mode. |
| Plan 2 preloader says it initializes audio but returns null | Copied helper cannot fulfill its comment | Add user-gesture initialization or remove the claim. |
| Plan 4 allows synthetic clips as last resort but requires an actual failsafe recording | Generated illustrations cannot validate an operational fallback | Separate test patterns, illustrated pitch media and genuine app recordings. |
| Fixed tests/latencies in plans vs evolving code | Numerical precision gives false confidence | Publish dated generated evidence tied to model and commit. |
| Hardware changes among Pi4+camera₹2800, PiZero2W, Rockchip BOM and reused phone | Cost/latency comparison has no stable target | Choose one reference build and distinguish alternatives/projections. |
| IRC:82, IRC SP:20, generic “IRC rates”; “state-of-the-art” and sovereign-training claims | Neither wording nor precision establishes external validation | Treat as project assumptions until exact authoritative sources/results are supplied. |

## 4. Prioritized issue register

Severity reflects consequence, not number of lines to change. Complexity is Low/Medium/High. “Critical” includes a broken central workflow as requested; it is not a CVSS score.

### 🔴 Critical

| ID | Issue and evidence | Why it matters / affected feature | Smallest appropriate fix | Complexity |
|---|---|---|---|---|
| I01 | Credential-bearing Supabase PostgreSQL URL committed in [start_full_demo.sh:14](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/start_full_demo.sh#L14) and [start_full_demo.bat:14](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/start_full_demo.bat#L14). Secret deliberately omitted here; validity not tested. | Public credential exposure; database access could be compromised. Repository/security. | Rotate/revoke credential first; remove from launchers, read environment/secret store, review access logs and remediate history/copies. Merely deleting current lines is insufficient. | Low code; Medium remediation |
| I02 | Dedup deletes all clusters and copies status from the **first** historical centroid within 25 m; R09 closes a distinct 20 m-away open defect. [dbscan_dedup.py:105](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/dbscan_dedup.py#L105), [dbscan_dedup.py:148](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/dbscan_dedup.py#L148). | Can suppress a real unresolved hazard and corrupt work-order identity/status. Core repairs/DB. | Preserve stable cluster IDs; match membership/nearest eligible one-to-one identity inside a transaction; never transfer resolved state solely by broad proximity. Add the 20 m regression test before refactoring. | High |
| I03 | City switch changes process-global variable; reports do not filter city, frontend does not pass city or update GIS, fleet fallback returns other-city data. R04/R12. [poi_data.py:22](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/poi_data.py#L22), [main.py:788](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L788), [CitySelector.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/CitySelector.tsx), [Header.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/Header.tsx). | Wrong municipality’s observations and assignments appear together. Plan 1/2 multi-city. | Add city_id to observations/queries, explicit per-request city, shared UI selection and scoped exports. Remove cross-city empty fallback. | High |
| I04 | Municipal report labels 30 days but includes older data, budgets raw passes as distinct repairs, calculates SLA without assignment/resolution history, has blank zones and false methodology. R04–R07. [pdf_report.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/pdf_report.py), [main.py:788](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L788). | A plausible PDF can lead to wrong budget and SLA decisions. Plan 1/4 government deliverable. | Define report population as unique repair scopes with explicit city/date/status; store assignment/due/resolution times; show assumptions and versioned rates. | Medium–High |
| I05 | Shared/default API key shipped in public browser code; Next ingestion/dedup routes have no equivalent authorization; MQTT permits anonymous writes. [api.ts:19](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/lib/api.ts#L19), [route.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/api/detections/route.ts), [route.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/api/trigger-dedup/route.ts), [mosquitto.conf](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/mosquitto.conf). | Anyone obtaining public/default configuration can submit or alter observations; no user/role/city boundary. Security/all ingestion. | Server-side authenticated sessions for operators; per-device credentials/scopes for ingestion; one authorized backend; broker TLS/ACLs and private network bindings. | High |
| I06 | `/ws` refers to undefined `API_KEY`; R01 confirms immediate failure. Guard would also accept an absent token if only the undefined name were repaired. [main.py:508](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L508). | Claimed live WebSocket chain does not work. Dashboard/live demo. | Use the same explicit auth configuration as HTTP; reject missing/invalid token; add real connection/broadcast/disconnect tests. | Low |

### 🟠 High

| ID | Issue and evidence | Why it matters / affected feature | Recommended fix | Complexity |
|---|---|---|---|---|
| I07 | CI/root quickstart misses slowapi; full suite retains auth-incompatible test; optional edge dependencies absent in backend image/profile. [requirements.txt](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/requirements.txt), [requirements.txt](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/requirements.txt), [ci.yml](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/.github/workflows/ci.yml), [test_api.py:64](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/test_api.py#L64), [Dockerfile](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/Dockerfile). | Fresh clone and deploy do not reproduce local audit success. All plans/demo. | One documented set of backend/base, edge and dev extras; install correct profile in CI/image; fix legacy test expectations; check clean install. | Medium |
| I08 | Capture traffic/incidents helpers omit auth headers; capture sends reporter as `vehicle_id` instead of `reporter_vehicle_id`; result failures are ignored. [api.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/lib/api.ts), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/capture/page.tsx). | Counts/ANPR can appear in capture without durable backend records. Traffic/incident flows. | Shared authenticated mutation client; typed request/response DTOs; surface 401/error; send correct fields and speed. | Low–Medium |
| I09 | Production reports/cities rewrite to localhost:8000; two different public backend env names plus localStorage override; checked-in temporary tunnel URL. [next.config.mjs](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/next.config.mjs), [.env.production](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/.env.production), [api.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/lib/api.ts), [CitySelector.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/CitySelector.tsx). | Features target different servers or the deployment container itself. Exports/city/inference. | One environment resolver and same-origin proxy with server-only upstream URL; validate configuration at startup. | Medium |
| I10 | Empty healthy API retains seeded 64 detections / 9 clusters; `lastUpdated` advances on failure; work-orders header reports demo while real data is present. [useDashboardData.ts:35](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/hooks/useDashboardData.ts#L35), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/work-orders/page.tsx), R11. | Users cannot tell empty, stale, failed, demo and live apart. Dashboard/trust. | Start empty; represent dataSource/lastSuccess/error separately; commit empty arrays; explicit opt-in seed mode only. | Medium |
| I11 | Dashboard flex layout shrinks cockpit/queue/feed to headings; header clips controls; mobile 10-column orders table lacks a usable summary layout. E03. [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/page.tsx), [Header.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/Header.tsx), [HardwareCockpit.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/HardwareCockpit.tsx), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/work-orders/page.tsx). | Core triage becomes inaccessible even though components are mounted. Plan 2/UI. | Fix header breakpoints and vertical scrolling; prioritize queue; use mobile cards/detail sheet; see redesign below. | Medium |
| I12 | No durable detection outbox despite “buffering”, “store-and-forward”, “zero packet loss”; publisher undefined os prevents send; BroadcastChannel is same-origin same-device only. R13. [telemetry_publisher.py:43](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/edge/telemetry_publisher.py#L43), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/capture/page.tsx), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/fleet/page.tsx). | Offline reports are lost; a phone and laptop do not sync through BroadcastChannel. Demo/edge. | Import os; add persistent bounded queue with event UUID/ack/retry and honest status; separate demo transport. | Medium |
| I13 | Stream processor produces MJPEG/stats, not persisted detections; VideoCameraGrid presents simulated rear/IMU/depth and fallback FPS/counts. [stream_video.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/edge/stream_video.py), [VideoCameraGrid.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/VideoCameraGrid.tsx). | Seeing boxes does not prove camera→map or multicamera/depth functionality. Track 3-related/demo. | Add a tested ingestion adapter, readiness/source metadata and per-feed state; label/remove simulated sensor panels. | Medium |
| I14 | Missing ANPR dependencies trigger randomized plate simulation; training metrics not tied to artifacts; direct card smoke failed. [anpr_detector.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/edge/anpr_detector.py), [detector.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/edge/detector.py), [README.md](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/training/README.md), R10. | Synthetic outputs can be mistaken for evidence of recognition. AI/demo. | Fail visibly in real mode; dependency/model preflight; separate simulator class; verify prepared samples and publish evaluation provenance. | Medium |
| I15 | Five-row fleet UI maps only DEFAULT_FLEET and uses nonexistent last_ping; HTTP upsert destroys trajectory required by OD; analytics mix hardcoded series with live data. [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/fleet/page.tsx), [od_analysis.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/od_analysis.py), [TrafficAnalyticsSection.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/charts/TrafficAnalyticsSection.tsx), R08. | New nodes disappear; trip/delay interpretations are unsupported. Analytics/fleet. | Render returned nodes; normalize timestamp; retain bounded trajectories; wire real series or label placeholders. | Medium |
| I16 | Unauthenticated incident list returns plate/image/location data; RC lookup lacks operator authorization. [main.py:657](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L657), [main.py:895](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L895). | Sensitive observations may be readable by unauthorized users; live RC upstream would extend exposure. Incidents/security. | Enforce roles and city scope; redact default list payload; require audited permission for detail/RC access; define retention. | Medium |
| I17 | npm audit flags 7 package entries including Next 14.2.35; no evidence of an advisory-management gate. E08, [package.json](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/package.json). | Known dependency exposure needs triage before public release. | Upgrade along a supported patched path, triage advisory preconditions and retest build/PWA/API routes. Do not blindly run a forced major update. | Medium |
| I18 | Failsafe is drawn 720p animation, not an actual app recording; demo claims exceed verified flows; two competing master decks. E05/E06. [generate_failsafe_video.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/assets/generate_failsafe_video.py), [DEMO_SCRIPT.md](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/DEMO_SCRIPT.md), [README.md](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/README.md). | Backup cannot demonstrate that the system works and can mislead judges. Plan 4. | Repair flows, record real 1080p session, update one canonical deck/runbook with measured facts. | Medium |
| I19 | Every ingest performs full-history clustering synchronously and queues it again; all clusters deleted/recreated. [main.py:309](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L309), [tasks.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/tasks.py), [dbscan_dedup.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/dbscan_dedup.py). | Increasing latency, duplicate work, races and blocking I/O on async routes. Scaling/identity. | One serialized clustering owner; bounded spatial/time input or incremental update; atomic stable identities and idempotent events. | High |

### 🟡 Medium

| ID | Issue and evidence | Why it matters / affected feature | Recommended fix | Complexity |
|---|---|---|---|---|
| I20 | Arbitrary defect/severity strings accepted; MQTT bypasses REST schema; missing count/string/pagination bounds and uniqueness. R03, [main.py:109](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L109), [mqtt_listener.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/mqtt_listener.py), [models.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/models.py). | Corrupt classes, inflated budgets, oversized rows and duplicate retries. Validation/DB. | Enums and bounded fields at one shared ingest boundary; DB checks and event UUID uniqueness; validated pagination. | Medium |
| I21 | API cluster response omits created_at; real rows display Invalid Date; date sorting is unreliable. R11, [main.py:366](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L366), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/work-orders/page.tsx). | Operational timing and sorting are broken only when real data arrives. Work orders. | Explicit response models and generated/shared frontend types; return ISO UTC created_at. | Low |
| I22 | SQLAlchemy model shape depends on live network probe at import; DB fallback/migrations catch broad errors and silently continue. [models.py:15](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/models.py#L15), [database.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/database.py). | Startup/schema may differ across processes; persistent outage can become a divergent SQLite data set. Deploy/data. | Select database mode explicitly; fail readiness when required DB unavailable; use versioned migrations. | Medium |
| I23 | Status flip does not record assignee/actor/history or evidence, but captions say “Crew Dispatched” and “Resolved & Verified”. [main.py:469](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L469), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/work-orders/page.tsx), [models.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/models.py). | Workflow state is stronger than recorded proof. Dispatch/repair. | Call it status-only until assignment records and resolution evidence exist; use valid transitions and audit timestamps. | Medium |
| I24 | API Setu returns simulated records when unconfigured; data.gov client returns constants; AIRAWAT/AIKosh metadata and presentation overstate integration. [api_setu_client.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/api_setu_client.py), [data_gov_client.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/data_gov_client.py), [model_metadata.json](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/model_metadata.json), [add_gov_slides.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/assets/add_gov_slides.py). | Government platform naming is not a verified service connection. Reports/demo. | Label stubs/fixtures; remove completed-integration claims; require approved sandbox tests before live use. | Medium |
| I25 | Browser reports hydration mismatch from server/client time formats (`7:18:32 PM` vs`19:18:32`); dynamic/fabricated timestamps. E03, ConnectionStatus component. | Visible dev errors and client-render fallback; makes state appear fresh. UI/reliability. | Render stable server text; format locale/time after mount or use explicit matching locale/timezone. | Low |
| I26 | Repeated polling, unbounded cluster/heatmap reads and multiple COUNT queries; no in-flight cancellation/timeouts for several fetch paths. [useDashboardData.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/hooks/useDashboardData.ts), [api.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/lib/api.ts), [main.py:398](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L398), [main.py:441](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L441). | More load as tabs/vehicles grow and stale requests can overwrite current views. Performance. | One coordinated refresh, timeouts/cancellation, aggregate stats and bounded map data; add pagination before huge data. | Medium |
| I27 | CSV exports raw user-influenced strings; upload/inference accepts compressed images without a pixel/work budget; permissive deployment-origin regex. [pdf_report.py:248](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/pdf_report.py#L248), [main.py:226](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L226), [main.py:64](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py#L64). | Spreadsheet formula interpretation and resource exhaustion remain plausible; CORS should name actual deployments. | Neutralize formula prefixes in exported strings; bound decoded dimensions/runtime; exact origin allowlist. No exploit attempted. | Low–Medium |
| I28 | Fleet unique index/FKs/status history absent; no migration versioning; no cleanup/retention for images/incidents/trajectories. [models.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/models.py), [database.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/database.py). | Integrity is only application convention and storage can grow indefinitely. Database. | Add constraints after data cleanup, version migrations and documented retention; preserve required evidence. | Medium |
| I29 | CI uptime workflow does not fail when curl fails; GitHub UI says main is unprotected. [uptime_ping.yml](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/.github/workflows/uptime_ping.yml), E02b. | Green checks do not necessarily establish service health; broken commits can become main. Repository. | Fail on health errors; protect main with build/test checks and review appropriate to the team. | Low |

### 🔵 Low

| ID | Issue and evidence | Why it matters / affected feature | Recommended fix | Complexity |
|---|---|---|---|---|
| I30 | Duplicated chime, overlapping CSS/tokens, unused imports and oversized page files; main.py 933 lines / capture 1,006 / dashboard 762. [DetectionChime.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/DetectionChime.tsx), [page.tsx](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/capture/page.tsx), [globals.css](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/app/globals.css), [main.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py). | Harder for another developer to trace a change safely. Maintainability. | Extract only by responsibility after contracts stabilize; remove dead helper/imports; consolidate primitive styles. | Medium |
| I31 | Tiny uppercase mono labels, mixed emoji/Lucide, multiple radii/glows, implementation jargon in user labels. E03. | Looks like a technical demo/control-panel collage rather than a coherent municipal application. Visual polish. | Adopt the bounded design system and terminology below. | Low–Medium |
| I32 | Stale README counts, differing deck/runbook filenames, generated media/models/assets alongside active source. [README.md](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/README.md), [METRICS.md](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/METRICS.md), E05/E06. | Setup and demonstration authority are unclear. Repository/docs. | One canonical README/deck/runbook; artifact manifests/model hashes; archive superseded outputs. | Low |

## 5. Major flows traced end-to-end

| Flow | Access → API → database → UI | Errors / edge cases / outcome |
|---|---|---|
| Road detection by HTTP | Correct auth permits POST; valid observation stored; fleet updated; cluster/RPI computed; polling returns it; browser shows real row | **Working local happy path.** Invalid taxonomy accepted; response differs from frontend Detection type; WebSocket broken; full-history dedup unsafe. |
| Capture road inference | User can open capture, choose camera/simulator/manual input; real ONNX files available; road mutation includes auth | Physical camera and browser-model accuracy UNVERIFIED. Simulator media did not play in tested browser state; GPS lock/42 km/h still shown. A manual synthetic detection must not be presented as recognition. |
| Traffic capture | Frontend helper calls /api/traffic; backend and TrafficObservation table exist | Header absent→401; speed/field mismatch; UI does not give useful failed-delivery state. Python traffic ONNX path also lacks road detector’s NMS, risking duplicate anchors/counts. |
| ANPR/incident | Capture/OCR and incident endpoint/table/list exist; lookup route accessible | Header absent→401; reporter field mismatch; Python adapter may simulate without dependencies. No evidence supports automatic hit-and-run/rash-driving inference from these records. |
| Multi-camera/live video | Frontend opens MJPEG view; Python stream annotates one source | No stream→ingestion adapter; additional camera/sensor panels contain fabricated metrics. No genuine concurrent-camera acceptance performed. |
| Dashboard read | Health/stats/detections/clusters are fetched every 5 seconds; map works with seeded and real clusters | Empty successful response does not clear seeds. Fake rotating “audit log” is unrelated to server events. Header source indicators conflict between pages. |
| Work-order status | Browser selection → authenticated status endpoint → persisted cluster status → polling UI | ASSIGNED persisted in R11. No recipient dispatch, assignee, actor, audit history or repair proof. Failed status update rolls back without an explanatory toast. Two rapid requests are not serialized. |
| City switching | Dropdown→POST→global active city→button label | Switch itself succeeds, while map/data stay Chennai. Cross-city report/empty fleet behavior fails. Multi-worker consistency unverified and structurally unsafe. |
| Municipal exports | Local JSON/PDF/CSV work; work-orders also has a separate client-side CSV export | Local PDF generation succeeds, but semantic scope is wrong. Hosted proxy defaults to localhost. Distinguish backend municipal report from client-filtered dispatch CSV. |
| Fleet/OD/delay | API holds latest fleet row; UI merges only the five known fixtures; analytics routes compute or return seed data | Unknown/new vehicle absent from UI; temporal trajectory unavailable through HTTP upsert; chart panels include fixed passenger/delay/hourly data. |
| Offline use | PWA caches frontend assets; BroadcastChannel shares local tab messages | No durable acknowledged detection outbox demonstrated. Service-worker app caching is not telemetry synchronization. Phone and laptop require a real server/broker transport. |
| Government integrations | RC client stub uses configurable HTTP request; MoRTH returns a static dictionary; metadata serves JSON | No live API approval, OAuth/mTLS exchange, AIRAWAT job or official data refresh verified. “Integration_ready” must not mean operationally verified. |

**KEEP — no change required** for the basic authenticated HTTP happy path, the RPI arithmetic helpers, the Haversine helper, existing semantic defect classes, PDF byte-generation library and current MapLibre/Next/FastAPI technology choices. Keep the successful parts while repairing their contracts and context.

## 6. Why the frontend looks unfinished

The issue is more specific than “make it modern.” The application spends too much of the visual budget on explaining machinery, and too little on helping an operator decide what to repair next. Borders, glows, animated sparklines, simulated sensor readouts, technical captions and nested pills receive almost equal prominence to location, priority and action.

### Observed design and usability problems

| Area | Specific evidence | Consequence | Correction |
|---|---|---|---|
| Typography | Most UI uses font-mono, uppercase labels and 9–12 px text; actual font loading differs from token names. | Long municipal/contractor names wrap; small distinctions become tiring. | Body 14–16 px sans, metadata 12 px minimum, monospace only IDs/coordinates; use explicit loaded font variables. |
| Hierarchy | Four large sparkline cards precede queue/actions; every section carries an all-caps header, badge and icon. | Primary work is visually buried. | One page title, concise context, compact key counts, dominant queue/map or table. |
| Spacing/height | Fixed-height dashboard, flex children and overflow-hidden shrink the cockpit and queue. | Content disappears despite space in the map pane. | One predictable scroll owner per pane; minimum practical queue height; collapse optional panels by default. |
| Alignment/grid | Cockpit’s lg four-column grid lives inside an approximately 440 px sidebar. | Card content is cramped even on a wide monitor. | Component/container-based columns; two max in this sidebar. |
| Cards/backgrounds | Glass-panel/card/pill variants, inline gradients, nested translucent surfaces, inset and outer glows. | Too many boundaries and inconsistent perceived depth. | Solid base/surface/elevated layers; one subtle border; shadow only for overlays. |
| Color | Cyan/blue gradients dominate ordinary buttons; red/orange/blue encode severity and defect class interchangeably. | Legend “Critical (D40)” implies class fixes severity; real D40 high exposes the mismatch. | Severity gets one mapping; class gets text/icon separately; green reserved for verified success. |
| Contrast | Muted slate-500, 10 px descriptions on translucent dark cards and dense map overlays are visibly hard to read. | Secondary information may be effectively hidden. | Use proposed high-contrast text tokens; measure actual pairs. No formal contrast certification was performed. |
| Icons/images | Lucide plus emoji hospital/college/construction symbols and decorative hardware/rendering graphics. | Different visual weights; pictures seem to prove hardware readiness when they are illustrative. | One icon set, text labels, explicit illustration/simulation captions; real evidence thumbnails for defects. |
| Buttons | Repeated gradient/glass/pill treatments; icon-only city trigger has no accessible name at mobile size. | Actions are hard to rank and access. | Shared button variants; visible primary action per context; 44 px touch target and accessible labels. |
| Navigation | Desktop header keeps all long nav labels at tablet width; city/refresh/dedup clip; command palette is not a substitute. | Important context/action disappears. | Collapse desktop nav earlier; retain city and connection source; menu secondary actions. |
| Tables | Work-orders has 10 columns with location, POI, phone, timestamp andstatus at once. | Heavy wrapping desktop; horizontal hunt mobile. | 6 essential columns on desktop; row detail drawer; mobile incident cards. |
| Forms | Search has placeholder but status/severity native selects are not clearly labelled; no coherent field/error primitive. | Screens reader context and visible form guidance are weak. | Persistent labels, associatederrors, controlled pending state and useful empty search results. |
| Modals/overlays | Command/brief/formula interactions are implemented separately; keyboard/focus behavior has no acceptance coverage. | Uniform Escape, focus return and focus trapping cannot be assumed. | One Dialog/Sheet primitive with keyboard acceptance tests. No claim of a specific untested focus-trap failure. |
| Empty state | A healthy empty database still shows nine seed clusters; seeded KPI charts do not disappear. | Empty and successful first run are indistinguishable from activity. | “No detections for Bangalore in this period” with capture/import action; never auto-seed live mode. |
| Loading state | Initial splash is polished, but page counts begin at fake populated values; requests repeat every 5 seconds. | A loading transition looks like live evidence. | Skeletons then real empty/data state; do not reset entire page during background refresh. |
| Error state | City changes locally on failure; capture failures/permission errors go to console; status rollback silent. | Users believe actions succeeded or cannot recover. | Inline error with Retry; retain user input; explicit 401/configuration guidance. |
| Success state | “Transmitted”, “Crew Dispatched”, “Verified”, “Zero Packet Loss” used without corresponding acknowledgments/proof. | Success wording exceeds recorded state. | Distinguish detected/queued/sent/acknowledged and assigned/resolved/verified. |
| Motion | Pulses, sparkline effects, 3D animations, marquee audit log and random gauges compete continuously. | Attention is drawn away from changing actual incidents; reduced-motion support absent. | Animate only meaningful changes; use 150–200 ms transitions; honor prefers-reduced-motion. |

No actual destructive delete workflow was found to exercise. Status changes are reversible but consequential; “resolve” should request reason/evidence rather than an unnecessary confirmation for every harmless selection. No app-wide access-control flow or account-management UI exists.

### Responsive evidence

| View | Observed problem | Evidence |
|---|---|---|
| Desktop 1440×900 | Dense tiny-label visual hierarchy, competing map annotations and 10-column orders table | `screenshots/dashboard-desktop.png`, `analytics-desktop.png`, `work-orders-desktop.png` |
| Laptop 1366×768 | Expanded hardware body clipped; queue/feed effectively compressed to headers; map toolbar requires horizontal traversal | `screenshots/dashboard-laptop-1366.png` |
| Tablet 768×1024 | Header’s full desktop navigation leaves city/connection/actions off-screen; fleet cards consume substantial height; simulation dominates | `screenshots/fleet-tablet-768.png` |
| Mobile 390×844 | Header clipped; map controls/legend collide; queue dominated by KPI cards; orders reach bottom navigation before the data table; capture overlays collide with camera prompt | `screenshots/dashboard-mobile-390.png`, `dashboard-mobile-queue.png`, `orders-mobile-390.png`, `capture-mobile-390.png` |

Local screenshots may show Next development error overlays. Those are identified local hydration errors, not claims that the hosted production app displays the dev overlay. Viewport testing did not simulate real-device CPU, camera permission behavior or mobile-browser chrome.

![Laptop: queue and cockpit compressed while map occupies the screen](screenshots/dashboard-laptop-1366.png)

![Bangalore selected, Chennai map still rendered](screenshots/city-bangalore-chennai-map.png)

![Mobile orders: decorative summary consumes the first screen](screenshots/orders-mobile-390.png)

The frontend is **prototype-like because primary tasks and truthful state are unfinished**, supported by these examples. It is not merely a matter of taste or the choice of dark mode.

## 7. Design system audit and concrete proposal

Useful foundations already exist: Header, MobileBottomNav, KPICard, SeverityBadge, StatusDropdown, RPIProgressBar, Tailwind tokens, glass utilities and local fonts. Button, Input, Select, Card, Dialog/Sheet, Table, Alert, EmptyState, Skeleton and MutationFeedback are missing or insufficiently standardized. Components repeatedly define their own borders, shadows, padding and gradients.

Keep React and Tailwind. Introduce a small set of primitives; no new UI framework is required.

| Token group | Proposed values and rules |
|---|---|
| Primary | Action blue `#2563EB`; hover `#1D4ED8`; white text. Cyan `#22D3EE` for secondary telemetry emphasis. |
| Background | Canvas `#0B1020`; surface `#111827`; raised `#182235`; border `#334155`. Use solid surfaces for readability. |
| Text | Main `#F8FAFC`; secondary `#CBD5E1`; muted `#94A3B8`. Disabled states must remain distinguishable without tiny faded text. |
| Semantic | Critical `#F87171`; high/warning `#FBBF24`; info `#60A5FA`; success `#4ADE80`. Pair color with text or an icon. |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px. Page padding 24 px desktop / 16 px mobile; card padding 16–24 px; related controls 8 px apart; section gap 24 px. |
| Radius and depth | 6 px for inputs/buttons; 10 px for cards; 14 px for overlays. Pills only for compact status. One subtle border and one overlay shadow. |
| Typography | Loaded Geist Sans for content; loaded Geist Mono for IDs and coordinates. Page title 28/36 semibold; section 20/28; card title 16/24; body 14/22, mobile 16/24; metadata 12/18; KPI 28/32. Avoid all-caps paragraphs. |
| Buttons | Primary filled, secondary outline, tertiary text, danger filled. Height 40 px desktop / 44 px touch; icons 16–20 px with an 8 px gap. Show pending state only on the affected action. |
| Inputs/selects | Visible label, 40/44 px height, 12 px horizontal padding, associated error under the field. Retain filter values during refresh. |
| Cards | Title/context/action row and one content area. Add a chart only when actual history and a time axis support it. |
| Tables | 44–48 px rows, 14 px content, sticky header; numbers aligned right; sort indicators and `aria-sort`; expandable detail. Switch to cards on narrow screens. |
| Feedback | Separate data source, connection health, last successful update and data age. Mutations show Queued / Sending / Saved / Failed, with retry where useful. |
| Overlays | One Dialog/Sheet with title, Escape, focus trapping, focus return and scroll handling; bottom sheet on mobile. |
| Motion | 150–200 ms transitions; no repeated decorative motion in operational mode; honor `prefers-reduced-motion`. |

These are proposed tokens, not a completed accessibility certification. Measure actual text/background pairs and keyboard flows during implementation. Wire the existing font variables into Tailwind. Install JetBrains Mono only if exact Plan 2 font compliance remains a requirement; the bundled Geist family is otherwise adequate.

### Page-by-page redesign

Each page should use the same typography, spacing, colors and component rules above.

| Page | Keep | Remove or demote | Layout and components | Interaction and responsiveness |
|---|---|---|---|---|
| Command center `/` | MapLibre, RPI ordering, severity badges, real recent observations | Fabricated audit marquee; random sensor panel from default triage; decorative KPI sparklines; implementation jargon | Header with city, period and source. Compact counts row. Desktop map about 60% and queue 40%; incident detail drawer; optional diagnostics drawer. | Marker and queue selection stay synchronized. Queue always remains reachable and scrollable. Tablet stacks map/list; mobile uses Map/List tabs with shared selection and safe-area padding above navigation. |
| Analytics `/analytics` | Implemented congestion calculation, real aggregates, export | Hardcoded hourly/passenger/OD series presented as measurements; chart-library names | Title and city/date filters; three useful summary values; trend and class breakdown; corridor congestion table; export panel showing population and assumptions. | Show charts only when actual data supports them; otherwise use an empty state. One chart per row on mobile, legend below, text summary. PDF action shows progress and a specific failure. |
| Fleet `/fleet` | Vehicle identity, last position, last seen, connection state | Main-page BOM showcase, fixed 5/5 active, fake NPU diagnostics, unverified hardware and zero-loss claims | Fleet list/table and selected vehicle map/detail. Fields: status, last seen, route, known speed, model version. Diagnostics becomes a secondary tab. | Render every returned node; search and filter active/stale. Mobile node cards open a detail sheet. Unknown speed is “—”, not 42. |
| Work orders `/work-orders` | Search, status/severity filters, RPI, contractor field, successful status mutation | Four large fake-trend cards; POI/phone as default columns; “verified” without proof | Compact summary and toolbar. Table columns: ID, location, priority, assignee, due, status. Detail contains classification, POI, evidence and history. | Assignment opens a small form; resolution records reason/evidence. Show pending/save/error. Mobile cards expose priority, location, status and next action immediately. Label keyboard actions. |
| Capture `/capture` | Explicit camera start, model overlays, preview, manual test mode | Simulator output as real inference; fabricated GPS lock/speed; overlapping permission prompt; unsupported success labels | First show permission/model readiness, then preview with GPS/source bar, a large capture/scan control, and delivery queue. Put gating/incident options in an advanced settings sheet. | Denial offers retry or clearly labelled simulation. Model loading/error is separate from connection state. Use 44 px controls, a useful portrait preview and queued/sent/acknowledged counts. |

### Component disposition

| Action | Components | Reason |
|---|---|---|
| Reuse | MapLibre renderer, RPI helpers, SeverityBadge, StatusDropdown, local fonts, MobileBottomNav | Sound foundations with small style/contract improvements. |
| Refactor | Header, CitySelector, useDashboardData, api.ts, WebGISMap, HardwareCockpit, VideoCameraGrid, KPICard, ConnectionStatus | Correct layout, provenance and state contracts; separate simulation from live behavior. |
| Create | AppShell, Button, Field/Select, Card, DataTable, IncidentListItem, DetailSheet, Dialog, Alert, EmptyState, Skeleton, DataSourceBadge, MutationStatus | Replace repeated styling and feedback logic. |
| Remove from operational views | AgentThoughtStream, fabricated chart series, camera/depth readouts and unmeasured hardware claims | They are presentation fixtures. Keep them only in a clearly labelled demo mode if useful. |
| Consolidate | Two chime implementations, overlapping glass/stat CSS, Python/Next business logic | One implementation per responsibility reduces drift. |

## 8. Backend, database and security assessment

### API and business logic

The 933-line main module mixes transport, validation, database writes, clustering, reporting, simulation and serialization. Keep FastAPI; extract ingestion, clusters/work orders, reports, cities and external clients into services with clear ownership. Add explicit response models so missing `created_at` and reporter/timestamp mismatches are detectable. [main.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/main.py), [api.ts](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/lib/api.ts).

REST coordinates and confidence already have some validation. Several mutations have API-key checks and rate limits: **KEEP these protections and extend them.** Defect/severity remain strings, while MQTT writes directly to ORM models. Use one validated ingestion service for both transports. A successful ingestion response should mean the observation was durably accepted; processing state should be separate. A request that commits raw data and then fails during fleet update or deduplication must not invite duplicate retries.

The current status flow is neither contractor notification nor repair verification. Add assignee, assigned_at, due_at, resolved_at, actor and evidence references as needed for the promised workflow. Do not add email/SMS until external delivery is part of the agreed scope. Deterministic transitions and an audit record are the immediate requirement.

### Schema and integrity

| Table | Existing support | Important gap |
|---|---|---|
| detections | Primary key, defect/confidence/severity, vehicle, timestamp, coordinates, road, thumbnail, cluster integer | No event UUID/idempotency, city/zone, database enum/checks, or foreign key for cluster_id. Time/road query indexes need review. |
| clusters | RPI, centroid, count, status, contractor/SLA, POI, created/updated times | Rebuilt IDs; no stable incident identity, actor, assignment/resolution history. |
| traffic_observations | Counts, speed, density, vehicle, location, time and several indexes | No event identity, city scope, consistent cross-transport validation or retention. |
| incidents | Plate/confidence/class, image, reporter, location, time, status | Sensitive content exposed in lists; no access/audit/retention boundary; reporter field mismatch. |
| fleet_positions | Vehicle ID, location, speed, heading, status, time | vehicle_id indexed but not unique; conflicting latest-state and trajectory semantics. |

Versioned migrations are needed. Swallowing ALTER errors is not a migration strategy. Geometry columns depend on an import-time connection test. PostgreSQL failure can cause a SQLite fallback while the application appears healthy. Make the mode explicit: an offline demo can choose SQLite, but an operational service should not silently write to another database. [database.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/database.py), [models.py](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/models.py).

Do not add indexes indiscriminately. Start with query plans for city/time observations, vehicle/time trajectories, status/RPI work orders and the actual spatial query. The PostGIS query constructs and transforms geometry from latitude/longitude across all rows; the existence of a spatial column does not prove it is used. EPSG:3857 distances vary with latitude. Test the actual 15 m boundary in each configured city and choose an appropriate metric projection or geography-based approach. This is a source-derived concern; hosted PostGIS was not benchmarked.

### Security boundaries

The actionable findings are I01, I05, I16, I17, I20, I22, I27 and I28. Qualifications matter:

- `NEXT_PUBLIC` API keys are public configuration. LocalStorage does not create an operator identity. User roles, city scope and per-device identity are absent.
- Anonymous MQTT on 1883 and host-exposed Redis/Postgres ports are unsuitable as an unqualified production configuration. Bind development services to loopback or a private network. Require broker ACL/TLS for remote ingestion. The UI should not claim TLS 8883 until actual connections prove it.
- CORS is not simply a wildcard: an explicit list and broad Vigilance Vercel regex exist. CORS is not authentication and does not protect against non-browser clients. Narrow the allowlist to intended deployments.
- SQLAlchemy filtering and MapLibre HTML escaping are good foundations. No SQL injection or reflected XSS exploit was confirmed. CSV formula interpretation is a separate output risk. No destructive exploitation was attempted.
- Traditional cookie CSRF is not the primary current failure because authentication uses a shared header key rather than a user session cookie. If moving to sessions, include appropriate SameSite/CSRF protections for state-changing requests.
- The inference endpoint’s compressed-payload cap is useful, but it does not establish a decoded-pixel or CPU budget. Authentication and rate limits must cover expensive inference as well as writes.
- RC lookup needs operator authorization before returning future live owner data. The unconfigured client currently returns `demo_mode`; its fictional registry entries are not actual personal records.

The dependency registry flags were checked against primary maintainer advisories, including [Next.js Server Components denial of service](https://github.com/vercel/next.js/security/advisories/GHSA-h25 m-26qc-wcjf) and [request smuggling in rewrites](https://github.com/vercel/next.js/security/advisories/GHSA-ggv3-7p47-pfv8). Package-version matches are confirmed; every advisory’s application-specific preconditions were not tested. Record triage and move to a supported patched release without claiming that a compromise occurred.

## 9. Performance, maintainability and repository health

### Performance work with a clear benefit

| Area | Current evidence | Useful next optimization |
|---|---|---|
| Clustering | All observations loaded, all clusters replaced, synchronous work plus a queued duplicate | Fix identity/serialization first; limit work to changed spatial regions or periods; measure ingestion p95 under a defined fleet load. |
| Stats and map APIs | Several COUNT queries, cluster-list reads and unbounded heatmap; polling every 5 seconds | Aggregate counts, briefly cache by city/filter, return bounded GeoJSON and paginate feeds. |
| Frontend bundle | Analytics first load 290 kB versus dashboard 187 kB; multiple chart/3D/animation libraries | Lazy-load optional 3D/diagnostics; choose one chart library after checking usage; remove dependencies only when confirmed unused. |
| Rendering | Polling plus random 800 ms cockpit updates and an animated fake audit stream | Remove fabricated updates; memoize expensive real transformations; preserve the map instance and update its sources. |
| Requests | Health and three data reads per refresh, plus page-specific pollers; timeout/cancellation gaps | Coordinate refreshes, cancel superseded requests and retain last-successful data age. A new state library is not inherently required. |
| Media | Videos, failsafe and model binaries in source; media codec differs from plan | Browser-compatible H.264, lazy loading and model hash manifests. Load large optional artifacts on demand. |
| Inference | Synchronous CPU work inside an async endpoint; compressed-image cap only | Explicit concurrency/work budget and decoded shape limits; measure target hardware before latency claims. |

No load test or Core Web Vitals run was completed. Bundle figures are build outputs, not measured page-load times. No N+1 issue is asserted without a query trace; full-history scans and duplicate clustering are already concrete priorities.

### Maintainability

Another developer can understand the repository’s broad structure, but must follow competing API paths, fallback data, global city state and duplicated calculations to safely change a feature. Ambiguous authority is the largest maintenance cost. Stabilize API types and data provenance, then split large files by responsibility. Cosmetic refactoring alone will not repair business behavior.

The scan results in E07 are triage evidence. Broad exception handlers frequently turn a failure into simulation, SQLite fallback or a “buffering” message. Log operation/event IDs, distinguish missing dependencies from remote outages, and fail readiness when required services are unavailable. Show useful recovery messages in the UI without exposing stack traces.

### Repository and deployment

- Main history includes Track 1–4 work and later integration commits. This shows intent and activity, not acceptance. Available branches include Parth, android-telemetry, dev, docs/presentation, feature/backend-gis, feature/dashboard-ui, feature/edge-ai and final-frontend. Several feature references remain on older commits. This supports branch staleness/divergence, not a claim that a person abandoned work.
- Plan 3 is absent from the available history filename inventory. A Track 3 commit title cannot substitute for its specification.
- README declares a separate Vercel deployment mirror. Releases should record source, mirror and deployed commit IDs; they were not verified as identical during this audit.
- Root requirements, backend requirements, Docker context and launch scripts describe different environments. Root `.env` instructions do not match the backend/prototype `.env` loader paths. The example database name differs from Compose. A blank API_KEY prevents protected writes until configured.
- The backend Docker context excludes edge code/models. Its capabilities must reflect that. Fly’s small memory profile needs measurement with the intended models.
- `.gitignore` cannot remove previously committed credentials. Generated media, models, decks and training output need an artifact policy. Preserve useful model artifacts; consider releases/LFS only when repository size/history justifies it.
- The root MIT license and model metadata’s AGPL reference warrant attribution/licensing review before distribution. This audit gives no legal determination about the weights or the whole project.
- No verified deployment gate covers physical capture, real PostGIS, broker or browser flows. Uptime workflow success alone is not readiness. The signed-in GitHub owner UI explicitly reports that main is unprotected.

## 10. Testing that matters next

Current tests cover useful RPI bounds, POI distance, deduplication and HTTP behavior: **KEEP them.** The 61 passes did not prevent the reproduced defects because critical contracts, empty states and real transport authentication were outside effective coverage. Build/type checking cannot validate unchecked JSON casts.

| Priority | High-value test | Acceptance criterion |
|---|---|---|
| Must fix | Dedup identity/status regression | Distinct defects 20 m apart retain independent status; merges do not transfer closure incorrectly; IDs remain stable; concurrent ingestion does not lose changes. |
| Must fix | WebSocket auth/broadcast | Missing/invalid tokens rejected; valid connection receives a persisted event; disconnect cleanup works. |
| Must fix | Empty healthy API and outage browser flow | Zero records show zero/empty; outage retains last successful data with age; simulation never appears live. |
| Must fix | Two-city isolation | City A ingestion does not appear in City B’s query/map/report; two clients do not change each other’s city context. |
| Must fix | Actual capture mutations | Traffic/incidents include credentials, correct reporter/speed fields, and visible acknowledgment/failure. |
| Must fix | Municipal report fixture | Old, out-of-city, resolved and duplicate observations produce agreed totals; units/zones correct; budget uses unique repair scopes. |
| Must fix | Clean-clone CI | Correct profiles installed, all tests collected, build passes, missing configuration fails clearly. |
| Important | Fleet state and history | New vehicle appears; latest row remains unique; retained trajectory creates real OD pairs; no history returns no-data. |
| Important | Idempotency/offline queue | Retry, reload and reconnect do not duplicate or lose acknowledged observations. |
| Important | Real PostGIS | Near/beyond-15 m fixtures in all cities; expected results compared with SQLite; migrations exercised. |
| Important | Responsive and accessible browser flow | Header/primary actions reachable at 1440/1366/768/390 px; keyboard menu/dialog flow and mobile cards work. |
| Important | Prepared sample/model tests | Known positive/negative images use the shipped model hash; ANPR checks never silently simulate; H.264 playback works. |
| Important | Physical demo rehearsal | Permission denial/retry, unknown/stationary GPS, sensor availability, phone→server→separate-laptop acknowledgment, offline queue and export. |
| Polish | Visual regression and long reports | Long names, large tables, multi-page PDF headers/wrapping and reduced-motion states. |

Avoid tests that merely freeze current markup, assert seed values exist, or mock away the very authentication/transport boundary under examination.

## 11. Final verdict

### A. Executive Summary

A functional prototype exists: the frontend builds, real road-model inference executes, valid HTTP observations persist, local RPI/clustering runs, basic status updates persist, and PDF/CSV files are generated. Production/demo approval is withheld because deduplication can corrupt resolution state, city/report scope is wrong, WebSocket fails, credentials are exposed, and critical UI states misrepresent data. Most problems can be repaired incrementally in the current stack.

### B. Four-Plan Compliance

Plan 1 implements much of the prescribed scaffolding but does not provide a reliable multi-city municipal workflow. Plan 2 implements many literal styling/simulation requirements, but font integration, responsive visibility and shared chime integration are incomplete. Plan 3 cannot be verified without its document. Plan 4 has test assets and runbook structure, but failsafe authenticity, verified claims and integrated rehearsal are not satisfied. Individual classifications are in the requirement matrix.

### C. Biggest Functional Gaps

Stable work-order identity; city-scoped data; truthful reports; authenticated traffic/incident capture; working WebSockets; durable offline queue; real stream-to-map ingestion; trajectory-backed OD; actual assignment and repair verification.

### D. Biggest UI/UX Problems

The repair queue is hidden by layout. Headers clip controls. Work orders overload a ten-column table. Fake charts/logs/gauges compete with actual work. Empty/loading/error states do not describe reality. Small mono typography and repeated glass effects obscure hierarchy. Changing colors alone will not fix these problems.

### E. Architecture Problems

Two backends with different truth, global city state, destructive clustering, network-dependent model schema, duplicated transport logic and simulation mixed with real paths. Keep the stack and clarify ownership/contracts.

### F. Security Problems

Public credential-bearing database URL; public/default shared key; unauthenticated Next mutation routes; anonymous MQTT; unprotected incident/RC reads; validation/resource-budget gaps; dependency advisories. No destructive exploit or credential-validity check was performed.

### G. Technical Debt

Divergent dependency/configuration entry points, stale documentation/metrics, unversioned migrations, missing response models, duplicated chime/styles, large coupled components and unverified presentation claims.

### H. What Is Already Good

**KEEP — no change required** for the choice of Next/React/Tailwind, FastAPI/SQLAlchemy and MapLibre. Keep numeric RPI/Haversine helpers, actual INT8/FP32 artifacts, the working authenticated HTTP path, PDF/CSV generation foundation, useful unit tests and build checks. The benchmark document’s separation of measured Apple Silicon results from projected Pi performance is the right pattern; apply it consistently.

### I. Required Fixes

#### PHASE 1 — Must Fix

| Exact change | Affected files/components | Reason | Complexity |
|---|---|---|---|
| Rotate exposed credential; remove hardcoded URL; review access/history | start_full_demo.sh/.bat, hosting secrets | Contain exposure, I01 | Medium |
| Fix WebSocket auth, publisher os import, capture traffic/incident auth and fields | main.py, telemetry_publisher.py, api.ts, capture | Restore broken transport, I06/I08/I12 | Low–Medium |
| Preserve stable defect identity/status; add the 20 m regression first | dbscan_dedup.py, models.py, tasks.py, tests | Prevent incorrect closure, I02/I19 | High |
| Unify API origin; remove unlabelled fallback backend/simulation | api.ts, next.config.mjs, serverStore, useDashboardData, Header | Establish authoritative data, I09/I10 | Medium |
| Isolate city across DB/API/map/export; scope report date/status/repair population | models, main, poi_data, pdf_report, CitySelector, WebGISMap | Stop misattribution and wrong budgets, I03/I04 | High |
| Establish operator/device auth; protect incident reads and broker | API dependencies, Next routes, MQTT configuration | Prevent unauthorized reads/writes, I05/I16 | High |
| Align install profiles; fix full suite/CI; triage dependency upgrades | requirements, package/lock, CI, Dockerfiles | Reproducible release, I07/I17 | Medium |
| Make queue, cards and actions visible at required widths | Header, dashboard, HardwareCockpit, work-orders | Restore access to primary work, I11 | Medium |
| Record a genuine failsafe and correct demo assertions | DEMO_SCRIPT, failsafe video, canonical deck, METRICS | Credible demonstration, I18 | Medium |

#### PHASE 2 — Important

| Exact change | Affected files/components | Reason | Complexity |
|---|---|---|---|
| Shared validated ingestion, event UUIDs, DB constraints and migrations | main, mqtt_listener, models, database | Cross-transport integrity and retries | Medium |
| Separate latest fleet state from retained trajectories; wire real analytics | FleetPosition, od_analysis, delay_estimator, fleet, TrafficAnalyticsSection | Real fleet/OD behavior | Medium |
| Persisted outbox and video ingestion adapter with readiness/source labels | capture, edge publisher, stream_video, VideoCameraGrid | Offline recovery and video-to-map flow | Medium |
| Assignment/history/resolution evidence and correct response DTOs | Work-order records, main, orders, frontend types | Trustworthy status, SLA and timestamps | Medium |
| Gate government features on verified configuration; label stubs | API Setu client, data.gov client, metadata, reports/deck | Defensible integration claims | Medium |
| Add section 10 tests and measure broker/PostGIS/device flows | tests, CI, browser fixtures | Exercise actual failure boundaries | Medium |

#### PHASE 3 — Polish

| Exact change | Affected files/components | Reason | Complexity |
|---|---|---|---|
| Apply shared tokens/primitives and page layout plan | globals.css, Tailwind, components, five pages | Cohesion, readability, fewer duplicated styles | Medium |
| Remove ambient decoration; add accessibility/reduced-motion/long-text states | KPI/charts, AgentThoughtStream, dialogs, CitySelector | Predictable operator UX | Low–Medium |
| Consolidate charts/dead helpers after usage check; lazy-load optional 3D | package.json, analytics, fleet, DetectionChime | Lower bundle and maintenance cost | Medium |
| Generate current metrics/test manifest and one canonical demo entry point | README, METRICS, BENCHMARKS, presentations | Prevent recurring documentation drift | Low |

Production acceptance should require a clean install and passing CI, the data-integrity/city/report/auth regressions, and a test of the actual target device and transport. Demo acceptance may be narrower, but must identify simulation and unverified hardware claims explicitly.

### J. Final Requirement Coverage

| Plan | Requirements | Full | Partial | Missing | Incorrect | Unverified | Strict coverage |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plan 1 | 34 | 22 | 3 | 1 | 6 | 2 | 64.7% |
| Plan 2 | 25 | 15 | 5 | 2 | 2 | 1 | 60.0% |
| Plan 3 | Unknown | — | — | — | — | — | N/A — specification absent |
| Plan 4 | 30 | 8 | 10 | 0 | 5 | 7 | 26.7% |


The percentages count fully satisfied acceptance items; they are not quality scores. **There is no supportable claim that all four plans were followed.** Obtain Plan 3 and complete the device, model, cloud and presentation checks before closing the remaining verification gaps.
