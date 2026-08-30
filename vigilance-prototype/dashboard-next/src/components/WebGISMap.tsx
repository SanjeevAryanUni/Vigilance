'use client';

import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ClusterData {
  id: number;
  centroid_lat: number;
  centroid_lon: number;
  detection_count: number;
  dominant_type: string;
  max_severity: string;
  rpi_score: number;
  status: string;
  road_name: string;
  nearest_poi?: string;
  poi_distance_m?: number;
}

interface WebGISMapProps {
  clusters: ClusterData[];
  onStatusChange: (clusterId: number, newStatus: string) => void;
}

export default function WebGISMap({ clusters, onStatusChange }: WebGISMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [80.2030, 13.0067],
      zoom: 11.5,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((c) => {
      const isCrit = c.max_severity.toLowerCase() === 'critical';
      const el = document.createElement('div');
      el.className = 'custom-cluster-node cursor-pointer';
      
      const bgColor = isCrit ? '#DC2626' : (c.rpi_score > 70 ? '#EA580C' : '#2563EB');
      const borderColor = isCrit ? '#FCA5A5' : '#93C5FD';
      
      el.innerHTML = `
        <div style="
          background: ${bgColor};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 0 12px ${bgColor};
          transition: transform 0.2s;
        ">
          ${c.detection_count}
        </div>
      `;

      const popupContent = `
        <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #1e293b;">
            ${c.dominant_type} Node (RPI: ${c.rpi_score})
          </h4>
          <p style="font-size: 11px; color: #475569; margin: 0 0 4px 0;">${c.road_name}</p>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            <span>Nearest POI: <b>${c.nearest_poi || 'Urban Corridor'}</b></span><br/>
            <span>Multi-Pass Ingestions: <b>${c.detection_count}</b></span><br/>
            <span>Current Status: <b style="text-transform: uppercase; color: #2563eb;">${c.status}</b></span>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.centroid_lon, c.centroid_lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [clusters]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-slate-800">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
