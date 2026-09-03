'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import ConnectionStatus from '@/components/ConnectionStatus';
import KPICard from '@/components/KPICard';
import SeverityBadge from '@/components/SeverityBadge';
import RPIProgressBar from '@/components/RPIProgressBar';
import StatusDropdown from '@/components/StatusDropdown';
import { useDashboardData } from '@/hooks/useDashboardData';
import { exportToCSV, formatDateTime } from '@/lib/utils';
import { ClusterStatus, Severity } from '@/types/vigilance';
import { ClipboardList, Download, Search, CheckCircle2, Clock, Wrench, AlertTriangle, Filter } from 'lucide-react';

export default function WorkOrdersPage() {
  const { stats, clusters, isConnected, backendAvailable, lastUpdated, refreshData, updateStatus, triggerDedup } =
    useDashboardData();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rpi' | 'passes' | 'date'>('rpi');

  // Summary counts
  const openCount = clusters.filter((c) => c.status === 'open').length;
  const assignedCount = clusters.filter((c) => c.status === 'assigned').length;
  const resolvedCount = clusters.filter((c) => c.status === 'resolved').length;

  const filteredClusters = useMemo(() => {
    return clusters
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (severityFilter !== 'all' && c.max_severity !== severityFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            c.road_name.toLowerCase().includes(q) ||
            c.dominant_type.toLowerCase().includes(q) ||
            (c.nearest_poi && c.nearest_poi.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rpi') return b.rpi_score - a.rpi_score;
        if (sortBy === 'passes') return b.detection_count - a.detection_count;
        if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [clusters, statusFilter, severityFilter, searchQuery, sortBy]);

  const handleExportCSV = () => {
    const dataToExport = filteredClusters.map((c, i) => ({
      WorkOrderID: `WO-${c.id.toString().padStart(4, '0')}`,
      PriorityRank: i + 1,
      DefectType: c.dominant_type,
      MaxSeverity: c.max_severity,
      RPIScore: c.rpi_score,
      Status: c.status,
      RoadName: c.road_name,
      NearestPOI: c.nearest_poi || 'N/A',
      POIDistanceMeters: c.poi_distance_m || 0,
      FleetPassCount: c.detection_count,
      CentroidLat: c.centroid_lat,
      CentroidLon: c.centroid_lon,
      CreatedAt: c.created_at,
    }));
    exportToCSV(`VIGILANCE_PWD_Work_Orders_${new Date().toISOString().slice(0, 10)}.csv`, dataToExport);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans select-none">
      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
      />

      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">
        {/* Title and Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              <span>Municipal PWD Road Work Order Management</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Automated work-order lifecycle: Open ➔ Dispatched to PWD ➔ Verified Resolved by Fleet Passes
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Work Orders</span>
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Total Work Orders"
            value={clusters.length}
            subtitle="Active Spatial Clusters"
            icon={ClipboardList}
            colorClass="text-slate-100"
          />
          <KPICard
            title="Awaiting Dispatch"
            value={openCount}
            subtitle="Prioritized in RPI Queue"
            icon={AlertTriangle}
            colorClass="text-red-400"
            badgeText="ACTION REQ."
          />
          <KPICard
            title="Assigned / PWD Dispatched"
            value={assignedCount}
            subtitle="Maintenance Crews Mobilized"
            icon={Wrench}
            colorClass="text-blue-400"
          />
          <KPICard
            title="Repaired & Resolved"
            value={resolvedCount}
            subtitle="Fleet Proof-of-Work Verified"
            icon={CheckCircle2}
            colorClass="text-emerald-400"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search road name, defect or hospital..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              <span className="text-[10px] text-slate-500 px-1">Status:</span>
              {(['all', 'open', 'assigned', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition ${
                    statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              <span className="text-[10px] text-slate-500 px-1">Severity:</span>
              {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition ${
                    severityFilter === sev ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="rpi">RPI Priority (High ➔ Low)</option>
              <option value="passes">Fleet Passes (High ➔ Low)</option>
              <option value="date">Date Logged</option>
            </select>
          </div>
        </div>

        {/* Work Orders Master Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Distress Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Road Location</th>
                  <th className="py-3 px-4">Nearest POI</th>
                  <th className="py-3 px-4">Pass Count</th>
                  <th className="py-3 px-4 min-w-[130px]">RPI Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClusters.map((cluster) => {
                  return (
                    <tr
                      key={cluster.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        cluster.rpi_score >= 85 ? 'bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        WO-{cluster.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{cluster.dominant_type}</td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={cluster.max_severity} />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{cluster.road_name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {cluster.nearest_poi ? (
                          <span>
                            {cluster.nearest_poi} <span className="text-slate-500">({cluster.poi_distance_m}m)</span>
                          </span>
                        ) : (
                          'Arterial Corridor'
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-300">{cluster.detection_count} passes</td>
                      <td className="py-3 px-4">
                        <RPIProgressBar score={cluster.rpi_score} showLabel={false} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusDropdown
                          status={cluster.status}
                          onChange={(newStatus) => updateStatus(cluster.id, newStatus)}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <StatusDropdown
                          status={cluster.status}
                          onChange={(newStatus) => updateStatus(cluster.id, newStatus)}
                          compact={true}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClusters.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No matching work orders found for the current search/filter criteria.
            </div>
          )}
        </div>
      </main>

      <ConnectionStatus isConnected={isConnected} backendAvailable={backendAvailable} lastUpdated={lastUpdated} />
    </div>
  );
}
