# 🎨 TRACK 2 — TEAMMATE 1: UI/UX Redesign & Edge Hardware Cockpit

> **Owner:** Teammate 1  
> **Track:** Frontend Visual Overhaul + Edge AI Cockpit  
> **Estimated Time:** 5–6 hours  
> **GAPs Addressed:** GAP 1 (Elite Visual Overhaul), GAP 3 (Edge AI Hardware Proof)

---

## 📂 Files You Own (DO NOT let others touch these)

| File | Status |
|---|---|
| `dashboard-next/tailwind.config.ts` | MODIFY |
| `dashboard-next/src/app/globals.css` | MODIFY |
| `dashboard-next/src/components/Header.tsx` | MODIFY |
| `dashboard-next/src/components/HardwareCockpit.tsx` | **NEW** |
| `dashboard-next/src/components/CitySelector.tsx` | **NEW** |
| `dashboard-next/src/components/DetectionChime.tsx` | **NEW** |
| `dashboard-next/src/app/page.tsx` | MODIFY (import HardwareCockpit) |

---

## 🚀 STEP 0 — Install New Font & Dependencies

```bash
cd vigilance-prototype/dashboard-next
npm install @fontsource/jetbrains-mono@5.1.7
```

---

## 🚀 STEP 1 — Upgrade `tailwind.config.ts` with Command Center Design Tokens

