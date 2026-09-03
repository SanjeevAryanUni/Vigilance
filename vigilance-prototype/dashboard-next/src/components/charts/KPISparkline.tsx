'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface KPISparklineProps {
  data: number[];
  color?: string;
}

export default function KPISparkline({
  data,
  color = '#06b6d4',
}: KPISparklineProps) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    stroke: {
      curve: 'smooth',
      width: 1.5,
      colors: [color],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color, opacity: 0.4 },
          { offset: 100, color, opacity: 0.0 },
        ],
      },
    },
    tooltip: { enabled: false },
    colors: [color],
  };

  const series = [{ name: 'Trend', data }];

  return (
    <div className="w-full h-8 overflow-hidden">
      <Chart options={options} series={series} type="area" height="100%" width="100%" />
    </div>
  );
}
