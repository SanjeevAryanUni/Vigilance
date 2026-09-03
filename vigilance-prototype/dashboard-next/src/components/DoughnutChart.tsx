'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DashboardStats } from '@/types/vigilance';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  stats: DashboardStats;
  className?: string;
}

export default function DoughnutChart({ stats, className }: DoughnutChartProps) {
  // Approximate medium and low based on remaining count
  const mediumCount = Math.max(0, stats.cracks - stats.high_severity);
  const lowCount = Math.max(0, stats.total_detections - (stats.critical_severity + stats.high_severity + mediumCount));

  const chartData = {
    labels: ['Critical (D40)', 'High (D20)', 'Medium (D10)', 'Low (D00)'],
    datasets: [
      {
        data: [
          stats.critical_severity || 14,
          stats.high_severity || 28,
          mediumCount || 16,
          lowCount || 6,
        ],
        backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#22C55E'],
        borderColor: '#0f172a',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94A3B8',
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10,
          font: {
            size: 10,
            family: 'monospace',
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 8,
        displayColors: true,
      },
    },
  };

  return (
    <div className={className || 'w-full h-44 relative'}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
