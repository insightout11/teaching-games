'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Sparkles } from 'lucide-react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';
import type { DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, greatCircleLine, rangeRing } from '@/lib/world-flight/geo';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';
import { destinationFeatures, EMPTY_FEATURE_COLLECTION, journeyRouteFeatures, journeyStepFeatures } from '@/lib/world-flight/map-features';
import { addWorldFlightMapLayers } from './world-flight-map-layers';
import { countryAt, loadCountries, type CountryShape } from '@/lib/live-room/places-below';
import { souvenirIcon } from '@/components/session/live-room/souvenir-icons';

/**
 * The World Flight map, for the Live Room before take-off: the same drawing as the World Flight page (range ring,
 * the class's journey with arrows and numbered steps, city dots coloured by reach with ticks on visited cities,
 * expedition stops, and the planned route drawing itself), with zoom buttons. Tapping a city reports it; the room
 * decides what that means (fly there, or teach a far city's lesson).
 */
export interface WorldFlightMapProps {
  /** Where the class is now. Not always a World Flight city (a new class starts at LC International). */
  origin: { id: string; lat: number; lng: number };
  rangeKm: number;
  visitedIds: string[];
  /** The class's flights so far, oldest first. */
  journey: Array<{ from: string | null; to: string }>;
  /** The city the class is about to fly to (its route draws itself). Null: no route. */
  selectedId: string | null;
  /** A far city picked for its lesson (highlighted, no route: the class does not fly there). */
  farId?: string | null;
  expedition?: { stopIds: string[]; completedIds: string[]; recommendedId: string | null } | null;
  onCityClick?: (id: string, reachable: boolean) => void;
  /** Visited cities' souvenirs: the icon of one the class has, and whether another is still waiting there. */
  souvenirs?: Array<{ destinationId: string; icon: string | null; waiting: boolean }>;
  /** Change this number to replay the class's journey: the plane flies every leg in turn (about 20 seconds). */
  replayKey?: number;
  onReplayDone?: () => void;
  className?: string;
}

const byId = new Map(WORLD_DESTINATIONS.map((d) => [d.id, d]));
const asData = (d: unknown) => d as Parameters<GeoJSONSource['setData']>[0];
const src = (map: MapLibreMap | null, id: string) => map?.getSource(id) as GeoJSONSource | undefined;

