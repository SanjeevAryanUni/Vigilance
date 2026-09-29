'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Check, Globe } from 'lucide-react';

import { getApiBase, getAuthHeaders } from '@/lib/api';

interface CityInfo {
  key: string;
  display_name: string;
  state: string;
  center: { lat: number; lon: number };
  zoom: number;
  municipal_body: string;
  is_active: boolean;
}

interface CitySelectorProps {
  onCityChange?: (city: CityInfo) => void;
}

export default function CitySelector({ onCityChange }: CitySelectorProps) {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [activeCity, setActiveCity] = useState<string>('chennai');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities on mount
  useEffect(() => {
    const base = getApiBase();
    const url = base ? `${base}/api/cities` : '/api/cities';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setCities(data.cities || []);
        setActiveCity(data.active || 'chennai');
      })
      .catch(() => {
        // Fallback if backend is down
        setCities([
          { key: 'chennai', display_name: 'Chennai', state: 'Tamil Nadu', center: { lat: 13.0827, lon: 80.2707 }, zoom: 12, municipal_body: 'Greater Chennai Corporation (GCC)', is_active: true },
          { key: 'bangalore', display_name: 'Bangalore', state: 'Karnataka', center: { lat: 12.9716, lon: 77.5946 }, zoom: 12, municipal_body: 'Bruhat Bengaluru Mahanagara Palike (BBMP)', is_active: false },
          { key: 'delhi', display_name: 'Delhi', state: 'NCT Delhi', center: { lat: 28.6139, lon: 77.2090 }, zoom: 11, municipal_body: 'Municipal Corporation of Delhi (MCD)', is_active: false },
        ]);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySwitch = async (cityKey: string) => {
    if (cityKey === activeCity) {
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    const base = getApiBase();
    const switchUrl = base ? `${base}/api/cities/switch?city_key=${cityKey}` : `/api/cities/switch?city_key=${cityKey}`;
    try {
      await fetch(switchUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      setActiveCity(cityKey);
      const selected = cities.find(c => c.key === cityKey);
      if (selected) {
        if (onCityChange) onCityChange({ ...selected, is_active: true });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vigilance:city_change', { detail: selected }));
        }
      }
    } catch {
      // Still switch locally for demo mode
      setActiveCity(cityKey);
      const selected = cities.find(c => c.key === cityKey);
      if (selected) {
        if (onCityChange) onCityChange({ ...selected, is_active: true });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vigilance:city_change', { detail: selected }));
        }
      }
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const activeCityData = cities.find(c => c.key === activeCity);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 hover:border-amber-500/30 transition-all text-xs font-mono backdrop-blur-md shadow-xs group"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
        <span className="hidden sm:inline font-semibold">
          {activeCityData?.display_name || 'Chennai'}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-slide-up">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              SELECT DEPLOYMENT CITY
            </span>
          </div>
          <div className="p-1.5">
            {cities.map((city) => {
              const isActive = city.key === activeCity;
              return (
                <button
                  key={city.key}
                  onClick={() => handleCitySwitch(city.key)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <MapPin className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold font-mono ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                        {city.display_name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {city.state} • {city.municipal_body}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
