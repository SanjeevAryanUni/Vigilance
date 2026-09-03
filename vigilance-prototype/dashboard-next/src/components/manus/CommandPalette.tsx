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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDedup?: () => void;
  onOpenCockpit?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onTriggerDedup,
  onOpenCockpit,
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
        } else {
          // Open handled by parent or state
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
      category: 'Actions & Simulations',
      items: [
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
          title: 'Command Center (Spatial WebGIS HERO)',
          subtitle: 'Real-time urban surveillance grid & repair queue',
          icon: Command,
          action: () => {
            onClose();
            router.push('/');
          },
        },
        {
          id: 'nav-analytics',
          title: 'Urban Road Distress Analytics',
          subtitle: 'Corridor risk matrix and temporal degradation splines',
          icon: AlertOctagon,
          action: () => {
            onClose();
            router.push('/analytics');
          },
        },
        {
          id: 'nav-fleet',
          title: 'Public Transit Fleet Nodes & Hardware BOM',
          subtitle: '5 active MTC buses, NPU specs, and sub-₹3,000 unit assembly',
          icon: Truck,
          action: () => {
            onClose();
            router.push('/fleet');
          },
        },
        {
          id: 'nav-work-orders',
          title: 'Municipal Work Orders & PWD Dispatch',
          subtitle: 'Track repair contractors, asphalt budgets, and CSV export',
          icon: FileSpreadsheet,
          action: () => {
            onClose();
            router.push('/work-orders');
          },
        },
      ],
    },
    {
      category: 'Arterial Road Corridors',
      items: [
        {
          id: 'corridor-gst',
          title: 'NH-32 GST Road (Tambaram ➔ Guindy)',
          subtitle: 'High-speed corridor with 4 critical potholes identified',
          icon: MapPin,
          action: () => {
            onClose();
            router.push('/');
          },
        },
        {
          id: 'corridor-omr',
          title: 'OMR Rajiv Gandhi Salai (IT Highway)',
          subtitle: 'Heavy multi-axle bus traffic near Tidel Park & Siruseri',
          icon: MapPin,
          action: () => {
            onClose();
            router.push('/');
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md font-mono select-none animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-cyan-800/80 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, corridor, vehicle ID, or action..."
            autoFocus
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Results */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No commands or road corridors found matching &quot;{query}&quot;
            </div>
          ) : (
            filteredCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2">
                  {cat.category}
                </div>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-cyan-800/80 hover:bg-cyan-950/40 cursor-pointer transition-all duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
