# VIGILANCE — 90-question jury defense pack

Current-state answers for audited commit `ae9ec7b`, 28 September 2026. These are expert rehearsal prompts, not official SIH questions. Do not claim proposed repairs or measurements have already happened. Evidence references map to Technical_Audit.md and the finale report.


### Technical — 20 questions

#### Q01. What exactly runs on the vehicle and what runs centrally?

**What the jury is testing:** Architecture ownership.

**Honest answer:** The intended split is onboard inference and central aggregation/review. We have road/traffic/ANPR modules and a browser capture path, but not every transport is integrated. The demonstrated execution path must be named; the video overlay alone does not prove central ingestion.

**Evidence to prepare:** Architecture diagram, running process/configuration manifest, one event trace; I08/I13.

#### Q02. Can you trace this map issue back to a real frame?

**What the jury is testing:** Provenance rather than seeded UI.

**Honest answer:** Not every current map item can be traced that way; the default interface includes seed data. Our target proof is a frame, model hash, event ID and acknowledged database row linked to a stable issue. We must implement the missing evidence linkage before claiming it.

**Evidence to prepare:** Source-labelled frame/event/DB/UI trace; S01 and I10.

#### Q03. Which model classes are actually supported?

**What the jury is testing:** Scope precision.

**Honest answer:** The road model is configured for longitudinal, transverse and alligator cracks plus potholes. That does not establish detection of missing signs, dividers, zebra crossings or waterlogging. Generic traffic/person detection is a separate path, and broader PS obligations remain incomplete.

**Evidence to prepare:** RDD YAML, model output mapping and PS capability ledger.

#### Q04. How did you obtain the reported mAP, precision and recall?

**What the jury is testing:** Reproducible model evaluation.

**Honest answer:** The repository asserts metrics, but the audit could not tie them to the shipped model using a reproducible evaluation bundle. We should not present them as independently verified. We need the checkpoint hash, exact split, evaluation settings and raw results.

**Evidence to prepare:** Training arguments, dataset manifest, exported-model hash and evaluation output; P1-28.

#### Q05. Did quantization improve speed without unacceptable accuracy loss?

**What the jury is testing:** Tradeoff measurement.

**Honest answer:** The shipped INT8 artifact is smaller: 3,356,689 bytes versus 12,268,188 bytes. The paired accuracy and device-speed tradeoff is not established by that fact. We need both models evaluated on the same device and held-out data before claiming a measured speedup.

**Evidence to prepare:** File hashes/sizes, paired FP32/INT8 metrics and latency distribution; E04/P1-29–30.

#### Q06. Is your latency figure model time or camera-to-map latency?

**What the jury is testing:** Correct performance denominator.

**Honest answer:** Those are different measurements. Existing benchmark claims must identify preprocessing, inference, postprocessing and hardware. The audit did not verify sub-200 ms camera-to-map latency. We will timestamp capture, enqueue, acknowledgment and display separately and report a distribution.

**Evidence to prepare:** Clock method, instrumented trace, p50/p95 and dropped-event count; P4-12.

#### Q07. Why did you choose a 15-metre clustering radius?

**What the jury is testing:** Geospatial reasoning.

**Honest answer:** It is the current configured threshold, not a universally validated physical defect size. GPS uncertainty, bus position versus defect position, parallel roads and repeated sightings can cause false merges. The 25 m status-transfer rule also has a reproduced defect. We need labelled route fixtures and uncertainty-aware matching.

**Evidence to prepare:** Radius policy, GPS error analysis, 20 m regression and false-merge/split cases; R09.

#### Q08. Does DBSCAN guarantee that every pair in a cluster is within 15 metres?

**What the jury is testing:** Algorithm understanding.

**Honest answer:** No. Density connectivity can chain nearby points, so a cluster’s overall diameter can exceed the neighbourhood radius. We should examine bridge-point cases and road direction/segment context. Calling it a strict maximum defect diameter would overstate what the algorithm does.

**Evidence to prepare:** Small chained-point fixture and chosen clustering implementation/configuration; [DBSCAN parameter documentation](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html).

#### Q09. How do you stop an already resolved defect being reopened or copied to another issue?

**What the jury is testing:** Stable identity and history.

**Honest answer:** The current rebuild deletes/recreates clusters and can copy resolution to a nearby distinct defect; this is a confirmed blocker. Stable issue identity, explicit merge/split policy and preserved decision history are required. We cannot defend the current behavior as safe.

**Evidence to prepare:** Before/after fixture, repaired stable-ID design and concurrency regression; I02/R09.

#### Q10. How is a missing road sign different from an undetected sign?

**What the jury is testing:** Negative evidence and scene reasoning.

**Honest answer:** A missing object requires knowledge that it should exist and adequate visibility. A detector returning no box can mean occlusion, blur or model failure. We do not currently implement a validated expected-asset comparison and must mark that PS obligation missing.

