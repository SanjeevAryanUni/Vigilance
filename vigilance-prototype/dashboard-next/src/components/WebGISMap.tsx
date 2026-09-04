'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Cluster, ClusterStatus } from '@/types/vigilance';
import { CHENNAI_CENTER, CHENNAI_POIS, DEFAULT_PITCH, DEFAULT_ZOOM } from '@/lib/constants';

interface WebGISMapProps {
  clusters: Cluster[];
  onStatusChange: (clusterId: number, newStatus: ClusterStatus) => void;
  selectedClusterId?: number | null;
  className?: string;
  activeMapStyle?: string;
  onMapStyleChange?: (styleKey: string) => void;
}

export const MAP_STYLES: Record<string, { label: string; style: maplibregl.StyleSpecification }> = {
  cartoDark: {
    label: 'Dark Matter',
    style: {
      version: 8,
      sources: {
        'carto-dark-tiles': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors, © CARTO',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark-tiles',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  osmStandard: {
    label: 'Street Map',
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  esriSatellite: {
    label: 'Satellite',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar, Earthstar Geographics',
        },
      },
      layers: [
        { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 20 },
      ],
    },
  },
  esriTopo: {
    label: 'Topography',
    style: {
      version: 8,
      sources: {
        'esri-topo': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, HERE, Garmin, OpenStreetMap',
        },
      },
      layers: [
        { id: 'esri-topo-layer', type: 'raster', source: 'esri-topo', minzoom: 0, maxzoom: 20 },
      ],
    },
  },
};

const DEFAULT_STYLE = 'cartoDark';