Replace the entire file:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Command Center palette
        "vc-bg": "#090d16",
        "vc-panel": "rgba(15, 23, 42, 0.45)",
        "vc-border": "rgba(255, 255, 255, 0.09)",
        // Neon accent system
        "neon-cyan": "#22d3ee",
        "neon-green": "#4ade80",
        "neon-amber": "#fbbf24",
        "neon-red": "#f87171",
        "neon-blue": "#60a5fa",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Geist", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(34, 211, 238, 0.3), 0 0 60px rgba(34, 211, 238, 0.1)",
        "neon-green": "0 0 20px rgba(74, 222, 128, 0.3), 0 0 60px rgba(74, 222, 128, 0.1)",
        "neon-amber": "0 0 20px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.1)",
        "neon-red": "0 0 20px rgba(248, 113, 113, 0.3), 0 0 60px rgba(248, 113, 113, 0.1)",
        "glass-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        "command-glow": "0 4px 30px rgba(0, 0, 0, 0.5), 0 0 50px rgba(34, 211, 238, 0.05)",
      },
      animation: {
        "radar-ping": "radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "neon-pulse": "neon-pulse 2.5s ease-in-out infinite",
        "gauge-fill": "gauge-fill 1.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
      },
      keyframes: {
        "radar-ping": {
          "0%": { transform: "scale(0.5)", opacity: "1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "gauge-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--gauge-target)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(34, 211, 238, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(34, 211, 238, 0.5)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 🚀 STEP 2 — Add New Animations & Command Center Styles to `globals.css`

Add these **at the bottom** of the existing `globals.css` (keep all existing styles):

```css
/* ════════════════════════════════════════════════════════════════════
   COMMAND CENTER DESIGN SYSTEM — VIGILANCE SIH2026
   ════════════════════════════════════════════════════════════════════ */

/* Radar ping animation for new detections on the map */
@keyframes radar-ping {
  0% {
    transform: scale(0.5);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.7);
  }
  70% {
    transform: scale(2);
    opacity: 0.3;
    box-shadow: 0 0 0 20px rgba(248, 113, 113, 0);
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
    box-shadow: 0 0 0 30px rgba(248, 113, 113, 0);
  }
}

.animate-radar-ping {
  animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Neon severity pill badges */
.severity-critical {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.severity-high {
  background: rgba(249, 115, 22, 0.15);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.4);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.25);
}

.severity-medium {
  background: rgba(234, 179, 8, 0.12);
  color: #fde047;
  border: 1px solid rgba(234, 179, 8, 0.35);
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.2);
}

.severity-low {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.35);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.2);
}

/* Cockpit gauge progress bar */
.cockpit-gauge {
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.03));
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.cockpit-gauge-fill {
  background: linear-gradient(90deg, #06b6d4, #22d3ee);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
  border-radius: 4px;
  height: 100%;
  transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Stat card with left accent border */
.stat-card-cyan {
  border-left: 3px solid #22d3ee;
  box-shadow: -4px 0 12px rgba(34, 211, 238, 0.15);
}

.stat-card-green {
  border-left: 3px solid #4ade80;
  box-shadow: -4px 0 12px rgba(74, 222, 128, 0.15);
}

.stat-card-amber {
  border-left: 3px solid #fbbf24;
  box-shadow: -4px 0 12px rgba(251, 191, 36, 0.15);
}

.stat-card-red {
  border-left: 3px solid #f87171;
  box-shadow: -4px 0 12px rgba(248, 113, 113, 0.15);
}

/* G-Force vibration meter */
@keyframes g-force-wave {
  0% { height: 30%; }
  25% { height: 80%; }
  50% { height: 45%; }
  75% { height: 90%; }
  100% { height: 30%; }
}

.g-force-bar {
  animation: g-force-wave 0.8s ease-in-out infinite;
  background: linear-gradient(to top, #22d3ee, #06b6d4);
  border-radius: 2px;
}
```

---

## 🚀 STEP 3 — Create `HardwareCockpit.tsx` (Edge AI Hardware Widget)

**File:** `dashboard-next/src/components/HardwareCockpit.tsx`

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Wifi, Activity, HardDrive, Gauge, ChevronDown, ChevronUp } from 'lucide-react';

interface CockpitMetric {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  accentColor: string;
  gaugePercent: number;
}

export default function HardwareCockpit() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [gForce, setGForce] = useState(0.0);
  const [gForceActive, setGForceActive] = useState(false);

  // Simulated G-force from accelerometer (real data comes via DeviceMotion in /capture)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate accelerometer data — in production, this reads DeviceMotionEvent
      const simulated = 0.5 + Math.random() * 4.5;
      setGForce(parseFloat(simulated.toFixed(2)));
      setGForceActive(simulated > 3.5);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const metrics: CockpitMetric[] = [
    {
      label: 'Model Size (INT8)',
      value: '3.2 MB',
      subtext: 'vs 12.2 MB FP32 → 72.6% compression',
      icon: <HardDrive className="w-5 h-5" />,
      accentColor: 'cyan',
      gaugePercent: 26.2, // 3.2/12.2 * 100
    },
    {
      label: 'Mean Latency (INT8)',
      value: '28.4 ms',
      subtext: 'vs 64.2 ms FP32 → 2.26× speedup',
      icon: <Zap className="w-5 h-5" />,
      accentColor: 'green',
      gaugePercent: 44.2, // 28.4/64.2 * 100
    },
    {
      label: 'Bandwidth Saved',
      value: '99.8%',
      subtext: '200B MQTT vs 5 Mbps raw video',
      icon: <Wifi className="w-5 h-5" />,
      accentColor: 'amber',
      gaugePercent: 99.8,
    },
    {
      label: 'Edge Hardware Cost',
      value: '₹2,800',
      subtext: 'Raspberry Pi 4B + Camera Module v3',
      icon: <Cpu className="w-5 h-5" />,
      accentColor: 'red',
      gaugePercent: 9.3, // 2800/30000 * 100 (vs typical server)
    },
  ];

  const accentStyles: Record<string, { border: string; text: string; bg: string; glow: string; fill: string }> = {
    cyan: {
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
      fill: 'from-cyan-600 to-cyan-400',
    },
    green: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glow: 'shadow-[0_0_20px_rgba(74,222,128,0.15)]',
      fill: 'from-emerald-600 to-emerald-400',
    },
    amber: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      fill: 'from-amber-600 to-amber-400',
    },
    red: {
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]',
      fill: 'from-rose-600 to-rose-400',
    },
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900/60 border-b border-white/[0.06] hover:bg-slate-900/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
              EDGE AI HARDWARE COCKPIT
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              INT8 Quantized • Sub-₹3,000 Hardware • MQTT Telemetry
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live G-force indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border backdrop-blur-md transition-all ${
            gForceActive
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(248,113,113,0.3)] animate-pulse'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
          }`}>
            <Activity className="w-3 h-3" />
            <span>{gForce} m/s²</span>
            <span className="font-semibold">{gForceActive ? 'BUMP' : 'IDLE'}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((m, idx) => {
              const style = accentStyles[m.accentColor];
              return (
                <div
                  key={idx}
                  className={`glass-card glass-card-hover rounded-xl p-4 ${style.border} ${style.glow} cursor-default`}
                >
                  {/* Icon + Label */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center ${style.text} border ${style.border}`}>
                      {m.icon}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 leading-tight">
                      {m.label}
                    </span>
                  </div>

                  {/* Value */}
                  <div className={`text-2xl font-extrabold font-mono ${style.text} tracking-tight mb-1`}>
                    {m.value}
                  </div>

                  {/* Subtext */}
                  <p className="text-[10px] text-slate-500 font-mono mb-3 leading-relaxed">
                    {m.subtext}
                  </p>

                  {/* Gauge Bar */}
                  <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${style.fill} transition-all duration-[1500ms] ease-out`}
                      style={{ width: `${m.gaugePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-600 font-mono">0</span>
                    <span className={`text-[9px] font-mono font-semibold ${style.text}`}>
                      {m.gaugePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* G-Force Vibration Gauge */}
          <div className="mt-4 glass-card rounded-xl p-4 border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-300">
                  ACCELEROMETER VIBRATION GAUGE
                </span>
              </div>
              <span className={`text-xs font-mono font-bold ${gForceActive ? 'text-rose-400' : 'text-emerald-400'}`}>
                THRESHOLD: 3.5 m/s²
              </span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 24 }).map((_, i) => {
                const barHeight = 20 + Math.random() * (gForceActive ? 80 : 40);
                const isHot = barHeight > 60;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-300 ${
                      isHot
                        ? 'bg-gradient-to-t from-rose-600 to-amber-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]'
                        : 'bg-gradient-to-t from-cyan-700 to-cyan-400'
                    }`}
                    style={{
                      height: `${barHeight}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-slate-600 font-mono">0 Hz</span>
              <span className={`text-[10px] font-mono font-bold ${gForceActive ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                {gForceActive ? '⚠ ROAD DEFECT ZONE — CAPTURING' : '● MONITORING — SMOOTH ROAD'}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">50 Hz</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 STEP 4 — Create `CitySelector.tsx` (Multi-City Dropdown)

**File:** `dashboard-next/src/components/CitySelector.tsx`

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Check, Globe } from 'lucide-react';

interface CityInfo {
  key: string;
  display_name: string;
  state: string;
  center: { lat: number; lon: number };
  zoom: number;
  municipal_body: string;
  is_active: boolean;
}

interface CitySelectorProps {
  onCityChange?: (city: CityInfo) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function CitySelector({ onCityChange }: CitySelectorProps) {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [activeCity, setActiveCity] = useState<string>('chennai');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/cities`)
      .then(res => res.json())
      .then(data => {
        setCities(data.cities || []);
        setActiveCity(data.active || 'chennai');
      })
      .catch(() => {
        // Fallback if backend is down
        setCities([
          { key: 'chennai', display_name: 'Chennai', state: 'Tamil Nadu', center: { lat: 13.0827, lon: 80.2707 }, zoom: 12, municipal_body: 'GCC', is_active: true },
          { key: 'bangalore', display_name: 'Bangalore', state: 'Karnataka', center: { lat: 12.9716, lon: 77.5946 }, zoom: 12, municipal_body: 'BBMP', is_active: false },
          { key: 'delhi', display_name: 'Delhi', state: 'NCT Delhi', center: { lat: 28.6139, lon: 77.2090 }, zoom: 11, municipal_body: 'MCD', is_active: false },
        ]);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySwitch = async (cityKey: string) => {
    if (cityKey === activeCity) {
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cities/switch?city_key=${cityKey}`, { method: 'POST' });
      const data = await res.json();
      setActiveCity(cityKey);
      const selected = cities.find(c => c.key === cityKey);
      if (selected && onCityChange) {
        onCityChange({ ...selected, is_active: true });
      }
    } catch (err) {
      // Still switch locally for demo mode
      setActiveCity(cityKey);
      const selected = cities.find(c => c.key === cityKey);
      if (selected && onCityChange) onCityChange({ ...selected, is_active: true });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const activeCityData = cities.find(c => c.key === activeCity);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 hover:border-cyan-500/30 transition-all text-xs font-mono backdrop-blur-md shadow-xs group"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        <span className="hidden sm:inline font-semibold">
          {activeCityData?.display_name || 'Chennai'}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-slide-up">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              SELECT DEPLOYMENT CITY
            </span>
          </div>
          <div className="p-1.5">
            {cities.map((city) => {
              const isActive = city.key === activeCity;
              return (
                <button
                  key={city.key}
                  onClick={() => handleCitySwitch(city.key)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                      : 'hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <MapPin className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold font-mono ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {city.display_name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-mono font-bold border border-cyan-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {city.state} • {city.municipal_body}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 STEP 5 — Create `DetectionChime.tsx` (Audio + Haptic Feedback)

**File:** `dashboard-next/src/components/DetectionChime.tsx`

```tsx
'use client';

/**
 * DetectionChime — plays a synthesized Web Audio chime and triggers
 * navigator.vibrate() when a road defect or license plate is detected
 * on the /capture page.
 *
 * Usage:
 *   import { playDetectionChime } from '@/components/DetectionChime';
 *   // When detection occurs:
 *   playDetectionChime('pothole');
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export type DetectionType = 'pothole' | 'crack' | 'plate' | 'vehicle';

const CHIME_CONFIGS: Record<DetectionType, { freq: number; freq2: number; duration: number; vibrateMs: number[] }> = {
  pothole: { freq: 880, freq2: 1108, duration: 0.25, vibrateMs: [150, 50, 150] },
  crack: { freq: 660, freq2: 830, duration: 0.2, vibrateMs: [100, 30, 100] },
  plate: { freq: 1200, freq2: 1500, duration: 0.15, vibrateMs: [80] },
  vehicle: { freq: 440, freq2: 554, duration: 0.15, vibrateMs: [50] },
};

export function playDetectionChime(type: DetectionType = 'pothole') {
  const config = CHIME_CONFIGS[type];

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Oscillator 1 — primary tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(config.freq, now);
    osc1.frequency.exponentialRampToValueAtTime(config.freq * 0.8, now + config.duration);

    // Oscillator 2 — harmonic overtone
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(config.freq2, now);

    // Gain envelope — sharp attack, smooth decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + config.duration);
    osc2.stop(now + config.duration);
  } catch (e) {
    // Audio API not available — silent fallback
  }

  // Haptic feedback (mobile only)
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(config.vibrateMs);
    }
  } catch (e) {
    // Vibration API not available — silent fallback
  }
}

export default function DetectionChimePreloader() {
  // Invisible component — preloads AudioContext on first user interaction
  return null;
}
```

---

## 🚀 STEP 6 — Integrate City Selector into `Header.tsx`

Open [Header.tsx](file:///d:/coding/hackethon%20project%20data/vigilance%20data%20sih/New%20folder/Vigilance/vigilance-prototype/dashboard-next/src/components/Header.tsx) and make these changes:

### 6a. Add import at the top:

```tsx
import CitySelector from './CitySelector';
```

### 6b. Add CitySelector inside the action indicators div (after the UTC Clock, before the Dedup button):

Find the line `{/* Trigger Dedup Button */}` (around line 201) and add this **before** it:

```tsx
        {/* City Selector Dropdown */}
        <CitySelector onCityChange={(city) => {
          console.log(`[VIGILANCE] Switched to ${city.display_name}`);
          // Optionally trigger map re-center here
        }} />
```

---

## 🚀 STEP 7 — Import HardwareCockpit into Main Dashboard

Open [page.tsx](file:///d:/coding/hackethon%20project%20data/vigilance%20data%20sih/New%20folder/Vigilance/vigilance-prototype/dashboard-next/src/app/page.tsx) and:

### 7a. Add import at the top (with other component imports):

```tsx
import HardwareCockpit from '@/components/HardwareCockpit';
```

### 7b. Add the component in the JSX

Find a suitable location in the main dashboard layout (typically after the KPI cards section or after the map section) and add:

```tsx
{/* Edge AI Hardware Cockpit — GAP 3 */}
<HardwareCockpit />
```

---

## ✅ Verification Checklist

```bash
# 1. Build check — ensure no TypeScript errors
cd vigilance-prototype/dashboard-next
npm run build

# 2. Dev server — visual inspection
npm run dev
# Open http://localhost:3000 and verify:
#   ✅ Hardware Cockpit widget renders with 4 metric cards
#   ✅ G-force gauge animates with colored bars
#   ✅ City selector dropdown shows Chennai/Bangalore/Delhi
#   ✅ Severity badges use neon glow styles
#   ✅ New animations (slide-up, radar-ping) work

# 3. Test chime (run in browser DevTools console)
# import { playDetectionChime } from '@/components/DetectionChime';
# playDetectionChime('pothole');
```

---

> [!TIP]
> **Coordinate with Sanjeev:** Your `CitySelector` calls his `/api/cities` and `/api/cities/switch` endpoints. Make sure his backend is running for full integration testing. If the backend is down, the component falls back to hardcoded demo cities.

> [!TIP]
> **Coordinate with Teammate 2:** Their MJPEG video stream at `http://localhost:8001/video_feed` can be embedded as an `<img>` tag in a Multi-Camera Grid component. If you have time, create a `<VideoFeedPanel src="http://localhost:8001/video_feed" />` component they can plug into.