**Evidence to prepare:** Asset inventory, visibility/occlusion rules, labelled absence examples and abstention policy.

#### Q11. How do you count unique vehicles rather than boxes across frames?

**What the jury is testing:** Temporal measurement.

**Honest answer:** The inspected Python ONNX traffic branch emits boxes without NMS, and frame counts are not unique flow counts. We need proper postprocessing and persistent tracks with a defined counting boundary. Until then, label results as frame observations rather than traffic throughput.

**Evidence to prepare:** NMS regression, annotated counting clips, track IDs and line-crossing definitions; source traffic detector.

#### Q12. Can the system identify schoolchildren crossing a road?

**What the jury is testing:** Pedestrian-safety scope.

**Honest answer:** It currently has generic person detection, not a verified schoolchild or crossing-risk capability. A safe next step is a review flag for observed pedestrian trajectories near a known crossing, with explicit uncertainty. We should not infer age or promise protected-group identification from the current model.

**Evidence to prepare:** Person/crossing annotations, temporal-risk definition and error examples; PS ledger.

#### Q13. What evidence proves a hit-and-run and links the plate to the offender?

**What the jury is testing:** Event causality and attribution.

**Honest answer:** The current standalone heuristic does not prove that. It can label pothole-plus-speed as hit-and-run and attach the first plate. We must remove that claim. The browser path is a plate observation, and any future event system needs temporal evidence, tracking and human review.

**Evidence to prepare:** S03 reproduction, call-path review, event-to-track evidence design.

#### Q14. What does the plate confidence number mean?

**What the jury is testing:** Calibration and abstention.

**Honest answer:** A recognition score is not proof of identity or legal responsibility. We need a clear OCR/model definition, exact-match evaluation under relevant conditions and an abstention threshold. Dependency fallback must not invent plates. Low-quality readings should remain unconfirmed observations.

**Evidence to prepare:** Plate crops, model/runtime versions, exact-match/error rates, calibration and unavailable-mode tests; I14.

#### Q15. How is road priority calculated and validated?

**What the jury is testing:** Explainability versus scientific validity.

**Honest answer:** The implementation uses a weighted heuristic over severity, observation density, road importance and POI proximity. The arithmetic is useful and tested, but the policy is not a validated accident-risk model. Domain review and sensitivity analysis are needed before treating it as an authoritative maintenance ranking.

**Evidence to prepare:** RPI code/tests, factor definitions, policy version and expert review records.

#### Q16. How does offline delivery survive refresh or power loss?

**What the jury is testing:** Durable transport.

**Honest answer:** It currently does not have a verified persistent detection outbox. PWA asset caching and same-device BroadcastChannel are different capabilities. We need persisted event IDs, bounded storage, acknowledgments and retry/idempotency before claiming offline delivery.

**Evidence to prepare:** Restart/disconnect/outbox drain test with acknowledged event count; I12.

#### Q17. How do phone and laptop share observations?

**What the jury is testing:** Actual network path.

**Honest answer:** They must use a reachable authenticated server or broker. BroadcastChannel only connects compatible same-origin contexts on the same device. Each device has its own localhost. We need a rehearsed shared origin and actual cross-device acknowledgment, not merely the same Wi-Fi.

**Evidence to prepare:** Device network diagram, HTTPS setup and phone→server→laptop trace; I12/DEMO_SCRIPT.

#### Q18. Does switching city isolate all data and users?

**What the jury is testing:** State scoping.

**Honest answer:** No. The current process-global city and UI wiring allow mismatched city labels, map content and report population. We need city ownership in data and per-request scoping, plus two-client tests. A dropdown with three configurations is not multi-city isolation.

**Evidence to prepare:** R04/R12, source city context and isolation regression; I03.

#### Q19. Where does origin–destination information come from?

**What the jury is testing:** Data semantics.

**Honest answer:** The implementation expects fleet position history, but HTTP upserts retain only the latest position and the endpoint can return seeded trips. Even correct bus trajectories would describe bus movement, not passenger origins or destinations. That distinction must be explicit.

**Evidence to prepare:** Trajectory schema, retained samples, OD calculation/no-data test; R08.

#### Q20. What do your tests actually prove?

**What the jury is testing:** Test relevance.

**Honest answer:** The audited full run had 61 passes and one failure; build passed, while root CI had a dependency failure. Tests cover useful helpers and HTTP cases but missed major contracts and browser states. We should show exact commands/environment and regression cases, not say everything passes.

**Evidence to prepare:** Saved test/build/CI outputs, failure explanation and targeted test list; E02/I07.


### Product and domain — 20 questions

#### Q21. Who is the primary user and who benefits?

**What the jury is testing:** User clarity.

