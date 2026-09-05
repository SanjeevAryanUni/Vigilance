"""
VIGILANCE — Urban Road Intelligence Platform
SQLAlchemy ORM Domain Models
"""

import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base

try:
    from geoalchemy2 import Geometry
    GEOALCHEMY_AVAILABLE = True
except ImportError:
    GEOALCHEMY_AVAILABLE = False

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_POSTGRES = "postgresql" in DATABASE_URL

Base = declarative_base()


class Detection(Base):
    """
    Individual defect detection telemetry received from edge vehicle perception nodes.
    Supports RDD2022 taxonomy: D00 (Longitudinal), D10 (Transverse), D20 (Alligator), D40 (Pothole).
    """
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    defect_type = Column(String, index=True)      # D00, D10, D20, D40
    confidence = Column(Float)                    # 0.0 - 1.0
    severity = Column(String, index=True)         # low, medium, high, critical
    vehicle_id = Column(String, index=True)       # e.g., BUS-TN01-1042
    timestamp = Column(DateTime, default=datetime.utcnow)
    lat = Column(Float, index=True)
    lon = Column(Float, index=True)
    cluster_id = Column(Integer, nullable=True, index=True)
    thumbnail_b64 = Column(Text, nullable=True)
    road_name = Column(String, default="GST Road, Chennai")

    if GEOALCHEMY_AVAILABLE and IS_POSTGRES:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)


class Cluster(Base):
    """
    Spatially deduplicated road distress incident (15m radius DBSCAN cluster).
    Aggregates recurring vehicle detections and computes dynamic Repair Prioritization Index (RPI).
    """
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    centroid_lat = Column(Float)
    centroid_lon = Column(Float)
    detection_count = Column(Integer, default=1)
    dominant_type = Column(String)
    max_severity = Column(String)
    rpi_score = Column(Float, default=0.0)       # 10.0 - 100.0
    status = Column(String, default="open")      # open, assigned, resolved
    road_name = Column(String, default="GST Road, Chennai")
    nearest_poi = Column(String, default="General Area")
    poi_distance_m = Column(Float, default=0.0)
    contractor_name = Column(String, default="Greater Chennai PWD")
    contractor_contact = Column(String, default="+91 44 2538 4520")
    sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    if GEOALCHEMY_AVAILABLE and IS_POSTGRES:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
