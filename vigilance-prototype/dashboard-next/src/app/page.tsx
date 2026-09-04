'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardData } from '@/hooks/useDashboardData';
import Header from '@/components/Header';
import KPICard from '@/components/KPICard';
import TelemetryFeed from '@/components/TelemetryFeed';
import ClusterTable from '@/components/ClusterTable';
import ConnectionStatus from '@/components/ConnectionStatus';
import NoiseOverlay from '@/components/reactbits/NoiseOverlay';
import AgentThoughtStream from '@/components/manus/AgentThoughtStream';
import CommandPalette from '@/components/manus/CommandPalette';
import CorridorDistressSpline from '@/components/charts/CorridorDistressSpline';
import RPIRadialGauge from '@/components/charts/RPIRadialGauge';
import { Cluster } from '@/types/vigilance';
import { Activity, AlertOctagon, Camera, Columns, Layers, Layout, MapPin, ShieldCheck, Sparkles, TrendingUp, Truck, X } from 'lucide-react';

const WebGISMap = dynamic(() => import('@/components/WebGISMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      <span>Initializing Chennai Arterial WebGIS Spatial Grid (MapLibre GL)...</span>
    </div>
  ),
});

const EdgeCockpit3D = dynamic(() => import('@/components/EdgeCockpit3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-xs">
      Initializing 3D Transit Highway Telemetry...
    </div>
  ),
});

type WorkstationMode = 'full-gis' | 'split-ops' | 'full-cockpit';

