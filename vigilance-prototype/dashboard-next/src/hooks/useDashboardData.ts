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

  // Fallback realistic edge perception simulation when backend is offline
  useEffect(() => {
    if (backendAvailable === false || backendAvailable === null) {
      simulationTimerRef.current = setInterval(() => {
        const vehicles = ['BUS-TN01-1042', 'BUS-TN02-3891', 'MUNICIPAL-TRUCK-07', 'PATROL-VAN-12', 'BUS-TN22-5501'];
        const defects: DefectType[] = ['D40', 'D20', 'D10', 'D00'];
        const roads = [
          'GST Road, Tambaram (NH-32)',
          'Anna Salai (Mount Road)',
          'Guindy Kathipara Junction',
          'SRM / Potheri Highway',
          'Old Mahabalipuram Road (OMR)',
        ];

        const defect = defects[Math.floor(Math.random() * defects.length)];
        const road = roads[Math.floor(Math.random() * roads.length)];
        const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        const isCrit = defect === 'D40' && Math.random() > 0.35;
        const sev: Severity = isCrit ? 'critical' : defect === 'D40' || defect === 'D20' ? 'high' : 'medium';

        const mockDetection: Detection = {
          id: Date.now(),
          defect_type: defect,
          confidence: Number((0.82 + Math.random() * 0.16).toFixed(2)),
          severity: sev,
          vehicle_id: vehicle,
          road_name: road,
          lat: 13.0067 + (Math.random() - 0.5) * 0.08,
          lon: 80.2030 + (Math.random() - 0.5) * 0.08,
          cluster_id: Math.floor(Math.random() * 9) + 1,
          timestamp: new Date().toISOString(),
          thumbnail_b64: null,
        };

        setDetections((prev) => [mockDetection, ...prev.slice(0, 19)]);
        setStats((prev) => ({
          ...prev,
          total_detections: prev.total_detections + 1,
          potholes: defect === 'D40' ? prev.potholes + 1 : prev.potholes,
          cracks: defect !== 'D40' ? prev.cracks + 1 : prev.cracks,
          critical_severity: isCrit ? prev.critical_severity + 1 : prev.critical_severity,
        }));
        setLastUpdated(new Date());
      }, 4500);
    }

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
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
