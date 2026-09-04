'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useDashboardData } from '@/hooks/useDashboardData';
import Header from '@/components/Header';
import KPICard from '@/components/KPICard';
import TelemetryFeed from '@/components/TelemetryFeed';
import ClusterTable from '@/components/ClusterTable';
import AgentThoughtStream from '@/components/manus/AgentThoughtStream';
import CommandPalette from '@/components/manus/CommandPalette';
import CorridorDistressSpline from '@/components/charts/CorridorDistressSpline';
import RPIRadialGauge from '@/components/charts/RPIRadialGauge';
import { Cluster } from '@/types/vigilance';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertOctagon,
  Camera,
  Columns,
  Layers,
  Layout,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Truck,
  X,
  Smartphone,
  BarChart3,
  ListOrdered,
  Calculator,
} from 'lucide-react';

const WebGISMap = dynamic(() => import('@/components/WebGISMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <span>Loading Chennai Spatial Grid (MapLibre GL)...</span>
    </div>
  ),
});

const EdgeCockpit3D = dynamic(() => import('@/components/EdgeCockpit3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
      Initializing 3D Transit Highway Telemetry...
    </div>
  ),
});

type WorkstationMode = 'full-gis' | 'split-ops';
type SidebarTab = 'queue' | 'analytics';

const MAP_LAYER_OPTIONS = [
  { key: 'esriDark', label: 'Dark Canvas' },
  { key: 'osmStandard', label: 'Street Map' },
  { key: 'esriSatellite', label: 'Satellite' },
  { key: 'esriTopo', label: 'Topography' },
];

