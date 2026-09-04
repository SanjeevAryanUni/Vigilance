'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Truck, ClipboardList, Smartphone, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide when already inside the fullscreen capture viewfinder
  if (pathname === '/capture') return null;

  const items = [
    { href: '/', label: 'WebGIS', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/capture', label: 'Dashcam', icon: Smartphone, highlight: true },
    { href: '/fleet', label: 'Fleet', icon: Truck },
    { href: '/work-orders', label: 'Orders', icon: ClipboardList },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 -mt-5 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/40 group-active:scale-95 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-all',
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            )}
          >
            <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
            <span className="text-[10px] font-mono">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
