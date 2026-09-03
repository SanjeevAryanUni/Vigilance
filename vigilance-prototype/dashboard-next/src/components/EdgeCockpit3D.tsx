'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, AlertTriangle, Camera, Cpu, Crosshair, Gauge, Maximize2, Minimize2, Radio, ShieldAlert, Sparkles, Truck, Volume2, VolumeX, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EdgeCockpit3DProps {
  vehicleId?: string;
  roadName?: string;
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

export default function EdgeCockpit3D({
  vehicleId = 'BUS-TN01-1042',
  roadName = 'GST Road, Tambaram (NH-32)',
  onClose,
  className,
  isModal = false,
}: EdgeCockpit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentSpeed, setCurrentSpeed] = useState<number>(42);
  const [activeDefect, setActiveDefect] = useState<{
    type: 'D40' | 'D20';
    name: string;
    conf: number;
    severity: string;
    x: number;
    y: number;
    size: number;
  } | null>({
    type: 'D40',
    name: 'Pothole (Structural Cavity)',
    conf: 0.94,
    severity: 'CRITICAL',
    x: 48,
    y: 62,
    size: 90,
  });
  const [telemetryPing, setTelemetryPing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic simulation of AI distress detections locking onto road surface
  useEffect(() => {
    const defects = [
      { type: 'D40' as const, name: 'Pothole (Structural Cavity)', conf: 0.94, severity: 'CRITICAL', x: 46, y: 64, size: 95 },
      { type: 'D20' as const, name: 'Alligator Crack Mesh', conf: 0.89, severity: 'HIGH', x: 52, y: 58, size: 110 },
      { type: 'D40' as const, name: 'Deep Asphalt Depression', conf: 0.96, severity: 'CRITICAL', x: 42, y: 68, size: 85 },
      { type: 'D20' as const, name: 'Fatigue Cracking', conf: 0.85, severity: 'HIGH', x: 55, y: 62, size: 100 },
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % defects.length;
      setActiveDefect(defects[index]);
      setTelemetryPing(true);

      // Flash telemetry transmission packet
      setTimeout(() => setTelemetryPing(false), 800);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  // Three.js 3D Highway Perspective Setup (adapted from hyperspeed-background)
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.007);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 6);
    camera.lookAt(0, 0, -50);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Road Plane with asphalt dark styling
    const roadWidth = 14;
    const roadLength = 300;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 20, 20);
    const roadMat = new THREE.MeshBasicMaterial({
      color: 0x0a0f1d,
      side: THREE.DoubleSide,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -roadLength / 2 + 10;
    scene.add(road);

    // Dynamic Road Markings (Shoulder & Broken Lane Lines)
    const lineCount = 35;
    const laneLines: THREE.Mesh[] = [];
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan glowing center divider
    const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Amber shoulder lines

    // Center broken dashed lines
    for (let i = 0; i < lineCount; i++) {
      const dashGeo = new THREE.PlaneGeometry(0.3, 4);
      const dash = new THREE.Mesh(dashGeo, laneMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.05, -i * 12);
      scene.add(dash);
      laneLines.push(dash);
    }

    // Left and Right continuous road shoulder edges
    const leftEdgeGeo = new THREE.PlaneGeometry(0.25, roadLength);
    const leftEdge = new THREE.Mesh(leftEdgeGeo, shoulderMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-roadWidth / 2 + 0.3, 0.05, -roadLength / 2 + 10);
    scene.add(leftEdge);

    const rightEdgeGeo = new THREE.PlaneGeometry(0.25, roadLength);
    const rightEdge = new THREE.Mesh(rightEdgeGeo, shoulderMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(roadWidth / 2 - 0.3, 0.05, -roadLength / 2 + 10);
    scene.add(rightEdge);

    // Particle Warp Light Streaks simulating city highway lights
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = -Math.random() * 200;

      // Cyan or Amber light trails
      if (Math.random() > 0.5) {
        colors[i * 3] = 0.02;
        colors[i * 3 + 1] = 0.71;
        colors[i * 3 + 2] = 0.83; // Cyan
      } else {
        colors[i * 3] = 0.96;
        colors[i * 3 + 1] = 0.62;
        colors[i * 3 + 2] = 0.04; // Amber
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let animationFrameId: number;
    let speed = 0.7;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Translate dashed lines to simulate forward bus motion
      laneLines.forEach((dash) => {
        dash.position.z += speed;
        if (dash.position.z > 15) {
          dash.position.z = -((lineCount - 1) * 12);
        }
      });

      // Move particle streaks backward
      const posArray = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 2] += speed * 1.5;
        if (posArray[i * 3 + 2] > 15) {
          posArray[i * 3 + 2] = -200;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      roadGeo.dispose();
      roadMat.dispose();
      laneMat.dispose();
      shoulderMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full min-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-900/80 shadow-2xl font-mono select-none flex flex-col',
        className
      )}
    >
      {/* Three.js Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* CRT Scanline & Lens Vignette Shader Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.85)_100%)] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30 z-10" />

      {/* HUD Header Telemetry Bar */}
      <div className="relative z-20 p-3 bg-slate-950/80 backdrop-blur-md border-b border-cyan-900/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-700/80 px-2.5 py-1 rounded text-cyan-300 font-bold">
            <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ONBOARD EDGE COCKPIT // {vehicleId}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>GPS 5Hz • 12.9516°N, 80.1462°E</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Telemetry packet ACK pulse */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-all',
              telemetryPing
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            )}
          >
            <Activity className="w-3 h-3" />
            <span>{telemetryPing ? 'MQTT TX: 1.2 KB ACK' : 'STANDBY'}</span>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded border border-slate-800 transition"
            title="Toggle Audio Feedback"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-800 transition"
              title="Close Cockpit"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main HUD Center Area with Dynamic Target Reticle */}
      <div className="relative z-20 flex-1 flex items-center justify-center p-4">
        {activeDefect && (
          <div
            className="absolute transition-all duration-700 ease-out pointer-events-none"
            style={{
              left: `${activeDefect.x}%`,
              top: `${activeDefect.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Dynamic Bounding Box Brackets */}
            <div
              className={cn(
                'relative rounded border-2 transition-all',
                activeDefect.severity === 'CRITICAL'
                  ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                  : 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
              )}
              style={{
                width: `${activeDefect.size}px`,
                height: `${activeDefect.size * 0.75}px`,
              }}
            >
              {/* Corner targeting indicators */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-white" />

              {/* Pulsing center reticle */}
              <Crosshair className="w-4 h-4 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />

              {/* Tag Label Box */}
              <div
                className={cn(
                  'absolute -top-7 left-0 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md',
                  activeDefect.severity === 'CRITICAL'
                    ? 'bg-red-950/90 text-red-300 border border-red-700'
                    : 'bg-orange-950/90 text-orange-300 border border-orange-700'
                )}
              >
                <span>{activeDefect.type}</span>
                <span className="text-white">•</span>
                <span>{(activeDefect.conf * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Crosshair Pitch Center Guidelines */}
        <div className="w-20 h-20 border border-cyan-500/20 rounded-full flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full" />
        </div>
      </div>

      {/* HUD Bottom Tactical Dashboard Footer */}
      <div className="relative z-20 p-3 bg-slate-950/90 backdrop-blur-md border-t border-cyan-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Speedometer */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400">VEHICLE VELOCITY</div>
            <div className="text-base font-bold text-slate-100 tabular-nums">{currentSpeed} km/h</div>
          </div>
        </div>

        {/* AI Inference Specs */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400">ONBOARD NPU</div>
            <div className="text-base font-bold text-amber-300 tabular-nums">24.0 FPS (INT8)</div>
          </div>
        </div>

        {/* Current Corridor */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">CORRIDOR FOCUS</div>
            <div className="text-xs font-bold text-slate-200 truncate">{roadName}</div>
          </div>
        </div>

        {/* System Memory & Engine Status */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">MEMORY FOOTPRINT</div>
            <div className="text-xs font-bold text-emerald-400">109.7 MB / 16 GB</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