export default function CommandCenterPage() {
  const {
    stats,
    clusters,
    detections,
    isConnected,
    backendAvailable,
    backendStatus,
    lastUpdated,
    refreshData,
    updateStatus,
    triggerDedup,
  } = useDashboardData();

  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [showRPIModal, setShowRPIModal] = useState(false);
  const [showExecutiveBrief, setShowExecutiveBrief] = useState(false);
  const [showCockpitModal, setShowCockpitModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [workstationMode, setWorkstationMode] = useState<WorkstationMode>('full-gis');
  const [activeMapStyle, setActiveMapStyle] = useState<string>('esriDark');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('queue');
  const [mobileTab, setMobileTab] = useState<'map' | 'telemetry'>('map');

  const avgRpi =
    clusters.length > 0
      ? clusters.reduce((acc, c) => acc + c.rpi_score, 0) / clusters.length
      : 84.5;

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* 1. Master Header Bar */}
      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        backendAvailable={backendAvailable}
        backendStatus={backendStatus}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* Fallback / Demo Data Warning Banner (when backend is cold/sleeping or unreachable) */}
      {backendAvailable === false && (
        <div className="bg-amber-950/90 border-b border-amber-600/70 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-amber-200 z-30 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-bold text-amber-300">DEMO MODE (SYNTHETIC TELEMETRY ACTIVE):</span>
            <span className="text-amber-200/90 text-[11px] hidden sm:inline">
              Backend service is currently unreachable or sleeping (Render free-tier cold start). Serving cached dataset + client-side simulation.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="px-2 py-0.5 bg-amber-900 hover:bg-amber-800 border border-amber-600 rounded text-[11px] font-semibold text-amber-100 cursor-pointer transition"
            >
              🔄 Retry Connection
            </button>
            <button
              onClick={() => setShowCommandPalette(true)}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 cursor-pointer transition"
            >
              ⚙️ Set Live API URL
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher Bar (visible only on mobile/tablet < lg) */}
      <div className="lg:hidden flex items-center bg-slate-900 border-b border-slate-800 px-3 py-1.5 shrink-0 z-20">
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono w-full">
          <button
            onClick={() => setMobileTab('map')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition font-semibold',
              mobileTab === 'map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GIS Map & Cockpit</span>
          </button>
          <button
            onClick={() => setMobileTab('telemetry')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition font-semibold',
              mobileTab === 'telemetry'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Queue & Stats</span>
          </button>
        </div>
      </div>

      {/* 2. Perception Audit Log Stream Ticker */}
      <div className="px-3 pt-2 shrink-0">
        <AgentThoughtStream />
      </div>

      {/* 3. Main Workstation Grid */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">
        {/* Left Sidebar: Executive KPIs + Tabbed Operations / Analytics */}
        <aside
          className={cn(
            'w-full lg:w-[410px] xl:w-[440px] flex flex-col gap-2.5 shrink-0 overflow-hidden',
            mobileTab !== 'telemetry' && 'hidden lg:flex'
          )}
        >
          {/* Executive KPI 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <KPICard
              title="Total Ingests"
              value={stats.total_detections}
              subtitle="Continuous Fleet Perception"
              icon={Activity}
              colorClass="text-slate-100"
              spotlightColor="blue"
              badgeText="LIVE 5Hz"
              sparklineData={[15, 22, 18, 32, 28, 45, 52]}
            />
            <KPICard
              title="DBSCAN Clusters"
              value={stats.deduplicated_clusters}
              subtitle="15m Spatial Deduplication"
              icon={Layers}
              colorClass="text-amber-400"
              spotlightColor="amber"
              badgeText="15m EPS"
              sparklineData={[4, 6, 5, 8, 9, 12, 14]}
            />
            <KPICard
              title="Critical Hazards"
              value={stats.critical_severity}
              subtitle="D40 Deep Potholes"
              icon={AlertOctagon}
              colorClass="text-rose-400"
              spotlightColor="red"
              badgeText="HIGH RISK"
              sparklineData={[2, 4, 3, 5, 4, 7, 8]}
            />
            <KPICard
              title="Active Fleet"
              value={stats.active_vehicles}
              subtitle="Chennai Transit Buses"
              icon={Truck}
              colorClass="text-emerald-400"
              spotlightColor="emerald"
              badgeText="ONLINE"
              sparklineData={[5, 5, 5, 5, 5, 5, 5]}
            />
          </div>

          {/* Sidebar View Tabs (Queue & Live Feed vs Corridor Analytics) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono shrink-0">
            <button
              onClick={() => setSidebarTab('queue')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition font-semibold',
                sidebarTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Priority Triage Queue</span>
            </button>
            <button
              onClick={() => setSidebarTab('analytics')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition font-semibold',
                sidebarTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Corridor Analytics</span>
            </button>
          </div>

          {/* Tab Content 1: Priority Queue & Live Telemetry Feed */}
          {sidebarTab === 'queue' && (
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              <ClusterTable
                clusters={clusters}
                onStatusChange={updateStatus}
                onSelectCluster={(c) => setSelectedCluster(c)}
                maxItems={10}
              />
              <TelemetryFeed detections={detections} maxItems={8} />
            </div>
          )}

          {/* Tab Content 2: Corridor Analytics & Radial RPI Gauge */}
          {sidebarTab === 'analytics' && (
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              {/* Corridor Distress Spline */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>Corridor Distress Velocity</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">24H TIMELINE</span>
                </div>
                <CorridorDistressSpline potholesCount={stats.potholes} cracksCount={stats.cracks} />
              </div>

              {/* RPI Concentric Radial Formula Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-mono text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                    <Calculator className="w-3.5 h-3.5 text-amber-400" />
                    <span>RPI Multi-Factor Breakdown</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">4-WEIGHT FORMULA</span>
                </div>
                <RPIRadialGauge rpiScore={avgRpi} />
              </div>
            </div>
          )}
        </aside>

        {/* Center/Right: WebGIS Map Canvas & Unified Workstation Area */}
        <main
          className={cn(
            'flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl min-h-0 relative',
            mobileTab !== 'map' && 'hidden lg:flex'
          )}
        >
          {/* Single-Row Unified Map Control Ribbon (NEVER WRAPS) */}
          <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 z-20 select-none overflow-x-auto custom-scrollbar flex-nowrap whitespace-nowrap">
            {/* Left Section: Region Title & View Mode Tabs */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Chennai Arterial Grid</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">EPSG:4326</span>
              </div>

              {/* Workstation Mode Switcher */}
              <div className="hidden xl:flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-md text-xs font-mono">
                <button
                  onClick={() => setWorkstationMode('full-gis')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition',
                    workstationMode === 'full-gis'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Layout className="w-3 h-3" />
                  <span>Full Map</span>
                </button>
                <button
                  onClick={() => setWorkstationMode('split-ops')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition',
                    workstationMode === 'split-ops'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Columns className="w-3 h-3" />
                  <span>Split 3D</span>
                </button>
              </div>
            </div>

            {/* Center Section: Map Layer Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-md text-xs font-mono shrink-0">
              {MAP_LAYER_OPTIONS.map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => setActiveMapStyle(layer.key)}
                  className={cn(
                    'px-2 py-0.5 text-[10.5px] rounded transition-colors',
                    activeMapStyle === layer.key
                      ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  )}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/capture"
                className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-mono transition font-bold shadow-xs active:scale-95"
                title="Launch phone camera windshield dashcam"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Dashcam</span>
              </Link>

              <button
                onClick={() => setShowCockpitModal(true)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-mono transition"
                title="View live 3D highway edge cockpit perspective"
              >
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">3D Cockpit</span>
              </button>

              <button
                onClick={() => setShowExecutiveBrief(!showExecutiveBrief)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-mono transition hidden sm:flex"
                title="View SIH26124 Executive Architecture Brief"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>BEL Brief</span>
              </button>

              <button
                onClick={() => setShowRPIModal(!showRPIModal)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-mono transition hidden md:flex"
                title="View Road Priority Index scoring formula"
              >
                <Calculator className="w-3 h-3 text-amber-400" />
                <span>RPI Formula</span>
              </button>
            </div>
          </div>

          {/* Map & Cockpit Viewport */}
          <div className="flex-1 w-full h-full flex overflow-hidden relative">
            {workstationMode === 'split-ops' && (
              <div className="w-1/2 h-full border-r border-slate-800 p-2 relative bg-slate-950">
                <div className="absolute top-2 left-3 z-10 text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded">
                  <Camera className="w-3 h-3 text-blue-400" />
                  <span>3D WINDSHIELD HUD</span>
                </div>
                <EdgeCockpit3D
                  vehicleId="BUS-TN01-1042"
                  roadName="GST Road (NH-32)"
                />
              </div>
            )}

            <div className={`${workstationMode === 'split-ops' ? 'w-1/2' : 'w-full'} h-full relative`}>
              <WebGISMap
                clusters={clusters}
                onStatusChange={updateStatus}
                selectedClusterId={selectedCluster?.id}
                activeMapStyle={activeMapStyle}
                onMapStyleChange={setActiveMapStyle}
              />
            </div>

            {/* Bottom Map Legend (Clean positioning) */}
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2">
              <div className="bg-slate-950/95 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono pointer-events-auto shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10.5px] text-slate-300">Critical (D40)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10.5px] text-slate-300">Alligator Crack (D20)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[10.5px] text-slate-300">Linear (D00/D10)</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10.5px] text-slate-300">Resolved Ticket</span>
                </div>
              </div>

              <div className="hidden xl:flex items-center gap-2 bg-slate-950/95 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono text-slate-400 pointer-events-auto shadow-md">
                <span>🏥 Hospitals: 6</span>
                <span>•</span>
                <span>🎓 Universities: 6</span>
                <span>•</span>
                <span>🛣️ Arterials: 8</span>
              </div>
            </div>
          </div>

          {/* 3D Edge Cockpit Modal Overlay */}
          {showCockpitModal && (
            <div className="absolute inset-4 z-30 flex flex-col bg-slate-950/95 backdrop-blur-xl rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex-1 w-full h-full relative">
                <EdgeCockpit3D
                  vehicleId="BUS-TN01-1042"
                  roadName="GST Road, Tambaram (NH-32)"
                  onClose={() => setShowCockpitModal(false)}
                />
              </div>
            </div>
          )}

          {/* SIH Executive Brief Modal */}
          {showExecutiveBrief && (
            <div className="absolute inset-x-6 top-8 bottom-8 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-xl p-6 shadow-2xl overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-between animate-in fade-in zoom-in-95">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold text-slate-100">
                      SIH26124 • BHARAT ELECTRONICS LIMITED (BEL) EXECUTIVE BRIEF
                    </span>
                  </div>
                  <button
                    onClick={() => setShowExecutiveBrief(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-blue-400 mb-1.5">Problem Context</h4>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Municipal corporations lose ₹2.5L Cr annually to undetected road distress. VIGILANCE converts existing public transit bus fleets into continuous 5Hz edge AI perception units.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-emerald-400 mb-1.5">Hardware Efficiency</h4>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Runs INT8 quantized YOLOv8-Nano on Raspberry Pi Zero 2W (BOM: ₹2,950/bus) or driver Android smartphones via Termux at zero added hardware cost.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-amber-400 mb-1.5">DBSCAN Spatial Consensus</h4>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Multiple bus passes across corridors are merged within a 15m radius via great-circle haversine clustering to eradicate false positives.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                    <h4 className="font-bold text-rose-400 mb-1.5">Automated SLA Dispatch</h4>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Clusters calculate RPI and automatically dispatch work orders to responsible road contractors with 24h/48h resolution SLA countdowns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-slate-500 text-[10px]">
                <span>VIGILANCE SIH 2026 • SRM Institute of Science and Technology</span>
                <button
                  onClick={() => setShowExecutiveBrief(false)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Close Brief
                </button>
              </div>
            </div>
          )}

          {/* RPI Formula Modal */}
          {showRPIModal && (
            <div className="absolute inset-x-8 top-12 bottom-12 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-xl p-6 shadow-2xl overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-between animate-in fade-in zoom-in-95">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-slate-100">
                      ROAD PRIORITY INDEX (RPI) FORMULATION SPECIFICATION
                    </span>
                  </div>
                  <button
                    onClick={() => setShowRPIModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-4 bg-slate-900 border border-slate-800 p-4 rounded-lg font-mono text-slate-200">
                  <div className="text-amber-400 font-bold mb-2">RPI Formula:</div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs">
                    RPI = (Severity × 0.40) + (Density × 0.25) + (Hierarchy × 0.20) + (POI Proximity × 0.15)
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-[11px] text-slate-400">
                    <div>• <b>Severity (40%):</b> D40 Pothole = 1.0, D20 Alligator = 0.8, D00 Crack = 0.5</div>
                    <div>• <b>Density (25%):</b> Fleet passes / 10 (capped at 1.0)</div>
                    <div>• <b>Hierarchy (20%):</b> NH/Expressway = 1.0, Arterial = 0.8, Local = 0.4</div>
                    <div>• <b>POI Proximity (15%):</b> &lt;500m to Hospital/School = 1.0, &lt;1km = 0.7</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowRPIModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 4. Command Palette Dialog */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTriggerDedup={triggerDedup}
        onRefreshData={refreshData}
      />
    </div>
  );
}
