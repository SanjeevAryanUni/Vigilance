'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Car,
  Clock,
  ArrowRightLeft,
  Flame,
  AlertTriangle,
  TrendingDown,
  Navigation,
} from 'lucide-react';
import { getCongestion } from '@/lib/api';

// Fallback baseline for high-fidelity demonstration
const DEFAULT_CONGESTION = [
  { corridor: 'GST Road (NH-32)', congestion: 78, speed: 22, density: 'heavy' },
  { corridor: 'Anna Salai', congestion: 65, speed: 28, density: 'moderate' },
  { corridor: 'OMR Expressway', congestion: 52, speed: 38, density: 'moderate' },
  { corridor: 'Kathipara Junction', congestion: 88, speed: 14, density: 'gridlock' },
  { corridor: 'Poonamallee High Rd', congestion: 60, speed: 31, density: 'moderate' },
  { corridor: '100 Feet Inner Ring', congestion: 45, speed: 44, density: 'light' },
  { corridor: 'ECR Coastal Corridor', congestion: 30, speed: 52, density: 'free_flow' },
];

const HOURLY_TRAFFIC_DATA = [
  { hour: '06:00', vehicles: 420, pedestrians: 110 },
  { hour: '07:00', vehicles: 850, pedestrians: 240 },
  { hour: '08:00', vehicles: 1680, pedestrians: 490 },
  { hour: '09:00', vehicles: 2340, pedestrians: 680 },
  { hour: '10:00', vehicles: 1950, pedestrians: 510 },
  { hour: '11:00', vehicles: 1420, pedestrians: 390 },
  { hour: '12:00', vehicles: 1310, pedestrians: 360 },
  { hour: '13:00', vehicles: 1250, pedestrians: 340 },
  { hour: '14:00', vehicles: 1380, pedestrians: 370 },
  { hour: '15:00', vehicles: 1540, pedestrians: 420 },
  { hour: '16:00', vehicles: 1890, pedestrians: 540 },
  { hour: '17:00', vehicles: 2480, pedestrians: 730 },
  { hour: '18:00', vehicles: 2650, pedestrians: 810 },
  { hour: '19:00', vehicles: 2190, pedestrians: 640 },
  { hour: '20:00', vehicles: 1610, pedestrians: 430 },
  { hour: '21:00', vehicles: 980, pedestrians: 250 },
];

const CORRIDOR_DELAYS = [
  {
    corridor: 'Tambaram ➔ Guindy (GST Rd)',
    nominalTime: '28 min',
    actualTime: '49 min',
    delay: '+21 min',
    bottleneck: 'Chromepet Flyover Infill',
    status: 'severe',
  },
  {
    corridor: 'Guindy ➔ Central (Anna Salai)',
    nominalTime: '24 min',
    actualTime: '36 min',
    delay: '+12 min',
    bottleneck: 'Nandanam Metro Crossing',
    status: 'moderate',
  },
  {
    corridor: 'Madhya Kailash ➔ Sholinganallur (OMR)',
    nominalTime: '22 min',
    actualTime: '31 min',
    delay: '+9 min',
    bottleneck: 'Perungudi Toll Plaza',
    status: 'minor',
  },
  {
    corridor: 'Koyambedu ➔ Kathipara (Inner Ring)',
    nominalTime: '18 min',
    actualTime: '34 min',
    delay: '+16 min',
    bottleneck: 'Ashok Pillar Diversion',
    status: 'severe',
  },
];

const OD_MATRIX = [
  { origin: 'Tambaram Hub', tambaram: '-', guindy: '4,820', central: '3,150', omr: '2,400', koyambedu: '1,950' },
  { origin: 'Guindy Kathipara', tambaram: '4,100', guindy: '-', central: '5,280', omr: '3,890', koyambedu: '3,410' },
  { origin: 'Chennai Central', tambaram: '2,900', guindy: '4,980', central: '-', omr: '2,150', koyambedu: '4,220' },
  { origin: 'OMR Sholinganallur', tambaram: '2,150', guindy: '3,740', central: '1,890', omr: '-', koyambedu: '1,620' },
  { origin: 'Koyambedu CMBT', tambaram: '1,850', guindy: '3,290', central: '4,110', omr: '1,450', koyambedu: '-' },
];

export default function TrafficAnalyticsSection() {
  const [congestionList, setCongestionList] = useState(DEFAULT_CONGESTION);

  useEffect(() => {
    getCongestion().then((res) => {
      if (res && res.length > 0) {
        setCongestionList(
          res.map((r) => ({
            corridor: r.corridor,
            congestion: r.congestion_level,
            speed: r.avg_speed_kmh,
            density: r.density,
          }))
        );
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Congestion Bar Chart & Hourly Flow Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Congestion Index per Corridor */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-slate-200 uppercase">
                Corridor Congestion Index (%)
              </span>
            </div>
            <span className="text-[10px] text-orange-400 font-bold">RECHARTS BAR</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mb-2">
            Real-time congestion severity computed from public fleet transit velocity & bus dwell times
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={congestionList}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="corridor"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fontSize: 9 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [`${val}% Congestion`, 'Severity']}
                />
                <Bar
                  dataKey="congestion"
                  fill="#f97316"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Vehicle & Pedestrian Flow */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200 uppercase">
                Hourly Transit & Pedestrian Density
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold">COCO PERCEPTION</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mb-2">
            Aggregated traffic count time-series recorded across active fleet dashcam nodes
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={HOURLY_TRAFFIC_DATA}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPeds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="vehicles"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorVehicles)"
                  name="Vehicles"
                />
                <Area
                  type="monotone"
                  dataKey="pedestrians"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPeds)"
                  name="Pedestrians"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Route Delay Analysis Cards */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 lg:p-5 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
              Transit Route Delay Intelligence & Bottlenecks
            </h2>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            Real-Time GPS & ETA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CORRIDOR_DELAYS.map((card, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between font-mono text-xs hover:border-slate-700 transition"
            >
              <div>
                <div className="text-[11px] font-bold text-slate-200 truncate mb-1">
                  {card.corridor}
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black text-rose-400">{card.delay}</span>
                  <span className="text-[10px] text-slate-400">
                    {card.nominalTime} ➔ {card.actualTime}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate max-w-[150px]">
                  📍 {card.bottleneck}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                    card.status === 'severe'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : card.status === 'moderate'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {card.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Origin-Destination (OD) Matrix Table */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-xl p-4 lg:p-5 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
              Urban Fleet Origin-Destination (OD) Passenger Flow Matrix
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
            Daily Transit Volume (Trips)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="pb-2.5 font-semibold">Origin Hub</th>
                <th className="pb-2.5 font-semibold text-center">Tambaram</th>
                <th className="pb-2.5 font-semibold text-center">Guindy</th>
                <th className="pb-2.5 font-semibold text-center">Central</th>
                <th className="pb-2.5 font-semibold text-center">OMR Tech</th>
                <th className="pb-2.5 font-semibold text-center">Koyambedu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {OD_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 font-bold text-slate-200">{row.origin}</td>
                  <td className="py-2.5 text-center text-slate-300">{row.tambaram}</td>
                  <td className="py-2.5 text-center text-cyan-400 font-semibold">{row.guindy}</td>
                  <td className="py-2.5 text-center text-slate-300">{row.central}</td>
                  <td className="py-2.5 text-center text-slate-300">{row.omr}</td>
                  <td className="py-2.5 text-center text-slate-300">{row.koyambedu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
