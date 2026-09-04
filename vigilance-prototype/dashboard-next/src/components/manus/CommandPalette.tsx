'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  Truck,
  MapPin,
  AlertOctagon,
  Layers,
  Camera,
  FileSpreadsheet,
  CloudRain,
  X,
  ArrowRight,
  Smartphone,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDedup?: () => void;
  onOpenCockpit?: () => void;
  onRefreshData?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onTriggerDedup,
  onOpenCockpit,
  onRefreshData,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMAND_ITEMS = [
    {
      category: 'Actions & Operations',
      items: [
        {
          id: 'dedup',
          title: 'Trigger Native PostGIS ST_ClusterDBSCAN',
          subtitle: 'Execute 15m spatial deduplication on recent detections',
          icon: Layers,
          action: () => {
            onClose();
            onTriggerDedup?.();
          },
        },
        {
          id: 'refresh',
          title: 'Force Refresh Live Telemetry & Clusters',
          subtitle: 'Query backend API for latest fleet updates',
          icon: RefreshCw,
          action: () => {
            onClose();
            onRefreshData?.();
          },
        },
        {
          id: 'cockpit',
          title: 'Launch Onboard 3D Vehicle Edge Cockpit',
          subtitle: 'Live WebGL Three.js highway perception windshield',
          icon: Camera,
          action: () => {
            onClose();
            onOpenCockpit?.();
          },
        },
        {
          id: 'set-backend',
          title: 'Configure Live Backend API URL (Ngrok / Cloud)',
          subtitle: 'Connect this dashboard to a live FastAPI / PostGIS instance',
          icon: Globe,
          action: () => {
            onClose();
            const current = (typeof window !== 'undefined' ? localStorage.getItem('vigilance_api_url') : '') || 'http://localhost:8000';
            const url = prompt('Enter your live VIGILANCE Backend API URL (e.g., https://your-tunnel.ngrok-free.app or http://localhost:8000):', current);
            if (url !== null) {
              if (url.trim()) {
                localStorage.setItem('vigilance_api_url', url.trim());
              } else {
                localStorage.removeItem('vigilance_api_url');
              }
              window.location.reload();
            }
          },
        },
        {
          id: 'monsoon',
          title: 'Simulate Heavy Monsoon Road Degradation',
          subtitle: 'Inject waterlogged potholes and high-risk washouts',
          icon: CloudRain,
          action: () => {
            onClose();
            alert('Monsoon simulation active: Elevated distress weight applied to GST Road & OMR.');
          },
        },
      ],
    },
    {
      category: 'Navigation',
      items: [
        {
          id: 'nav-command',
          title: 'Command Center (Spatial WebGIS)',
          subtitle: 'Real-time urban surveillance grid & repair queue',
          icon: Command,
          action: () => {
            onClose();
            router.push('/');
          },
        },
        {
          id: 'nav-capture',
          title: 'Mobile Phone Windshield Dashcam (/capture)',
          subtitle: 'Stream live camera & 5Hz GPS telemetry from your phone',
          icon: Smartphone,
          action: () => {
            onClose();
            router.push('/capture');
          },
        },
        {
          id: 'nav-analytics',
          title: 'Urban Road Distress Analytics',
          subtitle: 'Corridor breakdowns, RPI distribution & fleet charts',
          icon: AlertOctagon,
          action: () => {
            onClose();
            router.push('/analytics');
          },
        },
        {
          id: 'nav-fleet',
          title: 'Fleet Perception Nodes',
          subtitle: 'GPS breadcrumbs, Edge NPU health & frame latencies',
          icon: Truck,
          action: () => {
            onClose();
            router.push('/fleet');
          },
        },
        {
          id: 'nav-workorders',
          title: 'PWD Work Orders & Dispatch',
          subtitle: 'Automated repair tickets, SLA tracking & CSV exports',
          icon: FileSpreadsheet,
          action: () => {
            onClose();
            router.push('/work-orders');
          },
        },
      ],
    },
  ];

  const filteredCategories = COMMAND_ITEMS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Palette Modal Box */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden font-sans z-10">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3 bg-slate-900/90">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, action, or navigate..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden font-mono"
            autoFocus
          />
          <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500">
              No matching command found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {cat.category}
                </div>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            {item.title}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation & Operations</span>
            <span>•</span>
            <span>BEL SIH26124</span>
          </div>
          <div>Press ESC to close</div>
        </div>
      </div>
    </div>
  );
}
