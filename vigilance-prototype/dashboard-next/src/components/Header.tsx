'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Radio, RefreshCw, Cpu, Activity, LayoutDashboard, BarChart3, Truck, ClipboardList, Search, Smartphone, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackendConnectionStatus } from '@/hooks/useDashboardData';

interface HeaderProps {
  activeVehicles?: number;
  isConnected?: boolean;
  backendAvailable?: boolean | null;
  backendStatus?: BackendConnectionStatus;
  onRefresh?: () => void;
  onTriggerDedup?: () => Promise<any>;
  onOpenCommandPalette?: () => void;
}

export default function Header({
  activeVehicles = 5,
  isConnected = false,
  backendAvailable = null,
  backendStatus = 'unreachable',
  onRefresh,
  onTriggerDedup,
  onOpenCommandPalette,
}: HeaderProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDeduping, setIsDeduping] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDedupClick = async () => {
    if (!onTriggerDedup || isDeduping) return;
    setIsDeduping(true);
    try {
      await onTriggerDedup();
    } finally {
      setTimeout(() => setIsDeduping(false), 800);
    }
  };

  const navLinks = [
    { href: '/', label: 'Command Center', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/fleet', label: 'Fleet Nodes', icon: Truck },
    { href: '/work-orders', label: 'Work Orders', icon: ClipboardList },
    { href: '/capture', label: 'Mobile Dashcam', icon: Smartphone },
  ];

  const isLive = backendAvailable === true || isConnected;
  const isColdStarting = backendStatus === 'cold-starting';

  return (
    <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 lg:px-5 flex items-center justify-between z-30 select-none shrink-0">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-slate-100 font-mono">
                VIGILANCE
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 font-semibold tracking-wide">
                SIH26124 • BEL
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-mono hidden sm:block">
              Urban Road Intelligence & Maintenance Dispatch
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Action / Telemetry Status Indicators */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger Button */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border border-slate-700 transition text-xs font-mono shadow-xs"
            title="Open Command Palette (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline text-[11px]">Command Palette</span>
            <kbd className="hidden sm:inline text-[10px] bg-slate-900 text-slate-400 px-1 py-0.5 rounded border border-slate-700 font-mono">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Mobile Direct Dashcam Button */}
        <Link
          href="/capture"
          className="md:hidden flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-sm active:scale-95 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Dashcam</span>
        </Link>

        {/* Live Backend / Demo Status Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono border transition-all',
            isLive
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : isColdStarting
              ? 'bg-amber-950/70 border-amber-600/70 text-amber-300 animate-pulse'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
          )}
          title={
            isLive
              ? 'Connected to live FastAPI & PostGIS backend'
              : isColdStarting
              ? 'Backend is waking up from sleep (Render free tier cold-start)'
              : 'Backend unreachable — displaying fallback demo data'
          }
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isLive
                ? 'bg-emerald-400 animate-pulse'
                : isColdStarting
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-400'
            )}
          />
          <span className="font-semibold">
            {isLive ? 'LIVE BACKEND' : isColdStarting ? 'WAKING BACKEND' : 'DEMO DATA'}
          </span>
        </div>

        {/* Active Fleet Node Count */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-lg text-xs text-slate-300 font-mono">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>{activeVehicles} Nodes</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 border border-slate-700/80 px-2 py-1 rounded-lg text-[10.5px] text-slate-400 font-mono">
          <Activity className="w-3 h-3 text-slate-500" />
          <span>{currentTime || 'SYNCING...'}</span>
        </div>

        {/* Trigger Dedup Button */}
        {onTriggerDedup && (
          <button
            onClick={handleDedupClick}
            disabled={isDeduping}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg font-mono transition-all disabled:opacity-50"
            title="Trigger manual 15m DBSCAN spatial deduplication"
          >
            <Cpu className={cn('w-3.5 h-3.5 text-blue-400', isDeduping && 'animate-spin')} />
            <span className="hidden sm:inline">{isDeduping ? 'Deduping...' : 'Dedup'}</span>
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 rounded-lg text-xs transition"
            title="Refresh dashboard data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
