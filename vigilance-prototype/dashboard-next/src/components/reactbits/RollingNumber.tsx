'use client';

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface RollingNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function RollingNumber({
  value,
  duration = 800,
  decimals = 0,
  className = '',
  prefix = '',
  suffix = '',
}: RollingNumberProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const currentValRef = useRef<number>(0);

  useEffect(() => {
    if (!spanRef.current) return;

    const obj = { val: currentValRef.current };

    animate(obj, {
      val: value,
      ease: 'outExpo',
      duration: duration,
      onUpdate: () => {
        if (spanRef.current) {
          const formatted =
            decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString();
          spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
      onComplete: () => {
        currentValRef.current = value;
      },
    });
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <span ref={spanRef} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}
      {suffix}
    </span>
  );
}
