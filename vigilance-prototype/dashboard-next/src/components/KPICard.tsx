'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
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

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass = 'text-slate-100',
  badgeText,
  sparklineData,
  spotlightColor = 'cyan',
}: KPICardProps) {
  // Generate deterministic micro-sparkline if not provided
  const sparkline = sparklineData || [12, 19, 15, 28, 22, 34, 42];

  const isNumeric = typeof value === 'number';

  return (
    <SpotlightCard
      spotlightColor={spotlightColor}
      className="p-3.5 flex flex-col justify-between transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-mono font-semibold text-slate-400">
          {title}
        </span>
        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-700/60 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-2 flex items-baseline justify-between">
        <div className={cn('text-2xl font-bold font-mono tracking-tight tabular-nums', colorClass)}>
          {isNumeric ? (
            <RollingNumber value={value as number} duration={900} />
          ) : (
            <span>{value}</span>
          )}
        </div>
        {badgeText && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 font-semibold shadow-sm">
            {badgeText}
          </span>
        )}
      </div>

      {/* Mini Vector Sparkline */}
      <div className="mt-1 -mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <KPISparkline
          data={sparkline}
          color={
            spotlightColor === 'amber'
              ? '#f59e0b'
              : spotlightColor === 'red'
              ? '#ef4444'
              : spotlightColor === 'emerald'
              ? '#10b981'
              : '#06b6d4'
          }
        />
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">
          {subtitle}
        </div>
      )}
    </SpotlightCard>
  );
}
