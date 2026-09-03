'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RPIRadialGaugeProps {
  className?: string;
  rpiScore?: number;
}

export default function RPIRadialGauge({ className, rpiScore = 0.91 }: RPIRadialGaugeProps) {
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
            fontSize: '14px',
            fontWeight: 700,
            color: '#f8fafc',
            formatter: (val: number) => `${(val / 100).toFixed(2)}`,
            offsetY: 2,
          },
          total: {
            show: true,
            label: 'RPI SCORE',
            color: '#06b6d4',
            formatter: () => `${rpiScore.toFixed(2)}`,
          },
        },
      },
    },
    colors: ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6'],
    labels: ['Severity (40%)', 'Density (25%)', 'Highway (20%)', 'POI Prox (15%)'],
    stroke: {
      lineCap: 'round',
    },
  };

  // Percentages corresponding to RPI sub-weights
  const series = [94, 85, 90, 95];

  return (
    <div className={`w-full h-full min-h-[190px] flex items-center justify-center ${className || ''}`}>
      <Chart options={options} series={series} type="radialBar" height="100%" width="100%" />
    </div>
  );
}