**Honest answer:** A municipal engineer or transport controller reviews observations and decides on action. Fleet technicians maintain capture; citizens benefit indirectly. Drivers should not have to interact with a dense dashboard while moving. We need interviews to validate responsibilities rather than treating every role as one user.

**Evidence to prepare:** Role journey, operator interview notes and task prototype.

#### Q22. What exact decision does the first screen help make?

**What the jury is testing:** Product focus.

**Honest answer:** It should answer which issue needs review and why. The current screen gives too much space to technical gauges and map modes. We should lead with a linked queue, source evidence and one review action, with diagnostics separate.

**Evidence to prepare:** Before/after task walkthrough and completion observations; section 18.

#### Q23. Why use buses instead of a dedicated survey fleet?

**What the jury is testing:** Operational value.

**Honest answer:** Repeated existing journeys could reduce additional survey trips on covered routes. That benefit is a hypothesis, not zero-cost or complete coverage. We need route frequency, camera suitability and operational cost compared with the relevant current practice.

**Evidence to prepare:** Actual route coverage/revisit analysis and comparative cost assumptions.

#### Q24. Which areas will buses miss?

**What the jury is testing:** Coverage bias.

**Honest answer:** Routes, service hours, obstructions and camera downtime create blind spots. We should display observed segments and age, distinguish unobserved from safe, and complement bus data with other inspection channels where needed. We have not measured citywide coverage.

**Evidence to prepare:** Coverage map, route schedule, camera availability and no-data policy.

#### Q25. Is every camera already suitable for this task?

**What the jury is testing:** Deployment realism.

**Honest answer:** No. Recording cameras may differ in view, resolution, compression, access and placement. We need a fleet inventory and representative tests, plus operator permission for integration. The current prototype is not proof that every existing camera can be reused.

**Evidence to prepare:** Camera compatibility matrix, sample feeds and authorized installation plan.

#### Q26. What happens when the system finds a pothole?

**What the jury is testing:** End-to-end operational ownership.

**Honest answer:** It should create a reviewable observation and update a stable issue. Today basic status tracking exists, but real dispatch, assignment history and repair verification are not complete. We should demonstrate only the recorded action and agree the next handoff with an actual authority.

**Evidence to prepare:** Issue lifecycle diagram, owner/action fields and local persistence evidence.

#### Q27. Who approves the repair priority?

**What the jury is testing:** Human accountability.

**Honest answer:** An authorized operator should review the evidence and priority factors. The current weighting is an engineering heuristic, not a mandated authority policy. We need explicit override/reason/history and a domain-reviewed policy version before operational use.

**Evidence to prepare:** RPI sensitivity examples and operator approval/override workflow.

#### Q28. How do you avoid favoring roads that have more buses?

**What the jury is testing:** Sampling bias.

**Honest answer:** Observation density can reflect service frequency rather than worse damage. The current RPI needs review for that bias. Compare ranking with and without exposure normalization, track distinct passes/coverage and disclose low-observation areas instead of treating silence as good condition.

**Evidence to prepare:** Route exposure data, rank sensitivity and reviewed counterexamples.

#### Q29. How do you know which organization owns a road?

**What the jury is testing:** Actionability.

**Honest answer:** Current contractor/road entries are manually configured samples. They do not establish jurisdiction or a dispatch integration. We need an authoritative road/ward ownership source, versioning and an unknown-owner review state before routing real work.

**Evidence to prepare:** Ownership dataset provenance, version and validated sample handoffs.

#### Q30. Are the displayed repair costs official estimates?

**What the jury is testing:** Budget credibility.

**Honest answer:** Not yet. Current estimates use configured rates and an assumed area, and reports can double-count observations. We must correct unique repair scopes and state every assumption. A supervisor or approved process must validate estimates; do not present them as procurement approvals.

**Evidence to prepare:** Corrected report fixture, rate source/date and measured/assumed area distinction; I04.

#### Q31. What does “resolved and verified” mean?

**What the jury is testing:** Outcome truth.

**Honest answer:** The current status change does not prove a physical repair or independent verification. We should label it “marked resolved” and require evidence, actor/time and review before using “verified.” Subsequent fleet sightings can support review but are not guaranteed proof.

**Evidence to prepare:** Status history and proposed before/after verification acceptance cases.

#### Q32. Can a contractor dispute a finding?

**What the jury is testing:** Practical workflow.

**Honest answer:** A production workflow needs source evidence, a correction/appeal path, reviewer decisions and retained history. That is not fully implemented. The demo should not claim automatic penalties or fraudulent-billing detection from a model output.

**Evidence to prepare:** Dispute state design, evidence retention and actor permissions.

#### Q33. How is your solution different from existing road-inspection AI?

**What the jury is testing:** Defensible differentiation.

**Honest answer:** Vehicle-mounted AI inspection already exists. Our potential distinction is dependable repeated-observation fusion with explainable municipal review in an urban fleet setting. We need comparative evidence; simply naming YOLO, DBSCAN or edge AI does not establish originality.