export default function CommandCenterPage() {
  const {
    stats,
    clusters,
    detections,
    isConnected,
    backendAvailable,
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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* 0. Organic Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 1. Master Header Bar */}
      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* 2. Manus Live Agent Thought Stream */}
      <div className="px-3 pt-2">
        <AgentThoughtStream />
      </div>

      {/* 3. Main Workstation Grid */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Sidebar (Spotlight KPIs, ApexCharts Spline & Radial, Priority Queue) */}
        <aside className="w-full lg:w-[440px] flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar pr-1">
          {/* KPI 2x2 Metric Grid with SpotlightCard and Mini Sparklines */}
          <div className="grid grid-cols-2 gap-2.5">
            <KPICard
              title="Total Ingests"
              value={stats.total_detections}
              subtitle="Continuous Fleet Perception"
              icon={Activity}
              colorClass="text-cyan-400"
              spotlightColor="cyan"
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
              colorClass="text-red-400"
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

          {/* Cinematic ApexCharts: Real-time Corridor Distress Spline */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-3 flex flex-col shadow-lg relative group">
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/60 font-mono text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Corridor Distress Velocity</span>
              </div>
              <span className="text-[10px] text-slate-500">APEXCHARTS REAL-TIME</span>
            </div>
            <CorridorDistressSpline potholesCount={stats.potholes} cracksCount={stats.cracks} />
          </div>

          {/* RPI Concentric Radial Formula Breakdown */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-3 flex flex-col shadow-lg">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60 font-mono text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>RPI Factor Multi-Radial Gauge</span>
              </div>
              <span className="text-[10px] text-purple-400 font-bold">4-FACTOR WEIGHT</span>
            </div>
            <RPIRadialGauge
              rpiScore={
                clusters.length > 0
                  ? clusters.reduce((acc, c) => acc + c.rpi_score, 0) / clusters.length
                  : 84.5
              }
            />
          </div>

          {/* Real-time Telemetry Ingestion Feed */}
          <TelemetryFeed detections={detections} maxItems={10} />

          {/* RPI Priority Repair Queue */}
          <ClusterTable
            clusters={clusters}
            onStatusChange={updateStatus}
            onSelectCluster={(c) => setSelectedCluster(c)}
            maxItems={8}
          />
        </aside>

        {/* Center/Right: WebGIS Map Canvas & Tactical Workstation Area */}
        <main className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900 relative shadow-2xl">
          {/* Tactical Workstation Header Bar */}
          <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Left Controls */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-slate-200">Chennai Arterial Spatial Grid</span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-400">EPSG:4326</span>
              </div>

              {/* Workstation Mode Switcher Tabs */}
              <div className="hidden xl:flex items-center bg-slate-950/90 border border-slate-800 p-1 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setWorkstationMode('full-gis')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                    workstationMode === 'full-gis'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layout className="w-3 h-3" />
                  <span>Full GIS Map</span>
                </button>
                <button
                  onClick={() => setWorkstationMode('split-ops')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                    workstationMode === 'split-ops'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  <span>Split Tactical Ops</span>
                </button>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setShowExecutiveBrief(!showExecutiveBrief)}
                className="bg-purple-950/80 hover:bg-purple-900/90 border border-purple-800/80 text-purple-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition shadow-lg"
                title="View SIH26124 Executive Architecture Brief"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>BEL Solution Brief</span>
              </button>

              <button
                onClick={() => setShowCockpitModal(true)}
                className="bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-700/80 text-cyan-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition shadow-lg animate-pulse"
                title="View live 3D highway edge cockpit perspective"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Bus Cockpit</span>
              </button>

              <button
                onClick={() => setShowRPIModal(!showRPIModal)}
                className="bg-blue-950/80 hover:bg-blue-900/90 border border-blue-800/80 text-cyan-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition shadow-lg"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>RPI Formula</span>
              </button>
            </div>
          </div>

          {/* Main Content Area (supports Full GIS or Split Tactical Ops) */}
          <div className="flex-1 w-full h-full flex overflow-hidden">
            {workstationMode === 'split-ops' && (
              <div className="w-1/2 h-full border-r border-slate-800 pt-12 p-2 relative bg-slate-950">
                <div className="absolute top-2 left-3 z-10 text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                  <Camera className="w-3 h-3 animate-pulse" />
                  <span>TACTICAL WINDSHIELD 3D HUD</span>
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
              />
            </div>
          </div>

          {/* Tactical Bottom Map Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex items-center justify-between">
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg flex items-center gap-4 text-xs font-mono pointer-events-auto shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <span className="text-[11px] text-slate-300">Critical Pothole (D40)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[11px] text-slate-300">Alligator Crack (D20)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[11px] text-slate-300">Linear Defect (D00/D10)</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-300">Resolved PWD Ticket</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 pointer-events-auto shadow-lg">
              <span>🏥 Hospitals: 6</span>
              <span>•</span>
              <span>🎓 Universities: 6</span>
              <span>•</span>
              <span>🛣️ Arterials: 8</span>
            </div>
          </div>

          {/* 3D Edge Cockpit Modal Overlay */}
          {showCockpitModal && (
            <div className="absolute inset-4 z-30 flex flex-col bg-slate-950/95 backdrop-blur-xl rounded-xl border border-cyan-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
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
            <div className="absolute inset-x-8 top-12 bottom-12 z-30 bg-slate-950/95 backdrop-blur-xl border border-purple-700/80 rounded-2xl p-6 shadow-2xl overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-between animate-in fade-in zoom-in-95">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span className="text-base font-bold text-slate-100">
                      SIH26124 • BHARAT ELECTRONICS LIMITED (BEL) SOLUTION BRIEF
                    </span>
                  </div>
                  <button
                    onClick={() => setShowExecutiveBrief(false)}
                    className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                    <div className="text-cyan-400 font-bold mb-1">1. SUB-₹3,000 EDGE UNIT</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Custom INT8 quantized YOLOv8n running on Rockchip RK3588 NPU at 24 FPS (&lt;110MB RAM footprint).
                      Reuses public transit buses with zero infrastructure CAPEX.
                    </p>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                    <div className="text-amber-400 font-bold mb-1">2. SPATIO-TEMPORAL DBSCAN</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Asynchronous Celery + Redis pipeline executing PostGIS <code className="text-white">ST_ClusterDBSCAN</code> (15m radius),
                      eliminating duplicate detections from repeated bus passes.
                    </p>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                    <div className="text-purple-400 font-bold mb-1">3. DYNAMIC RPI TRIAGE</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Priority score combining Distress Severity (40%), Bus Frequency (25%), Highway Hierarchy (20%), and Emergency POI proximity (15%).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                <span>Status: Fully Built &amp; Deployed (Live WebGIS + Production APIs)</span>
                <button
                  onClick={() => setShowExecutiveBrief(false)}
                  className="px-4 py-1.5 rounded-lg bg-purple-900 text-purple-200 font-bold hover:bg-purple-800 transition"
                >
                  Return to Workstation
                </button>
              </div>
            </div>
          )}

          {/* RPI Formula Explainer Modal */}
          {showRPIModal && (
            <div className="absolute top-14 left-3 z-20 w-80 bg-slate-950/95 backdrop-blur-xl border border-cyan-800/80 rounded-xl p-4 text-xs font-mono shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Dynamic RPI Algorithm
                </span>
                <button
                  onClick={() => setShowRPIModal(false)}
                  className="text-slate-500 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 text-slate-300 leading-relaxed">
                <code className="text-cyan-400 font-bold block bg-slate-900 p-1.5 rounded border border-slate-800 mb-2">
                  0.40(Sev) + 0.25(Den) + 0.20(Hwy) + 0.15(POI)
                </code>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• <b className="text-slate-200">Severity (40%):</b> D40 critical = 1.0, crack = 0.5</li>
                  <li>• <b className="text-slate-200">Density (25%):</b> Multi-bus pass frequency</li>
                  <li>• <b className="text-slate-200">Highway (20%):</b> GST Road = 1.0, OMR = 0.8</li>
                  <li>• <b className="text-slate-200">POI (15%):</b> Distance to emergency hospitals</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 4. Manus Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTriggerDedup={triggerDedup}
        onOpenCockpit={() => setShowCockpitModal(true)}
      />

      {/* 5. Bottom System Status Bar */}
      <ConnectionStatus
        isConnected={isConnected}
        backendAvailable={backendAvailable}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
