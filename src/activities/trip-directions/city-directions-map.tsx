'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker } from 'maplibre-gl';
import { createCityStreetMapStyle } from '@/data/world-flight/map-style';

export interface DirectionsGuessPin {
  studentKey: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface CityDirectionsMapProps {
  center: { lat: number; lng: number };
  start: { lat: number; lng: number };
  /** The destination, shown on the teacher screen so the guide can describe the route to it. */
  target: { lat: number; lng: number } | null;
  guesses: DirectionsGuessPin[];
  /** When true, student guess pins are drawn (during the reveal). */
  revealed: boolean;
}

export function CityDirectionsMap({ center, start, target, guesses, revealed }: CityDirectionsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createCityStreetMapStyle(true),
      center: [center.lng, center.lat],
      zoom: 13,
      minZoom: 10,
      maxZoom: 17,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Center is stable per activity mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      markersRef.current.push(new maplibregl.Marker({ color: '#34d399' }).setLngLat([start.lng, start.lat]).addTo(map));
      if (target) {
        markersRef.current.push(new maplibregl.Marker({ color: '#fbbf24' }).setLngLat([target.lng, target.lat]).addTo(map));
      }
      if (revealed) {
        guesses.forEach((g) => {
          markersRef.current.push(new maplibregl.Marker({ color: '#22d3ee' }).setLngLat([g.lng, g.lat]).addTo(map));
        });
      }
    };
    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [start, target, guesses, revealed]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950" />
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Start</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Destination (guide only)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />Student guesses</span>
      </div>
    </div>
  );
}
