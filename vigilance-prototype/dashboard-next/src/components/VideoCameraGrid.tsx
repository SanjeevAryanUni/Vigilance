'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  RefreshCw,
  Video,
  Layers,
  ShieldAlert,
  Car,
  Tag,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Grid3X3,
  MonitorPlay,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamStats {
  fps: number;
  frame_count: number;
  detections: {
    road_damage: number;
    vehicles: number;
    plates: number;
  };
  status: string;
}

interface VideoCameraGridProps {
  streamUrl?: string;
  statsUrl?: string;
  className?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function VideoCameraGrid({
  streamUrl = 'http://localhost:8001/video_feed',
  statsUrl = 'http://localhost:8001/api/stats',
  className,
  onClose,
  isModal = false,
}: VideoCameraGridProps) {
  const [activeCam, setActiveCam] = useState<'CAM_01' | 'CAM_02' | 'CAM_03' | 'CAM_04'>('CAM_01');
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [isLiveOnline, setIsLiveOnline] = useState<boolean>(false);
  const [useFallbackVideo, setUseFallbackVideo] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [stats, setStats] = useState<StreamStats>({
    fps: 24.5,
    frame_count: 1420,
    detections: { road_damage: 3, vehicles: 5, plates: 2 },
    status: 'connecting',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll Flask video_server for live stats
  useEffect(() => {
    let isMounted = true;

    const checkStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch(statsUrl, {
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          setStats(data);
          setIsLiveOnline(true);
        } else if (isMounted) {
          setIsLiveOnline(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLiveOnline(false);
        }
      }
    };

    checkStats();
    const interval = setInterval(checkStats, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [statsUrl]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cameras = [
    {
      id: 'CAM_01' as const,
      name: 'CAM 01: Front Dashcam',
      sub: 'Multi-Model Perception (Damage + Traffic + ANPR)',
      badge: isLiveOnline ? 'LIVE FEED' : 'STANDBY',
      type: 'primary',
    },
    {
      id: 'CAM_02' as const,
      name: 'CAM 02: Rear Traffic Sensor',
      sub: 'Trailing Distance & Congestion Monitor',
      badge: 'TELEMETRY',
      type: 'secondary',
    },
    {
      id: 'CAM_03' as const,
      name: 'CAM 03: Telemetry G-Force',
      sub: 'Z-Axis Accelerometer Vibration Sensor',
      badge: 'IMU 50Hz',
      type: 'sensor',
    },
    {
      id: 'CAM_04' as const,
      name: 'CAM 04: Pavement Scanner',
      sub: 'Profilometer D40 Pothole Depth Estimation',
      badge: 'IR LASER',
      type: 'profiler',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-slate-100 font-sans transition-all duration-300',
        isModal ? 'w-full h-full max-w-6xl max-h-[90vh]' : 'w-full',
        className
      )}
    >
      {/* ── Top Header Toolbar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
                EDGE CAM PIPELINE
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border flex items-center gap-1.5',
                  isLiveOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isLiveOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  )}
                />
                {isLiveOnline ? 'LIVE STREAMING (PORT 8001)' : 'FAIL-SAFE DEMO'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Vehicle: BUS-TN01-1042 · Route 19B (Anna Salai ➔ Guindy)
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                'px-2 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all',
                viewMode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
              title="Single Camera Focus"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Focus
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all',
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
              title="4-Camera Quad Grid"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Quad
            </button>
          </div>

          {/* Toggle HUD Overlay */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={cn(
              'p-1.5 rounded-lg border text-xs transition-colors',
              showOverlays
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
            )}
            title="Toggle AI HUD Annotations"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal button if applicable */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Close Stream Window"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Main View Area ────────────────────────────────────────────── */}
      <div className="flex-1 p-3 flex flex-col gap-3 min-h-[360px] relative">
        {viewMode === 'single' ? (
          /* Single Camera Primary View */
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[320px]">
            {activeCam === 'CAM_01' ? (
              /* CAM_01: Either Live Stream or Fail-safe Video */
              isLiveOnline && !useFallbackVideo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={streamUrl}
                  alt="Vigilance Live Multi-Model Stream"
                  className="w-full h-full object-contain bg-black"
                  onError={() => {
                    setIsLiveOnline(false);
                    setUseFallbackVideo(true);
                  }}
                />
              ) : (
                /* Fail-safe HTML5 Video player */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src="/videos/chennai_road.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {!isLiveOnline && (
                    <div className="absolute top-3 left-3 bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>STANDBY DEMO LOOP — Run edge/stream_video.py --serve for live feeder</span>
                    </div>
                  )}
                </div>
              )
            ) : activeCam === 'CAM_02' ? (
              /* CAM_02: Rear Traffic Sensor */
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <Car className="w-12 h-12 text-sky-400 mb-3 animate-pulse" />
                <h4 className="font-mono text-sm font-semibold text-slate-200">
                  REAR HIGHWAY CONGESTION RADAR
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Monitoring following vehicular distance, headway safety margin, and queue formation.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-xs font-mono text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">TAIL VEHICLES</span>
                    <span className="text-sky-400 font-bold text-base">4 UNITS</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">GAP DISTANCE</span>
                    <span className="text-emerald-400 font-bold text-base">18.4 METERS</span>
                  </div>
                </div>
              </div>
            ) : activeCam === 'CAM_03' ? (
              /* CAM_03: Accelerometer / Cabin */
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <Radio className="w-12 h-12 text-emerald-400 mb-3 animate-pulse" />
                <h4 className="font-mono text-sm font-semibold text-slate-200">
                  CABIN TELEMETRY & IMU ACCELEROMETER
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Vibration gate active: Triggering high-res frame capture on vertical acceleration {'>'}{' '}
                  3.5 m/s²
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-sm font-mono text-xs">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">X (Lateral)</span>
                    <span className="text-slate-200 font-bold">0.12 g</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Y (Forward)</span>
                    <span className="text-slate-200 font-bold">0.08 g</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Z (Bump)</span>
                    <span className="text-amber-400 font-bold">1.04 g</span>
                  </div>
                </div>
              </div>
            ) : (
              /* CAM_04: Profiler */
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <Sliders className="w-12 h-12 text-rose-400 mb-3 animate-pulse" />
                <h4 className="font-mono text-sm font-semibold text-slate-200">
                  LASER SURFACE PROFILOMETER
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Sub-millimeter infrared asphalt surface profiling and IRC volumetric cavity measurement.
                </p>
                <div className="flex gap-4 mt-4 font-mono text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">MEAN PROFILE DEPTH</span>
                    <span className="text-rose-400 font-bold text-base">42.8 mm</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">ESTIMATED REPAIR AREA</span>
                    <span className="text-amber-400 font-bold text-base">0.85 m²</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Camera Watermark & HUD Overlays */}
            {showOverlays && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-white/90 font-mono text-[11px]">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>REC [00:12:45]</span>
                  <span className="text-white/40">|</span>
                  <span>960x540 @ {stats.fps.toFixed(1)} FPS</span>
                  <span className="text-white/40">|</span>
                  <span className="text-cyan-400">INT8 QUANTIZED</span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                  <span>GPS: 13.0067°N, 80.2030°E</span>
                  <span className="text-white/40">|</span>
                  <span className="text-emerald-400">ANNA SALAI</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Quad Grid 4-Camera View */
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-[340px]">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => {
                  setActiveCam(cam.id);
                  setViewMode('single');
                }}
                className={cn(
                  'relative bg-black rounded-xl overflow-hidden border transition-all cursor-pointer group flex flex-col justify-between p-2',
                  activeCam === cam.id
                    ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-white/10 hover:border-white/30'
                )}
              >
                <div className="flex items-center justify-between z-10">
                  <span className="font-mono text-[10px] font-semibold text-slate-200 bg-black/70 px-2 py-0.5 rounded">
                    {cam.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                    {cam.badge}
                  </span>
                </div>

                {cam.id === 'CAM_01' ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                    <video
                      src="/videos/chennai_road.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 my-4">
                    <Video className="w-8 h-8 mb-1 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-mono text-[10px]">{cam.sub}</span>
                  </div>
                )}

                <div className="z-10 flex justify-between items-center text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded">
                  <span>TAP TO EXPAND</span>
                  <Maximize2 className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Camera Selector Tabs ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {cameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setActiveCam(cam.id)}
              className={cn(
                'flex flex-col text-left p-2 rounded-xl border transition-all text-xs font-mono',
                activeCam === cam.id
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-200'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-[11px] truncate">{cam.name}</span>
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    activeCam === cam.id ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                  )}
                />
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-0.5">{cam.sub}</span>
            </button>
          ))}
        </div>

        {/* ── Real-Time Multi-Model Telemetry Ribbon ───────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/5">
          {/* Road Damage Metric */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-rose-500/20">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Road Damage (INT8)
              </span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {stats.detections?.road_damage ?? 0} DETECTIONS
              </span>
            </div>
          </div>

          {/* Traffic Metric */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-sky-500/20">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Traffic Vehicles
              </span>
              <span className="text-sm font-bold font-mono text-sky-400">
                {stats.detections?.vehicles ?? 0} TRACKED
              </span>
            </div>
          </div>

          {/* ANPR Plates Metric */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-emerald-500/20">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Plates (ANPR)
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {stats.detections?.plates ?? 0} LOGGED
              </span>
            </div>
          </div>

          {/* Live Edge FPS Metric */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-amber-500/20">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Edge Inference Speed
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {(stats.fps || 24.5).toFixed(1)} FPS (28.4ms)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
