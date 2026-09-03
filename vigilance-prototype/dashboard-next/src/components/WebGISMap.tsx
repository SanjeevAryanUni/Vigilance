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
  contractor_name?: string;
  contractor_contact?: string;
  sla_hours?: number;
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

    // Carto Dark Matter style
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-basemap': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-basemap-layer',
            type: 'raster',
            source: 'osm-basemap',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: [80.2030, 13.0067], // Chennai Center (Guindy / Kathipara)
      zoom: 11.5,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    // Ensure map fits container correctly on render
    map.on('load', () => {
      map.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((c) => {
      const isCrit = c.max_severity?.toLowerCase() === 'critical';
      const el = document.createElement('div');
      el.className = 'custom-cluster-node cursor-pointer';
      
      const bgColor = isCrit ? '#DC2626' : (c.rpi_score > 75 ? '#EA580C' : '#2563EB');
      const borderColor = isCrit ? '#FCA5A5' : '#93C5FD';
      
      el.innerHTML = `
        <div style="
          background: ${bgColor};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 0 14px ${bgColor};
          transition: transform 0.2s ease-in-out;
          cursor: pointer;
        ">
          ${c.detection_count}
        </div>
      `;

      const popupContent = `
        <div style="color: #0f172a; padding: 6px; font-family: sans-serif; min-width: 210px;">
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #1e293b;">
            ${c.dominant_type} (RPI: ${c.rpi_score})
          </h4>
          <p style="font-size: 11px; color: #475569; margin: 0 0 4px 0;">${c.road_name}</p>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px; line-height: 1.5;">
            <span>📍 POI: <b>${c.nearest_poi || 'Urban Corridor'}</b></span><br/>
            <span>🚗 Fleet Passes: <b>${c.detection_count}</b></span><br/>
            <span>🏗️ Contractor: <b>${c.contractor_name || 'L&T Infra'}</b></span><br/>
            <span>📞 Contact: <b>${c.contractor_contact || 'PWD HQ'}</b></span><br/>
            <span>⏱️ Repair SLA: <b style="color: #dc2626;">${c.sla_hours || 24} Hours</b></span><br/>
            <span>⚡ Status: <b style="text-transform: uppercase; color: #2563eb;">${c.status}</b></span>
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
    <div className="w-full h-full min-h-[450px] relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />
    </div>
  );
}