export default function WebGISMap({
  clusters,
  onStatusChange,
  selectedClusterId,
  className,
  activeMapStyle = DEFAULT_STYLE,
  onMapStyleChange,
}: WebGISMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const clustersRef = useRef<Cluster[]>(clusters);
  const [internalStyle, setInternalStyle] = useState<string>(activeMapStyle || DEFAULT_STYLE);

  const currentStyle = activeMapStyle || internalStyle;

  // Keep the ref in sync with the latest clusters prop
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  // Helper to add Chennai POI markers (Hospitals, Institutions, Arterials)
  const addPOIMarkers = (map: maplibregl.Map) => {
    // Clean up existing POI markers
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    CHENNAI_POIS.forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.title = `${poi.name} (${poi.type})`;

      const isHospital = poi.type === 'hospital';
      const icon = isHospital ? '🏥' : '🎓';
      const badgeBg = isHospital ? '#ef4444' : '#3b82f6';

      el.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(71, 85, 105, 0.8);
          border-radius: 6px;
          padding: 2px 5px;
          font-family: monospace;
          font-size: 9.5px;
          color: #f1f5f9;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          cursor: pointer;
        ">
          <span style="font-size: 11px;">${icon}</span>
          <span style="font-weight: 600; white-space: nowrap;">${poi.name}</span>
          <span style="background: ${badgeBg}; color: white; font-size: 8px; padding: 1px 4px; border-radius: 3px; text-transform: uppercase;">
            ${isHospital ? '1.5x POI' : '1.2x POI'}
          </span>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lon, poi.lat])
        .addTo(map);

      poiMarkersRef.current.push(marker);
    });
  };

  // Helper to re-render Cluster markers with interactive popups
  const addMarkers = (map: maplibregl.Map, currentClusters: Cluster[]) => {
    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    currentClusters.forEach((c) => {
      const isCrit = c.max_severity === 'critical';
      const isHigh = c.max_severity === 'high';
      const isResolved = c.status === 'resolved';
      const isAssigned = c.status === 'assigned';

      const bgColor = isResolved ? '#10b981' : isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';
      const borderColor = isResolved ? '#34d399' : isCrit ? '#f87171' : isHigh ? '#fbbf24' : '#60a5fa';

      const el = document.createElement('div');
      el.className = 'cluster-marker cursor-pointer';

      el.innerHTML = `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          ${
            isCrit
              ? `<div style="
                  position: absolute;
                  inset: -4px;
                  border-radius: 50%;
                  background: ${bgColor};
                  opacity: 0.3;
                  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>`
              : ''
          }
          <div style="
            position: relative;
            width: 26px;
            height: 26px;
            background: ${bgColor};
            color: white;
            border-radius: 50%;
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            font-family: monospace;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            transition: transform 0.2s ease-in-out;
          ">
            ${c.detection_count}
          </div>
        </div>
      `;

      // Interactive popup with Assign & Resolve buttons
      const popupDiv = document.createElement('div');
      popupDiv.style.color = '#f8fafc';
      popupDiv.style.fontFamily = 'monospace';
      popupDiv.style.padding = '4px';
      popupDiv.style.fontSize = '11px';
      popupDiv.style.minWidth = '230px';

      popupDiv.innerHTML = `
        <div style="border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 6px;">
          <div style="font-weight: 800; font-size: 13px; color: ${borderColor};">
            ${isCrit ? '🔴' : isHigh ? '🟠' : '🟡'} ${c.dominant_type}
          </div>
          <div style="font-size: 10px; color: #94a3b8;">Incident Node #${c.id}</div>
        </div>
        <div style="margin-bottom: 6px; line-height: 1.5;">
          <div><b style="color: #94a3b8;">Road:</b> <span style="color: #f1f5f9;">${c.road_name}</span></div>
          <div><b style="color: #94a3b8;">RPI Score:</b> <span style="font-weight: bold; color: #ef4444;">${c.rpi_score.toFixed(1)} / 100</span></div>
          <div><b style="color: #94a3b8;">Fleet Passes:</b> <span style="color: #f1f5f9;">${c.detection_count} passes</span></div>
          ${c.contractor_name ? `<div style="color: #38bdf8; margin-top: 2px;"><b>Contractor:</b> ${c.contractor_name} <span style="color: #f87171;">(${c.sla_hours || 24}h SLA)</span></div>` : ''}
          ${c.nearest_poi ? `<div style="color: #cbd5e1;"><b>Near POI:</b> ${c.nearest_poi} (${c.poi_distance_m}m)</div>` : ''}
          <div style="margin-top: 4px;">
            <b style="color: #94a3b8;">Status:</b> <span style="text-transform: uppercase; font-weight: bold; color: ${
              isResolved ? '#10b981' : isAssigned ? '#3b82f6' : '#ef4444'
            };">${c.status}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #334155; padding-top: 6px;">
          <button id="btn-assign-${c.id}" style="
            flex: 1;
            padding: 5px 8px;
            background: #2563eb;
            color: white;
            border: 1px solid #3b82f6;
            border-radius: 5px;
            font-size: 10.5px;
            font-weight: bold;
            cursor: pointer;
          ">Dispatch PWD</button>
          <button id="btn-resolve-${c.id}" style="
            flex: 1;
            padding: 5px 8px;
            background: #059669;
            color: white;
            border: 1px solid #10b981;
            border-radius: 5px;
            font-size: 10.5px;
            font-weight: bold;
            cursor: pointer;
          ">Resolve</button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true }).setDOMContent(popupDiv);

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
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const initialStyleKey = MAP_STYLES[currentStyle] ? currentStyle : DEFAULT_STYLE;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[initialStyleKey].style,
      center: CHENNAI_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
    });

    // Navigation top-right
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    // Scale bottom-left
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.resize();
      addPOIMarkers(map);
      addMarkers(map, clustersRef.current);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  // Handle Dynamic Map Style Switching from props
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAP_STYLES[currentStyle]) return;

    map.setStyle(MAP_STYLES[currentStyle].style);
    map.once('style.load', () => {
      addPOIMarkers(map);
      addMarkers(map, clustersRef.current);
    });
  }, [currentStyle]);

  // Update Dynamic Cluster Markers when clusters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.loaded()) {
      addMarkers(map, clusters);
    } else {
      map.once('load', () => addMarkers(map, clusters));
    }
  }, [clusters, onStatusChange]);

  // Center on selected cluster if specified
  useEffect(() => {
    if (!selectedClusterId || !mapRef.current) return;
    const target = clusters.find((c) => c.id === selectedClusterId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.centroid_lon, target.centroid_lat],
        zoom: 14.5,
        essential: true,
      });
    }
  }, [selectedClusterId, clusters]);

  return (
    <div className={`w-full h-full relative rounded-xl overflow-hidden bg-slate-950 ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />
    </div>
  );
}