**Evidence to prepare:** Official NHAI prior-art source, matched workflow comparison and fusion error study.

#### Q34. Why does this need AI instead of just geotagged complaints?

**What the jury is testing:** Appropriate technology.

**Honest answer:** Visual triage may automate repeated observation across routes, while complaints provide context and coverage the fleet lacks. We should compare review workload, misses and false alarms. AI should propose evidence for review, not replace every existing reporting channel.

**Evidence to prepare:** Baseline complaint/inspection workflow and matched task/route experiment.

#### Q35. What impact have you actually measured?

**What the jury is testing:** Evidence discipline.

**Honest answer:** The audit demonstrates engineering behavior and failures, not time savings, crash reduction or carbon savings. We must collect operator review time, accepted unique issues, route coverage and action latency before claiming product impact. Until then those are evaluation goals.

**Evidence to prepare:** Pilot protocol, raw observations and explicit results-versus-targets ledger.

#### Q36. What user research have you done?

**What the jury is testing:** Adoption evidence.

**Honest answer:** No verified municipal or fleet-user research was available in the audited materials. We should say so and arrange structured observation of current triage, handoff and maintenance tasks. A UI preference from teammates is not a substitute for domain-user validation.

**Evidence to prepare:** Interview protocol, anonymized notes, task findings and resulting design changes.

#### Q37. Does the full BEL problem statement fit your current product?

**What the jury is testing:** Requirement honesty.

**Honest answer:** Only partially. The road-repair slice is strongest; multiple cameras, infrastructure absence, pedestrian-risk interpretation and incident tracking are incomplete or missing. We should show a capability ledger and obtain priority guidance, not call the entire PS complete.

**Evidence to prepare:** Section 1 PS matrix, official portal export and Plan 3 when supplied.

#### Q38. Could an operator confuse sample and live information?

**What the jury is testing:** Trust and UX.

**Honest answer:** Yes, the audited UI has contradictory source/health indicators and automatic fallback behavior. We need persistent source labels through cards, map, events and exports, plus separate health and data provenance. Empty live data must remain empty.

**Evidence to prepare:** S01/S02 and empty/offline/refresh browser acceptance cases.

#### Q39. How will staff with limited technical training use it?

**What the jury is testing:** Usability.

**Honest answer:** The normal flow should be review issue, inspect evidence, decide and record. API URLs, SQL commands and model internals do not belong there. We need plain labels, reachable controls, language/accessibility validation and a short role-specific onboarding flow.

**Evidence to prepare:** Operator task test, projector/mobile screenshots and accessible form/navigation checks.

#### Q40. Who would pay and who would operate it after SIH?

**What the jury is testing:** Business and operational realism.

**Honest answer:** A transport authority or municipal organization is a plausible buyer/operator, but no verified commitment is established. Costs include integration, devices, connectivity, support and data/model maintenance. We need a pilot sponsor and ownership agreement before claiming adoption or revenue.

**Evidence to prepare:** Cost model, pilot proposal and real stakeholder feedback rather than hypothetical contracts.


### Scalability — 10 questions

#### Q41. What exactly do you mean by 1,000 users?

**What the jury is testing:** Workload definition.

**Honest answer:** We must separate dashboard operators, capture devices and stored observations. One thousand devices can produce very different load depending on event rate and images. We have not measured this scale; the test plan must specify active fraction, rate, payload and retention.

**Evidence to prepare:** Workload specification and ingress/storage formulas from section 10.

#### Q42. Can ten simultaneous operators safely change status today?

**What the jury is testing:** Concurrency correctness.

**Honest answer:** Not proven. Existing global city state, rebuilt cluster identity and unsynchronized changes are risks even at small scale. We need transactional status/history updates and concurrent-client tests before making that claim.

**Evidence to prepare:** Race test, stable-ID regression and authorization/isolation results.

#### Q43. What happens with 1,000 buses reporting simultaneously?

**What the jury is testing:** Ingress and backpressure.

**Honest answer:** Current repeated full-history clustering is a bottleneck. We need one controlled aggregation owner, bounded jobs, idempotent ingestion and measured queue behavior. Adding workers without correcting shared identity/state can increase races rather than solve them.

**Evidence to prepare:** Realistic load test with p95 acknowledgment, queue depth, errors and loss/duplicate rates.

#### Q44. Could this handle 100,000 devices?

**What the jury is testing:** Avoiding speculative capacity claims.

**Honest answer:** We have no evidence for that claim. It requires a workload and cost model, regional isolation, storage/retention planning, controlled fan-out and recovery tests. The immediate goal is a measured route pilot and increasing load without breaking correctness.

**Evidence to prepare:** Staged capacity plan, cost assumptions and explicit unverified capacity label.

