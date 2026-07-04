'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker, LngLatBounds } from 'maplibre-gl';
import { createCityStreetMapStyle } from '@/data/world-flight/map-style';

export interface DirectionsGuessPin {
  studentKey: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface CityDirectionsMapProps {
  center: { lat: number; lng: number };
  start: { lat: number; lng: number; name: string };
  /** All the round landmarks — used to frame the map so the playable area fills the view. */
  landmarks: Array<{ lat: number; lng: number }>;
  /** The destination — only drawn on the reveal (it stays the guide's secret until then). */
  target: { lat: number; lng: number; name: string } | null;
  guesses: DirectionsGuessPin[];
  revealed: boolean;
}

function labelledMarker(map: MapLibreMap, lat: number, lng: number, color: string, label?: string) {
  const marker = new maplibregl.Marker({ color }).setLngLat([lng, lat]).addTo(map);
  if (label) {
    marker.setPopup(new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18 }).setText(label));
    marker.togglePopup();
  }
  return marker;
}

export function CityDirectionsMap({ center, start, landmarks, target, guesses, revealed }: CityDirectionsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createCityStreetMapStyle(true),
      center: [center.lng, center.lat],
      zoom: 14,
      minZoom: 11,
      maxZoom: 17,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // Frame the playable area: start + every landmark, comfortably padded — never the
    // whole city at a confusing distance.
    const bounds = new LngLatBounds([start.lng, start.lat], [start.lng, start.lat]);
    for (const landmark of landmarks) bounds.extend([landmark.lng, landmark.lat]);
    map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 0 });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Center/landmarks are stable per activity mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      markersRef.current.push(labelledMarker(map, start.lat, start.lng, '#34d399', `START · ${start.name}`));
      if (revealed && target) {
        markersRef.current.push(labelledMarker(map, target.lat, target.lng, '#fbbf24', target.name));
      }
      if (revealed) {
        guesses.forEach((g) => {
          markersRef.current.push(labelledMarker(map, g.lat, g.lng, '#22d3ee', g.displayName));
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
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Destination (revealed at the end)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />Student pins (revealed at the end)</span>
      </div>
    </div>
  );
}
