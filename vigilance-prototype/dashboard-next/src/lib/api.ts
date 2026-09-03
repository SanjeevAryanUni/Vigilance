import { Cluster, ClusterStatus, DashboardStats, Detection } from '@/types/vigilance';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : '');

export async function getHealth(): Promise<{ status: string; service: string; timestamp: string } | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getStats(): Promise<DashboardStats | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getDetections(limit = 50): Promise<Detection[] | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/detections?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getClusters(): Promise<Cluster[] | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/clusters`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateClusterStatus(clusterId: number, status: ClusterStatus): Promise<boolean> {
  if (!API_BASE) return true; // optimistic local update
  try {
    const res = await fetch(`${API_BASE}/api/clusters/${clusterId}/status?status=${status}`, {
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
  if (!API_BASE) return { status: 'DEDUP_COMPLETE', clusters_updated: 9 };
  try {
    const res = await fetch(`${API_BASE}/api/trigger-dedup`, {
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
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Create detection error:', err);
    return null;
  }
}
