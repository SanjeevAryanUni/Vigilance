'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export interface IncidentItem {
  id: string;
  timestamp: string;
  type: string;
  plate: string;
  confidence: number;
  location: string;
  status: 'flagged' | 'investigating' | 'resolved';
}

const DEFAULT_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-8801',
    timestamp: '10:42 AM',
    type: 'Emergency Lane Violation',
    plate: 'TN09BV4819',
    confidence: 0.94,
    location: 'Kathipara Grade Separator',
    status: 'flagged',
  },
  {
    id: 'INC-8802',
    timestamp: '10:35 AM',
    type: 'Bus Bay Obstruction',
    plate: 'TN22AX1102',
    confidence: 0.91,
    location: 'Tambaram Sanatorium',
    status: 'investigating',
  },
  {
    id: 'INC-8803',
    timestamp: '10:14 AM',
    type: 'Unregistered Commercial Vehicle',
    plate: 'MH12QZ9921',
    confidence: 0.88,
    location: 'OMR Toll Gate',
    status: 'resolved',
  },
  {
    id: 'INC-8804',
    timestamp: '09:55 AM',
    type: 'Pothole Evasion Hazardous Swerve',
    plate: 'TN01CK3390',
    confidence: 0.85,
    location: 'Guindy Race Course Rd',
    status: 'flagged',
  },
];

export default function IncidentFeed({ incidents = DEFAULT_INCIDENTS }: { incidents?: IncidentItem[] }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>ANPR Incident & Enforcement Feed</span>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
          EDGE ANPR OCR
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <th className="pb-1.5">Plate</th>
              <th className="pb-1.5">Violation</th>
              <th className="pb-1.5">Location</th>
              <th className="pb-1.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-800/30 transition">
                <td className="py-2 font-bold text-amber-300">
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-[10px]">
                    {inc.plate}
                  </span>
                </td>
                <td className="py-2 text-slate-200">
                  <div>{inc.type}</div>
                  <div className="text-[9px] text-slate-400">{inc.timestamp} • {(inc.confidence * 100).toFixed(0)}% conf</div>
                </td>
                <td className="py-2 text-slate-400 truncate max-w-[120px] text-[10px]">
                  {inc.location}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      inc.status === 'flagged'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : inc.status === 'investigating'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {inc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
