# Verification notes

All mutation tests targeted local disposable SQLite data. No production records were altered. Audit source commit: ae9ec7ba678feb4db366a1058fa55509761fb9e9.

- Frontend: npm ci; npm run build. Passed on bundled Node runtime. Next.js 14.2.35.
- Backend: isolated virtual environment with backend and dev requirements, plus ONNX Runtime for model inspection. DATABASE_URL explicitly targeted local test SQLite.
- Full test command from repository root: `python -m pytest tests/ vigilance-prototype/backend/ -q --tb=short`.
- Result: 61 passed, 1 failed, 121 warnings, 6.50 s. Failure: backend/test_api.py::TestBackendAPI::test_detections_and_clusters_flow; 401 while test expects 200/201.
- TestClient reproductions: temporary in-memory SQLite session override; rate limiter disabled; Celery enqueue stubbed. These isolate logic, not broker or concurrency behavior.
- Browser: published app inspected read-only; local app tested against separate runtime SQLite database. A local work-order status update was persisted and a local city switch was observed.
- Model inference: actual shipped INT8 road model; provided pothole card produced zero boxes at 0.45 and 0.25. This is not a validation-set accuracy result.
- Media: OpenCV decoded videos; metadata recorded in media-summary.json. Both decks inspected via OOXML text/media inventory; full slide rendering not verified.
- npm audit: package advisory results stored in npm-audit.json; no exploitation attempted.

The JSON evidence intentionally includes only synthetic/local fixture observations. Credential values are not reproduced. The exposed PostgreSQL credential was never used to authenticate.
