'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import RollingNumber from '@/components/reactbits/RollingNumber';
import KPISparkline from '@/components/charts/KPISparkline';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass?: string;
  glowColor?: string;
  badgeText?: string;
  sparklineData?: number[];
  spotlightColor?: 'cyan' | 'amber' | 'red' | 'emerald' | 'blue';
}

const SPOTLIGHT_BORDER_MAP = {
  blue: 'hover:border-blue-400/40 hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)]',
  cyan: 'hover:border-sky-400/40 hover:shadow-[0_8px_30px_rgba(56,189,248,0.2)]',
  amber: 'hover:border-amber-400/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)]',
  red: 'hover:border-rose-400/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.2)]',
  emerald: 'hover:border-emerald-400/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]',
};

const SPARKLINE_COLOR_MAP = {
  blue: '#3b82f6',
  cyan: '#38bdf8',
  amber: '#f59e0b',
  red: '#ef4444',
  emerald: '#10b981',
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass = 'text-slate-100',
  badgeText,
  sparklineData,
  spotlightColor = 'blue',
}: KPICardProps) {
  const sparkline = sparklineData || [12, 19, 15, 28, 22, 34, 42];
  const isNumeric = typeof value === 'number';

  return (
    <div
      className={cn(
        'p-3.5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.10)]',
        SPOTLIGHT_BORDER_MAP[spotlightColor] || 'hover:border-white/20'
      )}
    >
      {/* Header: Title & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-wider font-mono font-semibold text-slate-400">
          {title}
        </span>
        <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 group-hover:text-slate-100 group-hover:bg-white/[0.08] transition-all backdrop-blur-md shadow-xs">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-2.5 flex items-baseline justify-between">
        <div className={cn('text-2xl font-bold font-mono tracking-tight tabular-nums drop-shadow-xs', colorClass)}>
          {isNumeric ? (
            <RollingNumber value={value as number} duration={800} />
          ) : (
            <span>{value}</span>
          )}
        </div>
        {badgeText && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10 font-semibold backdrop-blur-md shadow-xs">
            {badgeText}
          </span>
        )}
      </div>

      {/* Micro Vector Sparkline */}
      <div className="mt-1.5 -mb-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <KPISparkline
          data={sparkline}
          color={SPARKLINE_COLOR_MAP[spotlightColor] || '#3b82f6'}
        />
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="mt-1.5 text-[10px] text-slate-400 font-mono truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

