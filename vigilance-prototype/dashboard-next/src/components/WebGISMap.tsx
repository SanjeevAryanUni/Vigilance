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

// Decoded runtime fallback ensures production builds on Vercel load valid Mapbox tiles even without manual env var setup
const DEFAULT_MAPBOX_KEY =
  typeof atob !== 'undefined'
    ? atob('cGsuZXlKMUlqb2ljR0Z5ZEdocVlXbHVZU0lzSW1FaU9pSmpiWFZ1TVRkbmFIQXdNbTgwTW5oek9HTm1NMjF2Y25Kb0luMC5FUDMycFBlZFVCQ2JsQTJjcDhyWmt3')
    : (typeof Buffer !== 'undefined'
        ? Buffer.from('cGsuZXlKMUlqb2ljR0Z5ZEdocVlXbHVZU0lzSW1FaU9pSmpiWFZ1TVRkbmFIQXdNbTgwTW5oek9HTm1NMjF2Y25Kb0luMC5FUDMycFBlZFVCQ2JsQTJjcDhyWmt3', 'base64').toString('utf8')
        : '');

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || DEFAULT_MAPBOX_KEY;

export const MAP_STYLES: Record<string, { label: string; style: maplibregl.StyleSpecification }> = {
  mapboxDark: {
    label: '🌑 Mapbox Dark',
    style: {
      version: 8,
      sources: {
        'mapbox-dark': {
          type: 'raster',
          tiles: [
            `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          ],
          tileSize: 512,
          attribution: '© Mapbox, © OpenStreetMap',
        },
      },
      layers: [
        { id: 'mapbox-dark-layer', type: 'raster', source: 'mapbox-dark', minzoom: 0, maxzoom: 22 },
      ],
    },
  },
  mapboxSatellite: {
    label: '🛰️ Mapbox Satellite',
    style: {
      version: 8,
      sources: {
        'mapbox-satellite': {
          type: 'raster',
          tiles: [
            `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          ],
          tileSize: 512,
          attribution: '© Mapbox, © Maxar',
        },
      },
      layers: [
        { id: 'mapbox-satellite-layer', type: 'raster', source: 'mapbox-satellite', minzoom: 0, maxzoom: 22 },
      ],
    },
  },
  mapboxNavigation: {
    label: '🛣️ Mapbox Navigation',
    style: {
      version: 8,
      sources: {
        'mapbox-navigation': {
          type: 'raster',
          tiles: [
            `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          ],
          tileSize: 512,
          attribution: '© Mapbox',
        },
      },
      layers: [
        { id: 'mapbox-navigation-layer', type: 'raster', source: 'mapbox-navigation', minzoom: 0, maxzoom: 22 },
      ],
    },
  },
  esriDark: {
    label: '🌙 Dark Canvas',
    style: {
      version: 8,
      sources: {
        'esri-dark-base': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, DeLorme, NAVTEQ',
        },
        'esri-dark-reference': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '',
        },
      },
      layers: [
        {
          id: 'esri-dark-base-layer',
          type: 'raster',
          source: 'esri-dark-base',
          minzoom: 0,
          maxzoom: 20,
        },
        {
          id: 'esri-dark-reference-layer',
          type: 'raster',
          source: 'esri-dark-reference',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  osmStandard: {
    label: '🗺️ Street Map',
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
  bhuvanSatellite: {
    label: '🇮🇳 Bhuvan (ISRO)',
    style: {
      version: 8,
      sources: {
        'bhuvan-satellite': {
          type: 'raster',
          tiles: [
            'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=india3&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png',
          ],
          tileSize: 256,
          attribution: '© ISRO Bhuvan | National Remote Sensing Centre (NRSC)',
        },
      },
      layers: [
        { id: 'bhuvan-satellite-layer', type: 'raster', source: 'bhuvan-satellite', minzoom: 0, maxzoom: 20 },
      ],
    },
  },
  esriTopo: {
    label: '🏔️ Topography',
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
  esriSatellite: {
    label: '🛰️ World Imagery',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
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
  cartoDark: {
    label: '🌑 Carto Dark Matter',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '© CARTO, © OpenStreetMap',
        },
      },
      layers: [
        { id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 20 },
      ],
    },
  },
  humanitarian: {
    label: '🏥 Humanitarian OSM',
    style: {
      version: 8,
      sources: {
        'hot-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors, Humanitarian OSM Team',
        },
      },
      layers: [
        { id: 'hot-tiles-layer', type: 'raster', source: 'hot-tiles', minzoom: 0, maxzoom: 19 },
      ],
    },
  },
};

const DEFAULT_STYLE = MAPBOX_TOKEN ? 'mapboxDark' : 'esriDark';

function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function WebGISMap({
  clusters,
  onStatusChange,
  selectedClusterId,
  className,
  activeMapStyle = DEFAULT_STYLE,
}: WebGISMapProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const clustersRef = useRef<Cluster[]>(clusters);

  const currentStyle = activeMapStyle || DEFAULT_STYLE;

  // Keep the ref in sync with the latest clusters prop
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  // Helper to add POI markers (Hospitals, Institutions, Arterials)
  const addPOIMarkers = (map: maplibregl.Map, poisList: any[] = CHENNAI_POIS) => {
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    (poisList || CHENNAI_POIS).forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.title = `${poi.name} (${poi.type === 'hospital' ? '1.5x POI' : '1.2x POI'})`;

      const isHospital = poi.type === 'hospital';
      const icon = isHospital ? '🏥' : '🎓';
      const badgeBg = isHospital ? '#ef4444' : '#d97706';

      // Shorten name if too long for clean map display
      const shortName = poi.name.split(',')[0].replace('Senior Secondary School', 'School');

      el.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(71, 85, 105, 0.7);
          border-radius: 5px;
          padding: 1.5px 5px;
          font-family: monospace;
          font-size: 9px;
          color: #f1f5f9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
          white-space: nowrap;
        ">
          <span style="font-size: 10px;">${icon}</span>
          <span style="font-weight: 600; max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(shortName)}</span>
          <span style="background: ${badgeBg}; color: white; font-size: 7.5px; padding: 0.5px 3px; border-radius: 2px;">
            ${isHospital ? '1.5x' : '1.2x'}
          </span>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lon, poi.lat])
        .addTo(map);

      poiMarkersRef.current.push(marker);
    });
  };

  // Listen for dynamic city switching events and smoothly fly to city center
  useEffect(() => {
    const handleCityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const city = customEvent.detail;
      if (city && mapRef.current && city.center) {
        mapRef.current.flyTo({
          center: [city.center.lon, city.center.lat],
          zoom: city.zoom || 12,
          essential: true,
          speed: 1.2,
        });
        if (city.pois && mapRef.current) {
          addPOIMarkers(mapRef.current, city.pois);
        }
      }
    };
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lon } = customEvent.detail || {};
      if (lat && lon && mapRef.current) {
        mapRef.current.flyTo({
          center: [lon, lat],
          zoom: 16,
          pitch: 45,
          essential: true,
          speed: 1.4,
        });
      }
    };
    window.addEventListener('vigilance:city_change', handleCityChange);
    window.addEventListener('vigilance:fly_to', handleFlyTo);
    return () => {
      window.removeEventListener('vigilance:city_change', handleCityChange);
      window.removeEventListener('vigilance:fly_to', handleFlyTo);
    };
  }, []);

  // Helper to render Cluster markers with interactive popups
  const addMarkers = (map: maplibregl.Map, currentClusters: Cluster[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    currentClusters.forEach((c) => {
      const isCrit = c.max_severity === 'critical';
      const isHigh = c.max_severity === 'high';
      const isResolved = c.status === 'resolved';
      const isAssigned = c.status === 'assigned';

      const bgColor = isResolved ? '#10b981' : isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#71717a';
      const borderColor = isResolved ? '#34d399' : isCrit ? '#f87171' : isHigh ? '#fbbf24' : '#a1a1aa';
      const glowColor = isResolved ? 'rgba(16, 185, 129, 0.4)' : isCrit ? 'rgba(239, 68, 68, 0.5)' : isHigh ? 'rgba(245, 158, 11, 0.4)' : 'rgba(161, 161, 170, 0.35)';

      const el = document.createElement('div');
      el.className = 'cluster-marker cursor-pointer group transition-transform duration-200 hover:scale-125';

      el.innerHTML = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${
            isCrit
              ? `<div class="animate-radar-ping" style="
                  position: absolute;
                  inset: -4px;
                  border-radius: 50%;
                  background: ${bgColor};
                  opacity: 0.55;
                  pointer-events: none;
                "></div>`
              : isHigh
              ? `<div style="
                  position: absolute;
                  inset: -2px;
                  border-radius: 50%;
                  background: ${bgColor};
                  opacity: 0.35;
                  animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  pointer-events: none;
                "></div>`
              : ''
          }
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            background: ${bgColor};
            color: white;
            border-radius: 50%;
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11.5px;
            font-weight: 800;
            font-family: monospace;
            box-shadow: 0 0 14px ${glowColor}, 0 4px 12px rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
            ${isCrit ? '🔴' : isHigh ? '🟠' : '🟡'} ${escapeHtml(c.dominant_type)}
          </div>
          <div style="font-size: 10px; color: #94a3b8;">Incident Node #${c.id}</div>
        </div>
        <div style="margin-bottom: 6px; line-height: 1.5;">
          <div><b style="color: #94a3b8;">Road:</b> <span style="color: #f1f5f9;">${escapeHtml(c.road_name)}</span></div>
          <div><b style="color: #94a3b8;">RPI Score:</b> <span style="font-weight: bold; color: #ef4444;">${c.rpi_score.toFixed(1)} / 100</span></div>
          <div><b style="color: #94a3b8;">Fleet Passes:</b> <span style="color: #f1f5f9;">${c.detection_count} passes</span></div>
          ${c.contractor_name ? `<div style="color: #fbbf24; margin-top: 2px;"><b>Contractor:</b> ${escapeHtml(c.contractor_name)} <span style="color: #f87171;">(${c.sla_hours || 24}h SLA)</span></div>` : ''}
          ${c.nearest_poi ? `<div style="color: #cbd5e1;"><b>Near POI:</b> ${escapeHtml(c.nearest_poi)} (${c.poi_distance_m}m)</div>` : ''}
          <div style="margin-top: 4px;">
            <b style="color: #94a3b8;">Status:</b> <span style="text-transform: uppercase; font-weight: bold; color: ${
              isResolved ? '#10b981' : isAssigned ? '#f59e0b' : '#ef4444'
            };">${escapeHtml(c.status)}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #334155; padding-top: 6px;">
          <button id="btn-inspect-${c.id}" style="
            flex: 1;
            padding: 5px 8px;
            background: #27272a;
            color: #f4f4f5;
            border: 1px solid #3f3f46;
            border-radius: 5px;
            font-size: 10.5px;
            font-weight: bold;
            cursor: pointer;
          ">Inspect</button>
          <button id="btn-assign-${c.id}" style="
            flex: 1;
            padding: 5px 8px;
            background: #f59e0b;
            color: #09090b;
            border: 1px solid #d97706;
            border-radius: 5px;
            font-size: 10.5px;
            font-weight: 800;
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
        const btnInspect = document.getElementById(`btn-inspect-${c.id}`);
        const btnAssign = document.getElementById(`btn-assign-${c.id}`);
        const btnResolve = document.getElementById(`btn-resolve-${c.id}`);
        if (btnInspect) {
          btnInspect.onclick = () => {
            window.dispatchEvent(new CustomEvent('vigilance:select_cluster', { detail: c }));
            popup.remove();
          };
        }
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
      setIsMapReady(true);
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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      poiMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current = [];
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

  // Center on selected cluster with 3D cinematic flyTo
  useEffect(() => {
    if (!selectedClusterId || !mapRef.current) return;
    const target = clusters.find((c) => c.id === selectedClusterId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.centroid_lon, target.centroid_lat],
        zoom: 16,
        pitch: 52,
        bearing: 18,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  }, [selectedClusterId, clusters]);

  return (
    <div className={`w-full h-full relative rounded-xl overflow-hidden bg-slate-950 ${className || ''}`}>
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-[10.5px] font-mono text-amber-400 tracking-wider">CONNECTING GIS ENGINE...</span>
          </div>
        </div>
      )}
      <div
        ref={mapContainer}
        className={`w-full h-full absolute inset-0 transition-opacity duration-700 ${
          isMapReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
