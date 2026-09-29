'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import { createWorldFlightGuessMapStyle } from '@/data/world-flight/map-style';
import { greatCirclePoint, type LatLng } from '@/lib/live-room/route-terrain';

/**
 * One map for the Live Room windscreen, in the World Flight style: labelled pins
 * (class pins, a searched place, journey stops) and optional curved flight
 * paths between points. Pins drop in with a little bounce as they arrive.
 */
export interface DeckMapPin extends LatLng {
  id: string;
  label?: string;
  color?: string;
}

export interface DeckMapProps {
  pins: DeckMapPin[];
  /** Curved routes, each drawn from a to b. */
  paths?: Array<{ a: LatLng; b: LatLng }>;
  /** Street-level zoom for a single place; otherwise the map fits every pin. */
  focusZoom?: number;
  labels?: boolean;
  className?: string;
  /** Makes pins tappable (e.g. picking the next destination). */
  onPinClick?: (id: string) => void;
}

const STEPS = 64;
type Coord = [number, number];

function arc(a: LatLng, b: LatLng): Coord[] {
  const pts: Coord[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const p = greatCirclePoint(a, b, i / STEPS);
    const c: Coord = [p.lng, p.lat];
    if (pts.length) {
      const prev = pts[pts.length - 1][0];
      while (c[0] - prev > 180) c[0] -= 360;
      while (c[0] - prev < -180) c[0] += 360;
    }
    pts.push(c);
  }
  return pts;
}

function pinElement(pin: DeckMapPin, onClick?: (id: string) => void) {
  const el = document.createElement('div');
  el.style.cssText = `display:flex;flex-direction:column;align-items:center;${onClick ? 'cursor:pointer' : 'pointer-events:none'}`;
  if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(pin.id); });
  const drop = document.createElement('div');
  drop.style.cssText = `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${pin.color ?? '#fb7185'};border:2.5px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.45);animation:deckpin .5s cubic-bezier(.2,1.6,.4,1) both`;
  el.appendChild(drop);
  if (pin.label) {
    const tag = document.createElement('div');
    tag.textContent = pin.label;
    tag.style.cssText = 'margin-top:4px;padding:1px 7px;border-radius:999px;background:rgba(2,6,23,.8);color:#fff;font:600 12px system-ui,sans-serif;white-space:nowrap';
    el.appendChild(tag);
  }
  return el;
}

export function DeckMap({ pins, paths = [], focusZoom, labels = true, className = '', onPinClick }: DeckMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const looks = useRef<Map<string, string>>(new Map());
  const clickRef = useRef(onPinClick);
  clickRef.current = onPinClick;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: createWorldFlightGuessMapStyle(labels),
      center: [10, 20],
      zoom: 1,
      attributionControl: false,
      renderWorldCopies: true,
    });
    map.on('load', () => {
      map.addSource('deck-paths', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'deck-paths', type: 'line', source: 'deck-paths', paint: { 'line-color': '#ffb547', 'line-width': 3, 'line-dasharray': [2, 1.2] } });
      setReady(true);
    });
    mapRef.current = map;
    const current = markers.current;
    return () => {
      current.clear();
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; pins and paths flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const seen = new Set<string>();
    for (const pin of pins) {
      seen.add(pin.id);
      const look = `${pin.color}|${pin.label}`;
      const existing = markers.current.get(pin.id);
      if (existing && looks.current.get(pin.id) === look) {
        existing.setLngLat([pin.lng, pin.lat]);
        continue;
      }
      existing?.remove();
      const click = clickRef.current ? (id: string) => clickRef.current?.(id) : undefined;
      markers.current.set(pin.id, new maplibregl.Marker({ element: pinElement(pin, click), anchor: 'top' }).setLngLat([pin.lng, pin.lat]).addTo(map));
      looks.current.set(pin.id, look);
    }
    markers.current.forEach((m, id) => {
      if (!seen.has(id)) {
        m.remove();
        markers.current.delete(id);
        looks.current.delete(id);
      }
    });

    const lines = paths.map((p) => arc(p.a, p.b));
    (map.getSource('deck-paths') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: lines.map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })),
    });

    const all: Coord[] = [...pins.map((p): Coord => [p.lng, p.lat]), ...lines.flat()];
    if (all.length === 1 || (focusZoom && pins.length === 1)) {
      map.flyTo({ center: all[0], zoom: focusZoom ?? 4, duration: 1200 });
    } else if (all.length > 1) {
      const lngs = all.map((c) => c[0]);
      const lats = all.map((c) => c[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 5, duration: 900 });
    }
  }, [ready, pins, paths, focusZoom]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <style>{'@keyframes deckpin{0%{transform:translateY(-26px) rotate(-45deg);opacity:0}100%{transform:rotate(-45deg);opacity:1}}'}</style>
      <div ref={box} className="absolute inset-0" />
    </div>
  );
}
