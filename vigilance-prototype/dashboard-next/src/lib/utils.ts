import { Severity } from '@/types/vigilance';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTimeAgo(dateInput: string | number | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffSec) || diffSec < 0) return 'just now';
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatDateTime(dateInput: string | number | Date): string {
  const date = new Date(dateInput);
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function getRPIBadgeColor(rpi: number): { bg: string; text: string; border: string } {
  if (rpi >= 85) {
    return { bg: 'bg-red-950/80', text: 'text-red-400', border: 'border-red-800' };
  }
  if (rpi >= 70) {
    return { bg: 'bg-orange-950/80', text: 'text-orange-400', border: 'border-orange-800' };
  }
  if (rpi >= 50) {
    return { bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-800' };
  }
  return { bg: 'bg-blue-950/80', text: 'text-blue-400', border: 'border-blue-800' };
}

export function getSeverityStyle(severity: Severity) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-500',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        dot: 'bg-orange-500',
        glow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500',
        glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
      };
    case 'low':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500',
        glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      };
  }
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