export function WorldFlightMap({ origin, rangeKm, visitedIds, journey, selectedId, farId = null, expedition = null, onCityClick, souvenirs = [], replayKey = 0, onReplayDone, className = '' }: WorldFlightMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const routeAnim = useRef(0);
  const rangeAnim = useRef(0);
  const clickRef = useRef(onCityClick);
  clickRef.current = onCityClick;

  // The origin as a city the drawing code understands (LC International is not one of the 50 cities).
  const originPack = useMemo(() => byId.get(origin.id) ?? ({ ...WORLD_DESTINATIONS[0], id: origin.id, lat: origin.lat, lng: origin.lng } as DestinationPack), [origin.id, origin.lat, origin.lng]);
  const legs = useMemo<WorldFlightClassSummary['completedLegs']>(() => journey.map((l, i) => ({
    id: `leg-${i}`,
    originDestinationId: l.from,
    destinationId: l.to,
    focusTitle: null,
    distanceKm: 0,
    completedAt: null,
  }) as unknown as WorldFlightClassSummary['completedLegs'][number]), [journey]);

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: WORLD_FLIGHT_MAP_STYLE,
      center: [origin.lng, origin.lat],
      zoom: 2.6,
      minZoom: 1.35,
      maxZoom: 7,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      // The world lights up: each country the class has visited glows softly, under everything else.
      map.addSource('wf-lit-countries', { type: 'geojson', data: asData(EMPTY_FEATURE_COLLECTION) });
      map.addLayer({ id: 'wf-lit-countries-fill', type: 'fill', source: 'wf-lit-countries', paint: { 'fill-color': '#F8D28B', 'fill-opacity': 0.16, 'fill-opacity-transition': { duration: 1200 } } });
      map.addLayer({ id: 'wf-lit-countries-line', type: 'line', source: 'wf-lit-countries', paint: { 'line-color': '#F8D28B', 'line-width': 1, 'line-opacity': 0.45 } });
      addWorldFlightMapLayers(map);
      const click = (e: maplibregl.MapLayerMouseEvent) => {
        const p = e.features?.[0]?.properties as { id?: string; reachable?: boolean } | undefined;
        if (p?.id) clickRef.current?.(p.id, !!p.reachable);
      };
      for (const layer of ['world-flight-city-dots', 'world-flight-city-labels', 'world-flight-visited-checks']) {
        map.on('click', layer, click);
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
      setReady(true);
    });
    return () => {
      cancelAnimationFrame(routeAnim.current);
      cancelAnimationFrame(rangeAnim.current);
      map.remove();
      mapRef.current = null;
    };
    // The map is made once; everything else flows through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cities, range ring, journey: the range ring fades in, as on the World Flight page.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    src(map, 'world-flight-range')?.setData(asData(rangeRing(originPack, rangeKm)));
    src(map, 'world-flight-journey-routes')?.setData(asData(journeyRouteFeatures(legs, null)));
    src(map, 'world-flight-journey-steps')?.setData(asData(journeyStepFeatures(legs, null)));
    src(map, 'world-flight-cities')?.setData(asData(destinationFeatures(
      originPack, rangeKm, visitedIds, null, true, [], true,
      farId, expedition?.stopIds ?? [], expedition?.completedIds ?? [], expedition?.recommendedId ?? null, [],
    )));
    cancelAnimationFrame(rangeAnim.current);
    const start = performance.now();
    const fade = (now: number) => {
      const t = Math.min((now - start) / 500, 1);
      map.setPaintProperty('world-flight-range-line', 'line-opacity', 0.85 * t);
      map.setPaintProperty('world-flight-range-glow', 'line-opacity', 0.14 * t);
      if (t < 1) rangeAnim.current = requestAnimationFrame(fade);
    };
    rangeAnim.current = requestAnimationFrame(fade);
  }, [ready, originPack, rangeKm, visitedIds, legs, farId, expedition]);

  // The planned route draws itself from the class's city to the chosen one.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const dest = selectedId ? byId.get(selectedId) : undefined;
    src(map, 'world-flight-route')?.setData(asData(dest && dest.id !== originPack.id ? greatCircleLine(originPack, dest) : EMPTY_FEATURE_COLLECTION));
    cancelAnimationFrame(routeAnim.current);
    if (dest) {
      const start = performance.now();
      const draw = (now: number) => {
        const t = Math.min((now - start) / 700, 1);
        const v = Math.min(t, 0.985);
        map.setPaintProperty('world-flight-route-line', 'line-gradient', ['interpolate', ['linear'], ['line-progress'], 0, '#67E8F9', v, '#67E8F9', Math.min(v + 0.015, 1), 'rgba(103,232,249,0)']);
        if (t < 1) routeAnim.current = requestAnimationFrame(draw);
      };
      routeAnim.current = requestAnimationFrame(draw);
    }
    const focus = dest ?? byId.get(farId ?? '') ?? originPack;
    map.easeTo({ center: destinationCoord(focus), zoom: 3.05, duration: 650, padding: { left: 60, right: 60, top: 60, bottom: 140 } });
  }, [ready, selectedId, farId, originPack]);

  // Countries the class has stamped, from the same outlines the room uses for "Below us".
  const [countries, setCountries] = useState<CountryShape[] | null>(null);
  useEffect(() => { void loadCountries().then(setCountries).catch(() => {}); }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !countries) return;
    const names = new Set(visitedIds.map((id) => byId.get(id)).filter((d): d is DestinationPack => !!d).map((d) => countryAt(countries, d)).filter((n): n is string => !!n));
    const features = countries.filter((c) => names.has(c.name)).map((c) => ({
      type: 'Feature', properties: { name: c.name },
      geometry: { type: 'MultiPolygon', coordinates: c.rings.map((r) => [r]) },
    }));
    src(map, 'wf-lit-countries')?.setData(asData({ type: 'FeatureCollection', features }));
  }, [ready, countries, visitedIds]);

  // Souvenirs: a small icon above each visited city (one the class has), with a sparkle where another is waiting.
  const markerEls = useRef(new Map<string, { el: HTMLDivElement; marker: maplibregl.Marker }>());
  const [els, setEls] = useState<Array<{ id: string; el: HTMLDivElement; icon: string | null; waiting: boolean }>>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const keep = new Set<string>();
    const next: Array<{ id: string; el: HTMLDivElement; icon: string | null; waiting: boolean }> = [];
    for (const sv of souvenirs) {
      const city = byId.get(sv.destinationId);
      if (!city || (!sv.icon && !sv.waiting)) continue;
      keep.add(sv.destinationId);
      let entry = markerEls.current.get(sv.destinationId);
      if (!entry) {
        const el = document.createElement('div');
        el.style.pointerEvents = 'none';
        entry = { el, marker: new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -12] }).setLngLat(destinationCoord(city)).addTo(map) };
        markerEls.current.set(sv.destinationId, entry);
      }
      next.push({ id: sv.destinationId, el: entry.el, icon: sv.icon, waiting: sv.waiting });
    }
    markerEls.current.forEach((entry, id) => {
      if (!keep.has(id)) { entry.marker.remove(); markerEls.current.delete(id); }
    });
    setEls(next);
  }, [ready, souvenirs]);
  useEffect(() => () => { markerEls.current.forEach((e) => e.marker.remove()); markerEls.current.clear(); }, []);

  // The journey replay: the plane flies each leg in turn, drawing the route behind it, stopping briefly at each city.
  const replayRef = useRef(0);
  const doneRef = useRef(onReplayDone);
  doneRef.current = onReplayDone;
  const [planeEl] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));
  const [planeAngle, setPlaneAngle] = useState(0);
  const [replaying, setReplaying] = useState(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!replayKey || !ready || !map || !planeEl) return;
    const lines = legs.map((l) => {
      const a = l.originDestinationId ? byId.get(l.originDestinationId) : undefined;
      const b = byId.get(l.destinationId);
      return a && b ? greatCircleLine(a, b).geometry.coordinates as Array<[number, number]> : null;
    }).filter((c): c is Array<[number, number]> => !!c && c.length > 1);
    if (lines.length === 0) { doneRef.current?.(); return; }
    const all = lines.flat();
    map.fitBounds([[Math.min(...all.map((c) => c[0])), Math.min(...all.map((c) => c[1]))], [Math.max(...all.map((c) => c[0])), Math.max(...all.map((c) => c[1]))]], { padding: 80, maxZoom: 4.5, duration: 800 });
    const per = Math.max(900, Math.min(2500, 20000 / lines.length));
    const pause = 350;
    src(map, 'world-flight-journey-steps')?.setData(asData(EMPTY_FEATURE_COLLECTION));
    const marker = new maplibregl.Marker({ element: planeEl, anchor: 'center' }).setLngLat(lines[0][0]).addTo(map);
    setReplaying(true);
    const line = (coords: Array<[number, number]>, i: number) => ({ type: 'Feature', properties: { legId: `r${i}`, routeNumber: i + 1, active: false }, geometry: { type: 'LineString', coordinates: coords } });
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + 800; // after the map has framed the journey
      const elapsed = Math.max(0, now - start);
      const i = Math.min(lines.length - 1, Math.floor(elapsed / (per + pause)));
      const within = Math.min(1, (elapsed - i * (per + pause)) / per);
      const coords = lines[i];
      const k = Math.max(1, Math.round(within * (coords.length - 1)));
      const drawn = [...lines.slice(0, i).map((c, n) => line(c, n)), line(coords.slice(0, k + 1), i)];
      src(map, 'world-flight-journey-routes')?.setData(asData({ type: 'FeatureCollection', features: drawn }));
      const here = coords[k];
      const prev = coords[Math.max(0, k - 1)];
      marker.setLngLat(here);
      setPlaneAngle((Math.atan2(here[0] - prev[0], here[1] - prev[1]) * 180) / Math.PI);
      if (elapsed < lines.length * (per + pause)) { replayRef.current = requestAnimationFrame(tick); return; }
      marker.remove();
      setReplaying(false);
      src(map, 'world-flight-journey-routes')?.setData(asData(journeyRouteFeatures(legs, null)));
      src(map, 'world-flight-journey-steps')?.setData(asData(journeyStepFeatures(legs, null)));
      doneRef.current?.();
    };
    replayRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(replayRef.current); marker.remove(); setReplaying(false); };
    // Only a new replay request starts one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, ready]);

  return (
    <>
      {/* The zoom buttons sit below the map's own top-row buttons (Class map, …), not on top of them. */}
      <div ref={box} className={`${className} [&_.maplibregl-ctrl-top-right]:!top-12`} />
      {planeEl && replaying && createPortal(
        <span className="block drop-shadow-[0_0_8px_rgba(248,210,139,.9)]" style={{ transform: `rotate(${planeAngle - 45}deg)` }}>
          <Plane className="h-6 w-6 fill-amber-200 text-amber-100" />
        </span>,
        planeEl,
      )}
      {els.map(({ id, el, icon, waiting }) => {
        const Icon = icon ? souvenirIcon(icon) : null;
        return createPortal(
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-amber-200/70 bg-slate-950/85 shadow-[0_0_10px_rgba(248,210,139,.45)]">
            {Icon ? <Icon className="h-3.5 w-3.5 text-amber-200" /> : <Sparkles className="h-3.5 w-3.5 text-amber-200/80" />}
            {waiting && Icon && <Sparkles className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-pulse text-amber-300" />}
          </span>,
          el,
          id,
        );
      })}
    </>
  );
}
