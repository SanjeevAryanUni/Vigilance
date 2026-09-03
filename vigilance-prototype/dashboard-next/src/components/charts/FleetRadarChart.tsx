'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface FleetRadarChartProps {
  className?: string;
  vehicleId?: string;
}

export default function FleetRadarChart({ className, vehicleId = 'BUS-TN01-1042' }: FleetRadarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'radar',
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'monospace',
    },
    colors: ['#06b6d4', '#f59e0b'],
    stroke: {
      width: 2,
    },
    fill: {
      opacity: 0.25,
    },
    markers: {
      size: 3,
      hover: { size: 6 },
    },
    xaxis: {
      categories: [
        'NPU FPS (INT8)',
        'Optics Clarity (WDR)',
        'GNSS HDOP Precision',
        '4G RSSI Signal',
        'eMMC Flash Endurance',
        'Thermal Headroom',
      ],
      labels: {
        style: {
          colors: ['#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8'],
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      show: false,
      min: 0,
      max: 100,
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: 'rgba(51, 65, 85, 0.5)',
          connectorColors: 'rgba(51, 65, 85, 0.5)',
          fill: {
            colors: ['transparent', 'rgba(15, 23, 42, 0.4)'],
          },
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: { colors: '#cbd5e1' },
      fontSize: '11px',
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `${val}% optimal`,
      },
    },
  };

  const series = [
    {
      name: `${vehicleId} (Current Unit)`,
      data: [96, 92, 94, 88, 98, 86],
    },
    {
      name: 'Fleet Baseline Average',
      data: [82, 80, 85, 78, 90, 75],
    },
  ];

  return (
    <div className={`w-full h-full min-h-[250px] flex items-center justify-center ${className || ''}`}>
      <Chart options={options} series={series} type="radar" height="100%" width="100%" />
    </div>
  );
}
