'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity } from 'lucide-react';

interface AnimatedLayoutProps {
  children: ReactNode;
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Subtle initial reveal delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-x-hidden bg-grid-pattern bg-radial-vignette">
      <AnimatePresence mode="wait">
        {!isLoaded ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-4 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute -inset-3 rounded-full border border-amber-500/20 border-t-amber-400"
                />
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <h1 className="text-xl font-extrabold tracking-widest text-zinc-100 font-sans">
                VIGILANCE
              </h1>
              <p className="text-[11px] tracking-wider uppercase text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
                AI Edge Road Telemetry Platform
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