#### Q45. Will every dashboard receive every fleet event?

**What the jury is testing:** Network fan-out.

**Honest answer:** It should not. Subscriptions should be scoped by city, role and current view, with aggregate updates where appropriate. Current in-process WebSocket management is not a proven multi-instance delivery design and the connection path itself needs repair.

**Evidence to prepare:** Subscription contract, auth tests and multi-instance delivery design after core fix.

#### Q46. How do you prevent duplicate events after retries?

**What the jury is testing:** Idempotency.

**Honest answer:** The current system lacks a complete event identity guarantee. Generate stable device/event IDs, enforce a database uniqueness constraint and return the same acknowledgment on repeat delivery. Verify across process restart and reordered retries, not only one in-memory request.

**Evidence to prepare:** Retry/restart regression with database counts and original acknowledgment IDs.

#### Q47. How will you add another city or country?

**What the jury is testing:** Configuration versus operational deployment.

**Honest answer:** Configuration is only one step. Data ownership, road/POI inventories, locale, permissions, model conditions and retention must be validated. Current city isolation is broken, so we cannot claim geography-independent operation merely from three JSON records.

**Evidence to prepare:** City isolation test, onboarding checklist and held-out local route evaluation.

#### Q48. How much storage will video and events require?

**What the jury is testing:** Cost and retention.

**Honest answer:** We need measured event/image sizes and rates plus retention rules. Continuous video, selected clips and thumbnails have very different costs. The current packet-size claim does not account for them. Use a stated workload model and measure actual transferred/stored bytes.

**Evidence to prepare:** Route-hour trace, image policy and retention/cost worksheet.

#### Q49. What is your recovery plan if the main server is lost?

**What the jury is testing:** Disaster recovery.

**Honest answer:** A documented backup/restore and device retry plan is required; it was not verified in this audit. Durable observations and outbox acknowledgments must survive restart. For SIH, the local replay/real recording is a presentation fallback, not production disaster recovery.

**Evidence to prepare:** Restore rehearsal, recovery objectives chosen with operator and device reconciliation test.

#### Q50. How do you know a model update did not degrade a city?

**What the jury is testing:** Operational model governance.

**Honest answer:** Freeze version/hash per observation and evaluate updates on representative held-out conditions before rollout. Compare old/new errors, deploy gradually and retain a rollback. This governance is a proposed next step, not a current automated platform capability.

**Evidence to prepare:** Versioned evaluation manifest, rollout/rollback plan and per-condition error comparison.


### Security — 10 questions

#### Q51. Did you commit a real credential?

**What the jury is testing:** Security ownership.

**Honest answer:** A credential-bearing PostgreSQL URL is committed in launch scripts. Its validity was not tested. The right response is rotation/revocation, removal from configuration/history as appropriate and an access review; deleting the current line alone does not contain exposure.

**Evidence to prepare:** Redacted remediation record and secret-scanning result; never display the credential.

#### Q52. Why is an API key in browser code insufficient?

**What the jury is testing:** Trust boundaries.

**Honest answer:** Browser code and public environment variables can be inspected. A shared key is not a user identity or a city-scoped permission. We need server-side operator sessions and separately scoped device credentials, with consistent enforcement across Python, Next and broker paths.

**Evidence to prepare:** Auth architecture and allow/deny tests for each operation/role.

#### Q53. Can someone fabricate road observations?

**What the jury is testing:** Ingestion integrity.

**Honest answer:** Current alternative routes and anonymous MQTT make that a real concern. Authenticated device enrollment, scoped credentials, payload bounds, event identity and anomaly review are needed. Authentication alone still cannot prove a camera observation is true; provenance and review remain important.

**Evidence to prepare:** Unauthorized injection rejection tests and device revocation/enrollment design.

#### Q54. Who can read plate images and location?

**What the jury is testing:** Sensitive-data access.

**Honest answer:** Current incident/RC reads lack adequate operator authorization. We should restrict detail by role/city, minimize list payloads, log access and define retention. We cannot call the existing access model production-ready.

**Evidence to prepare:** Role matrix, redacted payload samples, retention decision and access tests; I16.

#### Q55. Do you use encryption and mutual TLS end to end?

**What the jury is testing:** Claim verification.

**Honest answer:** No verified end-to-end mTLS deployment was shown. A hosted HTTPS page does not prove broker or device mutual authentication. We must state the actual configuration and remove the deck claim until certificates, broker ACLs and connection tests establish it.

**Evidence to prepare:** Redacted endpoint/broker TLS configuration and verification, not a logo or architecture arrow.

#### Q56. Is CORS protecting the API?

**What the jury is testing:** Security fundamentals.

**Honest answer:** CORS controls browser cross-origin access and is not an authorization boundary for arbitrary clients. The inspected rule is not simply a universal wildcard, but authenticated/authorized requests are still required. We should demonstrate permission checks independently of CORS.

