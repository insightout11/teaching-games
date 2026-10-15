'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import { createWorldFlightGuessMapStyle } from '@/data/world-flight/map-style';
import { greatCirclePoint, type LatLng } from '@/lib/live-room/route-terrain';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import type { RouteStop } from '@/lib/live-room/route-preview';

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
  /** Today's route: what the class will pass, with the minute each comes up. */
  preview?: RouteStop[];
  /** Minutes since take-off (null at the gate), to mark the stops already passed. */
  minutesFlown?: number | null;
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

export function FlightTracker({ origin, destination, progress, minutesLeft, below, holding = false, compact = false, preview = [], minutesFlown = null }: FlightTrackerProps) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const planeRef = useRef<Marker | null>(null);
  const planeEl = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const t = Math.min(1, Math.max(0, progress));
  const showPreview = preview.length > 1;
  const [following, setFollowing] = useState(true);

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
      // Draggable and zoomable in the full view; the corner widget stays a still picture.
      interactive: !compact,
      minZoom: 1,
      maxZoom: 8,
      renderWorldCopies: true,
    });
    if (!compact) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    // Once the teacher moves the map, it stops re-framing itself on every tick (Re-centre brings that back).
    const mine = (e: { originalEvent?: unknown }) => { if (e.originalEvent) setFollowing(false); };
    map.on('dragstart', mine);
    map.on('zoomstart', mine);
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
    if (!following) return;
    const lngs = route.map((c) => c[0]);
    const lats = route.map((c) => c[1]);
    // Keep the route (and the plane) clear of the cards: Today's route on the left, the arrival and distances below.
    const box = map.getContainer().getBoundingClientRect();
    const card = !compact && showPreview ? Math.min(320, box.width * 0.46) + 30 : 0;
    const padding = compact ? 24 : { left: Math.max(70, card), right: 70, top: 70, bottom: 110 };
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding, duration: 0, maxZoom: 5 });
  }, [ready, route, t, compact, showPreview, following]);

  const flownKm = Math.round(totalKm * t);
  const leftKm = Math.max(0, Math.round(totalKm - flownKm));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div ref={box} className="absolute inset-0 [&_.maplibregl-ctrl-top-right]:!top-12" />
      {!compact && !following && (
        <button type="button" onClick={() => setFollowing(true)} className="absolute right-3 top-[7.5rem] rounded-lg border border-white/20 bg-slate-950/80 px-2.5 py-1 text-xs text-white/85 backdrop-blur-md hover:text-white">Re-centre</button>
      )}
      {!compact && preview.length > 1 && (
        <div className="pointer-events-none absolute left-3 top-3 w-[min(320px,46%)] rounded-xl border border-white/15 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">Today&apos;s route</p>
          <ol className="mt-2 space-y-1.5">
            {preview.map((s) => {
              const passed = minutesFlown != null && s.at <= minutesFlown;
              return (
                <li key={s.text} className={`flex items-baseline gap-3 ${passed ? 'text-white/45' : 'text-white'}`}>
                  <span className="w-14 shrink-0 font-mono text-xs text-white/60">{minutesFlown == null ? `${s.at} min` : passed ? 'passed' : `in ${Math.max(1, Math.round(s.at - minutesFlown))} min`}</span>
                  <span className="text-[15px] leading-snug">{s.text}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
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
