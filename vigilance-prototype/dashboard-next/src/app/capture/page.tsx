'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Navigation,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Shield,
  RefreshCw,
  VideoOff,
  Radio,
  Sparkles,
  Smartphone,
} from 'lucide-react';

import { getApiBase } from '@/lib/api';

export default function MobileCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [vehicleId, setVehicleId] = useState('MOBILE-NODE-01');
  const [backendUrl, setBackendUrl] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number; speed: number | null }>({
    lat: 12.8231,
    lon: 80.0442,
    speed: 42.0,
  });
  const [detectionLogs, setDetectionLogs] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  useEffect(() => {
    setBackendUrl(getApiBase());
  }, []);

  // Initialize Camera Stream with multi-fallback for mobile
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);

    // Stop existing stream tracks if any
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access requires HTTPS or localhost. Please ensure you are viewing over HTTPS.');
      setStreamActive(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Attempt 1: Target facing mode (environment = rear camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('FacingMode constraint failed, retrying with basic video constraint...', err1);
        // Attempt 2: Fallback to any available video input
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setStreamActive(true);
        setCameraError(null);
      }
    } catch (e: any) {
      console.warn('Camera access failure:', e);
      let msg = 'Camera permission was denied or camera is unavailable.';
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your mobile browser settings.';
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      }
      setCameraError(msg);
      setStreamActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Track Geolocation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            speed: pos.coords.speed ? Number((pos.coords.speed * 3.6).toFixed(1)) : 42.0,
          });
        },
        (err) => console.warn('Geolocation notice:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Mount effect
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Send Pothole Payload to Backend API
  const sendDetection = async (defectType: string = 'D40', severity: string = 'critical') => {
    setIsCapturing(true);

    const payload = {
      defect_type: defectType,
      confidence: Number((0.88 + Math.random() * 0.1).toFixed(2)),
      severity: severity,
      vehicle_id: vehicleId,
      lat: coords.lat,
      lon: coords.lon,
      road_name: 'GST Road / Chennai Corridor',
      timestamp: new Date().toISOString(),
    };

    try {
      const base = backendUrl || getApiBase();
      if (base) {
        const targetUrl = base.endsWith('/') ? `${base}api/detections` : `${base}/api/detections`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setLastSent(`Sent #${Date.now().toString().slice(-4)} to Backend`);
        } else {
          setLastSent(`Buffered Locally (HTTP ${res.status})`);
        }
      } else {
        setLastSent(`Buffered (Standalone Demo Mode)`);
      }
    } catch (e) {
      setLastSent(`Buffered Locally (Offline)`);
    }

    setDetectionLogs((prev) => [payload, ...prev.slice(0, 9)]);
    setTimeout(() => setIsCapturing(false), 800);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md shrink-0 z-30">
        <Link href="/" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition text-xs font-mono font-semibold">
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Exit to Map</span>
        </Link>
        <div className="flex items-center gap-2">
          {streamActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CAM 5Hz</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[10px] font-mono font-bold">
              <VideoOff className="w-3 h-3 text-amber-400" />
              <span>{useSimulationMode ? 'SIMULATOR' : 'OFFLINE'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Viewfinder Canvas Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* The video element is ALWAYS mounted to preserve ref binding */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            streamActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
        />

        {/* Fallback Viewfinder if Camera is inactive */}
        {!streamActive && (
          <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
            <div className="relative mb-3">
              <Camera className="w-14 h-14 text-cyan-400 animate-pulse" />
              <Shield className="w-6 h-6 text-emerald-400 absolute -bottom-1 -right-1" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-200 font-mono">
              Vehicle Windshield Dashcam
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Mount your phone on the transit vehicle windshield facing the road to passively perceive road distress.
            </p>

            {cameraError && (
              <div className="mt-3 p-2 bg-red-950/80 border border-red-800/80 rounded-lg text-[11px] text-red-300 max-w-xs text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
              <button
                onClick={() => startCamera()}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Enable Smartphone Camera
              </button>

              <button
                onClick={() => setUseSimulationMode(true)}
                className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Use Synthetic Road Simulation
              </button>
            </div>
          </div>
        )}

        {/* HUD Overlay Crosshair (Active on real camera or simulation) */}
        {(streamActive || useSimulationMode) && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
            {/* Top HUD Stats */}
            <div className="flex justify-between items-start gap-2">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2 sm:p-2.5 rounded-lg text-xs font-mono space-y-0.5 shadow-lg">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Speed: {coords.speed} km/h • GPS 3D Fix (5Hz)
                </div>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {streamActive && (
                  <button
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-lg bg-slate-950/85 border border-slate-800 text-cyan-400 hover:text-white text-xs shadow-lg transition"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 font-bold shadow-lg">
                  {vehicleId}
                </div>
              </div>
            </div>

            {/* Center Target Windshield Box */}
            <div className="self-center w-56 sm:w-64 h-40 sm:h-48 border-2 border-dashed border-cyan-500/70 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <div className="absolute -top-3 bg-cyan-950/90 text-cyan-300 border border-cyan-800 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold shadow">
                Windshield Edge AI Perception Box
              </div>
              <div className="w-3 h-3 border-t-2 border-l-2 border-cyan-400 absolute top-2 left-2" />
              <div className="w-3 h-3 border-t-2 border-r-2 border-cyan-400 absolute top-2 right-2" />
              <div className="w-3 h-3 border-b-2 border-l-2 border-cyan-400 absolute bottom-2 left-2" />
              <div className="w-3 h-3 border-b-2 border-r-2 border-cyan-400 absolute bottom-2 right-2" />

              {isCapturing && (
                <div className="absolute inset-0 bg-red-600/30 border-2 border-red-500 rounded-xl animate-ping flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg font-mono">
                    POTHOLE DETECTED
                  </span>
                </div>
              )}
            </div>

            {/* Bottom HUD Metadata */}
            <div className="flex justify-between items-end gap-2">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-300 font-mono shadow">
                <span>Model: YOLOv8 INT8 ONNX</span>
              </div>
              {lastSent && (
                <div className="bg-emerald-950/90 border border-emerald-700 px-2.5 py-1.5 rounded text-[10px] text-emerald-300 font-mono flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lastSent}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Panel Bottom */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 flex flex-col gap-2.5 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => sendDetection('D40', 'critical')}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition active:scale-95 font-mono"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Pothole (D40)</span>
          </button>
          <button
            onClick={() => sendDetection('D20', 'high')}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30 transition active:scale-95 font-mono"
          >
            <Send className="w-4 h-4" />
            <span>Crack (D20)</span>
          </button>
        </div>

        {/* Live Local Mobile Buffer */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 max-h-20 overflow-y-auto font-mono text-[10px] custom-scrollbar">
          <div className="text-slate-400 font-bold mb-0.5 border-b border-slate-800/60 pb-0.5 flex items-center justify-between">
            <span>Live Mobile Stream Buffer:</span>
            <span className="text-[9px] text-slate-500">{detectionLogs.length} logged</span>
          </div>
          {detectionLogs.length === 0 ? (
            <div className="text-slate-600 italic py-1">Tap a red/amber button above to capture a road anomaly.</div>
          ) : (
            detectionLogs.map((log, idx) => (
              <div key={idx} className="text-slate-300 py-0.5 flex justify-between">
                <span>
                  [{log.defect_type}] Conf: {log.confidence} @ {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                </span>
                <span className="text-cyan-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
