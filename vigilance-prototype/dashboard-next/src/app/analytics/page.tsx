'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import ConnectionStatus from '@/components/ConnectionStatus';
import KPICard from '@/components/KPICard';
import RPIProgressBar from '@/components/RPIProgressBar';
import SeverityBadge from '@/components/SeverityBadge';
import NoiseOverlay from '@/components/reactbits/NoiseOverlay';
import AgentThoughtStream from '@/components/manus/AgentThoughtStream';
import CommandPalette from '@/components/manus/CommandPalette';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import CorridorDistressSpline from '@/components/charts/CorridorDistressSpline';
import RPIRadialGauge from '@/components/charts/RPIRadialGauge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CHENNAI_ROADS, DEFECT_INFO } from '@/lib/constants';
import { BarChart3, TrendingUp, AlertTriangle, Layers, Truck, ShieldCheck, MapPin, Sparkles, Eye } from 'lucide-react';

export default function AnalyticsPage() {
  const { stats, clusters, detections, isConnected, backendAvailable, lastUpdated, refreshData, triggerDedup } =
    useDashboardData();

  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Aggregate detections by road corridor
  const roadStats = CHENNAI_ROADS.map((r) => {
    const matchingClusters = clusters.filter((c) =>
      c.road_name.toLowerCase().includes(r.road.split(' ')[0].toLowerCase())
    );
    const totalDetections = matchingClusters.reduce((acc, c) => acc + c.detection_count, 0);
    const avgRpi =
      matchingClusters.length > 0
        ? matchingClusters.reduce((acc, c) => acc + c.rpi_score, 0) / matchingClusters.length
        : 0;
    const criticalCount = matchingClusters.filter((c) => c.max_severity === 'critical').length;

    return {
      road: r.road,
      weight: r.weight,
      significance: r.significance,
      clusterCount: matchingClusters.length,
      totalDetections,
      avgRpi,
      criticalCount,
    };
  }).sort((a, b) => b.totalDetections - a.totalDetections);

  // Fleet performance distribution
  const vehicleStats: Record<string, { count: number; critical: number; lastRoad: string }> = {};
  detections.forEach((d) => {
    if (!vehicleStats[d.vehicle_id]) {
      vehicleStats[d.vehicle_id] = { count: 0, critical: 0, lastRoad: d.road_name };
    }
    vehicleStats[d.vehicle_id].count += 1;
    if (d.severity === 'critical') vehicleStats[d.vehicle_id].critical += 1;
  });

  const overallAvgRpi = useMemo(() => {
    return clusters.length > 0
      ? clusters.reduce((acc, c) => acc + c.rpi_score, 0) / clusters.length
      : 84.5;
  }, [clusters]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans select-none relative">
      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      <div className="px-4 lg:px-6 pt-2">
        <AgentThoughtStream />
      </div>

      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Page Title & Breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Urban Road Distress Analytics & Intelligence</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Automated municipal spatial reporting based on CRDDC / RDD2022 benchmark specifications
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICard
            title="Total Detections"
            value={stats.total_detections}
            subtitle="Raw Mobile Ingests"
            icon={Eye}
            colorClass="text-cyan-400"
            spotlightColor="cyan"
            sparklineData={[20, 28, 25, 42, 38, 55, 62]}
          />
          <KPICard
            title="Deduplication Ratio"
            value={`${((1 - stats.deduplicated_clusters / Math.max(1, stats.total_detections)) * 100).toFixed(1)}%`}
            subtitle="Noise & Duplicate Rejection"
            icon={Layers}
            colorClass="text-emerald-400"
            spotlightColor="emerald"
            sparklineData={[60, 65, 72, 70, 78, 82, 85]}
          />
          <KPICard
            title="Avg Priority Score"
            value={overallAvgRpi.toFixed(1)}
            subtitle="Dynamic Multi-Factor RPI"
            icon={AlertTriangle}
            colorClass="text-amber-400"
            spotlightColor="amber"
            sparklineData={[78, 80, 82, 83, 84, 85, Math.round(overallAvgRpi)]}
          />
          <KPICard
            title="Critical Hazards (D40)"
            value={stats.critical_severity}
            subtitle="Requires Emergency PWD Infill"
            icon={ShieldCheck}
            colorClass="text-red-400"
            spotlightColor="red"
            sparklineData={[2, 4, 3, 5, 4, 7, 8]}
          />
        </div>

        {/* Cinematic ApexCharts Suite Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Spline Area Chart */}
          <div className="lg:col-span-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 uppercase">Corridor Distress Ingestion vs Velocity</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">APEXCHARTS DUAL-SPLINE</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-2">
              Time-series correlation between bus operating speed (km/h) and distress frequency along arterial routes
            </p>
            <div className="h-64">
              <CorridorDistressSpline potholesCount={stats.potholes} cracksCount={stats.cracks} />
            </div>
          </div>

          {/* RPI Concentric Radial Gauge */}
          <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-slate-200 uppercase">RPI Weight Distribution</span>
                </div>
                <span className="text-[10px] text-purple-400 font-bold">RADIAL BAR</span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2 mb-1">
                Multi-radial breakdown of the 4 priority factors: Severity, Frequency, Highway, and POI proximity
              </p>
              <div className="h-60 flex items-center justify-center">
                <RPIRadialGauge rpiScore={overallAvgRpi} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Target: Zero Accident Corridor</span>
              <span className="text-cyan-400">Formula V2.4 Active</span>
            </div>
          </div>
        </div>

        {/* Chennai Arterial Road Corridor Risk Matrix */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
                  Chennai Arterial Road Corridor Risk Matrix
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dynamic risk priority index calculated across primary transit routes in the Greater Chennai region
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800 self-start sm:self-auto">
              8 Arterials Monitored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Corridor Name</th>
                  <th className="pb-3 font-semibold">Classification</th>
                  <th className="pb-3 font-semibold text-center">Clusters</th>
                  <th className="pb-3 font-semibold text-center">Raw Ingests</th>
                  <th className="pb-3 font-semibold text-center">Critical (D40)</th>
                  <th className="pb-3 font-semibold">Average RPI</th>
                  <th className="pb-3 font-semibold">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roadStats.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{r.road}</span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">{r.significance}</td>
                    <td className="py-3 text-center text-slate-300">{r.clusterCount}</td>
                    <td className="py-3 text-center text-cyan-400 font-bold">{r.totalDetections}</td>
                    <td className="py-3 text-center">
                      {r.criticalCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                          {r.criticalCount}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 w-40">
                      <RPIProgressBar score={r.avgRpi} showLabel />
                    </td>
                    <td className="py-3">
                      {r.criticalCount > 0 ? (
                        <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-1 rounded border border-red-800">
                          PRIORITY DISPATCH
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                          NORMAL PATROL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Vehicle Performance Breakdown */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
              Edge Fleet Observation Diagnostics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(vehicleStats).map(([vehId, vData]) => (
              <SpotlightCard
                key={vehId}
                spotlightColor="emerald"
                className="p-3 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-xs font-mono">{vehId}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-bold font-mono text-cyan-400">{vData.count}</span>
                  <span className="text-[10px] font-mono text-slate-400">ingests</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  Route: {vData.lastRoad}
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onRefreshData={refreshData}
        onTriggerDedup={triggerDedup}
      />

      <ConnectionStatus isConnected={isConnected} backendAvailable={backendAvailable} lastUpdated={lastUpdated} />
    </div>
  );
}
