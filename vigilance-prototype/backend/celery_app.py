import os
import sys

sys.path.append(os.path.dirname(__file__))

try:
    from celery import Celery
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    class DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(f):
                f.delay = lambda *a, **kw: type('DummyTask', (), {'id': 'in_process'})()
                return f
            return decorator
        def conf(self): pass
        def update(self, *args, **kwargs): pass

# Use REDIS_URL if provided, else fallback to robust SQLite broker for standalone execution
REDIS_URL = os.getenv("REDIS_URL")
if CELERY_AVAILABLE:
    if not REDIS_URL:
        broker_db = os.path.join(os.path.dirname(__file__), "celery_broker.db")
        broker_url = f"sqla+sqlite:///{broker_db}"
        backend_url = f"db+sqlite:///{broker_db}"
    else:
        broker_url = REDIS_URL
        backend_url = REDIS_URL

    celery_app = Celery(
        "vigilance_tasks",
        broker=broker_url,
        backend=backend_url,
        include=["tasks"]
    )

    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        worker_concurrency=2
    )
else:
    celery_app = DummyCelery()
