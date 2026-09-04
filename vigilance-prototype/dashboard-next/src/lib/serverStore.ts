import { Cluster, DashboardStats, DefectType, Detection, Severity } from '@/types/vigilance';
import { CHENNAI_POIS, CHENNAI_ROADS, INITIAL_CLUSTERS, INITIAL_DETECTIONS } from './constants';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000.0;
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const dphi = ((lat2 - lat1) * Math.PI) / 180.0;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dphi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2.0) ** 2;
  return 2.0 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
}

function getNearestRoad(lat: number, lon: number): string {
  let minDistance = Infinity;
  let bestRoad = 'GST Road, Tambaram (NH-32)';

  for (const road of CHENNAI_ROADS) {
    // Approximate road distance based on nearest POI or coordinate
    for (const poi of CHENNAI_POIS) {
      const d = haversineMeters(lat, lon, poi.lat, poi.lon);
      if (d < minDistance) {
        minDistance = d;
        bestRoad = road.road;
      }
    }
  }
  return bestRoad;
}

function getNearestPOI(lat: number, lon: number): { name: string; distance: number } {
  let minDistance = Infinity;
  let nearestName = 'Urban Corridor';

  for (const poi of CHENNAI_POIS) {
    const d = haversineMeters(lat, lon, poi.lat, poi.lon);
    if (d < minDistance) {
      minDistance = d;
      nearestName = poi.name;
    }
  }
  return { name: nearestName, distance: Math.round(minDistance) };
}

function computeRPI(severity: string, count: number, roadName: string, poiDistance: number): number {
  const sevMap: Record<string, number> = { critical: 1.0, high: 0.75, medium: 0.5, low: 0.25 };
  const sVal = sevMap[severity.toLowerCase()] || 0.5;
  const densityVal = Math.min(1.0, count / 5.0);

  const matchedRoad = CHENNAI_ROADS.find((r) => roadName.toLowerCase().includes(r.road.split(' ')[0].toLowerCase()));
  const roadWt = matchedRoad ? matchedRoad.weight : 0.75;

  let proxWt = 0.25;
  if (poiDistance < 500) proxWt = 1.0;
  else if (poiDistance < 1500) proxWt = 0.75;
  else if (poiDistance < 3000) proxWt = 0.5;

  const rpi = sVal * 40.0 + densityVal * 25.0 + roadWt * 20.0 + proxWt * 15.0;
  return Number(Math.min(100.0, Math.max(10.0, rpi)).toFixed(1));
}

// Global server singleton to preserve detections across requests in memory
declare global {
  // eslint-disable-next-line no-var
  var __VIGILANCE_DETECTIONS__: Detection[] | undefined;
  // eslint-disable-next-line no-var
  var __VIGILANCE_CLUSTERS__: Cluster[] | undefined;
}

if (!global.__VIGILANCE_DETECTIONS__) {
  global.__VIGILANCE_DETECTIONS__ = [...INITIAL_DETECTIONS];
}

if (!global.__VIGILANCE_CLUSTERS__) {
  global.__VIGILANCE_CLUSTERS__ = [...INITIAL_CLUSTERS];
}

