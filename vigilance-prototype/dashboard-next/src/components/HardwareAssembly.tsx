'use client';

import React, { useState } from 'react';
import { Camera, Cpu, Radio, HardDrive, Zap, Layers, CheckCircle2, ShieldCheck, ChevronRight, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HardwareAssembly() {
  const [selectedLayer, setSelectedLayer] = useState<number>(1);

  const HARDWARE_LAYERS = [
    {
      id: 1,
      title: 'Optics & Vision Sensor Module',
      spec: 'Sony IMX335 1080p HDR CMOS Sensor',
      cost: '₹650',
      icon: Camera,
      badge: 'OPTICS',
      color: 'border-blue-500 text-blue-400 bg-blue-950/30',
      activeColor: 'border-blue-500 bg-blue-950/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
      description:
        'Wide-angle 120° FOV lens with dynamic auto-exposure and anti-glare polarization filter. Calibrated specifically for Indian road asphalt variations, monsoon water-reflection compensation, and bright tropical sunlight.',
      metrics: [
        { label: 'Resolution', val: '1920x1080 @ 30 FPS' },
        { label: 'Dynamic Range', val: '120 dB True WDR' },
        { label: 'Low-Light Sensitivity', val: '0.005 Lux Starlight' },
      ],
    },
    {
      id: 2,
      title: 'Neural Processing Unit (NPU) & Edge Compute',
      spec: 'Rockchip RK3588 NPU (6 TOPS) / ARM Cortex-A76',
      cost: '₹1,250',
      icon: Cpu,
      badge: 'AI COMPUTE',
      color: 'border-amber-500 text-amber-400 bg-amber-950/30',
      activeColor: 'border-amber-500 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      description:
        'Sub-watt edge compute board executing our custom INT8-quantized YOLOv8-Nano road-damage model locally. Achieves 24.0 FPS with a tiny 109.7 MB RAM footprint, eliminating continuous cloud video streaming costs.',
      metrics: [
        { label: 'Inference Latency', val: '41.7 ms / frame' },
        { label: 'RAM Consumption', val: '109.7 MB (<1% total)' },
        { label: 'Model Size', val: '3.20 MB (INT8 QUInt8)' },
      ],
    },
    {
      id: 3,
      title: 'GNSS High-Precision Satellite Positioning',
      spec: 'u-blox NEO-6M High-Sensitivity GPS Engine',
      cost: '₹350',
      icon: Radio,
      badge: 'POSITIONING',
      color: 'border-cyan-500 text-cyan-400 bg-cyan-950/30',
      activeColor: 'border-cyan-500 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      description:
        'Dedicated 50-channel tracking engine equipped with a 25mm ceramic patch antenna. Provides 5Hz real-time coordinate polling, ground speed, and heading vector logging even under dense flyovers and elevated metro corridors.',
      metrics: [
        { label: 'Update Frequency', val: '5 Hz Real-Time' },
        { label: 'Position Accuracy', val: '± 2.5 meters' },
        { label: 'Hot Start Time', val: '< 1 second' },
      ],
    },
    {
      id: 4,
      title: 'Cellular Modem & Store-and-Forward Flash',
      spec: 'Quectel 4G LTE eSIM + 32GB High-Endurance eMMC',
      cost: '₹400',
      icon: HardDrive,
      badge: 'TELEMETRY',
      color: 'border-emerald-500 text-emerald-400 bg-emerald-950/30',
      activeColor: 'border-emerald-500 bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      description:
        'Dual-mode transmission pipeline: transmits lightweight 1.2 KB MQTT JSON packets when 4G signal is active; buffers detections to local SQLite flash memory in cellular dead zones and automatically syncs upon reconnect or depot Wi-Fi.',
      metrics: [
        { label: 'Payload Size', val: '1.2 KB / detection' },
        { label: 'Data Consumption', val: '< 20 MB / 8h shift' },
        { label: 'Offline Buffer', val: '> 100,000 events' },
      ],
    },
    {
      id: 5,
      title: 'Automotive Power & IP67 Rugged Enclosure',
      spec: '12V/24V Vehicle Regulator & Polycarbonate Shell',
      cost: '₹200',
      icon: Zap,
      badge: 'POWER & CASING',
      color: 'border-purple-500 text-purple-400 bg-purple-950/30',
      activeColor: 'border-purple-500 bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      description:
        'Connects directly to the bus ignition auxiliary power. Features wide 9V–36V DC buck regulation with ISO 7637-2 alternator load-dump protection, reverse polarity defense, and thermal dissipation fins for 50°C summer heat.',
      metrics: [
        { label: 'Input Voltage', val: '9V – 36V DC Automotive' },
        { label: 'Ingress Rating', val: 'IP67 Weatherproof' },
        { label: 'Operating Temp', val: '-10°C to +65°C' },
      ],
    },
  ];

  const activeItem = HARDWARE_LAYERS.find((l) => l.id === selectedLayer) || HARDWARE_LAYERS[0];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 lg:p-6 flex flex-col gap-5 shadow-xl font-mono">
      {/* Title & BOM Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-tight">
              Interactive Sub-₹3,000 Hardware Architecture Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Exploded component inspection of the passive edge intelligence unit mounted behind city bus windshields
          </p>
        </div>

        {/* Total Cost Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/80 px-3.5 py-1.5 rounded-lg text-emerald-300 text-xs self-start sm:self-auto shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Total Unit BOM: <b>₹2,850</b> (Target: &lt; ₹3,000)</span>
        </div>
      </div>

      {/* Interactive 2-Column Exploded View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Exploded Component Layers Stack */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {HARDWARE_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = selectedLayer === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between group',
                  isSelected ? layer.activeColor : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded flex items-center justify-center border transition-transform group-hover:scale-105',
                      layer.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {layer.badge}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{layer.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{layer.spec}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs font-bold text-cyan-400">{layer.cost}</span>
                  <ChevronRight
                    className={cn(
                      'w-3.5 h-3.5 text-slate-500 transition-transform',
                      isSelected && 'rotate-90 text-cyan-400'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep-Dive Inspection Card */}
        <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <activeItem.icon className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{activeItem.title}</h3>
                  <div className="text-[11px] text-cyan-300">{activeItem.spec}</div>
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                {activeItem.cost}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-4">
              {activeItem.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
              {activeItem.metrics.map((m, i) => (
                <div key={i} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">{m.label}</div>
                  <div className="text-xs font-bold text-slate-100 mt-1">{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Hardware Tier: Production Prototype</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Benchmarked &amp; Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
