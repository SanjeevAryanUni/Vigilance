import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

import json
import asyncio
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from database import init_db, get_db, Detection, Cluster, run_spatial_deduplication, IS_POSTGRES
from poi_data import match_nearest_road
from tasks import async_spatial_deduplication

# Lifespan Context Manager (Modern FastAPI pattern)
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="VIGILANCE Urban Road Intelligence API",
    description="Edge-first road distress detection, DBSCAN spatial deduplication, and RPI prioritization platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration: Whitelist localhost, Vercel production & preview deployments
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://vigilance-sih.vercel.app",
        "https://vigilance-prototype.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Input Validation Models
class DetectionIn(BaseModel):
    defect_type: str = Field(..., description="RDD2022 defect type: D00, D10, D20, D40, or generic Pothole/Crack")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Inference confidence score")
    severity: str = Field(..., description="Severity category: low, medium, high, critical")
    vehicle_id: str = Field(..., description="Reporting transit node identifier")
    lat: float = Field(..., ge=-90.0, le=90.0, description="WGS84 Latitude")
    lon: float = Field(..., ge=-180.0, le=180.0, description="WGS84 Longitude")
    road_name: Optional[str] = Field(None, description="Road corridor name")
    thumbnail_b64: Optional[str] = Field(None, max_length=500000, description="Base64 encoded defect thumbnail (max 500KB)")

    @field_validator("lat")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90.0 and 90.0")
        return v

    @field_validator("lon")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180.0 and 180.0")
        return v

class DetectFrameIn(BaseModel):
    image_b64: str = Field(..., description="Base64 encoded JPEG/PNG frame")
    lat: Optional[float] = Field(12.8231, ge=-90.0, le=90.0)
    lon: Optional[float] = Field(80.0442, ge=-180.0, le=180.0)
    vehicle_id: Optional[str] = Field("MOBILE-NODE-01", description="Vehicle identifier")

# Edge Detector Singleton
_detector_instance = None

def get_detector():
    global _detector_instance
    if _detector_instance is None:
        try:
            edge_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "edge"))
            if edge_dir not in sys.path:
                sys.path.insert(0, edge_dir)
            from detector import RoadDamageDetector
            _detector_instance = RoadDamageDetector(conf_threshold=0.25)
        except Exception as e:
            print(f"Warning initializing RoadDamageDetector: {e}")
    return _detector_instance

# Optional API Key Authentication Helper
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    required_key = os.getenv("API_KEY")
    if required_key and x_api_key != required_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")
    return True

