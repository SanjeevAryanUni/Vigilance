# VIGILANCE — government resources worth integrating

Checked 28 September 2026 against the source previously audited at commit `ae9ec7ba678feb4db366a1058fa55509761fb9e9`. This is a feasibility review and implementation brief. No account was registered, GPU booked, personal data queried, application deployed, repository changed or PPT edited.

**Recommendation:** first build a useful city map with verified municipal boundaries and clear observation evidence; replace unsourced statistics with a reproducible government-data import; then use AIKosh compute for a documented model experiment. Keep approval-dependent identity/vehicle services outside the critical demo path until access is actually granted.

Government resources strengthen the entry when they improve a decision or supply measurable evidence. A provider name alone does not establish novelty, security, accuracy or an SIH scoring advantage.

## What to use, and why

| Resource | Useful VIGILANCE application | What was verified | Decision |
|---|---|---|---|
| Greater Chennai Corporation GIS | Ward/zone overlays, ward filtering and summaries of unique road issues | Public ward metadata and one GeoJSON polygon query succeeded | Best immediate mapping candidate; confirm effective boundary date and reuse terms before release |
| data.gov.in | Sourced road-safety context and potentially verified facility locations | Official catalog/help descriptions; selected resource access failed | Build a versioned import only after validating an actual resource file/API response |
| AIKosh datasets/models | Discover relevant training/evaluation resources and optional language capabilities | Public catalog and targeted searches inspected; no suitable replacement road-defect model established | Choose by task fit and model/data license, not portal branding |
| AIKosh notebooks / AIRAWAT | Reproducible small-model evaluation or fine-tuning experiment | Current public compute policy inspected | Useful experimentation route; account access, slot availability and your job are unverified |
| IndiaAI Compute | Larger or longer training runs | Student category and verification/request process published | Alternative when notebook limits are insufficient; approval and cost depend on the request |
| API Setu | A specific approved service or document exchange | Publisher-approved subscription model documented | Conditional, not an automatic VIGILANCE authentication solution |
| MeriPehchaan | Government SSO if the application becomes an approved partner | National SSO and partner integration documentation exist | Future authorized integration; retain application roles and device security |
| Bhuvan / NRSC | Optional thematic context, such as a relevant land-use or flood layer | WMS/WMTS documented; inspected endpoint timed out | Optional overlay after coverage, date, license and rendering checks; not the sole demo basemap |

## Map: the strongest concrete opportunity

