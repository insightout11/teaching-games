'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import { createWorldFlightGuessMapStyle } from '@/data/world-flight/map-style';
import { greatCirclePoint, type LatLng } from '@/lib/live-room/route-terrain';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';

/**
 * Seat-back flight map for the Live Room: the class's curved route in the World
 * Flight map style, flown part solid, the rest dashed, the plane at its current
 * position, plus distance and time to arrival.
 */
export interface FlightTrackerProps {
  origin: LatLng & { city: string };
  destination: LatLng & { city: string };
  /** 0 = departure, 1 = arrival. */
  progress: number;
  minutesLeft: number | null;
  below: string | null;
  holding?: boolean;
  compact?: boolean;
}

const STEPS = 96;
type Coord = [number, number];
const toCoord = (p: LatLng): Coord => [p.lng, p.lat];

function lineFeature(coords: Coord[]) {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
}
const asData = (d: unknown) => d as Parameters<GeoJSONSource['setData']>[0];

function bearing(a: LatLng, b: LatLng) {
  const t = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(t(b.lng - a.lng)) * Math.cos(t(b.lat));
  const x = Math.cos(t(a.lat)) * Math.sin(t(b.lat)) - Math.sin(t(a.lat)) * Math.cos(t(b.lat)) * Math.cos(t(b.lng - a.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function FlightTracker({ origin, destination, progress, minutesLeft, below, holding = false, compact = false }: FlightTrackerProps) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const planeRef = useRef<Marker | null>(null);
  const planeEl = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const t = Math.min(1, Math.max(0, progress));

  // Route points, unwrapped across the antimeridian so the line stays continuous.
  const route = useMemo<Coord[]>(() => {
    const pts: Coord[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const c = toCoord(greatCirclePoint(origin, destination, i / STEPS));
      if (pts.length) {
        const prev = pts[pts.length - 1][0];
        while (c[0] - prev > 180) c[0] -= 360;
        while (c[0] - prev < -180) c[0] += 360;
      }
      pts.push(c);
    }
    return pts;
  }, [origin, destination]);

  const totalKm = useMemo(() => distanceBetweenCoordsKm(origin, destination), [origin, destination]);

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: createWorldFlightGuessMapStyle(true),
      center: [0, 20],
      zoom: 1,
      attributionControl: false,
      interactive: false,
      renderWorldCopies: true,
    });
    map.on('load', () => {
      map.addSource('route-rest', { type: 'geojson', data: asData(lineFeature([])) });
      map.addSource('route-done', { type: 'geojson', data: asData(lineFeature([])) });
      map.addLayer({ id: 'route-rest', type: 'line', source: 'route-rest', paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-opacity': 0.7, 'line-dasharray': [1.5, 1.5] } });
      map.addLayer({ id: 'route-done', type: 'line', source: 'route-done', paint: { 'line-color': '#ffb547', 'line-width': 4 } });
      setReady(true);
    });
    const el = document.createElement('div');
    el.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="#ffffff" stroke="#0b1220" stroke-width="0.8"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';
    el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.5))';
    planeEl.current = el;
    planeRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' }).setLngLat(route[0]).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; route/progress updates flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const cut = Math.round(t * STEPS);
    (map.getSource('route-done') as GeoJSONSource | undefined)?.setData(asData(lineFeature(route.slice(0, Math.max(2, cut + 1)))));
    (map.getSource('route-rest') as GeoJSONSource | undefined)?.setData(asData(lineFeature(route.slice(cut))));
    const here = route[Math.min(STEPS, cut)];
    const next = route[Math.min(STEPS, cut + 1)] ?? here;
    planeRef.current?.setLngLat(here).setRotation(bearing({ lng: here[0], lat: here[1] }, { lng: next[0], lat: next[1] }));
    const lngs = route.map((c) => c[0]);
    const lats = route.map((c) => c[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: compact ? 24 : 70, duration: 0, maxZoom: 5 });
  }, [ready, route, t, compact]);

  const flownKm = Math.round(totalKm * t);
  const leftKm = Math.max(0, Math.round(totalKm - flownKm));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div ref={box} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
        <div className="rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">{origin.city} → {destination.city}</p>
          <p className="font-display text-lg text-white">
            {holding ? `Holding over ${destination.city}` : minutesLeft != null ? `Arriving in ${Math.max(0, Math.round(minutesLeft))} min` : 'At the gate'}
          </p>
        </div>
        {!compact && (
          <div className="flex gap-2">
            {[['Flown', `${flownKm.toLocaleString()} km`], ['To go', `${leftKm.toLocaleString()} km`], ['Below us', below ?? '—']].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 backdrop-blur-md">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{k}</p>
                <p className="font-mono text-sm text-white">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
