'use client';

import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Cluster, ClusterStatus } from '@/types/vigilance';
import { CARTO_DARK_TILES, CHENNAI_CENTER, CHENNAI_POIS, DEFAULT_PITCH, DEFAULT_ZOOM } from '@/lib/constants';

interface WebGISMapProps {
  clusters: Cluster[];
  onStatusChange: (clusterId: number, newStatus: ClusterStatus) => void;
  selectedClusterId?: number | null;
  className?: string;
}

export default function WebGISMap({
  clusters,
  onStatusChange,
  selectedClusterId,
  className,
}: WebGISMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: CARTO_DARK_TILES,
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO',
          },
        },
        layers: [
          {
            id: 'carto-dark-tiles',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: CHENNAI_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    mapRef.current = map;

    // Render static POIs
    CHENNAI_POIS.forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'poi-marker cursor-pointer select-none';
      const isHospital = poi.type === 'hospital';

      el.innerHTML = `
        <div style="
          background: ${isHospital ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
          border: 1px solid ${isHospital ? '#EF4444' : '#3B82F6'};
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 0 8px ${isHospital ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'};
        ">
          ${isHospital ? '🏥' : '🎓'}
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
        <div style="color: #0f172a; padding: 4px; font-family: monospace; font-size: 11px;">
          <div style="font-weight: bold; color: ${isHospital ? '#b91c1c' : '#1d4ed8'}; font-size: 12px;">
            ${isHospital ? '🏥 Emergency Medical Hub' : '🎓 Educational Zone'}
          </div>
          <div style="font-weight: 600; margin-top: 2px;">${poi.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">RPI Proximity Zone Anchor</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lon, poi.lat])
        .setPopup(popup)
        .addTo(map);

      poiMarkersRef.current.push(marker);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  // Update Dynamic Cluster Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old cluster markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((c) => {
      const isCrit = c.max_severity?.toLowerCase() === 'critical';
      const isHigh = c.max_severity?.toLowerCase() === 'high';
      const isResolved = c.status === 'resolved';
      const isAssigned = c.status === 'assigned';

      // Marker sizing based on detection passes (18px to 38px)
      const size = Math.min(38, Math.max(22, 20 + c.detection_count * 2.5));

      let bgColor = '#3B82F6';
      let borderColor = '#93C5FD';
      if (isResolved) {
        bgColor = '#10B981';
        borderColor = '#6EE7B7';
      } else if (isCrit) {
        bgColor = '#EF4444';
        borderColor = '#FCA5A5';
      } else if (isHigh || c.rpi_score > 75) {
        bgColor = '#F97316';
        borderColor = '#FDBA74';
      } else {
        bgColor = '#F59E0B';
        borderColor = '#FDE68A';
      }

      const el = document.createElement('div');
      el.className = 'custom-cluster-marker cursor-pointer select-none';

      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${
            isCrit && !isResolved
              ? `<div style="
                  position: absolute;
                  width: ${size + 14}px;
                  height: ${size + 14}px;
                  border-radius: 50%;
                  background: rgba(239, 68, 68, 0.4);
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ''
          }
          <div style="
            position: relative;
            background: ${bgColor};
            color: white;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            font-family: monospace;
            box-shadow: 0 0 14px ${bgColor};
            transition: transform 0.2s ease-in-out;
          ">
            ${c.detection_count}
          </div>
        </div>
      `;

      // Interactive popup with Assign & Resolve buttons
      const popupDiv = document.createElement('div');
      popupDiv.style.color = '#0f172a';
      popupDiv.style.fontFamily = 'monospace';
      popupDiv.style.padding = '4px';
      popupDiv.style.fontSize = '11px';
      popupDiv.style.minWidth = '220px';

      popupDiv.innerHTML = `
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          <div style="font-weight: 800; font-size: 13px; color: ${bgColor};">
            ${isCrit ? '🔴' : isHigh ? '🟠' : '🟡'} ${c.dominant_type}
          </div>
          <div style="font-size: 10px; color: #64748b;">Incident Node #${c.id}</div>
        </div>
        <div style="margin-bottom: 4px;">
          <div><b>Road:</b> ${c.road_name}</div>
          <div><b>RPI Score:</b> <span style="font-weight: bold; color: #dc2626;">${c.rpi_score.toFixed(1)} / 100</span></div>
          <div><b>Fleet Passes:</b> ${c.detection_count} verified passes</div>
          ${c.nearest_poi ? `<div><b>Nearest POI:</b> ${c.nearest_poi} (${c.poi_distance_m}m)</div>` : ''}
          <div style="margin-top: 4px;">
            <b>Status:</b> <span style="text-transform: uppercase; font-weight: bold; color: ${
              isResolved ? '#059669' : isAssigned ? '#2563eb' : '#dc2626'
            };">${c.status}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <button id="btn-assign-${c.id}" style="
            flex: 1;
            padding: 4px 6px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
          ">Dispatch PWD</button>
          <button id="btn-resolve-${c.id}" style="
            flex: 1;
            padding: 4px 6px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
          ">Resolve</button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupDiv);

      popup.on('open', () => {
        const btnAssign = document.getElementById(`btn-assign-${c.id}`);
        const btnResolve = document.getElementById(`btn-resolve-${c.id}`);
        if (btnAssign) {
          btnAssign.onclick = () => {
            onStatusChange(c.id, 'assigned');
            popup.remove();
          };
        }
        if (btnResolve) {
          btnResolve.onclick = () => {
            onStatusChange(c.id, 'resolved');
            popup.remove();
          };
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.centroid_lon, c.centroid_lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [clusters, onStatusChange]);

  // Center on selected cluster if specified
  useEffect(() => {
    if (!selectedClusterId || !mapRef.current) return;
    const target = clusters.find((c) => c.id === selectedClusterId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.centroid_lon, target.centroid_lat],
        zoom: 14,
        essential: true,
      });
    }
  }, [selectedClusterId, clusters]);

  return (
    <div className={`w-full h-full min-h-[480px] relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />
    </div>
  );
}
