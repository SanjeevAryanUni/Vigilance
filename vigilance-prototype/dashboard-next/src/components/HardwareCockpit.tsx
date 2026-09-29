'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Zap,
  Wifi,
  HardDrive,
  Gauge,
  ChevronDown,
  ChevronUp,
  Server,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CockpitTab = 'quantization' | 'bandwidth' | 'bom';

export default function HardwareCockpit() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<CockpitTab>('quantization');
  const [transitHours, setTransitHours] = useState(1);

  // Bandwidth calculation: 5 Mbps video = 2.25 GB/hour, 200B MQTT at 1/10s = 36 KB/hour
  const rawVideoGB = (transitHours * 2.25).toFixed(2);
  const telemetryKB = (transitHours * 36).toFixed(0);
  const bandwidthSaved = '99.998%';

  return (
    <div className="glass-obsidian rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-900/60 flex items-center justify-between cursor-pointer border-b border-white/10 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-xs tracking-wider text-slate-100 flex items-center gap-2">
              <span>EDGE AI & HARDWARE COCKPIT</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-normal">
                BEL-VERIFIED
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Quantization • Green Cellular Proof • Tactical BOM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>41.74ms INT8</span>
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 flex flex-col gap-3.5"
          >
            {/* Tab Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => setActiveTab('quantization')}
                className={cn(
                  'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-[11px]',
                  activeTab === 'quantization'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>INT8 Quantization</span>
              </button>
              <button
                onClick={() => setActiveTab('bandwidth')}
                className={cn(
                  'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-[11px]',
                  activeTab === 'bandwidth'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Bandwidth Proof</span>
              </button>
              <button
                onClick={() => setActiveTab('bom')}
                className={cn(
                  'flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-[11px]',
                  activeTab === 'bom'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Defense BOM</span>
              </button>
            </div>

            {/* Tab 1: Quantization Benchmarks */}
            {activeTab === 'quantization' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Inference Latency</span>
                  <div className="my-1.5 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-cyan-300">41.74 ms</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">2.3× Speedup</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[43%]" />
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-400 mt-1.5">INT8 vs 96.0ms FP32 baseline</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Binary Footprint</span>
                  <div className="my-1.5 flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-emerald-300">3.20 MB</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">72.6% Reduced</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-[27%]" />
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-400 mt-1.5">INT8 vs 11.70MB FP32 model</span>
                </div>
              </div>
            )}

            {/* Tab 2: Green Cellular Bandwidth Proof */}
            {activeTab === 'bandwidth' && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Fleet Transit Duration:</span>
                  <div className="flex items-center gap-1">
                    {[1, 4, 8, 24].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setTransitHours(hrs)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10.5px] font-mono transition',
                          transitHours === hrs
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                            : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'
                        )}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200">
                    <div className="text-[9.5px] text-rose-300 uppercase">Raw 1080p Video Stream</div>
                    <div className="text-base font-bold text-rose-400">{rawVideoGB} GB</div>
                    <div className="text-[9px] text-rose-300/80">Continuous 5 Mbps Uplink</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                    <div className="text-[9.5px] text-emerald-300 uppercase">VIGILANCE Edge Telemetry</div>
                    <div className="text-base font-bold text-emerald-400">{telemetryKB} KB</div>
                    <div className="text-[9px] text-emerald-300/80">200-Byte JSON Telemetry</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total Cellular Bandwidth Saved:</span>
                  </span>
                  <span className="font-bold text-xs">{bandwidthSaved}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Defense BOM Specifications */}
            {activeTab === 'bom' && (
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-[11.5px]">Apple Silicon M5 Host</div>
                      <div className="text-[9.5px] text-slate-400">Development Baseline Node</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-300 font-bold">24 FPS Real</span>
                    <div className="text-[9px] text-emerald-400">0ms Dropped</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-[11.5px]">Raspberry Pi Zero 2W</div>
                      <div className="text-[9.5px] text-slate-400">Sub-₹3,000 Production BOM</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-300 font-bold">~2.5 FPS</span>
                    <div className="text-[9px] text-slate-400">3.3m @ 30km/h</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-[11.5px]">Android Smartphone / Termux</div>
                      <div className="text-[9.5px] text-slate-400">Zero-Procurement Option</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-300 font-bold">~12 FPS</span>
                    <div className="text-[9px] text-emerald-400">85ms Mobile</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
