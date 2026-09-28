'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

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

function PlateTypewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current <= text.length) {
        setDisplayed(text.slice(0, current));
        current++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span className="tracking-widest">{displayed || text}</span>;
}

export default function IncidentFeed({ incidents = DEFAULT_INCIDENTS }: { incidents?: IncidentItem[] }) {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>ANPR Incident & Enforcement Feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" /> API Setu
          </span>
          <span className="text-[9px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
            EDGE OCR
          </span>
        </div>
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
            <AnimatePresence mode="popLayout">
              {incidents.map((inc, i) => {
                const isSelected = selectedIncident === inc.id;
                return (
                  <React.Fragment key={inc.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      onClick={() => setSelectedIncident(isSelected ? null : inc.id)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-2 font-bold text-amber-300">
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-700/80 text-[10.5px] font-mono tracking-wider shadow-xs inline-block">
                          <PlateTypewriter text={inc.plate} />
                        </span>
                      </td>
                      <td className="py-2 text-slate-200">
                        <div className="font-medium text-slate-100 flex items-center gap-1">
                          {inc.type}
                          <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-cyan-400' : ''}`} />
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{inc.timestamp} • {(inc.confidence * 100).toFixed(0)}% conf</div>
                      </td>
                      <td className="py-2 text-slate-400 truncate max-w-[120px] text-[10px]">
                        {inc.location}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-xs inline-block ${
                            inc.status === 'flagged'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-700/80 animate-glow-breathe'
                              : inc.status === 'investigating'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                    </motion.tr>

                    {isSelected && (
                      <tr className="bg-slate-950/60 border-b border-cyan-900/40">
                        <td colSpan={4} className="p-2 text-[10px] text-slate-300">
                          <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-cyan-300 font-bold">
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" /> MoRTH Parivahan Registry Verification (API Setu)
                              </span>
                              <span className="text-[9px] px-1 py-0.2 bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700">VERIFIED</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 text-[9.5px]">
                              <div>Owner: <span className="text-white font-semibold">Verified Transport Citizen</span></div>
                              <div>Vehicle Class: <span className="text-white font-semibold">LMV Motor Transport</span></div>
                              <div>Issuing RTO: <span className="text-cyan-400">{inc.plate.slice(0, 4)} Transport Dept</span></div>
                              <div>Fitness Validity: <span className="text-emerald-400">Valid (2037)</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

