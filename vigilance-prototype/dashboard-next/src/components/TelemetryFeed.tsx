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
    <div className={`flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.08)] ${className || ''}`}>
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Real-Time Telemetry Feed
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10 font-semibold backdrop-blur-md shadow-xs">
          {detections.length} STREAMED
        </span>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1.5 custom-scrollbar max-h-[340px]">
        {visible.map((det) => {
          const defectMeta = DEFECT_INFO[det.defect_type] || {
            name: det.defect_type,
            color: '#3B82F6',
            desc: '',
          };

          return (
            <div
              key={det.id}
              className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-white/[0.05] border border-white/10 transition-all text-xs flex flex-col gap-1 backdrop-blur-md shadow-xs"
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
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{det.road_name || 'GST Road Corridor'}</span>
              </div>

              {/* Footer: Vehicle ID + Confidence */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <div className="flex items-center gap-1 text-slate-400">
                  <Truck className="w-3 h-3 text-slate-500" />
                  <span>{det.vehicle_id}</span>
                </div>
                <div className="text-sky-400 font-semibold">
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