export function reclusterDetections(): Cluster[] {
  const detections = global.__VIGILANCE_DETECTIONS__ || [];
  if (detections.length === 0) return [];

  // Group detections into 15m radius clusters
  const clustersMap: { centerLat: number; centerLon: number; detections: Detection[] }[] = [];

  for (const det of detections) {
    let matched = false;
    for (const cluster of clustersMap) {
      const dist = haversineMeters(det.lat, det.lon, cluster.centerLat, cluster.centerLon);
      if (dist <= 15.0) {
        cluster.detections.push(det);
        // Recalculate centroid
        cluster.centerLat = cluster.detections.reduce((a, b) => a + b.lat, 0) / cluster.detections.length;
        cluster.centerLon = cluster.detections.reduce((a, b) => a + b.lon, 0) / cluster.detections.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      clustersMap.push({
        centerLat: det.lat,
        centerLon: det.lon,
        detections: [det],
      });
    }
  }

  // Preserve previous cluster statuses
  const prevMap = new Map<number, string>();
  for (const c of global.__VIGILANCE_CLUSTERS__ || []) {
    prevMap.set(c.id, c.status);
  }

  const sevRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

  const clusters: Cluster[] = clustersMap.map((grp, idx) => {
    const id = idx + 1;
    const types = grp.detections.map((d) => d.defect_type);
    const dominantType = types.sort((a, b) => types.filter((v) => v === a).length - types.filter((v) => v === b).length).pop() || 'D40';

    const severities = grp.detections.map((d) => (d.severity || 'medium').toLowerCase());
    const maxSeverity = (severities.sort((a, b) => (sevRank[a] || 1) - (sevRank[b] || 1)).pop() || 'critical') as Severity;

    const roadName = grp.detections[0].road_name || getNearestRoad(grp.centerLat, grp.centerLon);
    const { name: nearestPOI, distance: poiDistance } = getNearestPOI(grp.centerLat, grp.centerLon);
    const rpi = computeRPI(maxSeverity, grp.detections.length, roadName, poiDistance);

    // Assign cluster_id to detections
    grp.detections.forEach((d) => {
      d.cluster_id = id;
    });

    const existingStatus = prevMap.get(id) || 'open';

    return {
      id,
      centroid_lat: Number(grp.centerLat.toFixed(6)),
      centroid_lon: Number(grp.centerLon.toFixed(6)),
      detection_count: grp.detections.length,
      dominant_type: dominantType as DefectType,
      max_severity: maxSeverity,
      rpi_score: rpi,
      status: existingStatus as any,
      road_name: roadName,
      nearest_poi: nearestPOI,
      poi_distance_m: poiDistance,
      contractor_name: 'Greater Chennai PWD & Highway Division',
      contractor_contact: '+91 44 2538 4520',
      sla_hours: rpi > 80 ? 24 : 48,
      created_at: grp.detections[0].timestamp,
      updated_at: new Date().toISOString(),
    };
  });

  clusters.sort((a, b) => b.rpi_score - a.rpi_score);
  global.__VIGILANCE_CLUSTERS__ = clusters;
  return clusters;
}

export function addDetection(det: Partial<Detection>): Detection {
  const newDet: Detection = {
    id: det.id || Date.now(),
    defect_type: det.defect_type || 'D40',
    confidence: det.confidence || 0.92,
    severity: det.severity || 'critical',
    vehicle_id: det.vehicle_id || 'MOBILE-NODE-01',
    lat: det.lat || 12.8231,
    lon: det.lon || 80.0442,
    road_name: det.road_name || getNearestRoad(det.lat || 12.8231, det.lon || 80.0442),
    timestamp: det.timestamp || new Date().toISOString(),
    thumbnail_b64: det.thumbnail_b64 || null,
    cluster_id: 1,
  };

  if (!global.__VIGILANCE_DETECTIONS__) {
    global.__VIGILANCE_DETECTIONS__ = [];
  }

  // Prepend to detections list (capped at 200 items to avoid memory leaks)
  global.__VIGILANCE_DETECTIONS__ = [newDet, ...global.__VIGILANCE_DETECTIONS__.slice(0, 199)];

  // Auto-recluster
  reclusterDetections();

  return newDet;
}

export function getStoredDetections(limit = 50): Detection[] {
  return (global.__VIGILANCE_DETECTIONS__ || []).slice(0, limit);
}

export function getStoredClusters(): Cluster[] {
  if (!global.__VIGILANCE_CLUSTERS__ || global.__VIGILANCE_CLUSTERS__.length === 0) {
    return reclusterDetections();
  }
  return global.__VIGILANCE_CLUSTERS__;
}

export function getStoredStats(): DashboardStats {
  const detections = global.__VIGILANCE_DETECTIONS__ || [];
  const clusters = getStoredClusters();

  const potholes = detections.filter((d) => d.defect_type === 'D40').length;
  const cracks = detections.filter((d) => d.defect_type !== 'D40').length;
  const critical = detections.filter((d) => d.severity === 'critical').length;
  const high = detections.filter((d) => d.severity === 'high').length;
  const vehicles = new Set(detections.map((d) => d.vehicle_id)).size;

  return {
    total_detections: detections.length,
    deduplicated_clusters: clusters.length,
    potholes,
    cracks,
    critical_severity: critical,
    high_severity: high,
    active_vehicles: Math.max(5, vehicles),
  };
}

export function updateStoredClusterStatus(clusterId: number, status: string): boolean {
  if (!global.__VIGILANCE_CLUSTERS__) return false;
  let found = false;
  global.__VIGILANCE_CLUSTERS__ = global.__VIGILANCE_CLUSTERS__.map((c) => {
    if (c.id === clusterId) {
      found = true;
      return { ...c, status: status as any, updated_at: new Date().toISOString() };
    }
    return c;
  });
  return found;
}
