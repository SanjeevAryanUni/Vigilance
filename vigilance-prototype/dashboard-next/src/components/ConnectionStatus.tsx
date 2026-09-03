import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  backendAvailable: boolean | null;
  lastUpdated: Date;
  className?: string;
}

export default function ConnectionStatus({
  isConnected,
  backendAvailable,
  lastUpdated,
  className,
}: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 select-none', className)}>
      <div className="flex items-center gap-3">
        {/* Backend & WS Indicator */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>
            {isConnected
              ? 'Broker Sync: Active (WebSocket 101)'
              : backendAvailable === false
              ? 'Local Edge Demo Mode (Resilient Stream)'
              : 'Syncing Broker...'}
          </span>
        </div>

        {backendAvailable === false && (
          <div className="hidden sm:flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 text-[10px]">
            <AlertTriangle className="w-3 h-3" />
            <span>Cloud Preview Mode (Stand-alone Dataset Active)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span>Datum: EPSG:4326 • 15m DBSCAN Radius</span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:inline">
          Updated: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
