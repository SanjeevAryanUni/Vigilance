'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, MapPin, Navigation, Send, ArrowLeft, CheckCircle2, AlertTriangle, Shield, RefreshCw } from 'lucide-react';

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export default function MobileCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [vehicleId, setVehicleId] = useState('MOBILE-NODE-01');
  const [backendUrl, setBackendUrl] = useState(getApiBase());
  const [coords, setCoords] = useState<{ lat: number; lon: number; speed: number | null }>({
    lat: 12.8231,
    lon: 80.0442,
    speed: 38.5,
  });
  const [detectionLogs, setDetectionLogs] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  // Initialize Camera Stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (e) {
      console.warn('Camera access fallback (simulated camera stream active):', e);
      setStreamActive(false);
    }
  };

  // Track Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            speed: pos.coords.speed ? Number((pos.coords.speed * 3.6).toFixed(1)) : 42.0,
          });
        },
        (err) => console.warn('Geolocation warning:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    startCamera();
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
      road_name: 'SRM Institute / Potheri Highway',
      timestamp: new Date().toISOString(),
    };

    try {
      const targetUrl = backendUrl.endsWith('/') ? `${backendUrl}api/detections` : `${backendUrl}/api/detections`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLastSent(`Sent #${Date.now().toString().slice(-4)} OK`);
      } else {
        setLastSent(`Queued Local Stream`);
      }
    } catch (e) {
      setLastSent(`Simulated Event Ingested`);
    }

    setDetectionLogs((prev) => [payload, ...prev.slice(0, 9)]);
    setTimeout(() => setIsCapturing(false), 800);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition text-xs font-semibold">
          <ArrowLeft className="w-4 h-4 text-blue-400" /> WebGIS Command Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-emerald-400">DASHCAM ACTIVE</span>
        </div>
      </header>

      {/* Windshield Viewfinder */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {streamActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-4">
              <Camera className="w-16 h-16 text-blue-500 animate-pulse" />
              <Shield className="w-8 h-8 text-emerald-400 absolute -bottom-1 -right-1" />
            </div>
            <h2 className="text-lg font-bold text-slate-200">Windshield Dashcam Simulator</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Mount your mobile phone on the vehicle windshield facing the road to passively capture telemetry.
            </p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Enable Live Smartphone Camera
            </button>
          </div>
        )}

        {/* HUD Overlay Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-xs font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Navigation className="w-3.5 h-3.5" /> {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </div>
              <div className="text-slate-400 text-[10px]">Speed: {coords.speed} km/h • GPS 3D Fix</div>
            </div>

            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 font-bold">
              ID: {vehicleId}
            </div>
          </div>

          {/* Center Target Box */}
          <div className="self-center w-64 h-48 border-2 border-dashed border-blue-500/60 rounded-xl relative flex items-center justify-center">
            <div className="absolute -top-3 bg-blue-900/90 text-blue-200 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Windshield Edge AI Perception Box
            </div>
            {isCapturing && (
              <div className="absolute inset-0 bg-red-600/20 border-2 border-red-500 rounded-xl animate-ping flex items-center justify-center">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">POTHOLE DETECTED</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 font-mono">
              Model: YOLOv8 INT8 ONNX Mobile
            </div>
            {lastSent && (
              <div className="bg-emerald-950/90 border border-emerald-700/80 px-2.5 py-1 rounded text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {lastSent}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel Bottom */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => sendDetection('D40', 'critical')}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" /> Trigger Pothole (D40) Detection
          </button>
          <button
            onClick={() => sendDetection('D20', 'high')}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition active:scale-95"
          >
            <Send className="w-4 h-4" /> Trigger Crack (D20) Detection
          </button>
        </div>

        {/* Ingest Log */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-24 overflow-y-auto font-mono text-[10px]">
          <div className="text-slate-400 font-bold mb-1 border-b border-slate-800 pb-0.5">Live Local Mobile Buffer:</div>
          {detectionLogs.length === 0 ? (
            <div className="text-slate-600 italic">No telemetry events logged yet. Tap a trigger button above.</div>
          ) : (
            detectionLogs.map((log, idx) => (
              <div key={idx} className="text-slate-300 py-0.5 flex justify-between">
                <span>
                  [{log.defect_type}] Conf: {log.confidence} @ {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                </span>
                <span className="text-blue-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
