import React from 'react';
import { Cluster, ClusterStatus } from '@/types/vigilance';
import RPIProgressBar from './RPIProgressBar';
import SeverityBadge from './SeverityBadge';
import { cn } from '@/lib/utils';
import { MapPin, AlertTriangle, Building2, Clock } from 'lucide-react';

interface ClusterTableProps {
  clusters: Cluster[];
  onStatusChange: (clusterId: number, newStatus: ClusterStatus) => void;
  onSelectCluster?: (cluster: Cluster) => void;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export default function ClusterTable({
  clusters,
  onStatusChange,
  onSelectCluster,
  maxItems,
  className,
  compact = false,
}: ClusterTableProps) {
  const sorted = [...clusters].sort((a, b) => b.rpi_score - a.rpi_score);
  const items = maxItems ? sorted.slice(0, maxItems) : sorted;

  return (
    <div className={cn('flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm', className)}>
      {/* Table Title Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Priority Repair Queue
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
          {clusters.length} INCIDENTS
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5 custom-scrollbar max-h-[380px]">
        {items.map((cluster, idx) => {
          const isCritical = cluster.max_severity === 'critical';
          const isHigh = cluster.max_severity === 'high';

          return (
            <div
              key={cluster.id}
              onClick={() => onSelectCluster?.(cluster)}
              className={cn(
                'p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/60 border transition-all text-xs flex flex-col gap-2 cursor-pointer',
                isCritical
                  ? 'border-l-4 border-l-rose-500 border-slate-800'
                  : isHigh
                  ? 'border-l-4 border-l-amber-500 border-slate-800'
                  : 'border-l-4 border-l-blue-500 border-slate-800'
              )}
            >
              {/* Row 1: Rank Badge + Defect Type + Severity Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-100 font-mono text-[11px] truncate max-w-[150px]">
                    {cluster.dominant_type}
                  </span>
                </div>
                <SeverityBadge severity={cluster.max_severity} />
              </div>

              {/* Row 2: Road Name & POI */}
              <div className="flex flex-col gap-0.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 truncate font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-200">{cluster.road_name}</span>
                </div>
                {cluster.nearest_poi && (
                  <div className="text-[10px] text-slate-500 font-mono pl-5 truncate">
                    Near: <span className="text-slate-400">{cluster.nearest_poi}</span> ({cluster.poi_distance_m}m)
                  </div>
                )}
                {cluster.contractor_name && (
                  <div className="text-[10px] text-slate-400 font-mono pl-5 flex items-center gap-2 mt-0.5">
                    <span className="text-sky-400 font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {cluster.contractor_name}
                    </span>
                    <span className="text-rose-400 font-bold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {cluster.sla_hours || 24}h SLA
                    </span>
                  </div>
                )}
              </div>

              {/* Row 3: Detection Passes + RPI Bar */}
              <div className="grid grid-cols-12 gap-2 items-center pt-1.5 border-t border-slate-900">
                <div className="col-span-5 text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-slate-200">{cluster.detection_count}</span> passes
                </div>
                <div className="col-span-7">
                  <RPIProgressBar score={cluster.rpi_score} showLabel={false} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
