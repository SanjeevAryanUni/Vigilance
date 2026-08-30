import os
import sys
import logging

sys.path.append(os.path.dirname(__file__))

from celery_app import celery_app
from database import SessionLocal, run_spatial_deduplication

logger = logging.getLogger(__name__)

@celery_app.task(name="tasks.async_spatial_deduplication")
def async_spatial_deduplication():
    """
    Asynchronous Celery task for running DBSCAN spatial deduplication and RPI recalculation.
    """
    logger.info("[CELERY WORKER] Executing async DBSCAN spatial clustering and RPI prioritization...")
    db = SessionLocal()
    try:
        updated_clusters_count = run_spatial_deduplication(db)
        logger.info(f"[CELERY WORKER] Completed spatial clustering: {updated_clusters_count} clusters updated.")
        return {"status": "SUCCESS", "clusters_updated": updated_clusters_count}
    except Exception as e:
        logger.error(f"[CELERY WORKER] Deduplication failed: {e}")
        return {"status": "FAILURE", "error": str(e)}
    finally:
        db.close()
