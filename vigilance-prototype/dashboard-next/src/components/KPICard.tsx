import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass?: string;
  glowColor?: string;
  badgeText?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass = 'text-slate-100',
  glowColor,
  badgeText,
}: KPICardProps) {
  return (
    <div className="group relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Glow background accent */}
      {glowColor && (
        <div
          className={cn(
            'absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm pointer-events-none',
            glowColor
          )}
        />
      )}

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-slate-400">
          {title}
        </span>
        <div className="p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-300 group-hover:text-cyan-400 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="relative mt-2 flex items-baseline justify-between">
        <div className={cn('text-2xl font-bold font-mono tracking-tight tabular-nums', colorClass)}>
          {value}
        </div>
        {badgeText && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="relative mt-1 text-[10px] text-slate-500 font-mono truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
