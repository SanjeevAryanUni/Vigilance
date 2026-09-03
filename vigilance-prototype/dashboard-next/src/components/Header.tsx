'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Radio, RefreshCw, Cpu, Activity, LayoutDashboard, BarChart3, Truck, ClipboardList, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShinyText from '@/components/reactbits/ShinyText';

interface HeaderProps {
  activeVehicles?: number;
  isConnected?: boolean;
  onRefresh?: () => void;
  onTriggerDedup?: () => Promise<any>;
  onOpenCommandPalette?: () => void;
}

export default function Header({
  activeVehicles = 5,
  isConnected = false,
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
  ];

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Badge */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShinyText text="VIGILANCE" className="font-extrabold text-base tracking-wider text-slate-100 font-mono" />
              <span className="bg-blue-950/90 text-blue-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-blue-800/80 font-semibold tracking-wide">
                SIH26124 • BEL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">AI-Powered Mobile Urban Intelligence Platform</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
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
      <div className="flex items-center gap-2.5">
        {/* Manus Command Palette Trigger Button */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-800 transition text-xs font-mono shadow-sm"
            title="Open Manus Command Palette (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline text-[11px]">Command Bar</span>
            <kbd className="hidden sm:inline text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Live WebSocket / Simulation Status */}
        <div
          className={cn(
            'flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all',
            isConnected
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
          )}
          title={isConnected ? 'Connected to live WebSocket broker' : 'Operating in resilient simulated edge stream mode'}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )}
          />
          <span className="font-semibold">{isConnected ? 'LIVE WS' : 'EDGE STREAM'}</span>
        </div>

        {/* Fleet Count */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{activeVehicles} Nodes</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 font-mono">
          <Activity className="w-3 h-3 text-slate-500" />
          <span>{currentTime || 'SYNCING...'}</span>
        </div>

        {/* Trigger Dedup Button */}
        {onTriggerDedup && (
          <button
            onClick={handleDedupClick}
            disabled={isDeduping}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-900/50 hover:border-cyan-700/60 text-xs px-2.5 py-1.5 rounded-lg font-mono transition-all disabled:opacity-50"
            title="Trigger manual 15m DBSCAN spatial deduplication"
          >
            <Cpu className={cn('w-3.5 h-3.5', isDeduping && 'animate-spin')} />
            <span className="hidden sm:inline">{isDeduping ? 'Deduping...' : 'Dedup'}</span>
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg text-xs transition"
            title="Refresh dashboard data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
