'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShinyTextProps {
  text: string;
  className?: string;
  shimmerWidth?: number;
  speed?: number;
}

export default function ShinyText({
  text,
  className = '',
  shimmerWidth = 100,
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        'inline-block relative text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-200 to-slate-200 animate-shimmer',
        className
      )}
      style={{
        backgroundSize: '200% 100%',
      }}
    >
      {text}
    </span>
  );
}