**Evidence to prepare:** Direct valid/invalid role/device API tests and intended origin list.

#### Q57. Can you prove there is no injection or XSS?

**What the jury is testing:** Calibrated assurance.

**Honest answer:** No comprehensive absence proof is claimed. SQLAlchemy and escaping are useful safeguards, and no such exploit was demonstrated in the audit. We still need bounded validation, safe rendering/CSV handling and targeted tests, especially as evidence and administrative inputs expand.

**Evidence to prepare:** Reviewed query/render paths, validation tests and security-test scope/limitations.

#### Q58. How do you protect data stored offline?

**What the jury is testing:** Device data handling.

**Honest answer:** A durable outbox is not implemented yet, so its security cannot be claimed. The design should minimize stored sensitive images/plates, restrict access, set retention and use platform-appropriate protection. Losing a device must not expose long-lived shared credentials.

**Evidence to prepare:** Outbox data inventory, device threat model, revocation and deletion/recovery tests.

#### Q59. Are you compliant with all applicable privacy laws?

**What the jury is testing:** Unsupported compliance claims.

**Honest answer:** We have not performed a legal compliance determination. We should document purpose, access, retention and authorized collection and obtain appropriate review before a real deployment. A technical demo and a “sovereign” provider label are not a compliance certificate.

**Evidence to prepare:** Data-flow inventory, authorized pilot scope and qualified review record; no blanket legal claim.

#### Q60. What happens when a device or operator credential is compromised?

**What the jury is testing:** Containment and auditability.

**Honest answer:** We need individual credentials/sessions with revocation and scoped permissions, plus anomaly/access logs. A shared browser key cannot isolate the affected actor well. Re-enrollment and replay protection should be rehearsed without weakening production controls.

**Evidence to prepare:** Revocation test, credential lifecycle and audit-event examples.


### Feasibility — 10 questions

#### Q61. Have you tested on the actual proposed low-cost device?

**What the jury is testing:** Hardware evidence.

**Honest answer:** The audit exercised local model execution and reviewed a benchmark that separates measured Apple Silicon from projected Pi results. It did not establish the claimed low-cost node’s sustained performance. We need the actual device and realistic simultaneous workload.

**Evidence to prepare:** Device/OS/runtime/model manifest, sustained benchmark and thermal/power logs.

#### Q62. Does the complete node really cost under ₹3,000?

**What the jury is testing:** Unit economics.

**Honest answer:** That is not substantiated by a complete current BOM. The UI/decks reference different devices and prices. Include camera, power conversion, mount/enclosure, storage, connectivity, tax/shipping and replacement/support assumptions before quoting a target or actual cost.

**Evidence to prepare:** Dated supplier-backed BOM and recurring cost assumptions; no unsupported price guarantee.

#### Q63. How will cameras and power be installed on a bus?

**What the jury is testing:** Operational integration.

**Honest answer:** We need fleet approval and a qualified installation plan for mounting, vibration, weather, wiring and safe operation. This software audit did not verify vehicle installation or automotive suitability. Do not claim certified deployment from a hardware illustration.

**Evidence to prepare:** Authorized installation plan, compatibility inventory and representative field test.

#### Q64. Will it work at night or in rain?

**What the jury is testing:** Domain robustness.

**Honest answer:** That performance is unverified. We should evaluate representative held-out wet/night/glare/blur conditions and publish failure examples, not assume dataset training covers them. If reliability is insufficient, mark conditions unsupported and abstain rather than generate confident alerts.

**Evidence to prepare:** Condition-labelled evaluation, examples and threshold/abstention policy.

#### Q65. Can it keep working with intermittent cellular service?

**What the jury is testing:** Connectivity realism.

**Honest answer:** Only after durable queue/acknowledgment behavior is implemented and tested. The current UI’s buffering claim is not enough. For SIH we can use a clearly labelled local replay, but that does not prove remote offline synchronization.

**Evidence to prepare:** Disconnect/power-cycle/reconnect test and route-hour bandwidth trace.

#### Q66. Will your printed demonstration card work reliably?

**What the jury is testing:** Rehearsal quality.

**Honest answer:** The supplied pothole card produced zero detections in the audited direct-image smoke. Physical-phone performance is still unverified. Validate a known positive and negative sample on the actual camera/device; use labelled recorded input if that is the reliable supported path.

**Evidence to prepare:** Actual-device rehearsal video with model hash/threshold, including misses; R10/P4-08.

#### Q67. Have any municipal users agreed to a pilot?

**What the jury is testing:** Real adoption.

**Honest answer:** No verified commitment was available. We should present a pilot proposal and actual conversations only after they occur, not imply BEL or a contractor is already a customer. Start with a bounded route/task and named operational owner.

**Evidence to prepare:** Authentic pilot correspondence or meeting notes, agreed scope and success criteria.

