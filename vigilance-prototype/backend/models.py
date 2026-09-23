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


class TrafficObservation(Base):
    """
    Fleet traffic flow & pedestrian density observation.
    Captures vehicle counts, pedestrian counts, and localized corridor congestion.
    """
    __tablename__ = "traffic_observations"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float, nullable=False, index=True)
    lon = Column(Float, nullable=False, index=True)
    vehicle_count = Column(Integer, default=0)
    pedestrian_count = Column(Integer, default=0)
    density = Column(String, default="free_flow")  # free_flow, light, moderate, heavy, gridlock
    speed_kmh = Column(Float, nullable=True)
    road_name = Column(String, nullable=True, index=True)
    vehicle_id = Column(String, nullable=True, index=True)  # reporting bus ID
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    if GEOALCHEMY_AVAILABLE and IS_POSTGRES:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)


class IncidentReport(Base):
    """
    Real-time safety and enforcement incident telemetry (rash driving, hit-and-run, ANPR events).
    """
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String, nullable=False, index=True)  # rash_driving, hit_and_run, speeding, wrong_way, plate_detected
    plate_text = Column(String, nullable=True, index=True)
    plate_confidence = Column(Float, nullable=True)
    vehicle_class = Column(String, nullable=True)  # car, truck, motorcycle, bus
    lat = Column(Float, nullable=False, index=True)
    lon = Column(Float, nullable=False, index=True)
    road_name = Column(String, nullable=True, index=True)
    speed_kmh = Column(Float, nullable=True)
    reporter_vehicle_id = Column(String, nullable=True, index=True)
    image_b64 = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, default="reported", index=True)  # reported, verified, actioned

    if GEOALCHEMY_AVAILABLE and IS_POSTGRES:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)


class FleetPosition(Base):
    """
    Live telematics position from public transit vehicles via MQTT/HTTP heartbeats.
    """
    __tablename__ = "fleet_positions"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, nullable=False, index=True)
    lat = Column(Float, nullable=False, index=True)
    lon = Column(Float, nullable=False, index=True)
    speed_kmh = Column(Float, default=0.0)
    heading = Column(Float, nullable=True)
    road_name = Column(String, nullable=True, index=True)
    status = Column(String, default="active", index=True)  # active, idle, maintenance
    last_detection_type = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    if GEOALCHEMY_AVAILABLE and IS_POSTGRES:
        geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)

