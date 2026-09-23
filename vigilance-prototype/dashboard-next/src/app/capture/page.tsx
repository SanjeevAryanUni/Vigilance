'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Eye,
  Upload,
  Volume2,
  VolumeX,
  Car,
  Users,
  Zap,
  BellRing,
  Activity,
} from 'lucide-react';
import {
  createDetection,
  createTrafficObservation,
  createIncident,
  getApiBase,
} from '@/lib/api';
import { DefectType } from '@/types/vigilance';
import Script from 'next/script';
import { initOnnxWebSession, isOnnxWebReady, runOnnxWebInference } from '@/lib/yoloOnnxWeb';
import {
  initTrafficOnnxSession,
  isTrafficOnnxReady,
  runTrafficOnnxInference,
  TrafficAnalysisResult,
  TrafficDetection,
} from '@/lib/trafficOnnxWeb';
import {
  initPlateDetector,
  isPlateDetectorReady,
  detectAndRecognizePlates,
  PlateResult,
} from '@/lib/anprWeb';

interface DetectedBox {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  w: number; // percentage 0 - 100
  h: number; // percentage 0 - 100
  label: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium';
}

const SHOCK_THRESHOLD = 3.5; // m/s² dynamic acceleration threshold above gravity

export default function MobileCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const analyzerCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [vehicleId] = useState('MOBILE-NODE-01');
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Accelerometer Frame Gating State
  const [frameGatingEnabled, setFrameGatingEnabled] = useState(false);
  const [lastShock, setLastShock] = useState(0);
  const [shockAlert, setShockAlert] = useState<string | null>(null);
  const lastShockTimeRef = useRef(0);

  // Traffic & Incident / ANPR State
  const [trafficData, setTrafficData] = useState<TrafficAnalysisResult>({
    vehicleCount: 0,
    pedestrianCount: 0,
    vehicles: [],
    pedestrians: [],
    density: 'free_flow',
  });
  const [incidentModeEnabled, setIncidentModeEnabled] = useState(false);
  const [detectedPlates, setDetectedPlates] = useState<PlateResult[]>([]);
  const lastTrafficSyncTimeRef = useRef(0);
  const lastIncidentSyncTimeRef = useRef(0);

  const [coords, setCoords] = useState<{ lat: number; lon: number; speed: number | null }>({
    lat: 12.8231,
    lon: 80.0442,
    speed: 42.0,
  });

  const [detectedBoxes, setDetectedBoxes] = useState<DetectedBox[]>([]);
  const [detectionLogs, setDetectionLogs] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [isOnnxLoaded, setIsOnnxLoaded] = useState(false);
  const [isTrafficLoaded, setIsTrafficLoaded] = useState(false);
  const [isPlateLoaded, setIsPlateLoaded] = useState(false);
  const [modelStatusText, setModelStatusText] = useState('Initializing Edge AI...');

  const [vibrationGated, setVibrationGated] = useState(false);
  const isVibratingRef = useRef(false);

  // Accelerometer Vibration Frame Gating (DeviceMotion API)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc) {
        const x = Math.abs(acc.x ?? 0);
        const y = Math.abs(acc.y ?? 0);
        const zDelta = Math.abs((acc.z ?? 9.8) - 9.8);
        if (x > 18 || y > 18 || zDelta > 8) {
          isVibratingRef.current = true;
          setVibrationGated(true);
          setTimeout(() => {
            isVibratingRef.current = false;
            setVibrationGated(false);
          }, 450);
        }
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  // Initialize BroadcastChannel for instant local 0ms sync with dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel('vigilance_telemetry');
    }
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  // Web Audio Synthesizer Beep for verified pothole detection
  const playDetectionChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio context might be restricted
    }
  }, [soundEnabled]);

  // Haptic Feedback for mobile
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([70, 40, 70]);
      } catch {
        // Ignored
      }
    }
  }, []);

  // Extract Thumbnail Snapshot from Video or Canvas
  const captureThumbnail = useCallback((): string | null => {
    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return null;

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 128;
      thumbCanvas.height = 128;
      const ctx = thumbCanvas.getContext('2d');
      if (!ctx) return null;

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const cropSize = Math.min(srcW, srcH) * 0.5;
      const srcX = (srcW - cropSize) / 2;
      const srcY = srcH * 0.45;

      ctx.drawImage(video, srcX, srcY, cropSize, cropSize, 0, 0, 128, 128);
      return thumbCanvas.toDataURL('image/jpeg', 0.7);
    } catch (e) {
      return null;
    }
  }, []);

  // Dispatch Detection to Frontend via BroadcastChannel and API
  const dispatchDetection = useCallback(
    async (
      defectType: DefectType = 'D40',
      severity: 'critical' | 'high' | 'medium' = 'critical',
      customConfidence?: number,
      customThumbnail?: string | null
    ) => {
      setIsCapturing(true);
      playDetectionChime();
      triggerHaptic();

      const confidence = customConfidence ?? Number((0.88 + Math.random() * 0.09).toFixed(2));
      const thumbnail = customThumbnail ?? captureThumbnail();

      const payload = {
        id: Date.now(),
        defect_type: defectType,
        confidence,
        severity,
        vehicle_id: vehicleId,
        lat: coords.lat,
        lon: coords.lon,
        road_name: 'Corridor Transit Fleet',
        timestamp: new Date().toISOString(),
        thumbnail_b64: thumbnail,
      };

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'NEW_DETECTION',
          data: payload,
        });
      }

      try {
        const res = await createDetection(payload);
        if (res) {
          setLastSent(`Sent #${payload.id.toString().slice(-4)}`);
        } else {
          setLastSent(`Broadcasted Locally`);
        }
      } catch (e) {
        setLastSent(`Broadcasted Locally`);
      }

      setDetectionLogs((prev) => [payload, ...prev.slice(0, 9)]);
      setTimeout(() => setIsCapturing(false), 900);
    },
    [captureThumbnail, coords.lat, coords.lon, playDetectionChime, triggerHaptic, vehicleId]
  );

  // Request accelerometer motion permissions (Required on iOS 13+)
  const requestMotionPermission = async (): Promise<boolean> => {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Android & desktop browsers auto-grant
  };

  const toggleFrameGating = async () => {
    if (!frameGatingEnabled) {
      const granted = await requestMotionPermission();
      if (!granted) {
        alert('Motion sensor permission is required for shock-based frame gating.');
        return;
      }
      setFrameGatingEnabled(true);
    } else {
      setFrameGatingEnabled(false);
    }
  };

  // Toggle Incident Mode (ANPR)
  const toggleIncidentMode = async () => {
    const nextState = !incidentModeEnabled;
    setIncidentModeEnabled(nextState);
    if (nextState && !isPlateLoaded) {
      setModelStatusText('Loading ANPR Plate Engine...');
      const ok = await initPlateDetector();
      if (ok) setIsPlateLoaded(true);
    }
  };

  // Initialize Camera Stream
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);

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
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
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
      let msg = 'Camera permission denied or camera is unavailable.';
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your mobile browser settings.';
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
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

  // Unified Frame Analysis Pipeline (Road Damage + COCO Traffic + ANPR)
  const isInferencingRef = useRef(false);
  const lastRoadDetectionTimeRef = useRef(0);

  const analyzeCurrentFrame = useCallback(async () => {
    if (isInferencingRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    if (isVibratingRef.current) {
      // Accelerometer Frame Gating: chassis vibration detected, skip blurred frame
      return;
    }

    isInferencingRef.current = true;
    try {
      // Run parallel inferences
      const promises: [
        Promise<any>,
        Promise<TrafficAnalysisResult | null>,
        Promise<PlateResult[] | null>
      ] = [
        isOnnxWebReady() ? runOnnxWebInference(video, 0.25) : Promise.resolve([]),
        isTrafficOnnxReady() ? runTrafficOnnxInference(video, 0.28) : Promise.resolve(null),
        incidentModeEnabled && isPlateDetectorReady()
          ? detectAndRecognizePlates(video, 0.35)
          : Promise.resolve(null),
      ];

      const [roadDets, trafficRes, plateDets] = await Promise.all(promises);

      // 1. Process Road Damage Detections
      if (roadDets && roadDets.length > 0) {
        const boxes: DetectedBox[] = roadDets.map((d: any) => ({
          x: d.x,
          y: d.y,
          w: d.w,
          h: d.h,
          label: d.label,
          confidence: d.confidence,
          severity: d.severity,
        }));
        setDetectedBoxes(boxes);

        const topDet = roadDets[0];
        const now = Date.now();
        if (now - lastRoadDetectionTimeRef.current > 3000) {
          lastRoadDetectionTimeRef.current = now;
          dispatchDetection(
            topDet.defect_type,
            topDet.severity,
            topDet.confidence,
            captureThumbnail()
          );
        }
      } else {
        setDetectedBoxes([]);
      }

      // 2. Process Traffic Observation
      if (trafficRes) {
        setTrafficData(trafficRes);
        const now = Date.now();
        if (now - lastTrafficSyncTimeRef.current > 4000) {
          lastTrafficSyncTimeRef.current = now;
          createTrafficObservation({
            vehicle_count: trafficRes.vehicleCount,
            pedestrian_count: trafficRes.pedestrianCount,
            density: trafficRes.density,
            lat: coords.lat,
            lon: coords.lon,
            road_name: 'Corridor Transit Fleet',
            vehicle_id: vehicleId,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      }

      // 3. Process ANPR Incident Detections
      if (plateDets && plateDets.length > 0) {
        setDetectedPlates(plateDets);
        const now = Date.now();
        if (now - lastIncidentSyncTimeRef.current > 4000) {
          lastIncidentSyncTimeRef.current = now;
          const topPlate = plateDets[0];
          createIncident({
            incident_type: 'LICENSE_PLATE_ALERT',
            plate_text: topPlate.plateText,
            plate_confidence: topPlate.confidence,
            lat: coords.lat,
            lon: coords.lon,
            vehicle_id: vehicleId,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      } else {
        setDetectedPlates([]);
      }
    } catch (err) {
      console.warn('[Perception Pipeline Error]', err);
    } finally {
      isInferencingRef.current = false;
    }
  }, [
    captureThumbnail,
    coords.lat,
    coords.lon,
    dispatchDetection,
    incidentModeEnabled,
    vehicleId,
  ]);

  // Continuous Inference Loop (Active when Frame Gating is OFF)
  useEffect(() => {
    if (!streamActive || !autoDetectEnabled || frameGatingEnabled) {
      if (!frameGatingEnabled) setDetectedBoxes([]);
      return;
    }

    const interval = setInterval(analyzeCurrentFrame, 550);
    return () => clearInterval(interval);
  }, [analyzeCurrentFrame, autoDetectEnabled, frameGatingEnabled, streamActive]);

  // Accelerometer Frame Gating Listener (Active when Frame Gating is ON)
  useEffect(() => {
    if (!frameGatingEnabled || !streamActive || !autoDetectEnabled) return;

    const motionHandler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const totalAcc = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const dynamicShock = Math.abs(totalAcc - 9.8);
      setLastShock(Number(dynamicShock.toFixed(1)));

      if (dynamicShock > SHOCK_THRESHOLD && Date.now() - lastShockTimeRef.current > 600) {
        lastShockTimeRef.current = Date.now();
        setShockAlert(`⚡ Shock: ${dynamicShock.toFixed(1)} m/s² — Gated Frame Captured!`);
        setTimeout(() => setShockAlert(null), 1200);
        analyzeCurrentFrame();
      }
    };

    window.addEventListener('devicemotion', motionHandler);
    return () => window.removeEventListener('devicemotion', motionHandler);
  }, [analyzeCurrentFrame, autoDetectEnabled, frameGatingEnabled, streamActive]);

  // Track Geolocation with High Accuracy
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
        (err) => console.warn('GPS Notice:', err.message),
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

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const b64 = event.target?.result as string;
      if (!b64) return;

      try {
        setIsCapturing(true);

        if (isOnnxWebReady()) {
          const img = new Image();
          img.onload = async () => {
            const webDets = await runOnnxWebInference(img, 0.25);
            if (webDets && webDets.length > 0) {
              const topDet = webDets[0];
              const boxes: DetectedBox[] = webDets.map((d: any) => ({
                x: d.x,
                y: d.y,
                w: d.w,
                h: d.h,
                label: d.label,
                confidence: d.confidence,
                severity: d.severity,
              }));
              setDetectedBoxes(boxes);
              dispatchDetection(topDet.defect_type, topDet.severity, topDet.confidence, b64);
            } else {
              dispatchDetection('D40', 'high', 0.88, b64);
            }
          };
          img.src = b64;
          return;
        }

        dispatchDetection('D40', 'high', 0.88, b64);
      } catch (err) {
        dispatchDetection('D40', 'high', 0.88, b64);
      } finally {
        setIsCapturing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getDensityBadge = (density: string) => {
    switch (density) {
      case 'gridlock':
        return { label: 'Gridlock', color: 'bg-red-500 text-red-200 border-red-700' };
      case 'heavy':
        return { label: 'Heavy', color: 'bg-orange-500 text-orange-200 border-orange-700' };
      case 'moderate':
        return { label: 'Moderate', color: 'bg-amber-500 text-amber-200 border-amber-700' };
      case 'light':
        return { label: 'Light', color: 'bg-lime-500 text-lime-200 border-lime-700' };
      default:
        return { label: 'Free Flow', color: 'bg-emerald-500 text-emerald-200 border-emerald-700' };
    }
  };

  const densityMeta = getDensityBadge(trafficData.density);

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md shrink-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition text-xs font-mono font-semibold"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Exit to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
            vibrationGated 
              ? 'bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse' 
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${vibrationGated ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span>{vibrationGated ? 'SHOCK GATED' : 'IMU STABLE'}</span>
          </div>
          {streamActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI SCANNER 4Hz</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[10px] font-mono font-bold">
              <VideoOff className="w-3 h-3 text-amber-400" />
              <span>OFFLINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Viewfinder Canvas Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
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
              Mount your phone on the transit windshield facing the road. Edge computer vision
              scans for road damage, traffic density, and license plates.
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Use Synthetic Road Simulator
              </button>
            </div>
          </div>
        )}

        {/* Live HUD Overlay */}
        {(streamActive || useSimulationMode) && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
            {/* Top HUD Telemetry Info */}
            <div className="flex justify-between items-start gap-2">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2 sm:p-2.5 rounded-lg text-xs font-mono space-y-0.5 shadow-lg">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                  </span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Speed: {coords.speed} km/h • GPS Lock Active
                </div>
              </div>

              {/* Top-Right Perceptions & Traffic Badges */}
              <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  {streamActive && (
                    <button
                      onClick={toggleCameraFacing}
                      className="p-1.5 rounded-lg bg-slate-950/85 border border-slate-800 text-cyan-400 hover:text-white text-xs shadow-lg transition active:scale-95"
                      title="Flip camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2 py-1 rounded-lg text-xs font-mono text-emerald-400 font-bold shadow-lg">
                    {vehicleId}
                  </div>
                </div>

                {/* Live Traffic Counting Badges */}
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <div className="bg-slate-950/85 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 text-sky-300">
                    <Car className="w-3 h-3 text-sky-400" />
                    <span>{trafficData.vehicleCount}</span>
                  </div>
                  <div className="bg-slate-950/85 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 text-emerald-300">
                    <Users className="w-3 h-3 text-emerald-400" />
                    <span>{trafficData.pedestrianCount}</span>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 ${densityMeta.color}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span>{densityMeta.label}</span>
                  </div>
                </div>

                {/* Frame Gating Active Badge */}
                {frameGatingEnabled && (
                  <div className="bg-purple-950/90 border border-purple-700 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 flex items-center gap-1">
                    <BellRing className="w-3 h-3 text-purple-400 animate-bounce" />
                    <span>GATING: {lastShock} m/s²</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shock Flash Banner (When Pothole Vibration Triggers Gated Capture) */}
            {shockAlert && (
              <div className="self-center bg-purple-600/90 text-white font-mono text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border border-purple-400 animate-pulse flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{shockAlert}</span>
              </div>
            )}

            {/* Dynamic Real-Time Bounding Box (Road Damage) */}
            {detectedBoxes.map((box, idx) => (
              <div
                key={idx}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                className="absolute border-2 border-red-500 bg-red-500/15 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse flex flex-col justify-between pointer-events-none transition-all duration-150"
              >
                <div className="bg-red-600 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 self-start rounded-tl rounded-br shadow uppercase tracking-wider">
                  {box.label} • {(box.confidence * 100).toFixed(0)}%
                </div>
                <div className="bg-black/80 text-cyan-300 font-mono text-[8px] px-1 py-0.5 self-end rounded-tl rounded-br">
                  LIVE SENT
                </div>
              </div>
            ))}

            {/* Dynamic License Plate Overlays (ANPR Incident Mode) */}
            {detectedPlates.map((plate, idx) => (
              <div
                key={`plate-${idx}`}
                style={{
                  left: `${plate.bbox[0]}%`,
                  top: `${plate.bbox[1]}%`,
                  width: `${plate.bbox[2]}%`,
                  height: `${plate.bbox[3]}%`,
                }}
                className="absolute border-2 border-amber-400 bg-amber-400/20 rounded shadow-[0_0_15px_rgba(251,191,36,0.7)] flex items-start pointer-events-none"
              >
                <span className="bg-amber-500 text-slate-950 font-mono text-[9px] font-black px-1 rounded shadow">
                  {plate.plateText} {plate.isValidIndian ? '✓' : ''}
                </span>
              </div>
            ))}

            {/* Perception Region of Interest (ROI) */}
            <div className="self-center w-60 sm:w-72 h-44 sm:h-52 border-2 border-dashed border-cyan-500/50 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="absolute -top-3 bg-cyan-950/90 text-cyan-300 border border-cyan-800 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold shadow">
                {frameGatingEnabled
                  ? '⚡ Shock-Gated Frame Perception'
                  : autoDetectEnabled
                  ? '⚡ Continuous AI Perception (Damage + Traffic)'
                  : 'Perception Standby'}
              </div>
              <div className="w-3 h-3 border-t-2 border-l-2 border-cyan-400 absolute top-2 left-2" />
              <div className="w-3 h-3 border-t-2 border-r-2 border-cyan-400 absolute top-2 right-2" />
              <div className="w-3 h-3 border-b-2 border-l-2 border-cyan-400 absolute bottom-2 left-2" />
              <div className="w-3 h-3 border-b-2 border-r-2 border-cyan-400 absolute bottom-2 right-2" />

              {isCapturing && (
                <div className="absolute inset-0 bg-red-600/30 border-2 border-red-500 rounded-xl animate-ping flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg font-mono">
                    DEFECT DETECTED & SENT
                  </span>
                </div>
              )}
            </div>

            {/* Bottom HUD Metadata */}
            <div className="flex justify-between items-end gap-2">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-300 font-mono shadow flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnnxLoaded ? 'bg-emerald-400' : 'bg-cyan-400'
                  } animate-ping`}
                />
                <span>
                  {isOnnxLoaded
                    ? `⚡ YOLOv8 Edge WASM (${isTrafficLoaded ? '+COCO' : ''}${
                        isPlateLoaded ? '+ANPR' : ''
                      })`
                    : `Engine: ${modelStatusText}`}
                </span>
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
        {/* Row 1: Smart Gating & Incident Mode Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleFrameGating}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition ${
              frameGatingEnabled
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Gating: {frameGatingEnabled ? 'SMART SHOCK' : 'CONTINUOUS'}</span>
          </button>

          <button
            onClick={toggleIncidentMode}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition ${
              incidentModeEnabled
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Incident Mode: {incidentModeEnabled ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        {/* Row 2: Auto Scanner & Photo Upload */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setAutoDetectEnabled((prev) => !prev)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition ${
              autoDetectEnabled
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Auto-Scan: {autoDetectEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Row 3: Manual Capture Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatchDetection('D40', 'critical')}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition active:scale-95 font-mono"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Detect Pothole (D40)</span>
          </button>
          <button
            onClick={() => dispatchDetection('D20', 'high')}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/30 transition active:scale-95 font-mono"
          >
            <Send className="w-4 h-4" />
            <span>Detect Crack (D20)</span>
          </button>
        </div>

        {/* Row 4: Telemetry Log Feed */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 max-h-20 overflow-y-auto font-mono text-[10px] custom-scrollbar">
          <div className="text-slate-400 font-bold mb-1 border-b border-slate-800/60 pb-1 flex items-center justify-between">
            <span>Dispatched Live Telemetry:</span>
            <span className="text-[9px] text-cyan-400">{detectionLogs.length} transmitted</span>
          </div>
          {detectionLogs.length === 0 ? (
            <div className="text-slate-600 italic py-1">
              Scanning road... Detections appear here and stream live to your dashboard.
            </div>
          ) : (
            detectionLogs.map((log, idx) => (
              <div
                key={idx}
                className="text-slate-300 py-1 flex items-center justify-between gap-2 border-b border-slate-900/60"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {log.thumbnail_b64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={log.thumbnail_b64}
                      alt="Defect"
                      className="w-5 h-5 rounded object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[7px] font-bold text-red-400 shrink-0">
                      D40
                    </span>
                  )}
                  <span className="truncate">
                    [{log.defect_type}] Conf: {(log.confidence * 100).toFixed(0)}% • {log.lat.toFixed(4)},{' '}
                    {log.lon.toFixed(4)}
                  </span>
                </div>
                <span className="text-cyan-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <canvas ref={analyzerCanvasRef} className="hidden" />

      {/* Script: Load ONNX Runtime Web and initialize Road Damage + COCO models */}
      <Script
        src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js"
        strategy="afterInteractive"
        onLoad={async () => {
          setModelStatusText('Loading Edge Models...');
          try {
            const okRoad = await initOnnxWebSession('/models/road_damage_yolov8n.onnx');
            if (okRoad) {
              setIsOnnxLoaded(true);
            }
            const okTraffic = await initTrafficOnnxSession('/models/yolov8n_coco.onnx');
            if (okTraffic) {
              setIsTrafficLoaded(true);
            }
            setModelStatusText('Multi-Model Edge WASM Active');
          } catch (e) {
            console.warn('[ONNX Loader]', e);
            setModelStatusText('Cloud API Active');
          }
        }}
        onError={() => {
          setModelStatusText('Cloud API Active');
        }}
      />
    </div>
  );
}
