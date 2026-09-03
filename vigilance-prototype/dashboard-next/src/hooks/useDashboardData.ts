'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cluster, ClusterStatus, DashboardStats, DefectType, Detection, Severity, WebSocketMessage } from '@/types/vigilance';
import { INITIAL_CLUSTERS, INITIAL_DETECTIONS, INITIAL_STATS } from '@/lib/constants';
import { getClusters, getDetections, getStats, updateClusterStatus, triggerDedup } from '@/lib/api';
import { useWebSocket } from './useWebSocket';

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [clusters, setClusters] = useState<Cluster[]>(INITIAL_CLUSTERS);
  const [detections, setDetections] = useState<Detection[]>(INITIAL_DETECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const simulationTimerRef = useRef<NodeJS.Timeout>();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedDetections, fetchedClusters] = await Promise.all([
        getStats(),
        getDetections(20),
        getClusters(),
      ]);

      if (fetchedStats && fetchedClusters && fetchedClusters.length > 0) {
        setBackendAvailable(true);
        setStats(fetchedStats);
        if (fetchedDetections && fetchedDetections.length > 0) {
          setDetections(fetchedDetections);
        }
        setClusters(fetchedClusters);
      } else {
        setBackendAvailable(false);
      }
    } catch (err) {
      setBackendAvailable(false);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

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
    }
  }, []);

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

  // Initial load & periodic polling for stats
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusChange = async (clusterId: number, newStatus: ClusterStatus) => {
    setClusters((prev) =>
      prev.map((c) => (c.id === clusterId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))
    );
    await updateClusterStatus(clusterId, newStatus);
  };

  const handleTriggerDedup = async () => {
    const res = await triggerDedup();
    if (res) {
      await loadData();
    }
    return res;
  };

  return {
    stats,
    clusters,
    detections,
    isLoading,
    isConnected,
    backendAvailable,
    lastUpdated,
    refreshData: loadData,
    updateStatus: handleStatusChange,
    triggerDedup: handleTriggerDedup,
  };
}
