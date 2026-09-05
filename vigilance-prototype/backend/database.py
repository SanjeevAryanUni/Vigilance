"""
VIGILANCE — Urban Road Intelligence Platform
Database Connection, Session Management & Schema Initialization
"""

import os
import sys

# Ensure backend directory is in path for local module resolution
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import domain models, RPI calculator, and spatial deduplication from decoupled modules
from models import Base, Detection, Cluster, GEOALCHEMY_AVAILABLE, IS_POSTGRES
from rpi_calculator import compute_rpi, get_rpi_breakdown
from dbscan_dedup import run_spatial_deduplication
from poi_data import haversine_meters, get_road_weight, get_proximity_weight, get_contractor, match_nearest_road

DB_PATH = os.path.join(os.path.dirname(__file__), "vigilance.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(target_engine=None):
    """
    Initializes database schema.
    - If PostgreSQL, ensures the postgis extension is created.
    - Creates all tables (detections, clusters).
    - If SQLite, executes schema auto-migration to guarantee all columns exist.
    """
    eng = target_engine or engine
    db_url_str = str(eng.url)

    if "postgresql" in db_url_str:
        try:
            with eng.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
        except Exception:
            pass

    Base.metadata.create_all(bind=eng)

    # SQLite Auto-Migration: ensure newly added columns exist in older database files
    if "sqlite" in db_url_str:
        try:
            with eng.connect() as conn:
                # Check existing columns in clusters table
                cols_result = conn.execute(text("PRAGMA table_info(clusters);")).fetchall()
                existing_cols = {col[1] for col in cols_result}

                migration_cols = [
                    ("contractor_name", "VARCHAR DEFAULT 'Greater Chennai PWD'"),
                    ("contractor_contact", "VARCHAR DEFAULT '+91 44 2538 4520'"),
                    ("sla_hours", "INTEGER DEFAULT 48"),
                    ("nearest_poi", "VARCHAR DEFAULT 'General Area'"),
                    ("poi_distance_m", "FLOAT DEFAULT 0.0"),
                    ("road_name", "VARCHAR DEFAULT 'GST Road, Chennai'")
                ]

                for col_name, col_def in migration_cols:
                    if col_name not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE clusters ADD COLUMN {col_name} {col_def};"))
                            conn.commit()
                        except Exception:
                            pass
        except Exception:
            pass


def get_db():
    """FastAPI Dependency for database session injection with proper closing."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
