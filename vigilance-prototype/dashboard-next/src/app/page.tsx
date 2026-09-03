'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ShieldAlert, Radio, RefreshCw, Wrench, PieChart as PieIcon, MapPin, Smartphone } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const WebGISMap = dynamic(() => import('@/components/WebGISMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
      Initializing Chennai WebGIS Vector Grid...
    </div>
  ),
});

// Initial High-Fidelity Chennai Municipal Transit Seed Dataset
const INITIAL_CLUSTERS = [
  { id: 1, centroid_lat: 12.9516, centroid_lon: 80.1462, detection_count: 7, dominant_type: "D40 (Pothole)", max_severity: "critical", rpi_score: 94.5, status: "open", road_name: "GST Road, Tambaram (NH-32)", contractor_name: "L&T Highways Infra Ltd", contractor_contact: "+91 98401 22345", sla_hours: 24, nearest_poi: "MIOT Hospital Corridor", poi_distance_m: 420 },
  { id: 2, centroid_lat: 13.0067, centroid_lon: 80.2030, detection_count: 5, dominant_type: "D40 (Pothole)", max_severity: "critical", rpi_score: 89.2, status: "assigned", road_name: "Guindy Kathipara Grade Junction", contractor_name: "NHAI Metro Division Chennai", contractor_contact: "+91 91760 55667", sla_hours: 12, nearest_poi: "Anna University", poi_distance_m: 850 },
  { id: 3, centroid_lat: 13.0604, centroid_lon: 80.2496, detection_count: 4, dominant_type: "D20 (Alligator Crack)", max_severity: "high", rpi_score: 82.1, status: "open", road_name: "Anna Salai (Mount Road)", contractor_name: "GMR Urban Highways Ltd", contractor_contact: "+91 98840 77890", sla_hours: 24, nearest_poi: "Apollo Hospital, Greams Rd", poi_distance_m: 310 },
  { id: 4, centroid_lat: 12.8231, centroid_lon: 80.0442, detection_count: 6, dominant_type: "D40 (Pothole)", max_severity: "critical", rpi_score: 88.0, status: "open", road_name: "SRM Institute / Potheri Highway", contractor_name: "Chettinad Road Infra Pvt Ltd", contractor_contact: "+91 97900 88990", sla_hours: 24, nearest_poi: "SRM Medical College", poi_distance_m: 180 },
  { id: 5, centroid_lat: 12.9719, centroid_lon: 80.2500, detection_count: 3, dominant_type: "D10 (Transverse Crack)", max_severity: "high", rpi_score: 74.5, status: "assigned", road_name: "Old Mahabalipuram Road (OMR)", contractor_name: "TNRDC OMR Cell", contractor_contact: "+91 99400 33445", sla_hours: 48, nearest_poi: "IIT Madras Zone", poi_distance_m: 1200 },
  { id: 6, centroid_lat: 13.0827, centroid_lon: 80.2707, detection_count: 4, dominant_type: "D00 (Longitudinal Crack)", max_severity: "medium", rpi_score: 68.4, status: "resolved", road_name: "Poonamallee High Road", contractor_name: "TN PWD Division 4", contractor_contact: "+91 94440 11223", sla_hours: 48, nearest_poi: "Madras Medical College", poi_distance_m: 650 },
  { id: 7, centroid_lat: 12.9815, centroid_lon: 80.2180, detection_count: 3, dominant_type: "D40 (Pothole)", max_severity: "high", rpi_score: 79.8, status: "open", road_name: "Velachery Main Road", contractor_name: "Chennai Corp Zone 13", contractor_contact: "+91 94451 90013", sla_hours: 72, nearest_poi: "Fortis Malar Hospital", poi_distance_m: 1400 },
  { id: 8, centroid_lat: 13.0418, centroid_lon: 80.2341, detection_count: 5, dominant_type: "D20 (Alligator Crack)", max_severity: "high", rpi_score: 76.2, status: "open", road_name: "T. Nagar Usman Road Commercial", contractor_name: "Chennai Corp Zone 10", contractor_contact: "+91 94451 90010", sla_hours: 48, nearest_poi: "D.A.V. School Link", poi_distance_m: 920 },
  { id: 9, centroid_lat: 13.0878, centroid_lon: 80.2155, detection_count: 2, dominant_type: "D00 (Longitudinal Crack)", max_severity: "low", rpi_score: 52.0, status: "resolved", road_name: "Anna Nagar 2nd Avenue", contractor_name: "Chennai Corp Zone 8", contractor_contact: "+91 94451 90008", sla_hours: 72, nearest_poi: "Kendriya Vidyalaya", poi_distance_m: 1600 }
];