# API Endpoints
@app.post("/api/detect")
async def detect_frame(payload: DetectFrameIn):
    """
    Direct edge perception inference endpoint. Accepts base64 camera frame, runs
    fine-tuned RDD2022 YOLOv8-Nano (ONNX/PyTorch), and returns bounding boxes with telemetry.
    """
    # Protect against memory exhaustion (Image Bomb / Zip Bomb)
    if len(payload.image_b64) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload too large: Image base64 must not exceed 10MB")

    det = get_detector()
    if det is None:
        raise HTTPException(status_code=503, detail="Edge AI detector could not be initialized")
    
    try:
        import base64
        import numpy as np
        import cv2

        b64_str = payload.image_b64
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        
        img_bytes = base64.b64decode(b64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image frame")
        
        detections = det.infer_frame(
            frame=frame,
            lat=payload.lat,
            lon=payload.lon,
            vehicle_id=payload.vehicle_id
        )
        return {
            "status": "success",
            "engine": det.engine_type,
            "count": len(detections),
            "detections": detections
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
@app.get("/api/health")
def health():
    """System health check and database engine status."""
    return {
        "status": "healthy",
        "service": "VIGILANCE Urban Road Intelligence Backend",
        "version": "1.0.0",
        "database": "PostgreSQL/PostGIS" if IS_POSTGRES else "SQLite (Local/Fallback)",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/detections", status_code=status.HTTP_201_CREATED)
async def create_detection(det: DetectionIn, db: Session = Depends(get_db)):
    """Ingests individual vehicle defect telemetry and schedules spatial deduplication."""
    # Auto-match road segment if not provided or default
    road_name = det.road_name if det.road_name and det.road_name != "GST Road, Chennai" else match_nearest_road(det.lat, det.lon)

    db_det = Detection(
        defect_type=det.defect_type,
        confidence=det.confidence,
        severity=det.severity,
        vehicle_id=det.vehicle_id,
        lat=det.lat,
        lon=det.lon,
        road_name=road_name,
        thumbnail_b64=det.thumbnail_b64,
        timestamp=datetime.utcnow()
    )
    db.add(db_det)
    db.commit()
    db.refresh(db_det)
    
    # Run spatial deduplication immediately for real-time map updates
    run_spatial_deduplication(db)
    
    # Trigger asynchronous Celery task if broker reachable
    try:
        task_res = async_spatial_deduplication.delay()
        task_id = task_res.id
    except Exception:
        task_id = "in_process"
    
    # Broadcast to WebSocket
    await manager.broadcast({
        "event": "NEW_DETECTION",
        "data": {
            "id": db_det.id,
            "defect_type": db_det.defect_type,
            "confidence": db_det.confidence,
            "severity": db_det.severity,
            "vehicle_id": db_det.vehicle_id,
            "lat": db_det.lat,
            "lon": db_det.lon,
            "road_name": db_det.road_name,
            "timestamp": db_det.timestamp.isoformat(),
            "celery_task_id": task_id
        }
    })
    
    return {"status": "success", "id": db_det.id, "task_id": task_id}

@app.get("/api/detections")
def get_detections(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """Paginated list of raw detections ordered by timestamp descending."""
    detections = db.query(Detection).order_by(Detection.timestamp.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": d.id,
            "defect_type": d.defect_type,
            "confidence": d.confidence,
            "severity": d.severity,
            "vehicle_id": d.vehicle_id,
            "lat": d.lat,
            "lon": d.lon,
            "cluster_id": d.cluster_id,
            "road_name": d.road_name,
            "timestamp": d.timestamp.isoformat(),
            "has_thumbnail": bool(d.thumbnail_b64)
        }
        for d in detections
    ]

@app.get("/api/clusters")
def get_clusters(db: Session = Depends(get_db)):
    """List deduplicated clusters sorted by dynamic Repair Prioritization Index (RPI) descending."""
    clusters = db.query(Cluster).order_by(Cluster.rpi_score.desc()).all()
    return [
        {
            "id": c.id,
            "centroid_lat": c.centroid_lat,
            "centroid_lon": c.centroid_lon,
            "detection_count": c.detection_count,
            "dominant_type": c.dominant_type,
            "max_severity": c.max_severity,
            "rpi_score": c.rpi_score,
            "status": c.status,
            "road_name": c.road_name,
            "contractor_name": getattr(c, "contractor_name", "Greater Chennai PWD"),
            "contractor_contact": getattr(c, "contractor_contact", "+91 44 2538 4520"),
            "sla_hours": getattr(c, "sla_hours", 48),
            "nearest_poi": getattr(c, "nearest_poi", "Urban Corridor"),
            "poi_distance_m": getattr(c, "poi_distance_m", 0.0),
            "updated_at": c.updated_at.isoformat()
        }
        for c in clusters
    ]

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """System-wide summary metrics for municipal command center."""
    total = db.query(Detection).count()
    clusters_count = db.query(Cluster).count()
    potholes = db.query(Detection).filter(Detection.defect_type.in_(["D40", "Pothole"])).count()
    cracks = db.query(Detection).filter(Detection.defect_type.in_(["D00", "D10", "D20", "Crack"])).count()
    critical = db.query(Detection).filter(Detection.severity == "critical").count()
    high = db.query(Detection).filter(Detection.severity == "high").count()
    
    vehicles = [r[0] for r in db.query(Detection.vehicle_id).distinct().all() if r[0]]
    corridors = [r[0] for r in db.query(Detection.road_name).distinct().all() if r[0]]
    resolved_count = db.query(Cluster).filter(Cluster.status == "resolved").count()
    
    return {
        "total_detections": total,
        "deduplicated_clusters": clusters_count,
        "potholes": potholes,
        "cracks": cracks,
        "critical_severity": critical,
        "high_severity": high,
        "active_vehicles": len(vehicles) if vehicles else 5,
        "vehicle_ids": vehicles,
        "active_potholes": potholes,
        "active_corridors": len(corridors),
        "potholes_repaired": resolved_count
    }

@app.get("/api/heatmap")
def get_heatmap_geojson(db: Session = Depends(get_db)):
    """GeoJSON FeatureCollection representing spatial defect density and severity weighting."""
    detections = db.query(Detection).all()
    features = []
    sev_weights = {"critical": 1.0, "high": 0.75, "medium": 0.5, "low": 0.25}
    for d in detections:
        sev_str = d.severity.lower() if d.severity else "medium"
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [d.lon, d.lat]
            },
            "properties": {
                "id": d.id,
                "type": d.defect_type,
                "severity": d.severity,
                "weight": sev_weights.get(sev_str, 0.5)
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.patch("/api/clusters/{cluster_id}/status")
@app.post("/api/clusters/{cluster_id}/status")
async def update_cluster_status(cluster_id: int, status: str = Query(...), db: Session = Depends(get_db)):
    """Updates operational workflow status (open, assigned, resolved) of a road distress cluster."""
    valid_statuses = ["open", "assigned", "resolved"]
    if status.lower() not in valid_statuses:
        raise HTTPException(status_code=422, detail=f"Invalid status '{status}'. Must be one of {valid_statuses}")

    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    cluster.status = status.lower()
    cluster.updated_at = datetime.utcnow()
    db.commit()
    
    await manager.broadcast({
        "event": "CLUSTER_UPDATED",
        "data": {"id": cluster.id, "status": cluster.status, "rpi_score": cluster.rpi_score}
    })
    return {"status": "success", "cluster_id": cluster.id, "new_status": cluster.status}

@app.post("/api/trigger-dedup")
async def trigger_dedup(db: Session = Depends(get_db)):
    """
    Manually trigger spatial deduplication and RPI recalculation across all detections.
    Broadcasts CLUSTERS_RESET event so all connected dashboard clients refresh immediately.
    """
    updated_count = run_spatial_deduplication(db)
    await manager.broadcast({
        "event": "CLUSTERS_RESET",
        "data": {"clusters_updated": updated_count}
    })
    return {"status": "success", "clusters_updated": updated_count}

@app.get("/api/work-orders")
def get_work_orders(db: Session = Depends(get_db)):
    """Returns prioritized work orders corresponding to active road distress clusters."""
    return get_clusters(db=db)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Full-duplex WebSocket channel for real-time edge telemetry streaming."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
