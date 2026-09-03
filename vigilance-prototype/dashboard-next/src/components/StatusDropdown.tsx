import React from 'react';
import { ClusterStatus } from '@/types/vigilance';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Wrench } from 'lucide-react';

interface StatusDropdownProps {
  status: ClusterStatus;
  onChange: (status: ClusterStatus) => void;
  compact?: boolean;
}

export default function StatusDropdown({ status, onChange, compact = false }: StatusDropdownProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {status !== 'assigned' && (
          <button
            onClick={() => onChange('assigned')}
            className="px-2 py-0.5 bg-blue-950/80 hover:bg-blue-800/80 text-blue-300 border border-blue-800 rounded text-[10px] font-mono transition flex items-center gap-1"
            title="Dispatch PWD repair crew"
          >
            <Wrench className="w-2.5 h-2.5" />
            <span>Dispatch</span>
          </button>
        )}
        {status !== 'resolved' && (
          <button
            onClick={() => onChange('resolved')}
            className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-800 rounded text-[10px] font-mono transition flex items-center gap-1"
            title="Mark road defect as resolved"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Resolve</span>
          </button>
        )}
        {status === 'resolved' && (
          <button
            onClick={() => onChange('open')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-mono transition"
            title="Re-open work order"
          >
            Reopen
          </button>
        )}
      </div>
    );
  }

  const getBadge = () => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'assigned':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'open':
      default:
        return 'bg-red-950/80 text-red-300 border-red-700/60';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as ClusterStatus)}
        className={cn(
          'appearance-none text-xs font-mono font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 transition',
          getBadge()
        )}
      >
        <option value="open" className="bg-slate-900 text-red-400">
          OPEN
        </option>
        <option value="assigned" className="bg-slate-900 text-blue-400">
          ASSIGNED
        </option>
        <option value="resolved" className="bg-slate-900 text-emerald-400">
          RESOLVED
        </option>
      </select>
    </div>
  );
}
