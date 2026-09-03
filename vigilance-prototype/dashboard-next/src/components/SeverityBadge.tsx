import React from 'react';
import { Severity } from '@/types/vigilance';
import { getSeverityStyle } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

export default function SeverityBadge({ severity, className, showDot = true }: SeverityBadgeProps) {
  const style = getSeverityStyle(severity);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border transition-all',
        style.bg,
        style.glow,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />}
      <span>{severity}</span>
    </span>
  );
}
