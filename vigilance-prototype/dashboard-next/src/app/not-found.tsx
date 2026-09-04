'use client';

import Link from 'next/link';
import { AlertTriangle, LayoutDashboard, ClipboardList } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <AlertTriangle className="h-8 w-8 animate-pulse" />
        </div>

        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-cyan-400">
          Status 404 • Coordinate Not Found
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Sector Not Registered
        </h1>
        <p className="mb-8 text-sm text-slate-400 leading-relaxed">
          The tactical route or municipal telemetry resource you requested does not exist or has been relocated to another GIS corridor.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            Command Center
          </Link>
          <Link
            href="/work-orders"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all active:scale-95"
          >
            <ClipboardList className="h-4 w-4" />
            Work Orders
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-4 text-[11px] font-mono text-slate-500">
          VIGILANCE • Urban Road Intelligence Platform (SIH 2026)
        </div>
      </div>
    </div>
  );
}
