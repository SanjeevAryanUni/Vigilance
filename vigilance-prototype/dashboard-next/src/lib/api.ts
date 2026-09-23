import { Cluster, ClusterStatus, DashboardStats, Detection } from '@/types/vigilance';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('vigilance_api_url');
    if (custom) return custom.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  return '';
};

export const API_BASE = getApiBase();

export async function getHealth(): Promise<{ status: string; service: string; timestamp: string } | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/health` : '/api/health';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getStats(): Promise<DashboardStats | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/stats` : '/api/stats';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getDetections(limit = 50): Promise<Detection[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/detections?limit=${limit}` : `/api/detections?limit=${limit}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getClusters(): Promise<Cluster[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/clusters` : '/api/clusters';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateClusterStatus(clusterId: number, status: ClusterStatus): Promise<boolean> {
  const base = getApiBase();
  const url = base ? `${base}/api/clusters/${clusterId}/status?status=${status}` : `/api/clusters/${clusterId}/status?status=${status}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update cluster status:', err);
    return false;
  }
}

export async function triggerDedup(): Promise<{ status: string; clusters_updated: number } | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/trigger-dedup` : '/api/trigger-dedup';
  try {
    const res = await fetch(url, {
      method: 'POST',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Trigger dedup error:', err);
    return null;
  }
}

export async function createDetection(data: Partial<Detection>): Promise<Detection | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/detections` : '/api/detections';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.error('Create detection error:', err);
    return null;
  }
}

export async function getTrafficStats(): Promise<{
  vehicles_today?: number;
  pedestrians_today?: number;
  average_density?: string;
  total_observations?: number;
  vehicles_24h?: number;
  pedestrians_24h?: number;
  avg_speed_kmh?: number;
  active_monitors?: number;
} | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/traffic/stats` : '/api/traffic/stats';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      vehicles_today: data.vehicles_today ?? data.vehicles_24h ?? 0,
      pedestrians_today: data.pedestrians_today ?? data.pedestrians_24h ?? 0,
      average_density: data.average_density ?? 'moderate',
      total_observations: data.total_observations ?? data.vehicles_24h ?? 0,
      vehicles_24h: data.vehicles_24h ?? data.vehicles_today ?? 0,
      pedestrians_24h: data.pedestrians_24h ?? data.pedestrians_today ?? 0,
      avg_speed_kmh: data.avg_speed_kmh ?? 38.5,
      active_monitors: data.active_monitors ?? 5,
    };
  } catch (err) {
    return null;
  }
}

export async function getCongestion(): Promise<any[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/congestion` : '/api/congestion';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getCongestionHeatmap(): Promise<any[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/heatmap/congestion` : '/api/heatmap/congestion';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getIncidents(): Promise<any[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/incidents` : '/api/incidents';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function reportIncident(data: any): Promise<any | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/incidents` : '/api/incidents';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function createIncident(data: {
  incident_type: string;
  plate_text?: string;
  plate_confidence?: number;
  lat: number;
  lon: number;
  vehicle_id?: string;
  timestamp?: string;
  image_b64?: string | null;
}): Promise<boolean> {
  const res = await reportIncident(data);
  return res !== null;
}

export async function getOdMatrix(): Promise<{
  matrix: Record<string, Record<string, number>>;
  pairs: any[];
  stops: string[];
  total_trips: number;
} | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/analytics/od-matrix` : '/api/analytics/od-matrix';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getRouteDelays(): Promise<any[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/analytics/delays` : '/api/analytics/delays';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getFleetPositions(): Promise<any[] | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/fleet/positions` : '/api/fleet/positions';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function ingestTraffic(data: any): Promise<any | null> {
  const base = getApiBase();
  const url = base ? `${base}/api/traffic` : '/api/traffic';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function createTrafficObservation(data: {
  vehicle_count: number;
  pedestrian_count: number;
  density: string;
  lat: number;
  lon: number;
  road_name?: string;
  vehicle_id?: string;
  timestamp?: string;
}): Promise<boolean> {
  const res = await ingestTraffic(data);
  return res !== null;
}

