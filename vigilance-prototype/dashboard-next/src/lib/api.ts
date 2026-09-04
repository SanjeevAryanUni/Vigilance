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
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getStats(): Promise<DashboardStats | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getDetections(limit = 50): Promise<Detection[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/detections?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getClusters(): Promise<Cluster[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/clusters`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateClusterStatus(clusterId: number, status: ClusterStatus): Promise<boolean> {
  const base = getApiBase();
  if (!base) return true; // optimistic local update
  try {
    const res = await fetch(`${base}/api/clusters/${clusterId}/status?status=${status}`, {
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
  if (!base) return { status: 'DEDUP_COMPLETE', clusters_updated: 9 };
  try {
    const res = await fetch(`${base}/api/trigger-dedup`, {
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
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/detections`, {
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
