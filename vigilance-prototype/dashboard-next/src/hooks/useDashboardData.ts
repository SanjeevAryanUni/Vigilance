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
        // Merge stored overrides
        let clustersToSet = fetchedClusters;
        try {
          if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('vigilance_status_overrides');
            if (stored) {
              const map = JSON.parse(stored);
              clustersToSet = fetchedClusters.map((c) => (map[c.id] ? { ...c, status: map[c.id] } : c));
            }
          }
        } catch {}
        setClusters(clustersToSet);
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

  // Continuous edge telemetry stream simulator when WebSocket is disconnected or idle
  useEffect(() => {
    if (isConnected) return; // Use real WebSocket when connected

    const VEHICLES = [
      'BUS-TN01-1042',
      'BUS-TN02-3891',
      'MTC-FEEDER-08',
      'PATROL-VAN-12',
      'MUNICIPAL-TRUCK-07',
      'EV-BUS-TN22-9014',
    ];
    const ROADS = [
      { name: 'GST Road, Tambaram (NH-32)', lat: 12.9516, lon: 80.1462 },
      { name: 'Guindy Kathipara Grade Junction', lat: 13.0067, lon: 80.203 },
      { name: 'Anna Salai (Mount Road)', lat: 13.0604, lon: 80.2496 },
      { name: 'SRM Institute / Potheri Highway', lat: 12.8231, lon: 80.0442 },
      { name: 'Old Mahabalipuram Road (OMR)', lat: 12.9719, lon: 80.25 },
      { name: 'Velachery Main Road', lat: 12.9815, lon: 80.218 },
      { name: 'Poonamallee High Road', lat: 13.0827, lon: 80.2707 },
    ];
    const DEFECTS: Array<{ type: DefectType; sev: Severity }> = [
      { type: 'D40', sev: 'critical' },
      { type: 'D40', sev: 'high' },
      { type: 'D20', sev: 'high' },
      { type: 'D10', sev: 'medium' },
      { type: 'D00', sev: 'low' },
    ];

    const streamInterval = setInterval(() => {
      const road = ROADS[Math.floor(Math.random() * ROADS.length)];
      const defect = DEFECTS[Math.floor(Math.random() * DEFECTS.length)];
      const vehicle = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
      const jitterLat = (Math.random() - 0.5) * 0.005;
      const jitterLon = (Math.random() - 0.5) * 0.005;

      const simulatedDetection: Detection = {
        id: Date.now(),
        defect_type: defect.type,
        confidence: +(0.83 + Math.random() * 0.15).toFixed(2),
        severity: defect.sev,
        vehicle_id: vehicle,
        road_name: road.name,
        lat: +(road.lat + jitterLat).toFixed(4),
        lon: +(road.lon + jitterLon).toFixed(4),
        cluster_id: Math.floor(Math.random() * 9) + 1,
        timestamp: new Date().toISOString(),
        thumbnail_b64: null,
      };

      setDetections((prev) => [simulatedDetection, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        ...prev,
        total_detections: prev.total_detections + 1,
        potholes: defect.type === 'D40' ? prev.potholes + 1 : prev.potholes,
        cracks: defect.type !== 'D40' ? prev.cracks + 1 : prev.cracks,
        critical_severity: defect.sev === 'critical' ? prev.critical_severity + 1 : prev.critical_severity,
      }));
      setLastUpdated(new Date());
    }, 4000);

    return () => clearInterval(streamInterval);
  }, [isConnected]);

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
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusChange = async (clusterId: number, newStatus: ClusterStatus) => {
    // Optimistically update cluster status locally
    setClusters((prev) =>
      prev.map((c) => (c.id === clusterId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))
    );

    // Save override to sessionStorage so periodic polls don't clobber it in demo mode
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('vigilance_status_overrides');
        const map = stored ? JSON.parse(stored) : {};
        map[clusterId] = newStatus;
        sessionStorage.setItem('vigilance_status_overrides', JSON.stringify(map));
        
        // Dispatch toast notification
        window.dispatchEvent(
          new CustomEvent('vigilance:toast', {
            detail: {
              title: `Work Order WO-${clusterId.toString().padStart(4, '0')}`,
              message: `Status transitioned to ${newStatus.toUpperCase()}`,
              type: newStatus === 'resolved' ? 'success' : 'info',
            },
          })
        );
      }
    } catch {
      // Ignore storage errors
    }

    // Attempt background sync with backend
    try {
      await updateClusterStatus(clusterId, newStatus);
    } catch (err) {
      console.warn('[Vigilance] Status sync postponed (operating in offline demo mode):', err);
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
