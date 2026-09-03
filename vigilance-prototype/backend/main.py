import os
import sys

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(__file__))

import json
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import init_db, get_db, Detection, Cluster, run_spatial_deduplication, compute_rpi
from poi_data import match_nearest_road
from tasks import async_spatial_deduplication

app = FastAPI(title="VIGILANCE Urban Road Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
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
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
def startup_event():
    init_db()

class DetectionIn(BaseModel):
    defect_type: str
    confidence: float
    severity: str
    vehicle_id: str
    lat: float
    lon: float
    road_name: Optional[str] = None
    thumbnail_b64: Optional[str] = None

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "VIGILANCE Backend", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/detections")
async def create_detection(det: DetectionIn, db: Session = Depends(get_db)):
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
    
    # Trigger asynchronous Celery task for spatial deduplication and RPI scoring
    try:
        task_res = async_spatial_deduplication.delay()
        task_id = task_res.id
    except Exception as e:
        # Fallback to in-process execution if broker unreachable
        run_spatial_deduplication(db)
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
def get_detections(limit: int = 100, db: Session = Depends(get_db)):
    detections = db.query(Detection).order_by(Detection.timestamp.desc()).limit(limit).all()
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
            "contractor_name": getattr(c, "contractor_name", "L&T Highways Infra Ltd"),
            "contractor_contact": getattr(c, "contractor_contact", "+91 98401 22345"),
            "sla_hours": getattr(c, "sla_hours", 24),
            "nearest_poi": getattr(c, "nearest_poi", "Urban Corridor"),
            "poi_distance_m": getattr(c, "poi_distance_m", 0.0),
            "updated_at": c.updated_at.isoformat()
        }
        for c in clusters
    ]

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Detection).count()
    clusters_count = db.query(Cluster).count()
    potholes = db.query(Detection).filter(Detection.defect_type.in_(["D40", "Pothole"])).count()
    cracks = db.query(Detection).filter(Detection.defect_type.in_(["D00", "D10", "D20", "Crack"])).count()
    critical = db.query(Detection).filter(Detection.severity == "critical").count()
    high = db.query(Detection).filter(Detection.severity == "high").count()
    
    vehicles = [v[0] for v in db.query(Detection.vehicle_id).distinct().all()]
    
    return {
        "total_detections": total,
        "deduplicated_clusters": clusters_count,
        "potholes": potholes,
        "cracks": cracks,
        "critical_severity": critical,
        "high_severity": high,
        "active_vehicles": len(vehicles) if vehicles else 5,
        "vehicle_ids": vehicles
    }

@app.get("/api/heatmap")
def get_heatmap_geojson(db: Session = Depends(get_db)):
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

@app.post("/api/clusters/{cluster_id}/status")
async def update_cluster_status(cluster_id: int, status: str = Query(...), db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    cluster.status = status
    cluster.updated_at = datetime.utcnow()
    db.commit()
    
    await manager.broadcast({
        "event": "CLUSTER_UPDATED",
        "data": {"id": cluster.id, "status": cluster.status, "rpi_score": cluster.rpi_score}
    })
    return {"status": "success", "cluster_id": cluster.id, "new_status": cluster.status}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
