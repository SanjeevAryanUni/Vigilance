'use client';

import { useEffect } from 'react';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VIGILANCE TELEMETRY CRASH]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/30 bg-slate-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <AlertOctagon className="h-8 w-8 animate-bounce" />
        </div>

        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-rose-400">
          Telemetry Pipeline Exception
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">
          System Interruption
        </h2>
        <p className="mb-6 text-xs font-mono text-slate-400 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-left overflow-x-auto max-h-24">
          {error.message || 'An unexpected WebGL or runtime render state exception occurred.'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            <RotateCw className="h-4 w-4" />
            Restart Pipeline
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all active:scale-95"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>

        <div className="mt-6 border-t border-slate-800/60 pt-3 text-[11px] font-mono text-slate-500">
          Error Digest: {error.digest || 'VIGILANCE_FAULT_RECOVERABLE'}
        </div>
      </div>
    </div>
  );
}
