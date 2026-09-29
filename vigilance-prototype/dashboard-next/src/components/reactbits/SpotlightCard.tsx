'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: 'amber' | 'red' | 'emerald' | 'zinc' | 'cyan' | 'blue';
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = 'amber',
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const colors: Record<string, string> = {
    amber: 'rgba(245, 158, 11, 0.18)',
    red: 'rgba(239, 68, 68, 0.18)',
    emerald: 'rgba(16, 185, 129, 0.18)',
    zinc: 'rgba(255, 255, 255, 0.10)',
    cyan: 'rgba(245, 158, 11, 0.18)',
    blue: 'rgba(255, 255, 255, 0.10)',
  };

  const borderColors: Record<string, string> = {
    amber: 'rgba(245, 158, 11, 0.4)',
    red: 'rgba(239, 68, 68, 0.4)',
    emerald: 'rgba(16, 185, 129, 0.4)',
    zinc: 'rgba(255, 255, 255, 0.25)',
    cyan: 'rgba(245, 158, 11, 0.4)',
    blue: 'rgba(255, 255, 255, 0.25)',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${colors[spotlightColor]}, transparent 75%)`,
        }}
      />

      {/* Dynamic Border Illumination */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300 z-10"
        style={{
          opacity,
          boxShadow: `inset 0 0 0 1px ${borderColors[spotlightColor]}`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
}