const INITIAL_DETECTIONS = [
  { id: 101, defect_type: "D40", confidence: 0.94, severity: "critical", vehicle_id: "BUS-TN01-1042", road_name: "GST Road, Tambaram (NH-32)", timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 102, defect_type: "D20", confidence: 0.88, severity: "high", vehicle_id: "BUS-TN02-3891", road_name: "Guindy Kathipara Grade Junction", timestamp: new Date(Date.now() - 240000).toISOString() },
  { id: 103, defect_type: "D40", confidence: 0.96, severity: "critical", vehicle_id: "MUNICIPAL-TRUCK-07", road_name: "SRM Institute / Potheri Highway", timestamp: new Date(Date.now() - 360000).toISOString() },
  { id: 104, defect_type: "D10", confidence: 0.82, severity: "high", vehicle_id: "PATROL-VAN-12", road_name: "Anna Salai (Mount Road)", timestamp: new Date(Date.now() - 480000).toISOString() },
  { id: 105, defect_type: "D00", confidence: 0.79, severity: "medium", vehicle_id: "BUS-TN22-5501", road_name: "Old Mahabalipuram Road (OMR)", timestamp: new Date(Date.now() - 600000).toISOString() }
];

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const getWsUrl = (apiBase: string): string => {
  try {
    const url = new URL(apiBase);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}/ws`;
  } catch (e) {
    return 'ws://localhost:8000/ws';
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_detections: 0,
    deduplicated_clusters: 0,
    potholes: 0,
    cracks: 0,
    critical_severity: 0,
    high_severity: 0,
    active_vehicles: 0,
  });

  const [detections, setDetections] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = async () => {
    const apiBase = getApiBase();
    try {
      const [statsRes, detRes, clusterRes] = await Promise.all([
        fetch(`${apiBase}/api/stats`),
        fetch(`${apiBase}/api/detections?limit=15`),
        fetch(`${apiBase}/api/clusters`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (detRes.ok) {
        const d = await detRes.json();
        if (Array.isArray(d)) setDetections(d);
      }
      if (clusterRes.ok) {
        const c = await clusterRes.json();
        if (Array.isArray(c)) setClusters(c);
      }
    } catch (e) {
      console.warn('Backend fetch warning:', e);
    }
  };

  const updateStatus = async (clusterId: number, newStatus: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, status: newStatus } : c));
    const apiBase = getApiBase();
    try {
      await fetch(`${apiBase}/api/clusters/${clusterId}/status?status=${newStatus}`, { method: 'POST' });
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();

    // 1. Setup Fallback Polling (Every 5 seconds)
    const pollInterval = setInterval(() => {
      fetchData();
    }, 5000);

    // 2. Setup WebSocket Live Stream
    const apiBase = getApiBase();
    const wsUrl = getWsUrl(apiBase);
    let socket: WebSocket | null = null;
    let isComponentMounted = true;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (isComponentMounted) setWsConnected(true);
        fetchData();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'NEW_DETECTION' || msg.event === 'CLUSTER_UPDATED') {
            fetchData();
          }
        } catch (err) {
          fetchData();
        }
      };

      socket.onclose = () => {
        if (isComponentMounted) setWsConnected(false);
      };

      socket.onerror = () => {
        if (isComponentMounted) setWsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection error:', err);
    }

    return () => {
      isComponentMounted = false;
      clearInterval(pollInterval);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const chartData = {
    labels: ['Potholes (D40)', 'Cracks (D00-D20)', 'Critical Hazards'],
    datasets: [
      {
        data: [stats.potholes, stats.cracks, stats.critical_severity],
        backgroundColor: ['#DC2626', '#F59E0B', '#2563EB'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30">
            <ShieldAlert className="w-5 h-5" />
            <span>VIGILANCE</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Next.js 14 WebGIS Urban Road Intelligence Platform
              <span className="bg-blue-900/60 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-700 font-mono">
                SIH26124 • BEL
              </span>
            </h1>
            <p className="text-xs text-slate-400">Mobile Public Transport Passive Sensing Network • Apple M5 Edge AI Grid</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-full text-xs text-emerald-300">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{stats.active_vehicles} Fleet Nodes • {wsConnected ? 'WebSocket Live' : 'HTTP Polling'}</span>
          </div>
          <Link
            href="/capture"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg border border-blue-500 flex items-center gap-1.5 transition font-semibold shadow-md shadow-blue-600/20"
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile Phone Dashcam Mode
          </Link>
          <button
            onClick={() => fetchData()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column: Stats & Ingest Stream */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Ingestions</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">{stats.total_detections}</div>
              <span className="text-[10px] text-blue-400">Multi-Bus Passes</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-xs text-slate-400 uppercase font-semibold">DBSCAN Clusters</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{clusters.length}</div>
              <span className="text-[10px] text-amber-500/80">15m Spatial Dedup</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-xs text-slate-400 uppercase font-semibold">Critical Potholes</span>
              <div className="text-2xl font-bold text-red-500 mt-1">{stats.critical_severity}</div>
              <span className="text-[10px] text-red-400">D40 Hazard Level</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Buses</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.active_vehicles}</div>
              <span className="text-[10px] text-emerald-500/80">GPS Telemetry Nodes</span>
            </div>
          </div>

          {/* Live Ingestion Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg flex-1 flex flex-col overflow-hidden shadow-inner">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-400 animate-pulse" /> Real-Time Telemetry Stream
              </span>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {detections.map((d) => (
                <div
                  key={d.id}
                  className={`p-2.5 rounded border text-xs flex flex-col gap-1 transition-all ${
                    d.severity === 'critical' ? 'bg-red-950/30 border-red-800/60' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${d.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                      {d.defect_type} ({d.severity.toUpperCase()})
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(d.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] truncate">{d.road_name}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-400">{d.vehicle_id}</span>
                    <span className="text-blue-400 font-mono">Conf: {(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: WebGIS Vector Map */}
        <div className="col-span-6 flex flex-col gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" /> Chennai Arterial WebGIS Spatial Grid
            </span>
            <span className="text-[11px] text-slate-400">Datum: EPSG:4326 • 15m DBSCAN Radius</span>
          </div>

          <div className="flex-1 rounded overflow-hidden relative">
            <WebGISMap clusters={clusters} onStatusChange={updateStatus} />
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-2 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm shadow-red-500"></span> Critical Pothole (D40)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500"></span> High Priority Crack (D20)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-sm shadow-blue-500"></span> Multi-Pass Cluster
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Live Vector Carto Grid</span>
          </div>
        </div>

        {/* Right Column: RPI Repair Queue & Analytics */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* RPI Repair Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg flex-1 flex flex-col overflow-hidden shadow-inner">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-400" /> RPI Priority Repair Queue
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-mono">PWD Auto</span>
            </div>
            <div className="p-2 border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
              Formula: <code>0.40(Sev) + 0.25(Den) + 0.20(Hwy) + 0.15(POI)</code>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {clusters.map((c, idx) => (
                <div key={c.id} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded text-xs flex flex-col gap-1.5 hover:border-slate-700 transition">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-blue-900 text-blue-200 text-[10px] flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{c.dominant_type}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                        c.rpi_score > 85 ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                      }`}
                    >
                      RPI {c.rpi_score}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium truncate">{c.road_name}</div>
                  <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-semibold">🏗️ {c.contractor_name || 'L&T Infra'}</span>
                      <span className="text-red-400 font-mono font-semibold">{c.sla_hours || 24}h SLA</span>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-slate-400">
                      <span>📞 {c.contractor_contact || '+91 98401 22345'}</span>
                      <span>{c.detection_count} Passes</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="truncate text-slate-500">📍 {c.nearest_poi}</span>
                    <span
                      className={`capitalize px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        c.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : c.status === 'assigned'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => updateStatus(c.id, 'assigned')}
                      className="flex-1 py-1 bg-blue-900/40 hover:bg-blue-600 text-blue-200 text-[10px] font-semibold rounded border border-blue-700/60 transition"
                    >
                      Alert Contractor
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, 'resolved')}
                      className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-600 text-emerald-200 text-[10px] font-semibold rounded border border-emerald-700/60 transition"
                    >
                      Mark Settled
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg h-44 flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
              <PieIcon className="w-3.5 h-3.5 text-blue-400" /> Defect Distribution
            </span>
            <div className="flex-1 relative">
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, color: '#94A3B8', font: { size: 9 } } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
