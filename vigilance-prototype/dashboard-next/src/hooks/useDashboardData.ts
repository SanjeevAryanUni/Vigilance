'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cluster, ClusterStatus, DashboardStats, DefectType, Detection, Severity, WebSocketMessage } from '@/types/vigilance';
import { INITIAL_CLUSTERS, INITIAL_DETECTIONS, INITIAL_STATS } from '@/lib/constants';
import { getClusters, getDetections, getStats, getHealth, updateClusterStatus, triggerDedup, getApiBase } from '@/lib/api';
import { useWebSocket } from './useWebSocket';

export type BackendConnectionStatus = 'healthy' | 'cold-starting' | 'unreachable';

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [clusters, setClusters] = useState<Cluster[]>(INITIAL_CLUSTERS);
  const [detections, setDetections] = useState<Detection[]>(INITIAL_DETECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>('unreachable');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const simulationTimerRef = useRef<NodeJS.Timeout>();

  const checkHealth = useCallback(async () => {
    const health = await getHealth();
    if (health && health.status === 'healthy') {
      setBackendStatus('healthy');
      return true;
    }
    return false;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const apiBase = getApiBase();
    
    try {
      // First check health
      const isHealthy = await checkHealth();

      const [fetchedStats, fetchedDetections, fetchedClusters] = await Promise.all([
        getStats(),
        getDetections(20),
        getClusters(),
      ]);

      if (fetchedStats && fetchedClusters && fetchedClusters.length > 0) {
        setBackendAvailable(true);
        setBackendStatus('healthy');
        setStats(fetchedStats);
        if (fetchedDetections && fetchedDetections.length > 0) {
          setDetections(fetchedDetections);
        }
        setClusters(fetchedClusters);
      } else if (isHealthy) {
        setBackendAvailable(true);
        setBackendStatus('healthy');
      } else {
        setBackendAvailable(false);
        setBackendStatus(apiBase ? 'cold-starting' : 'unreachable');
      }
    } catch (err) {
      setBackendAvailable(false);
      setBackendStatus(apiBase ? 'cold-starting' : 'unreachable');
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [checkHealth]);

  const handleWsMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'new_detection') {
      const newDet = msg.data as Detection;
      setDetections((prev) => [newDet, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        ...prev,
        total_detections: prev.total_detections + 1,
        potholes: newDet.defect_type === 'D40' ? prev.potholes + 1 : prev.potholes,
        cracks: newDet.defect_type !== 'D40' ? prev.cracks + 1 : prev.cracks,
        critical_severity: newDet.severity === 'critical' ? prev.critical_severity + 1 : prev.critical_severity,
      }));
      setLastUpdated(new Date());
    } else if (msg.type === 'stats_update') {
      setStats(msg.data as DashboardStats);
      setLastUpdated(new Date());
    } else if (msg.type === 'cluster_updated') {
      const update = msg.data;
      setClusters((prev) =>
        prev.map((c) =>
          c.id === update.id
            ? { ...c, status: update.status, rpi_score: update.rpi_score ?? c.rpi_score, updated_at: new Date().toISOString() }
            : c
        )
      );
      setLastUpdated(new Date());
    } else if (msg.type === 'clusters_reset') {
      loadData();
    }
  }, [loadData]);

  const { isConnected } = useWebSocket(handleWsMessage);

  // Keep static placeholders when backend is offline — no fake data generation
  useEffect(() => {
    if (backendAvailable === false || backendAvailable === null) {
      // Backend offline state: Keep INITIAL_CLUSTERS / INITIAL_STATS as reference benchmarks
      // Real-time telemetry comes from /capture BroadcastChannel or live API polling
    }
    return () => {};
  }, [backendAvailable]);

  // Initial load & periodic polling for stats + health check
  // BroadcastChannel for instant local 0ms cross-tab sync between /capture and dashboard
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('vigilance_telemetry');
    channel.onmessage = (event) => {
      if (event.data?.type === 'NEW_DETECTION' && event.data.data) {
        const newDet = event.data.data as Detection;
        setDetections((prev) => [newDet, ...prev.filter((d) => d.id !== newDet.id).slice(0, 19)]);
        setStats((prev) => ({
          ...prev,
          total_detections: prev.total_detections + 1,
          potholes: newDet.defect_type === 'D40' ? prev.potholes + 1 : prev.potholes,
          cracks: newDet.defect_type !== 'D40' ? prev.cracks + 1 : prev.cracks,
          critical_severity: newDet.severity === 'critical' ? prev.critical_severity + 1 : prev.critical_severity,
        }));
        setLastUpdated(new Date());
        loadData();
      }
    };
    return () => channel.close();
  }, [loadData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusChange = async (clusterId: number, newStatus: ClusterStatus) => {
    const previous = clusters.find((c) => c.id === clusterId)?.status;
    setClusters((prev) =>
      prev.map((c) => (c.id === clusterId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))
    );
    const success = await updateClusterStatus(clusterId, newStatus);
    if (!success && previous) {
      // Rollback on network failure
      setClusters((prev) =>
        prev.map((c) => (c.id === clusterId ? { ...c, status: previous, updated_at: new Date().toISOString() } : c))
      );
    }
  };

  const handleTriggerDedup = async () => {
    try {
      const res = await triggerDedup();
      if (res) {
        await loadData();
      }
      return res;
    } catch (err) {
      console.error('Trigger dedup caught error:', err);
      return null;
    }
  };

  return {
    stats,
    clusters,
    detections,
    isLoading,
    isConnected,
    backendAvailable,
    backendStatus,
    lastUpdated,
    refreshData: loadData,
    updateStatus: handleStatusChange,
    triggerDedup: handleTriggerDedup,
  };
}