The [GCC public administrative-boundary service](https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCPublic/GCC_AdminBoundary/MapServer) exposes region, zone and ward layers. A read-only query to [Ward_Boundary, layer 4](https://gisgcc.chennaicorporation.gov.in/server/rest/services/GCCPublic/GCC_AdminBoundary/MapServer/4) returned HTTP 200 and a GeoJSON polygon with `ward: "169"`. The response also allowed the VIGILANCE origin in its CORS header. This is a successful **one-feature API test**, not a completed app integration or validation of the whole dataset. Evidence: [sample check](evidence/gcc_ward_sample_check.json).

Build this proposed workflow:

1. Select Chennai and see its actual operating extent; fix the existing city/map mismatch first.
2. Switch on **Ward boundaries**. Keep the street background quiet, with readable road labels and a flat default view.
3. Select a ward and filter the same issue list/map/report population.
4. Select an issue to see source frame, observation time, distinct sightings, location uncertainty and actual priority factors.
5. Show open/critical **unique issues** and last-observed coverage per ward. Separate raw sightings from repair work.

The resulting demonstration is: “This observation falls within this ward; here is the supporting evidence and review priority.” A ward does **not** establish road ownership or the responsible contractor. Chennai city bounds also do not include every metropolitan/suburban route: return “outside supported boundary” where appropriate.

Implementation uses the existing MapLibre renderer, which already supports [GeoJSON polygons](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-polygon/). The source GIS uses EPSG:32644; request `outSR=4326` for GeoJSON, as in the successful test. Validate coordinate order and polygon geometry; handle pagination, boundary points and unsupported areas. Retain full geometry for assignment and a simplified copy for display. Store provider, URL, boundary version/effective date and fetch time. Source/date unknown must remain unknown.

Suggested code changes: `WebGISMap.tsx`, `constants.ts`, city context, a server-side boundary loader and the issue/report query path. Pass city and boundary data into the map instead of depending on `CHENNAI_CENTER` and `CHENNAI_POIS`. Use one shared filter state, a small layers menu and a source-information panel. A permitted cached snapshot can support the demo, but must be labelled with its age.

### Bhuvan is already in your source

[`WebGISMap.tsx:101`](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/dashboard-next/src/components/WebGISMap.tsx#L101) already defines a Bhuvan option using WMS layer `india3`. Adding another ISRO button would duplicate existing UI. My capabilities request timed out after 20 seconds; that does not prove the layer is invalid or permanently unavailable. [Check record](evidence/bhuvan_capabilities_check.json).

NRSC documents [thematic layers and OGC integration](https://www.nrsc.gov.in/nrscnew/Dataproducts_Thematic_overview.php), including land use and flood-related products. Select an actual layer for the pilot geography and inspect its date, resolution, terms and service capabilities. A historical flood layer is not live waterlogging detection, and satellite context does not establish pothole depth. MapLibre also has a supported [WMS integration pattern](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-wms-source/), so no renderer rewrite is necessary.

## data.gov.in: replace unsupported numbers with traceable data

Your [`data_gov_client.py`](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/data_gov_client.py) returns a fixed dictionary. It defines an API key/base URL but makes no data.gov.in request. Its numbers therefore are not proof of a working government-data integration.

The [OGD help page](https://www.data.gov.in/help) describes API-key generation for registered users. Use the selected resource's actual schema and access method; do not invent a resource UUID, API quota or refresh frequency. Some pages were inaccessible during this review, and the retrieved help page itself carried a sandbox notice. Resource-level validation remains necessary before depending on a feed.

| Candidate located | Appropriate use | Important limit |
|---|---|---|
| [Health Infrastructure: Chennai](https://odisha.data.gov.in/catalog/health-infrastructure-chennai) | Facility/ward context, subject to checking the underlying data | Indexed official catalog describes ward-wise facilities; row contents and coordinates were not verified. Portal update time does not establish observation date. |
| [Tamil Nadu municipal ward details](https://tn.data.gov.in/catalog/ward-details-municipalities-within-tamil-nadu) | Administrative background only if still relevant | Describes counts, council strength and reservations; it is not a ward polygon dataset. |
| [Pothole-related accidents in Bengaluru and Mumbai, 2020](https://karnataka.data.gov.in/resource/city-wise-accidents-and-deaths-roads-cities-bengaluru-and-mumbai-account-potholes-during) | Historical problem context with year and geography stated | Catalog located; underlying rows not validated here. It cannot supply current Chennai pothole locations. |
| National Hospital Directory with geocodes | Candidate for replacing hand-entered hospital POIs | The inspected resource URL returned HTTP 503 in the browser. Current availability, completeness and coordinates remain unverified. |

For the implementation, use a backend importer with bounded timeout, schema checks and a last-good snapshot. Store resource ID, publisher, source URL, reporting period, units, geography, license, retrieval time and checksum. Retain unknown values rather than converting them to zero. Test one imported total against the original file, and distinguish state statistics from city statistics in both UI and PDF. Keep API keys on the server.

Only place a hospital on the map after validating a location record. Never turn a city/state aggregate into an invented point or silently geocode every missing address. Prioritization based on proximity also needs an explicit, reviewable distance policy.

## AIKosh: genuine compute opportunity, selective dataset use

The current [AIKosh notebook page](https://aikosh.indiaai.gov.in/home/notebook) advertises AIRAWAT-backed pilot access: a free, self-service basic tier with four-hour sessions on a 5 GB A100 profile, limited to three basic slots per week; an advanced tier offers a 20 GB profile for 22 hours with approval and advance booking. Capacity is conditional. Files are deleted when sessions terminate, and uploads have a defined preparation window. I inspected the public policy; I did not sign in or launch a job. [Observation summary](evidence/aikosh-notebook-summary.json).

The most useful experiment is to evaluate the shipped road model and a bounded fine-tuned candidate on the **same held-out route data**. Save dataset split, labels, model hash, settings, per-class errors and raw metrics. Export artifacts before expiry. Then separately benchmark the chosen model on the actual edge device; cloud GPU speed is not Raspberry Pi or phone speed. Small-batch inference/evaluation may fit the basic profile, but model/framework memory must be tested before promising a training run.

Targeted AIKosh dataset searches for potholes and driving surfaced statistical/documentary resources; they did not establish a suitable labelled road-damage image dataset. This was not an exhaustive absence proof. One concrete entry is [NCRB traffic-accident casualties for 2021](https://aikosh.indiaai.gov.in/home/datasets/details/traffic_accident_casualties_2021.html), a structured statistical dataset. That may support dated context; it does not train image bounding boxes. Preserve RDD2022 and obtain representative route labels unless a better licensed dataset is actually verified.

The model catalog includes language/speech resources. A future Tamil/English maintenance-summary aid could help operators, but validate the original model card, license, task and output fidelity first. Do not replace a road detector with a general language model or add a chatbot merely to mention AIKosh.

For larger jobs, [IndiaAI Compute](https://compute.indiaai.gov.in/login) is a separate route. Its [eligibility page](https://compute.indiaai.gov.in/eligibilitycriteria) lists students with relevant projects/academic profiles. Registration verification precedes compute requests; subsidy does not guarantee zero cost. Your eligibility, approval, allocation and final bill were not verified.

## API Setu and authentication: two separate jobs

[API Setu's official workflow](https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html) describes discovery, subscription and publisher approval. Its [SOP](https://apisetu.gov.in/sop) links onboarding guides. Availability in a directory is not permission to query it. Exact endpoint, fields, credential flow, sandbox access and allowed purpose must come from the approved provider documentation.

Your [`api_setu_client.py`](https://github.com/SanjeevAryanUni/Vigilance/blob/ae9ec7ba678feb4db366a1058fa55509761fb9e9/vigilance-prototype/backend/api_setu_client.py) currently returns sample vehicle records without credentials, advertises OAuth/mTLS in its response and otherwise constructs an unverified `/transport/rc/...` call using headers. It does not implement an OAuth token exchange or configure client certificates. Remove these capability claims until the actual integration is tested.

Recommended scope: defer vehicle-owner lookup unless it is required by the agreed PS demonstration and you obtain a suitable authorized API. Plate OCR, identity verification and evidence of an offense are different things. Provider [permitted-use terms](https://docs.apisetu.gov.in/document-central/terms-of-use/Permitted%20Use%20and%20Access.html) and [consent/access restrictions](https://docs.apisetu.gov.in/document-central/terms-of-use/Access%20Restrictions.html) apply to personal-data use; an arbitrary ANPR plate is not consent or permission.

For government SSO, investigate [MeriPehchaan](https://meripehchaan.gov.in/) and its [application-onboarding documentation](https://meripehchaan.gov.in/Documentation). Application partnership is separate from having a citizen account. Even after SSO, VIGILANCE must decide who may view a city, change a status or read a plate. Capture devices need their own scoped credentials. Fix those access boundaries now; do not wait for government onboarding to secure the prototype.

## Implementation order and evidence gates

These are engineering planning estimates, excluding external approvals and data licensing checks.

| Order | Deliverable | Rough effort | Proof before adding it to the demo |
|---|---|---|---|
| 1 | Correct city/extent, clearer map hierarchy, one issue-evidence path | 1–2 focused days | City/map/list agree; no source-label ambiguity; laptop/mobile usable |
| 2 | Versioned GCC ward overlay and matching issue filter/summary | 1–2 days after dataset validation | Known inside/outside/boundary cases; same counts in list/map/export; source/date visible |
| 3 | One genuine OGD import replacing static “official” statistics | 0.5–1.5 days after a usable resource is obtained | Original-file reconciliation, geography/year/units correct, failure retains labelled snapshot |
| 4 | One AIKosh model experiment | Preparation plus available slot; training duration unknown | Saved notebook, run configuration, model/dataset hashes and actual comparative results |
| 5 | Approved API Setu/SSO adapter if truly needed | Estimate only after access and contract review | Real authorized sandbox/production response, role enforcement and safe failure behavior |

Do not expand the number of dashboards to accommodate providers. Add context to the existing issue-review path. Keep third-party lookups and optional layers from blocking local ingestion or the repair queue.

## What to put in the PPT

Use one compact slide titled **“Government data and infrastructure: verified use and next steps.”** Separate operational data, model-development resources and external services. Today, the honest status is: municipal boundary API sample verified; OGD resource validation pending; AIKosh compute option verified but no VIGILANCE job run; API Setu/SSO integration not established.

After implementation and acceptance, use statements of this form:

- “Imported **[publisher, resource/version, date]** to show ward-level issue summaries; the displayed defect observations come from VIGILANCE.”
- “Evaluated **[model hash]** on **[held-out dataset/version]** using **[actual compute profile]**; measured **[metric and conditions]**.”
- “Connected to **[named API]** in **[sandbox/production]** for **[approved purpose]**; unavailable requests fail explicitly.”

Keep the brackets until evidence exists. A downloaded CSV is a dataset import; a notebook session is model-development compute; a successful approved API exchange is an integration. None establishes government endorsement, complete security or field impact. The best slide evidence is a source-labelled screen and a reproducible result, with provider attribution placed beside the specific contribution.
