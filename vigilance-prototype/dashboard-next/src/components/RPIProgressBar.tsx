import React from 'react';
import { cn, getRPIBadgeColor } from '@/lib/utils';

interface RPIProgressBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export default function RPIProgressBar({ score, showLabel = true, className }: RPIProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const colors = getRPIBadgeColor(clamped);

  const getBarColor = () => {
    if (clamped >= 85) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (clamped >= 70) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (clamped >= 50) return 'bg-gradient-to-r from-blue-500 to-amber-500';
    return 'bg-gradient-to-r from-cyan-500 to-blue-500';
  };

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      <div className="flex items-center justify-between text-xs font-mono">
        {showLabel && <span className="text-[10px] text-slate-400">RPI Score</span>}
        <span className={cn('text-[11px] font-bold px-1.5 py-0.2 rounded border', colors.bg, colors.text, colors.border)}>
          {clamped.toFixed(1)}
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', getBarColor())}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
