'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CorridorDistressSplineProps {
  className?: string;
  potholesCount?: number;
  cracksCount?: number;
}

export default function CorridorDistressSpline({ className, potholesCount = 24, cracksCount = 40 }: CorridorDistressSplineProps) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
      },
      fontFamily: 'monospace',
    },
    colors: ['#ef4444', '#f97316'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: '#1e293b',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10,
      },
    },
    xaxis: {
      categories: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', 'Now'],
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '10px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '10px',
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#cbd5e1',
      },
      fontSize: '10px',
      markers: {
        size: 4,
      },
    },
  };

  const p = potholesCount;
  const c = cracksCount;
  const series = [
    {
      name: 'D40 Potholes (Critical)',
      data: [Math.round(p * 0.16), Math.round(p * 0.32), Math.round(p * 0.6), Math.round(p * 0.48), Math.round(p * 0.88), Math.round(p * 0.72), p],
    },
    {
      name: 'D20 Alligator Cracks',
      data: [Math.round(c * 0.22), Math.round(c * 0.38), Math.round(c * 0.6), Math.round(c * 0.45), Math.round(c * 0.9), Math.round(c * 0.77), c],
    },
  ];

  return (
    <div className={`w-full h-full min-h-[160px] ${className || ''}`}>
      <Chart options={options} series={series} type="area" height="100%" width="100%" />
    </div>
  );
}
