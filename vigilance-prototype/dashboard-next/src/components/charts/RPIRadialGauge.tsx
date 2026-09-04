'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RPIRadialGaugeProps {
  className?: string;
  rpiScore?: number;
  factors?: [number, number, number, number];
}

export default function RPIRadialGauge({ className, rpiScore = 91.2, factors }: RPIRadialGaugeProps) {
  // Normalize rpiScore if passed as 0-1 instead of 0-100
  const normalizedScore = rpiScore <= 1.0 ? rpiScore * 100 : rpiScore;

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
      fontFamily: 'monospace',
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '28%',
        },
        track: {
          background: 'rgba(30, 41, 59, 0.6)',
          strokeWidth: '100%',
        },
        dataLabels: {
          name: {
            fontSize: '10px',
            color: '#94a3b8',
            offsetY: -6,
          },
          value: {
            fontSize: '13px',
            fontWeight: 700,
            color: '#f8fafc',
            formatter: (val: number) => `${val.toFixed(0)}%`,
            offsetY: 2,
          },
          total: {
            show: true,
            label: 'AVG RPI',
            color: '#f8fafc',
            formatter: () => `${normalizedScore.toFixed(1)}`,
          },
        },
      },
    },
    colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
    labels: ['Severity (40%)', 'Density (25%)', 'Hierarchy (20%)', 'POI Prox (15%)'],
    stroke: {
      lineCap: 'round',
    },
  };

  // Percentages corresponding to RPI sub-weights
  const series = factors || [
    Math.min(100, Math.round(normalizedScore * 1.02)),
    Math.min(100, Math.max(20, Math.round(normalizedScore * 0.88))),
    Math.min(100, Math.max(30, Math.round(normalizedScore * 0.95))),
    Math.min(100, Math.max(40, Math.round(normalizedScore * 0.92))),
  ];

  return (
    <div className={`w-full h-full min-h-[190px] flex items-center justify-center ${className || ''}`}>
      <Chart options={options} series={series} type="radialBar" height="100%" width="100%" />
    </div>
  );
}
