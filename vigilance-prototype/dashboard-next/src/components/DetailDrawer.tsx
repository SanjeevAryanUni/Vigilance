'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  Copy,
  Check,
  Navigation,
  ShieldAlert,
  IndianRupee,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
} from 'lucide-react';
import { Cluster, ClusterStatus, Severity } from '@/types/vigilance';
import SeverityBadge from '@/components/SeverityBadge';
import RPIProgressBar from '@/components/RPIProgressBar';
import { formatDateTime } from '@/lib/utils';

interface DetailDrawerProps {
  cluster: Cluster | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (clusterId: number, newStatus: ClusterStatus) => void;
  onFlyTo?: (lat: number, lon: number) => void;
}

export default function DetailDrawer({
  cluster,
  isOpen,
  onClose,
  onStatusChange,
  onFlyTo,
}: DetailDrawerProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!cluster) return null;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${cluster.centroid_lat.toFixed(6)}, ${cluster.centroid_lon.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Indian Road Congress (IRC) Cost Estimation
  const getIrcCost = () => {
    const norm = (cluster.dominant_type || '').toUpperCase();
    if (norm.includes('D40') || norm.includes('POTHOLE')) {
      const areaM2 = Math.min(6.0, 1.2 * Math.max(1, cluster.detection_count));
      return {
        rate: '₹4,500/m²',
        areaStr: `${areaM2.toFixed(1)} m²`,
        total: Math.round(areaM2 * 4500),
        spec: 'IRC SP:20 Bituminous Mastic Asphalt',
      };
    } else if (norm.includes('D20') || norm.includes('ALLIGATOR')) {
      const areaM2 = Math.min(12.0, 2.5 * Math.max(1, cluster.detection_count));
      return {
        rate: '₹1,800/m²',
        areaStr: `${areaM2.toFixed(1)} m²`,
        total: Math.round(areaM2 * 1800),
        spec: 'IRC 82-2015 Slurry Seal Resurfacing',
      };
    } else {
      const meters = Math.min(15.0, 3.0 * Math.max(1, cluster.detection_count));
      return {
        rate: '₹650/m',
        areaStr: `${meters.toFixed(1)} m`,
        total: Math.round(meters * 650),
        spec: 'IRC 82 Crack Bitumen Routing & Sealing',
      };
    }
  };

  const irc = getIrcCost();

  // SLA Calculation
  const getSlaDetails = () => {
    if (cluster.status === 'resolved') {
      return { label: 'RESOLVED & VERIFIED', isBreached: false, color: 'text-emerald-400 border-emerald-800 bg-emerald-950/80' };
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
        color: 'text-red-400 border-red-700 bg-red-950/90 animate-pulse font-bold',
      };
    } else if (remaining < 12) {
      return {
        label: `CRITICAL (${Math.round(remaining)}h REMAINING)`,
        isBreached: false,
        color: 'text-amber-300 border-amber-600 bg-amber-950/90 font-bold',
      };
    } else {
      return {
        label: `ACTIVE (${Math.round(remaining)}h REMAINING)`,
        isBreached: false,
        color: 'text-zinc-200 border-zinc-700 bg-zinc-800',
      };
    }
  };

  const sla = getSlaDetails();

  const handleStatusUpdate = async (nextStatus: ClusterStatus) => {
    if (!onStatusChange) return;
    setIsUpdating(true);
    try {
      await onStatusChange(cluster.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[#0B0F19] border-l border-slate-800 text-slate-100 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-amber-400 font-bold text-sm">
              WO-{cluster.id.toString().padStart(4, '0')}
            </span>
            <span className="text-slate-500">•</span>
            <SeverityBadge severity={cluster.max_severity as Severity} />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs font-sans">
          {/* Defect Thumbnail Snapshot */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center group shadow-inner">
            {/* Visual Bounding Box Box Overlay */}
            <div className="absolute inset-4 border-2 border-red-500/80 bg-red-500/10 rounded-lg flex flex-col justify-between p-2 pointer-events-none">
              <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded self-start shadow">
                {cluster.dominant_type} • RPI: {cluster.rpi_score.toFixed(1)}
              </span>
              <span className="bg-black/80 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded self-end">
                {cluster.detection_count} Observations Grouped
              </span>
            </div>
            {/* Fallback Road Texture Grid */}
            <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center opacity-70">
              <ShieldAlert className="w-12 h-12 text-slate-700" />
            </div>
          </div>

          {/* Location & GPS Section */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm text-slate-100">{cluster.road_name}</div>
                {cluster.nearest_poi && (
                  <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Near {cluster.nearest_poi} (~{cluster.poi_distance_m}m)</span>
                  </div>
                )}
              </div>
              {onFlyTo && (
                <button
                  onClick={() => onFlyTo(cluster.centroid_lat, cluster.centroid_lon)}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 text-[11px] font-mono font-semibold flex items-center gap-1 transition"
                  title="Fly to location on Map"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Fly To</span>
                </button>
              )}
            </div>

            {/* Coordinates with Copy Action */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-300">
                {cluster.centroid_lat.toFixed(6)}°N, {cluster.centroid_lon.toFixed(6)}°E
              </span>
              <button
                onClick={copyCoordinates}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
              >
                {copiedCoords ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RPI Priority Breakdown */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">ROAD PRIORITY INDEX (RPI):</span>
              <span className="font-bold text-amber-400 text-sm">{cluster.rpi_score.toFixed(1)} / 100</span>
            </div>
            <RPIProgressBar score={cluster.rpi_score} showLabel={false} />
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-400">
              <div>Severity Weight: <span className="text-slate-200">40%</span></div>
              <div>Spatial Density: <span className="text-slate-200">25%</span></div>
              <div>Road Hierarchy: <span className="text-slate-200">20%</span></div>
              <div>POI Proximity: <span className="text-slate-200">15%</span></div>
            </div>
          </div>

          {/* Indian Road Congress (IRC) Repair Costing */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                <span>IRC REPAIR BUDGET ESTIMATION:</span>
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                ₹{irc.total.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Standard Rate:</span>
                <span className="text-amber-400">{irc.rate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Extent:</span>
                <span className="text-slate-200">{irc.areaStr}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-900">
                <span>Spec Code:</span>
                <span className="text-slate-300">{irc.spec}</span>
              </div>
            </div>
          </div>

          {/* Contractor & SLA Assignment */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-mono font-semibold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>CONTRACTOR ASSIGNMENT & SLA:</span>
              </span>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${sla.color}`}>
                {sla.label}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
              <div className="font-semibold text-slate-200">
                🏗️ {cluster.contractor_name || 'L&T Highways Infra Ltd'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Phone: {cluster.contractor_contact || '+91 98401 22345'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Dispatched on: {formatDateTime(cluster.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center gap-2 shrink-0 font-mono text-xs">
          {cluster.status !== 'assigned' && cluster.status !== 'resolved' && (
            <button
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('assigned')}
              className="flex-1 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              <span>{isUpdating ? 'Assigning...' : 'Assign to Contractor'}</span>
            </button>
          )}

          {cluster.status === 'assigned' && (
            <button
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('resolved')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isUpdating ? 'Resolving...' : 'Mark Resolved & Closed'}</span>
            </button>
          )}

          {cluster.status === 'resolved' && (
            <button
              disabled={isUpdating}
              onClick={() => handleStatusUpdate('open')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{isUpdating ? 'Reopening...' : 'Re-open Work Order'}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