#### Q68. How much manual review will this create?

**What the jury is testing:** Operational workload.

**Honest answer:** Unknown until we measure false positives, duplicate reduction and operator review time on realistic routes. A detector with many alerts can increase work. We should cap/triage review queues and measure accepted unique issues per reviewer-hour rather than celebrate raw detections.

**Evidence to prepare:** Adjudicated route dataset, queue volumes and timed user task study.

#### Q69. What must be maintained each month?

**What the jury is testing:** Long-term sustainability.

**Honest answer:** Camera cleaning/alignment, device/power checks, connectivity, backend updates, data retention and model monitoring all need owners and cost. Existing journeys do not make these free. We need a maintenance schedule and measured failure/replacement assumptions.

**Evidence to prepare:** Operational runbook, role ownership and vehicle-month cost model.

#### Q70. What will you prove in the first pilot?

**What the jury is testing:** A bounded achievable next step.

**Honest answer:** Use a limited agreed route/fleet sample to test capture coverage, unique-defect quality, acknowledgment reliability and review usability. Choose criteria with the operator before collection and report misses. Do not promise accident reduction from a short pilot.

**Evidence to prepare:** Pilot protocol, baseline, annotation process, acceptance gates and limitations.


### Why didn't you — 10 questions

#### Q71. Why didn’t you use a larger, more accurate model?

**What the jury is testing:** Resource tradeoff.

**Honest answer:** A larger model may improve some accuracy but increases latency, energy and deployment cost. We should compare candidates on the actual workload/device and choose by measured tradeoff. The current small model is a starting point, not proof it is optimal.

**Evidence to prepare:** Paired model benchmark and task-level error/cost comparison.

#### Q72. Why didn’t you stream all video to the cloud?

**What the jury is testing:** Edge rationale.

**Honest answer:** Selected event processing may reduce bandwidth and central compute, but local inference and evidence retention have costs. We should measure the same route with a declared video baseline and event policy. Current saving percentages are not enough.

**Evidence to prepare:** Bandwidth/power/evidence-quality comparison including images and retries.

#### Q73. Why didn’t you use LiDAR to measure pothole depth?

**What the jury is testing:** Measurement validity.

**Honest answer:** Depth sensing could help geometry but changes cost, calibration and installation. The current camera model does not establish metric depth; static millimetre readouts should be removed. We should not claim to replace survey-grade measurement without an appropriate comparison.

**Evidence to prepare:** Sensor scope statement, calibrated measurement study if later implemented.

#### Q74. Why didn’t you just use the existing government system?

**What the jury is testing:** Differentiation and interoperability.

**Honest answer:** We must understand actual systems and their access/workflow constraints before claiming a gap. Our proposed niche is repeated urban-fleet evidence and operator review. Integration is future work unless authorized APIs and working exchanges are demonstrated.

**Evidence to prepare:** Stakeholder workflow study, prior-art comparison and verified integration contract if available.

#### Q75. Why didn’t you implement every problem-statement feature?

**What the jury is testing:** Scope judgment.

**Honest answer:** The current entry prioritizes road-repair observations and has material gaps elsewhere. We should acknowledge them and obtain sponsor priorities, not declare full compliance. Broad but unvalidated incident/infrastructure claims would weaken the entry more than a clearly stated boundary.

**Evidence to prepare:** PS obligation matrix, missing Plan 3 and agreed staged scope.

#### Q76. Why didn’t you use microservices or Kubernetes?

**What the jury is testing:** Avoiding architecture theatre.

**Honest answer:** They are not needed to repair the current correctness problems. A clear ingestion service, stable data and measured worker responsibilities are sufficient for the immediate prototype/pilot. Split further only when independent scaling, ownership or reliability needs justify the operational cost.

**Evidence to prepare:** Measured bottlenecks and an incremental deployment diagram.

#### Q77. Why didn’t you add blockchain for immutable repair records?

**What the jury is testing:** Appropriate accountability mechanism.

**Honest answer:** First implement authenticated append-only decision history, evidence retention and audit access. Blockchain does not prove that an image or repair claim is true. The current status field is not immutable, and we should not add a ledger label to conceal that gap.

**Evidence to prepare:** Threat model and tested history/evidence workflow.

#### Q78. Why didn’t you build a native mobile app?

**What the jury is testing:** Delivery choice.

**Honest answer:** A PWA can reduce installation friction, but camera, background execution, thermal and offline behavior must be tested on target browsers. If those limitations block required use, a native component may be justified later. Rewriting before measuring would add risk.

**Evidence to prepare:** Actual-device capability matrix and requirements that PWA cannot meet, if any.

#### Q79. Why didn’t you validate the RPI with a road engineer first?

**What the jury is testing:** Domain grounding.

