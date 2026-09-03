'use client';

import React from 'react';
import Header from '@/components/Header';
import ConnectionStatus from '@/components/ConnectionStatus';
import KPICard from '@/components/KPICard';
import DoughnutChart from '@/components/DoughnutChart';
import RPIProgressBar from '@/components/RPIProgressBar';
import SeverityBadge from '@/components/SeverityBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CHENNAI_ROADS, DEFECT_INFO } from '@/lib/constants';
import { BarChart3, TrendingUp, AlertTriangle, Layers, Truck, ShieldCheck, MapPin } from 'lucide-react';

export default function AnalyticsPage() {
  const { stats, clusters, detections, isConnected, backendAvailable, lastUpdated, refreshData, triggerDedup } =
    useDashboardData();

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans select-none">
      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
      />

      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Total Verified Distresses"
            value={stats.total_detections}
            subtitle="Multi-Vehicle Edge Observations"
            icon={TrendingUp}
            colorClass="text-cyan-400"
          />
          <KPICard
            title="Deduplicated Hotspots"
            value={clusters.length}
            subtitle="15m DBSCAN Spatial Clusters"
            icon={Layers}
            colorClass="text-amber-400"
          />
          <KPICard
            title="Critical Structural Failures"
            value={stats.critical_severity}
            subtitle="Potholes requiring emergency fill"
            icon={AlertTriangle}
            colorClass="text-red-400"
          />
          <KPICard
            title="Monitoring Coverage"
            value="100%"
            subtitle="8 Primary Chennai Arterials"
            icon={ShieldCheck}
            colorClass="text-emerald-400"
          />
        </div>

        {/* Charts Section (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Chart: Severity & Defect Distribution */}
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800 mb-3 flex items-center justify-between">
              <span>Distress Classification Breakdown</span>
              <span className="text-[10px] text-cyan-400 font-normal">RDD2022 Taxonomy</span>
            </h2>
            <div className="flex-1 flex items-center justify-center py-2">
              <DoughnutChart stats={stats} className="h-48 w-full relative" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                <span className="text-slate-400 text-[10px]">Potholes (D40)</span>
                <div className="text-red-400 font-bold text-base mt-0.5">{stats.potholes}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                <span className="text-slate-400 text-[10px]">Surface Cracks (D00-D20)</span>
                <div className="text-amber-400 font-bold text-base mt-0.5">{stats.cracks}</div>
              </div>
            </div>
          </div>

          {/* Right Chart: RPI Priority Distribution */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800 mb-3 flex items-center justify-between">
              <span>RPI Repair Priority Index Distribution</span>
              <span className="text-[10px] text-slate-500 font-mono">Ranked Highest First</span>
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1 custom-scrollbar">
              {clusters.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{c.road_name}</span>
                    </div>
                    <SeverityBadge severity={c.max_severity} />
                  </div>
                  <RPIProgressBar score={c.rpi_score} showLabel={true} />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{c.detection_count} Passes • Dominant: {c.dominant_type}</span>
                    <span>Status: <b className="text-slate-300 uppercase">{c.status}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Road Corridor Severity Heatmap Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Chennai Arterial Road Corridor Risk Matrix</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Hierarchy Weighted</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2">Road Corridor</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Hotspots</th>
                  <th className="pb-2">Total Passes</th>
                  <th className="pb-2">Avg RPI</th>
                  <th className="pb-2">Critical</th>
                  <th className="pb-2">Traffic Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roadStats.map((r) => (
                  <tr key={r.road} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-200">{r.road}</td>
                    <td className="py-2.5 text-cyan-400 font-bold">{r.weight.toFixed(2)}</td>
                    <td className="py-2.5 text-amber-400">{r.clusterCount}</td>
                    <td className="py-2.5 text-slate-300 font-bold">{r.totalDetections}</td>
                    <td className="py-2.5">
                      <span className="font-bold text-red-400">{r.avgRpi ? r.avgRpi.toFixed(1) : '—'}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                        {r.criticalCount}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate">{r.significance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Sensing Activity */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>Fleet Node Detection Performance</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(vehicleStats).map(([vehId, data]) => (
              <div key={vehId} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-[11px]">{vehId}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-1">{data.count}</div>
                <div className="text-[10px] text-slate-400">Total Detections Logged</div>
                <div className="text-[10px] text-red-400 mt-1">{data.critical} Critical Potholes</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ConnectionStatus isConnected={isConnected} backendAvailable={backendAvailable} lastUpdated={lastUpdated} />
    </div>
  );
}
