export type DefectType = 'D00' | 'D10' | 'D20' | 'D40';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ClusterStatus = 'open' | 'assigned' | 'resolved';

export interface Detection {
  id: number;
  defect_type: DefectType;
  confidence: number;
  severity: Severity;
  vehicle_id: string;
  lat: number;
  lon: number;
  road_name: string;
  cluster_id: number | null;
  timestamp: string;
  thumbnail_b64: string | null;
}

export interface Cluster {
  id: number;
  centroid_lat: number;
  centroid_lon: number;
  detection_count: number;
  dominant_type: string;
  max_severity: Severity;
  rpi_score: number;
  status: ClusterStatus;
  road_name: string;
  nearest_poi: string;
  poi_distance_m: number;
  contractor_name?: string;
  contractor_contact?: string;
  sla_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_detections: number;
  deduplicated_clusters: number;
  potholes: number;
  cracks: number;
  critical_severity: number;
  high_severity: number;
  active_vehicles: number;
}

export interface POI {
  name: string;
  lat: number;
  lon: number;
  type: 'hospital' | 'school';
}

export interface RoadHierarchy {
  road: string;
  weight: number;
  significance: string;
}

export interface VehicleInfo {
  id: string;
  route: string;
  status: 'active' | 'idle' | 'depot';
  lastSeen: string;
  detectionsCount: number;
  speedKmh: number;
  lat: number;
  lon: number;
}

export type WebSocketMessage =
  | {
      type: 'new_detection';
      data: Detection;
    }
  | {
      type: 'stats_update';
      data: DashboardStats;
    };
