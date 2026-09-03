'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CorridorDistressSplineProps {
  className?: string;
}

export default function CorridorDistressSpline({ className }: CorridorDistressSplineProps) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'monospace',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: ['#06b6d4', '#f59e0b'], // Cyan for D40 Potholes, Amber for D20 Cracks
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#0891b2', '#d97706'],
        inverseColors: false,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: 'rgba(51, 65, 85, 0.4)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 10, bottom: 0, left: 10 },
    },
    xaxis: {
      categories: ['17:15', '17:20', '17:25', '17:30', '17:35', '17:40', '17:45'],
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val: number) => `${val} events/min`,
      },
      style: {
        fontSize: '11px',
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

  const series = [
    {
      name: 'D40 Potholes (Critical)',
      data: [4, 8, 15, 12, 22, 18, 25],
    },
    {
      name: 'D20 Alligator Cracks',
      data: [7, 12, 19, 14, 28, 24, 31],
    },
  ];

  return (
    <div className={`w-full h-full min-h-[160px] ${className || ''}`}>
      <Chart options={options} series={series} type="area" height="100%" width="100%" />
    </div>
  );
}
