'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Database, Radio, ShieldAlert, CheckCircle2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentThoughtStream() {
  const PIPELINE_EVENTS = [
    {
      icon: Radio,
      tag: 'FLEET TELEMETRY',
      tagClass: 'text-sky-400 border-sky-800/80 bg-sky-950/50',
      text: 'Ingested GPS telemetry pass from MTC Bus #1042 on GST Road (NH-32) • 5Hz coordinate lock confirmed.',
    },
    {
      icon: Cpu,
      tag: 'EDGE INFERENCE',
      tagClass: 'text-amber-400 border-amber-800/80 bg-amber-950/50',
      text: 'YOLOv8-Nano INT8 model identified D40 Structural Pothole (Confidence: 94.2%) at 12.9516°N, 80.1462°E.',
    },
    {
      icon: Database,
      tag: 'SPATIAL DEDUP',
      tagClass: 'text-blue-400 border-blue-800/80 bg-blue-950/50',
      text: 'DBSCAN (ε=15m) aggregated 14 raw passes ➔ Spatial centroid snapped to nearest OSM road segment.',
    },
    {
      icon: Navigation,
      tag: 'RPI SCORING',
      tagClass: 'text-indigo-400 border-indigo-800/80 bg-indigo-950/50',
      text: 'Road Priority Index computed at 0.91 (CRITICAL) • Elevated weight: SRM Hospital proximity within 450m.',
    },
    {
      icon: ShieldAlert,
      tag: 'SLA DISPATCH',
      tagClass: 'text-rose-400 border-rose-800/80 bg-rose-950/50',
      text: 'Automated Work Order #WO-4091 dispatched to GMR Highways Ltd • 24h SLA response countdown active.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % PIPELINE_EVENTS.length);
        setFadeState('in');
      }, 250);
    }, 5000);

    return () => clearInterval(interval);
  }, [PIPELINE_EVENTS.length]);

  const current = PIPELINE_EVENTS[currentIndex];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-lg px-3 py-1.5 flex items-center justify-between font-mono text-xs overflow-hidden shadow-xs select-none">
      {/* Left Pulse Beacon & Audit Stream */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 tracking-wider hidden sm:inline">
            PERCEPTION AUDIT LOG
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-800 shrink-0" />

        {/* Audit Stream Item */}
        <div
          className={cn(
            'flex items-center gap-2 min-w-0 transition-opacity duration-200',
            fadeState === 'in' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide border shrink-0',
              current.tagClass
            )}
          >
            {current.tag}
          </span>
          <p className="text-[11px] text-slate-300 truncate">
            {current.text}
          </p>
        </div>
      </div>

      {/* Latency Indicator */}
      <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 pl-3">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Inference Latency: 85ms</span>
      </div>
    </div>
  );
}
