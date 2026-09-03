import React from 'react';
import { Detection } from '@/types/vigilance';
import { DEFECT_INFO } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';
import SeverityBadge from './SeverityBadge';
import { Radio, Truck, MapPin } from 'lucide-react';

interface TelemetryFeedProps {
  detections: Detection[];
  maxItems?: number;
  className?: string;
}

export default function TelemetryFeed({ detections, maxItems = 15, className }: TelemetryFeedProps) {
  const visible = detections.slice(0, maxItems);

  return (
    <div className={`flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Live Telemetry Ingest
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-cyan-300 border border-blue-800/60 font-semibold">
          {detections.length} STREAMED
        </span>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1.5 custom-scrollbar max-h-[320px]">
        {visible.map((det) => {
          const defectMeta = DEFECT_INFO[det.defect_type] || {
            name: det.defect_type,
            color: '#3B82F6',
            desc: '',
          };

          return (
            <div
              key={det.id}
              className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800/50 hover:border-slate-700/60 transition-all text-xs flex flex-col gap-1"
            >
              {/* Top Row: Defect Type + Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SeverityBadge severity={det.severity} />
                  <span className="font-bold text-slate-200 font-mono text-[11px]">
                    {det.defect_type} • {defectMeta.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatTimeAgo(det.timestamp)}
                </span>
              </div>

              {/* Road Name */}
              <div className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{det.road_name || 'GST Road Corridor'}</span>
              </div>

              {/* Footer: Vehicle ID + Confidence */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <Truck className="w-2.5 h-2.5" />
                  <span>{det.vehicle_id}</span>
                </div>
                <div className="text-cyan-400 font-semibold">
                  Conf: {(det.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
