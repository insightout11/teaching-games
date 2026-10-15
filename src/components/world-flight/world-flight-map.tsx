'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';
import type { DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, greatCircleLine, rangeRing } from '@/lib/world-flight/geo';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';
import { destinationFeatures, EMPTY_FEATURE_COLLECTION, journeyRouteFeatures, journeyStepFeatures } from '@/lib/world-flight/map-features';
import { addWorldFlightMapLayers } from './world-flight-map-layers';

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
  className?: string;
}

const byId = new Map(WORLD_DESTINATIONS.map((d) => [d.id, d]));
const asData = (d: unknown) => d as Parameters<GeoJSONSource['setData']>[0];
const src = (map: MapLibreMap | null, id: string) => map?.getSource(id) as GeoJSONSource | undefined;

export function WorldFlightMap({ origin, rangeKm, visitedIds, journey, selectedId, farId = null, expedition = null, onCityClick, className = '' }: WorldFlightMapProps) {
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

  return <div ref={box} className={className} />;
}
