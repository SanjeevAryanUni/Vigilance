'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Terminal, Cpu, Database, MapPin, Radio, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentThoughtStream() {
  const THOUGHTS = [
    {
      icon: Radio,
      tag: 'EDGE TELEMETRY',
      color: 'text-cyan-400 border-cyan-700 bg-cyan-950/60',
      text: 'Ingested GPS telemetry pass from MTC Bus 1042 on GST Road (NH-32) • 5Hz coordinate lock confirmed.',
    },
    {
      icon: Cpu,
      tag: 'NPU INFERENCE',
      color: 'text-amber-400 border-amber-700 bg-amber-950/60',
      text: 'ONNX INT8 YOLOv8n identified D40 Structural Pothole (Confidence: 94.2%) at 12.9516°N, 80.1462°E.',
    },
    {
      icon: Database,
      tag: 'POSTGIS DBSCAN',
      color: 'text-blue-400 border-blue-700 bg-blue-950/60',
      text: 'ST_ClusterDBSCAN aggregated 14 raw edge passes within 15m radius ➔ Spatial centroid locked to Cluster #CL-01.',
    },
    {
      icon: Sparkles,
      tag: 'RPI ALGORITHM',
      color: 'text-purple-400 border-purple-700 bg-purple-950/60',
      text: 'Road Priority Index computed at 0.91 (CRITICAL) • Proximity weight elevated: SRM Hospital 450m away.',
    },
    {
      icon: ShieldAlert,
      tag: 'DISPATCH TRIAGE',
      color: 'text-red-400 border-red-700 bg-red-950/60',
      text: 'Automated PWD Work Order #WO-4091 generated for Tambaram Highway division • Asphalt crew alert queued.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % THOUGHTS.length);
        setFadeState('in');
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [THOUGHTS.length]);

  const current = THOUGHTS[currentIndex];
  const Icon = current.icon;

  return (
    <div className="relative w-full bg-slate-950/80 backdrop-blur-md border border-cyan-900/50 rounded-lg px-3 py-1.5 flex items-center justify-between font-mono text-xs overflow-hidden shadow-inner select-none">
      {/* Left Pulse Beacon */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider hidden sm:inline">
            AGENT REASONING
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800 shrink-0" />

        {/* Thought Stream Item */}
        <div
          className={cn(
            'flex items-center gap-2 min-w-0 transition-opacity duration-300',
            fadeState === 'in' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border shrink-0',
              current.color
            )}
          >
            {current.tag}
          </span>
          <p className="text-[11px] text-slate-300 truncate">
            {current.text}
          </p>
        </div>
      </div>

      {/* Latency / Active Node Indicator */}
      <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 shrink-0 pl-2">
        <Terminal className="w-3 h-3 text-cyan-400" />
        <span>Sub-42ms Latency</span>
      </div>
    </div>
  );
}
