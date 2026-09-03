'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import ConnectionStatus from '@/components/ConnectionStatus';
import KPICard from '@/components/KPICard';
import HardwareAssembly from '@/components/HardwareAssembly';
import NoiseOverlay from '@/components/reactbits/NoiseOverlay';
import AgentThoughtStream from '@/components/manus/AgentThoughtStream';
import CommandPalette from '@/components/manus/CommandPalette';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import TiltedCard from '@/components/reactbits/TiltedCard';
import FleetRadarChart from '@/components/charts/FleetRadarChart';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Truck, Radio, Navigation, Activity, ShieldCheck, MapPin, Gauge, Camera, Sliders } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

const EdgeCockpit3D = dynamic(() => import('@/components/EdgeCockpit3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-xs rounded-xl border border-slate-800">
      Initializing 3D Transit Highway Telemetry...
    </div>
  ),
});

export default function FleetPage() {
  const { stats, detections, isConnected, backendAvailable, lastUpdated, refreshData, triggerDedup } =
    useDashboardData();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('BUS-TN01-1042');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const FLEET_VEHICLES = [
    {
      id: 'BUS-TN01-1042',
      type: 'MTC Public Transit Bus',
      route: 'Route 21G: Tambaram ➔ Broadway via NH-32 GST Road',
      speedKmh: 42,
      lat: 12.9516,
      lon: 80.1462,
      status: 'active',
      cameraModel: 'Sony IMX335 1080p HDR',
      edgeSoC: 'Rockchip RK3588 NPU (6 TOPS)',
    },
    {
      id: 'BUS-TN02-3891',
      type: 'MTC Public Transit Bus',
      route: 'Route 570: CMBT ➔ Siruseri IT Park via Kathipara & OMR',
      speedKmh: 38,
      lat: 13.0067,
      lon: 80.2030,
      status: 'active',
      cameraModel: 'Sony IMX335 1080p HDR',
      edgeSoC: 'Raspberry Pi 4 + Coral TPU',
    },
    {
      id: 'MUNICIPAL-TRUCK-07',
      type: 'GCC Waste Management Truck',
      route: 'Zone M-12: SRM Potheri & Chengalpattu Sanitation Route',
      speedKmh: 28,
      lat: 12.8231,
      lon: 80.0442,
      status: 'active',
      cameraModel: 'Aptina AR0230 Low-Light CMOS',
      edgeSoC: 'Orange Pi 5 ARM Cortex-A76',
    },
    {
      id: 'PATROL-VAN-12',
      type: 'Municipal Patrol Unit',
      route: 'Route PV-04: Anna Salai CBD & Greams Road Night Patrol',
      speedKmh: 34,
      lat: 13.0604,
      lon: 80.2496,
      status: 'active',
      cameraModel: 'Sony Starvis 2 Low-Light',
      edgeSoC: 'Jetson Nano 4GB (Maxwell GPU)',
    },
    {
      id: 'BUS-TN22-5501',
      type: 'MTC Express Bus',
      route: 'Route 19B: T. Nagar ➔ Kelambakkam Express Corridor',
      speedKmh: 45,
      lat: 12.9719,
      lon: 80.2500,
      status: 'active',
      cameraModel: 'OmniVision OV2710 Wide-Angle',
      edgeSoC: 'Rockchip RK3566 NPU (0.8 TOPS)',
    },
  ];

  const activeVehicle = FLEET_VEHICLES.find((v) => v.id === selectedVehicleId) || FLEET_VEHICLES[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans select-none relative">
      <NoiseOverlay />

      <Header
        activeVehicles={stats.active_vehicles}
        isConnected={isConnected}
        onRefresh={refreshData}
        onTriggerDedup={triggerDedup}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      <div className="px-4 lg:px-6 pt-2">
        <AgentThoughtStream />
      </div>

      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span>Public Transit Edge AI Fleet Monitoring & Cockpit</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live telemetry and edge windshield perception streaming across Chennai arterial transit corridors
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/60 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300 self-start sm:self-auto shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>5/5 Fleet Nodes Active</span>
          </div>
        </div>

        {/* Top KPI Cards with Sparklines */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Active Fleet Nodes"
            value={stats.active_vehicles}
            subtitle="MTC Transit Buses & Trucks"
            icon={Truck}
            colorClass="text-emerald-400"
            spotlightColor="emerald"
            sparklineData={[5, 5, 5, 5, 5, 5, 5]}
          />
          <KPICard
            title="Telemetry Protocol"
            value="MQTT / 4G"
            subtitle="TLS 8883 / Cellular eSIM"
            icon={Radio}
            colorClass="text-cyan-400"
            spotlightColor="cyan"
            sparklineData={[12, 16, 14, 22, 19, 28, 30]}
          />
          <KPICard
            title="Average Edge FPS"
            value="24.0 FPS"
            subtitle="ONNX Runtime INT8 NEON"
            icon={Gauge}
            colorClass="text-amber-400"
            spotlightColor="amber"
            sparklineData={[23.8, 24.1, 24.0, 23.9, 24.2, 24.0, 24.0]}
          />
          <KPICard
            title="Hardware Unit Cost"
            value="< ₹3,000"
            subtitle="Zero Fleet Capex Reused"
            icon={ShieldCheck}
            colorClass="text-blue-400"
            spotlightColor="blue"
            sparklineData={[2850, 2850, 2850, 2850, 2850, 2850, 2850]}
          />
        </div>

        {/* 1. Live 3D Highway Edge Cockpit & 6-Axis Radar Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 3D WebGL Highway Windshield Canvas */}
          <div className="lg:col-span-8 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 uppercase tracking-wider">
                  Live Windshield Edge AI Perception Stream (WebGL Three.js)
                </span>
              </div>
              {/* Quick Vehicle Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg overflow-x-auto text-[10px] font-mono">
                {FLEET_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`px-2 py-1 rounded transition whitespace-nowrap font-bold ${
                      selectedVehicleId === v.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {v.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[460px] w-full">
              <EdgeCockpit3D
                vehicleId={activeVehicle.id}
                roadName={activeVehicle.route.split(':')[1]?.trim() || 'GST Road (NH-32)'}
              />
            </div>
          </div>

          {/* 6-Axis ApexCharts Hardware Diagnostics Spider Chart */}
          <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>6-Axis Sensor Diagnostics</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">{activeVehicle.id}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-2">
                Real-time edge hardware performance benchmarking comparing active node against fleet-wide baseline
              </p>
              <div className="mt-2 h-[340px]">
                <FleetRadarChart vehicleId={activeVehicle.id} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>NPU Core: INT8 Active</span>
              <span className="text-emerald-400">All Metrics Operational</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Sub-₹3,000 Hardware Architecture Assembly */}
        <HardwareAssembly />

        {/* 3. Fleet Nodes Detail Grid with TiltedCard & SpotlightCard */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Active Fleet Unit Roster (Interactive 3D Perspective)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLEET_VEHICLES.map((veh) => {
              const vehicleDetections = detections.filter((d) => d.vehicle_id === veh.id);
              const latestDet = vehicleDetections[0];
              const isSelected = selectedVehicleId === veh.id;

              return (
                <TiltedCard key={veh.id} maxTilt={6}>
                  <SpotlightCard
                    spotlightColor={isSelected ? 'cyan' : 'blue'}
                    onClick={() => setSelectedVehicleId(veh.id)}
                    className={`p-4 flex flex-col justify-between gap-3 transition-all duration-300 shadow-sm cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 font-mono text-sm">{veh.id}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-semibold">
                            ONLINE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{veh.type}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                    </div>

                    {/* Route Information */}
                    <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-lg text-xs font-mono flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Transit Corridor</span>
                      <span className="text-slate-200 font-medium text-[11px]">{veh.route}</span>
                    </div>

                    {/* Specs & Hardware */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                        <span className="text-slate-500">Camera Optics</span>
                        <div className="text-slate-300 font-semibold truncate mt-0.5">{veh.cameraModel}</div>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                        <span className="text-slate-500">Onboard Compute</span>
                        <div className="text-cyan-300 font-semibold truncate mt-0.5">{veh.edgeSoC}</div>
                      </div>
                    </div>

                    {/* Telemetry Footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Speed: <b>{veh.speedKmh} km/h</b></span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {latestDet ? formatTimeAgo(latestDet.timestamp) : 'Active now'}
                      </div>
                    </div>
                  </SpotlightCard>
                </TiltedCard>
              );
            })}
          </div>
        </div>

        {/* Store & Forward Resilient Network Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-cyan-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-sm">Store-and-Forward Offline Resilience Architecture</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Edge units buffer GPS-tagged detections to local SQLite flash memory when entering cellular dead zones,
                and auto-sync upon signal recovery or nightly bus depot Wi-Fi handoff.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 border border-blue-700 text-[11px] font-bold shrink-0">
            ZERO PACKET LOSS
          </span>
        </div>
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTriggerDedup={triggerDedup}
      />

      <ConnectionStatus isConnected={isConnected} backendAvailable={backendAvailable} lastUpdated={lastUpdated} />
    </div>
  );
}
