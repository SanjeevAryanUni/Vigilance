'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import ConnectionStatus from '@/components/ConnectionStatus';
import KPICard from '@/components/KPICard';
import SeverityBadge from '@/components/SeverityBadge';
import RPIProgressBar from '@/components/RPIProgressBar';
import StatusDropdown from '@/components/StatusDropdown';
import AgentThoughtStream from '@/components/manus/AgentThoughtStream';
import CommandPalette from '@/components/manus/CommandPalette';
import DetailDrawer from '@/components/DetailDrawer';
import { useDashboardData } from '@/hooks/useDashboardData';
import { exportToCSV, formatDateTime } from '@/lib/utils';
import { getApiBase } from '@/lib/api';
import { Cluster, ClusterStatus, Severity } from '@/types/vigilance';
import {
  ClipboardList,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Filter,
  FileText,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';

function getIrcCostEstimate(defectType: string, detectionCount: number) {
  const norm = (defectType || '').toUpperCase();
  if (norm.includes('D40') || norm.includes('POTHOLE')) {
    const areaM2 = Math.min(6.0, 1.2 * Math.max(1, detectionCount));
    return {
      rate: '₹4,500/m²',
      areaStr: `${areaM2.toFixed(1)} m²`,
      total: Math.round(areaM2 * 4500),
      spec: 'IRC SP:20 Mastic Asphalt',
    };
  } else if (norm.includes('D20') || norm.includes('ALLIGATOR')) {
    const areaM2 = Math.min(12.0, 2.5 * Math.max(1, detectionCount));
    return {
      rate: '₹1,800/m²',
      areaStr: `${areaM2.toFixed(1)} m²`,
      total: Math.round(areaM2 * 1800),
      spec: 'IRC 82-2015 Slurry Seal',
    };
  } else {
    const meters = Math.min(15.0, 3.0 * Math.max(1, detectionCount));
    return {
      rate: '₹650/m',
      areaStr: `${meters.toFixed(1)} m`,
      total: Math.round(meters * 650),
      spec: 'IRC 82 Bitumen Sealing',
    };
  }
}

function getSlaStatus(cluster: any) {
  if (cluster.status === 'resolved') {
    return {
      label: 'RESOLVED & VERIFIED',
      isBreached: false,
      color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
    };
  }
  const created = new Date(cluster.created_at || Date.now()).getTime();
  const now = Date.now();
  const elapsedHours = (now - created) / (1000 * 60 * 60);
  const slaTarget = cluster.sla_hours || 48;
  const remaining = slaTarget - elapsedHours;

  if (remaining <= 0) {
    return {
      label: `BREACHED (${Math.abs(Math.round(remaining))}h OVERDUE)`,
      isBreached: true,
      color: 'bg-red-950/90 text-red-300 border-red-600 animate-pulse font-bold',
    };
  } else if (remaining < 12) {
    return {
      label: `CRITICAL (${Math.round(remaining)}h REMAINING)`,
      isBreached: false,
      color: 'bg-amber-950/90 text-amber-300 border-amber-600 font-bold',
    };
  } else {
    return {
      label: `ACTIVE (${Math.round(remaining)}h REMAINING)`,
      isBreached: false,
      color: 'bg-blue-950/80 text-cyan-300 border-blue-700/80',
    };
  }
}

export default function WorkOrdersPage() {
  const { stats, clusters, isConnected, backendAvailable, lastUpdated, refreshData, updateStatus, triggerDedup } =
    useDashboardData();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rpi' | 'passes' | 'date' | 'cost'>('rpi');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  // Summary counts and IRC budget calculation
  const openCount = clusters.filter((c) => c.status === 'open').length;
  const assignedCount = clusters.filter((c) => c.status === 'assigned').length;
  const resolvedCount = clusters.filter((c) => c.status === 'resolved').length;

  const totalIrcBudget = useMemo(() => {
    return clusters.reduce((acc, c) => {
      const est = getIrcCostEstimate(c.dominant_type, c.detection_count);
      return acc + est.total;
    }, 0);
  }, [clusters]);

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
        if (sortBy === 'cost') {
          return (
            getIrcCostEstimate(b.dominant_type, b.detection_count).total -
            getIrcCostEstimate(a.dominant_type, a.detection_count).total
          );
        }
        if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [clusters, statusFilter, severityFilter, searchQuery, sortBy]);

  const handleExportCSV = () => {
    const dataToExport = filteredClusters.map((c, i) => {
      const est = getIrcCostEstimate(c.dominant_type, c.detection_count);
      const sla = getSlaStatus(c);
      return {
        WorkOrderID: `WO-${c.id.toString().padStart(4, '0')}`,
        PriorityRank: i + 1,
        DefectType: c.dominant_type,
        MaxSeverity: c.max_severity,
        RPIScore: c.rpi_score,
        EstimatedRepairCostINR: est.total,
        IRCSpecification: est.spec,
        RepairRate: est.rate,
        Status: c.status,
        SLAStatus: sla.label,
        RoadName: c.road_name,
        ContractorName: c.contractor_name || 'L&T Highways Infra Ltd',
        ContractorContact: c.contractor_contact || '+91 98401 22345',
        SLAHours: c.sla_hours || 48,
        NearestPOI: c.nearest_poi || 'N/A',
        POIDistanceMeters: c.poi_distance_m || 0,
        FleetPassCount: c.detection_count,
        CentroidLat: c.centroid_lat,
        CentroidLon: c.centroid_lon,
        CreatedAt: c.created_at,
      };
    });
    exportToCSV(`VIGILANCE_PWD_Work_Orders_${new Date().toISOString().slice(0, 10)}.csv`, dataToExport);
  };

  const handleDownloadPDF = () => {
    const apiBase = getApiBase();
    window.open(`${apiBase}/api/reports/pwd-summary?format=pdf&download=true`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06080F] text-slate-100 font-sans select-none relative">
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
        {/* Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2 text-white">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              <span>Municipal Work Orders & PWD Dispatch</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Automated road repair ticketing, IRC SP:20 cost estimation, contractor SLA enforcement & municipal triage
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-2 rounded-lg text-xs font-mono font-bold transition shadow-lg shadow-cyan-600/20"
              title="Generate Official Indian Road Congress Audit PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official PWD Audit (PDF)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold transition shadow"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Total Work Orders"
            value={clusters.length}
            subtitle="Deduplicated Hazard Clusters"
            icon={ClipboardList}
            colorClass="text-slate-100"
            spotlightColor="cyan"
            sparklineData={[8, 10, 12, 14, 13, 15, 16]}
          />
          <KPICard
            title="Remediation Budget"
            value={`₹${(totalIrcBudget / 100000).toFixed(2)}L`}
            subtitle="IRC SP:20 / 82-2015 Cost Norms"
            icon={IndianRupee}
            colorClass="text-cyan-400"
            spotlightColor="cyan"
            badgeText="PWD EST."
            sparklineData={[12, 14, 13, 17, 18, 21, 20]}
          />
          <KPICard
            title="Open / Unassigned"
            value={openCount}
            subtitle="Requires Contractor Triage"
            icon={Clock}
            colorClass="text-red-400"
            spotlightColor="red"
            badgeText="URGENT"
            sparklineData={[3, 5, 4, 6, 5, 7, 7]}
          />
          <KPICard
            title="Resolved & Verified"
            value={resolvedCount}
            subtitle="Closed via Re-inspection"
            icon={CheckCircle2}
            colorClass="text-emerald-400"
            spotlightColor="emerald"
            badgeText="CLOSED"
            sparklineData={[1, 2, 2, 3, 3, 4, 4]}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-obsidian rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 w-64">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search corridor or POI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 px-2 py-1 rounded-lg">
              <Filter className="w-3 h-3 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-300 border-none outline-none text-xs cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 px-2 py-1 rounded-lg">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-300 border-none outline-none text-xs cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical (D40)</option>
                <option value="high">High (D20)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 text-slate-400">
            <span>Sort by:</span>
            <button
              onClick={() => setSortBy('rpi')}
              className={`px-2 py-1 rounded ${
                sortBy === 'rpi' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'hover:text-slate-200'
              }`}
            >
              RPI Score
            </button>
            <button
              onClick={() => setSortBy('cost')}
              className={`px-2 py-1 rounded ${
                sortBy === 'cost' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'hover:text-slate-200'
              }`}
            >
              Est. Cost
            </button>
            <button
              onClick={() => setSortBy('passes')}
              className={`px-2 py-1 rounded ${
                sortBy === 'passes' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'hover:text-slate-200'
              }`}
            >
              Bus Passes
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-2 py-1 rounded ${
                sortBy === 'date' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'hover:text-slate-200'
              }`}
            >
              Date
            </button>
          </div>
        </div>

        {/* Work Orders Master Table */}
        <div className="glass-obsidian rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Corridor Location</th>
                  <th className="py-3 px-4 font-semibold">Hazard Type</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">RPI Score</th>
                  <th className="py-3 px-4 font-semibold">Est. Repair Cost</th>
                  <th className="py-3 px-4 font-semibold">Contractor & SLA Status</th>
                  <th className="py-3 px-4 font-semibold">Nearest POI</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredClusters.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No municipal work orders matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredClusters.map((cluster) => {
                    const est = getIrcCostEstimate(cluster.dominant_type, cluster.detection_count);
                    const sla = getSlaStatus(cluster);

                    return (
                      <tr
                        key={cluster.id}
                        onClick={() => setSelectedCluster(cluster)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-bold text-cyan-400 group-hover:underline">
                          WO-{cluster.id.toString().padStart(4, '0')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{cluster.road_name}</div>
                          <div className="text-[10px] text-slate-500">
                            {cluster.centroid_lat.toFixed(4)}°N, {cluster.centroid_lon.toFixed(4)}°E
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          {cluster.dominant_type}
                        </td>
                        <td className="py-3.5 px-4">
                          <SeverityBadge severity={cluster.max_severity as Severity} />
                        </td>
                        <td className="py-3.5 px-4 w-32">
                          <RPIProgressBar score={cluster.rpi_score} showLabel />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-400">₹{est.total.toLocaleString('en-IN')}</div>
                          <div className="text-[9px] text-slate-400">{est.spec}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <span>🏗️ {cluster.contractor_name || 'L&T Highways Infra Ltd'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px]">
                              <span className={`px-2 py-0.5 rounded border text-[9px] ${sla.color}`}>
                                {sla.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {cluster.nearest_poi ? (
                            <div>
                              <div className="text-slate-300">{cluster.nearest_poi}</div>
                              <div className="text-[10px] text-slate-500">~{cluster.poi_distance_m}m away</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(cluster.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <StatusDropdown
                            status={cluster.status as ClusterStatus}
                            onChange={(newStatus) => updateStatus(cluster.id, newStatus)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onRefreshData={refreshData}
        onTriggerDedup={triggerDedup}
      />

      <DetailDrawer
        cluster={selectedCluster}
        isOpen={!!selectedCluster}
        onClose={() => setSelectedCluster(null)}
        onStatusChange={updateStatus}
        onFlyTo={(lat, lon) => {
          window.location.href = `/?lat=${lat}&lon=${lon}`;
        }}
      />

      <ConnectionStatus isConnected={isConnected} backendAvailable={backendAvailable} lastUpdated={lastUpdated} />
    </div>
  );
}