**Honest answer:** That validation is a gap. The current weights are a transparent prototype policy, not an approved standard. We should seek expert review, compare ranking to independent judgments and document overrides/sensitivity before using it for real allocation.

**Evidence to prepare:** Domain review and ranking/sensitivity study.

#### Q80. Why didn’t you put every feature in the live demo?

**What the jury is testing:** Communication discipline.

**Honest answer:** A short demo should prove the supported core chain and disclose the wider capability boundary. Extra screens do not replace evidence. We will keep technical and incomplete features in the appendix and answer directly when asked, rather than imply they are complete.

**Evidence to prepare:** Timed runbook, capability ledger and accessible appendix evidence.


### Weakness exposure — 10 questions

#### Q81. What happens if I disconnect the internet right now?

**What the jury is testing:** Honest failure behavior.

**Honest answer:** The present build does not prove durable offline delivery. We should show the actual failure and distinguish cached/sample information from accepted events. A local replay or recorded session can continue explanation, but we must announce that switch and not claim successful online ingestion.

**Evidence to prepare:** Failure-state screenshot and rehearsed backup; outbox test only after implementation.

#### Q82. Why does the dashboard say LIVE while another part says demo?

**What the jury is testing:** Truth consistency.

**Honest answer:** That is a confirmed state/provenance defect, not a reliable live indication. Health and data source are conflated in the current UI. We need one state contract and no automatic seed substitution in live mode; until fixed, those displays cannot prove operation.

**Evidence to prepare:** S01, empty-DB reproduction and repaired state tests; I10.

#### Q83. Why did you report 100% passing tests when one fails?

**What the jury is testing:** Candor and evidence scope.

**Honest answer:** We should not report that. The audited full run was 61 passed and one failed, and root CI failed separately. Earlier counts referred to different/stale scopes. The presentation must show the current command, environment and result with failures disclosed.

**Evidence to prepare:** Timestamped full test output and CI link; E02/I07.

#### Q84. Are those buses really transmitting from the street?

**What the jury is testing:** Simulation disclosure.

**Honest answer:** The default five-node dataset is seeded, and the audit did not establish an installed live fleet. We should label it sample data. Only actual enrolled devices with timestamped authenticated observations may be described as live fleet evidence.

**Evidence to prepare:** Device enrollment/source records, recent acknowledgments and dataset label.

#### Q85. Can you prove that pressing ASSIGNED contacted a contractor?

**What the jury is testing:** Workflow overclaim.

**Honest answer:** No. The current local action persists a status field; it does not establish an external message or crew dispatch. We should say “status recorded” and implement/verify a real authorized handoff separately before using dispatch wording.

**Evidence to prepare:** Status API/DB trace and explicit absence of external dispatch integration; R11.

#### Q86. Why does the report contain old or wrong-city records?

**What the jury is testing:** Data correctness.

**Honest answer:** Those are confirmed scoping defects in the current query/report chain. The report must be repaired and checked against hand-computed city/date/duplicate fixtures before it supports a maintenance decision. A well-formatted PDF does not excuse incorrect totals.

**Evidence to prepare:** R04–R07 and corrected report reconciliation fixture; I03/I04.

#### Q87. If these two defects are 20 metres apart, will closing one close the other?

**What the jury is testing:** Counterexample robustness.

**Honest answer:** The audit reproduced incorrect resolution transfer after clustering. We cannot promise independence with the current implementation. Stable identity and regression tests for nearby distinct defects, merges and splits are mandatory before demonstrating reliable work-order continuity.

**Evidence to prepare:** R09 before/after statuses and fixed identity regression.

#### Q88. Is your backup video an actual recording of this product?

**What the jury is testing:** Demonstration authenticity.

**Honest answer:** The shipped failsafe is a programmatically drawn animation, not proof of the running application. It should be called a concept animation. Replace it with a real dated recording of the validated build, and announce when the demo switches to recording.

**Evidence to prepare:** Recording provenance, build hash and actual end-to-end replay; E05/I18.

#### Q89. Can you prove your claimed crash or carbon reduction?

**What the jury is testing:** Causal impact evidence.

**Honest answer:** No current project evidence establishes those outcomes. They must be removed as achieved results. A short route pilot can measure coverage, review quality and workflow time; safety/environmental effects need a suitable longer study and baseline.

**Evidence to prepare:** Claim ledger and impact measurement protocol, not extrapolated marketing numbers.

#### Q90. Why should we trust the rest of the project after finding these gaps?

**What the jury is testing:** Engineering ownership and learning.

**Honest answer:** Trust should come from precise scope, disclosed failures and reproducible evidence, not assurance. We should correct unsupported claims, show a stable tested core and explain remaining gaps with owners and acceptance gates. If those repairs are not done, the jury should regard this as an unfinished prototype.

**Evidence to prepare:** Corrected canonical deck, current evidence packet, regression results and roadmap gates.

