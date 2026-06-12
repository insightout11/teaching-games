'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { ArrowRight, BookOpen, Check, ExternalLink, Gauge, Globe2, MapPin, PanelLeftClose, PanelLeftOpen, Plane, Play, Route, ScanSearch, X } from 'lucide-react';
import { WORLD_DESTINATIONS, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import type { DestinationFocus, DestinationFocusKind, DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, destinationsWithinRange, distanceKm, formatDistance, greatCircleLine, rangePolygon, type WorldFeature, type WorldFeatureCollection } from '@/lib/world-flight/geo';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { usePlannerStore } from '@/stores/planner-store';
import { recommendNextDestinationId, type WorldFlightClassSummary } from '@/lib/world-flight/journey';
import { getPlaneAsset } from '@/lib/plane-progression';
import { ShareJourneyButton } from './share-journey-button';
import { InvestigationProgressPanel } from './investigation-progress-panel';
import { JourneyProgressPanel } from './journey-progress-panel';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
type FocusFilter = 'all' | DestinationFocusKind;

const EMPTY_FEATURE_COLLECTION: WorldFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};
const EMPTY_DESTINATION_IDS: string[] = [];

function asFeatureCollection(features: WorldFeature[]): WorldFeatureCollection {
  return { type: 'FeatureCollection', features };
}

function destinationFeatures(
  origin: DestinationPack | null,
  rangeKm: number,
  visitedDestinationIds: Iterable<string> = [],
  previewOrigin: DestinationPack | null = null,
) {
  const visited = new Set(visitedDestinationIds);
  return asFeatureCollection(
    WORLD_DESTINATIONS.map((destination) => {
      const km = origin ? distanceKm(origin, destination) : 0;
      const previewKm = previewOrigin ? distanceKm(previewOrigin, destination) : 0;
      return {
        type: 'Feature',
        properties: {
          id: destination.id,
          city: destination.city,
          country: destination.country,
          airport: destination.primaryAirport,
          reachable: !origin || km <= rangeKm || destination.id === origin.id,
          isOrigin: destination.id === origin?.id,
          visited: visited.has(destination.id),
          onwardReachable: !!previewOrigin && previewKm <= rangeKm && destination.id !== previewOrigin.id,
          isPreviewOrigin: destination.id === previewOrigin?.id,
        },
        geometry: {
          type: 'Point',
          coordinates: destinationCoord(destination),
        },
      } satisfies WorldFeature;
    }),
  );
}

function getSource(sourceId: string, map: MapLibreMap | null) {
  return map?.getSource(sourceId) as GeoJSONSource | undefined;
}

function toMapData(data: WorldFeature | WorldFeatureCollection) {
  return data as Parameters<GeoJSONSource['setData']>[0];
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function focusSourceLabel(focus: DestinationFocus) {
  if (focus.kind === 'video') {
    return ['Video', focus.publisher, formatDuration(focus.sourceMaterial.duration)].filter(Boolean).join(' - ');
  }
  return [
    'Reading',
    focus.sourceMaterial.briefingOptions?.length ? `${focus.sourceMaterial.briefingOptions.length} levels` : null,
    focus.citations?.length ? `${focus.citations.length} sources` : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

function isPublishedFocus(focus: DestinationFocus) {
  return focus.kind === 'video'
    ? focus.review.status === 'transcript-verified'
    : focus.review.status === 'researched';
}

function defaultNextDestination(origin: DestinationPack, rangeKm: number, visitedDestinationIds: Iterable<string> = []) {
  const candidates = WORLD_DESTINATIONS
    .filter((destination) => destination.id !== origin.id && distanceKm(origin, destination) <= rangeKm)
    .map((destination) => ({ id: destination.id, distanceKm: distanceKm(origin, destination) }));
  const destinationId = recommendNextDestinationId(candidates, visitedDestinationIds);
  return WORLD_DESTINATIONS.find((destination) => destination.id === destinationId) ?? origin;
}

function ImagePanel({ image, className = '' }: { image: DestinationPack['heroImage']; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt}
        className="h-full w-full object-cover"
        style={{ objectPosition: image.focalPoint ? `${image.focalPoint.x}% ${image.focalPoint.y}%` : 'center' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030814]/95 via-[#030814]/30 to-transparent" />
      <span className="absolute bottom-3 left-4 right-4 text-[10px] text-white/55">
        {image.caption} Source: {image.sourceName}
      </span>
    </div>
  );
}

function FocusButton({
  focus,
  selected,
  onClick,
}: {
  focus: DestinationFocus;
  selected: boolean;
  onClick: () => void;
}) {
  const icon = focus.kind === 'video' ? <Play className="h-3.5 w-3.5" aria-hidden /> : <BookOpen className="h-3.5 w-3.5" aria-hidden />;
  const isYoungerLearnerFriendly = focus.skills.includes('younger learners');
  const visibleSkills = focus.skills
    .filter((skill) => skill !== 'younger learners')
    .slice(0, isYoungerLearnerFriendly ? 1 : 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full overflow-hidden rounded-lg border text-left transition-colors ${
        selected
          ? 'border-lc-blue bg-lc-blue/10 shadow-[inset_3px_0_0_rgba(77,163,255,0.95)]'
          : 'border-white/10 bg-white/[0.04] hover:border-lc-blue/45 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex min-h-[92px]">
        <div className="relative w-28 shrink-0 overflow-hidden bg-lc-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={focus.image.url} alt="" className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#08111f]/45" />
        </div>
        <div className="min-w-0 flex-1 p-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-lc-text">{focus.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-lc-text3">{focus.subtitle}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">
                {icon}
                {focusSourceLabel(focus)}
              </p>
            </div>
            {selected && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lc-blue text-[#06101d]">
                <Check className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-lc-amber/25 bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold text-lc-amber">
              {focus.kind === 'reading' ? `Suggested: ${focus.difficulty}` : focus.difficulty}
            </span>
            {focus.kind === 'reading' && (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-0.5 text-[10px] font-semibold text-cyan-200/75">
                Adapts to class level
              </span>
            )}
            {isYoungerLearnerFriendly && (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                Younger learners
              </span>
            )}
            {visibleSkills.map((skill) => (
              <span key={skill} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-lc-text3">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export function WorldFlightPage({ initialClasses }: { initialClasses: WorldFlightClassSummary[] }) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState('tokyo');
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('all');
  const [listOpen, setListOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClasses[0]?.id ?? null);
  const [firstDepartureId, setFirstDepartureId] = useState<string | null>(null);
  const [previewNextHops, setPreviewNextHops] = useState(false);

  const selectedClass = initialClasses.find((cls) => cls.id === selectedClassId) ?? null;
  const visitedDestinationIds = selectedClass?.visitedDestinationIds ?? EMPTY_DESTINATION_IDS;
  const visitedDestinationSet = useMemo(() => new Set(visitedDestinationIds), [visitedDestinationIds]);
  const origin = useMemo(
    () => WORLD_DESTINATIONS.find((destination) => destination.id === selectedClass?.currentDestinationId) ?? null,
    [selectedClass?.currentDestinationId],
  );
  const firstDeparture = useMemo(
    () => WORLD_DESTINATIONS.find((destination) => destination.id === firstDepartureId) ?? null,
    [firstDepartureId],
  );
  const routeOrigin = origin ?? firstDeparture;
  const isChoosingDeparture = !origin && !firstDeparture;
  const rangeKm = selectedClass?.rangeKm ?? STARTER_PLANE_RANGE_KM;
  const planeName = getPlaneAsset(selectedClass?.planeKey).name;
  const selectedDestination = useMemo(
    () => WORLD_DESTINATIONS.find((destination) => destination.id === selectedDestinationId) ?? WORLD_DESTINATIONS[0],
    [selectedDestinationId],
  );
  const publishedFocusOptions = useMemo(
    () => selectedDestination.focusOptions.filter(isPublishedFocus),
    [selectedDestination],
  );
  const visibleFocusOptions = useMemo(
    () => publishedFocusOptions.filter((focus) => focusFilter === 'all' || focus.kind === focusFilter),
    [focusFilter, publishedFocusOptions],
  );
  const selectedDistanceKm = useMemo(
    () => routeOrigin ? distanceKm(routeOrigin, selectedDestination) : null,
    [routeOrigin, selectedDestination],
  );
  const selectedFocus = visibleFocusOptions.find((focus) => focus.id === selectedFocusId) ?? visibleFocusOptions[0] ?? publishedFocusOptions[0];
  const isReachable = !!routeOrigin && ((selectedDistanceKm ?? 0) <= rangeKm || selectedDestination.id === routeOrigin.id);
  const isLocalLesson = routeOrigin?.id === selectedDestination.id;
  const nextHopCandidates = useMemo(
    () => destinationsWithinRange(selectedDestination, WORLD_DESTINATIONS, rangeKm),
    [rangeKm, selectedDestination],
  );
  const nextHopDestinationIds = useMemo(
    () => new Set(nextHopCandidates.map((candidate) => candidate.destination.id)),
    [nextHopCandidates],
  );
  const listDistanceOrigin = previewNextHops ? selectedDestination : routeOrigin;

  useEffect(() => {
    setSelectedFocusId(null);
    setFocusFilter('all');
  }, [selectedDestinationId]);

  // Destinations list: open by default on wide screens, collapsed (map-first) on narrow.
  // Snaps to the appropriate default whenever the viewport crosses the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1536px)');
    const apply = () => {
      setIsWide(mq.matches);
      setListOpen(mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  function selectDestination(id: string) {
    setSelectedDestinationId(id);
    if (!isWide) setListOpen(false);
  }

  useEffect(() => {
    if (initialClasses.length === 0) return;

    const plannerClassId = usePlannerStore.getState().selectedClassId;
    let preferredClassId = plannerClassId && initialClasses.some((cls) => cls.id === plannerClassId)
      ? plannerClassId
      : null;

    try {
      const stored = localStorage.getItem('lc-last-class');
      const lastClass = stored ? JSON.parse(stored) as { id?: string } : null;
      if (lastClass?.id && initialClasses.some((cls) => cls.id === lastClass.id)) {
        preferredClassId = lastClass.id;
      }
    } catch {
      // Ignore malformed or unavailable local storage.
    }

    setSelectedClassId(preferredClassId ?? initialClasses[0].id);
  }, [initialClasses]);

  useEffect(() => {
    if (origin) {
      setSelectedDestinationId(defaultNextDestination(origin, rangeKm, visitedDestinationIds).id);
    }
  }, [origin, rangeKm, visitedDestinationIds]);

  function selectClass(id: string) {
    const nextClass = initialClasses.find((cls) => cls.id === id);
    setSelectedClassId(id);
    setFirstDepartureId(null);
    setPreviewNextHops(false);
    usePlannerStore.getState().setSelectedClassId(id);
    try {
      localStorage.setItem('lc-last-class', JSON.stringify({ id, name: nextClass?.name ?? '' }));
    } catch {
      // Selection still works when local storage is unavailable.
    }
  }

  function confirmFirstDeparture() {
    setFirstDepartureId(selectedDestination.id);
    setSelectedDestinationId(defaultNextDestination(selectedDestination, rangeKm).id);
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [83, 24],
      zoom: 2.1,
      minZoom: 1.35,
      maxZoom: 7,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.addSource('world-flight-range', {
        type: 'geojson',
        data: toMapData(EMPTY_FEATURE_COLLECTION),
      });
      map.addSource('world-flight-route', {
        type: 'geojson',
        data: toMapData(EMPTY_FEATURE_COLLECTION),
      });
      map.addSource('world-flight-next-range', {
        type: 'geojson',
        data: toMapData(EMPTY_FEATURE_COLLECTION),
      });
      map.addSource('world-flight-cities', {
        type: 'geojson',
        data: toMapData(destinationFeatures(null, STARTER_PLANE_RANGE_KM)),
      });

      map.addLayer({
        id: 'world-flight-range-fill',
        type: 'fill',
        source: 'world-flight-range',
        paint: {
          'fill-color': '#38BDF8',
          'fill-opacity': 0.12,
        },
      });
      map.addLayer({
        id: 'world-flight-range-glow',
        type: 'line',
        source: 'world-flight-range',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 14,
          'line-opacity': 0.32,
          'line-blur': 6,
        },
      });
      map.addLayer({
        id: 'world-flight-range-line',
        type: 'line',
        source: 'world-flight-range',
        paint: {
          'line-color': '#CFEFFF',
          'line-width': 3.5,
          'line-opacity': 1,
        },
      });
      map.addLayer({
        id: 'world-flight-route-glow',
        type: 'line',
        source: 'world-flight-route',
        paint: {
          'line-color': '#38D5FF',
          'line-width': 7,
          'line-opacity': 0.14,
        },
      });
      map.addLayer({
        id: 'world-flight-route-line',
        type: 'line',
        source: 'world-flight-route',
        paint: {
          'line-color': '#67E8F9',
          'line-width': 2.5,
          'line-opacity': 0.88,
        },
      });
      map.addLayer({
        id: 'world-flight-next-range-fill',
        type: 'fill',
        source: 'world-flight-next-range',
        paint: {
          'fill-color': '#22D3EE',
          'fill-opacity': 0.06,
        },
      });
      map.addLayer({
        id: 'world-flight-next-range-line',
        type: 'line',
        source: 'world-flight-next-range',
        paint: {
          'line-color': '#67E8F9',
          'line-width': 2.5,
          'line-opacity': 0.9,
          'line-dasharray': [2, 2],
        },
      });
      map.addLayer({
        id: 'world-flight-city-dots',
        type: 'circle',
        source: 'world-flight-cities',
        paint: {
          'circle-radius': ['case', ['get', 'isOrigin'], 8, ['get', 'isPreviewOrigin'], 8, ['get', 'onwardReachable'], 6.5, ['get', 'visited'], 7, ['get', 'reachable'], 6, 4.5],
          'circle-color': ['case', ['get', 'isOrigin'], '#F59E0B', ['get', 'isPreviewOrigin'], '#22D3EE', ['get', 'onwardReachable'], '#67E8F9', ['get', 'visited'], '#4DA3FF', ['get', 'reachable'], '#2FE59B', '#6F7F9C'],
          'circle-stroke-color': ['case', ['get', 'isPreviewOrigin'], '#ECFEFF', ['get', 'onwardReachable'], '#CFFAFE', ['get', 'visited'], '#BDE3FF', '#07111f'],
          'circle-stroke-width': ['case', ['get', 'isPreviewOrigin'], 3, ['get', 'onwardReachable'], 2.5, ['get', 'visited'], 2.5, 2],
          'circle-opacity': ['case', ['get', 'isOrigin'], 1, ['get', 'isPreviewOrigin'], 1, ['get', 'onwardReachable'], 1, ['get', 'visited'], 1, ['get', 'reachable'], 0.95, 0.72],
        },
      });
      map.addLayer({
        id: 'world-flight-city-labels',
        type: 'symbol',
        source: 'world-flight-cities',
        layout: {
          'text-field': ['get', 'city'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#EAF1FF',
          'text-halo-color': '#07111f',
          'text-halo-width': 1.5,
        },
      });

      map.on('click', 'world-flight-city-dots', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedDestinationId(id);
      });
      map.on('click', 'world-flight-city-labels', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedDestinationId(id);
      });
      map.on('mouseenter', 'world-flight-city-dots', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'world-flight-city-dots', () => {
        map.getCanvas().style.cursor = '';
      });

      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    getSource('world-flight-range', map)?.setData(toMapData(
      routeOrigin ? rangePolygon(routeOrigin, rangeKm) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-next-range', map)?.setData(toMapData(
      previewNextHops ? rangePolygon(selectedDestination, rangeKm) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-cities', map)?.setData(toMapData(
      destinationFeatures(routeOrigin, rangeKm, visitedDestinationIds, previewNextHops ? selectedDestination : null),
    ));
  }, [mapReady, routeOrigin, rangeKm, selectedDestination, previewNextHops, visitedDestinationIds]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const routeSource = getSource('world-flight-route', map);
    routeSource?.setData(toMapData(routeOrigin ? greatCircleLine(routeOrigin, selectedDestination) : EMPTY_FEATURE_COLLECTION));
    map?.easeTo({
      center: destinationCoord(selectedDestination),
      zoom: selectedDestination.id === routeOrigin?.id ? 3.2 : 3.05,
      duration: 650,
      padding: { left: listOpen ? 380 : 96, right: 460, top: 80, bottom: 80 },
    });
  }, [mapReady, routeOrigin, selectedDestination, listOpen]);

  function launchSelectedFocus() {
    const preset = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60');
    const store = usePlannerStore.getState();
    store.reset();
    store.setTopic(selectedFocus.title);
    store.setDifficulty(selectedFocus.difficulty);
    store.setSourceMaterial(selectedFocus.sourceMaterial);
    store.setWorldFlightRoute(routeOrigin?.id ?? null, selectedDestination.id);
    if (preset) store.loadPreset(preset);
    if (selectedClassId) store.setSelectedClassId(selectedClassId);
    store.setWorldFlightContext({
      destinationId: selectedDestination.id,
      focusId: selectedFocus.id,
      requestedMove: isReachable && !isLocalLesson,
      ...(!origin && firstDeparture ? { departureDestinationId: firstDeparture.id } : {}),
    });
    store.setStep('flight-plan');
    router.push('/lesson-planner');
  }

  function selectFocusFilter(nextFilter: FocusFilter) {
    const nextVisible = publishedFocusOptions.filter((focus) => nextFilter === 'all' || focus.kind === nextFilter);
    if (nextVisible.length === 0) return;
    setFocusFilter(nextFilter);
    if (!nextVisible.some((focus) => focus.id === selectedFocus.id)) {
      setSelectedFocusId(nextVisible[0]?.id ?? null);
    }
  }

  return (
    <div className="relative -m-6 min-h-[calc(100vh-0px)] overflow-hidden bg-[#050914] lg:-m-8">
      <div className="absolute inset-0">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050914]">
            <div className="rounded-xl border border-cyan-300/15 bg-white/[0.04] px-4 py-3 text-sm text-lc-text2">
              Loading world map...
            </div>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(77,163,255,0.12),transparent_36%),linear-gradient(90deg,rgba(5,9,20,0.72)_0%,rgba(5,9,20,0.26)_48%,rgba(5,9,20,0.78)_100%)]" />
      </div>

      <div className="pointer-events-none relative z-10 flex h-screen min-h-[760px] gap-5 p-6 lg:p-8">
        {!listOpen && (
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="pointer-events-auto flex h-fit items-center gap-2 self-start rounded-xl border border-cyan-300/15 bg-[#06101d]/92 px-4 py-3 text-sm font-semibold text-lc-text shadow-2xl shadow-black/30 backdrop-blur-xl transition-colors hover:border-cyan-300/35 hover:bg-[#06101d]"
          >
            <PanelLeftOpen className="h-4 w-4 text-cyan-300/80" aria-hidden />
            Destinations
          </button>
        )}
        {listOpen && (
        <section className="pointer-events-auto flex w-[360px] shrink-0 flex-col rounded-xl border border-cyan-300/15 bg-[#06101d]/92 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                <Globe2 className="h-4 w-4" aria-hidden />
                World Flight
              </div>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                aria-label="Collapse destinations"
                title="Collapse"
                className="-mr-1 rounded-md p-1 text-lc-text3 transition-colors hover:bg-white/[0.06] hover:text-lc-text"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-lc-text">
              Choose the next city lesson.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-lc-text3">
              Pick a city, choose a source, and we&apos;ll build a full lesson around it.
            </p>
          </div>

          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <div>
              <label htmlFor="world-flight-class" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-lc-text3">
                Class journey
              </label>
              {initialClasses.length > 0 ? (
                <select
                  id="world-flight-class"
                  value={selectedClassId ?? ''}
                  onChange={(event) => selectClass(event.target.value)}
                  className="min-h-9 w-full rounded-md border border-white/10 bg-[#0b1726] px-2.5 text-sm font-semibold text-lc-text outline-none transition-colors focus:border-cyan-300/45"
                >
                  {initialClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              ) : (
                <p className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-lc-text3">
                  Create a class in the planner to begin its journey.
                </p>
              )}
              {selectedClassId && (
                <div className="mt-2">
                  <ShareJourneyButton classId={selectedClassId} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-lc-text3">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {origin ? 'Origin' : 'Departure'}
                </div>
                <p className="mt-1 text-sm font-semibold text-lc-text">{routeOrigin?.city ?? 'Choose a city'}</p>
                <p className="text-xs text-lc-text3">{routeOrigin?.primaryAirport ?? 'Required before first flight'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-lc-text3">
                  <Gauge className="h-3.5 w-3.5" aria-hidden />
                  Range
                </div>
                <p className="mt-1 text-sm font-semibold text-lc-text">{routeOrigin ? formatDistance(rangeKm) : 'Set after departure'}</p>
                <p className="text-xs text-lc-text3">{selectedClass ? planeName : 'Select a class later'}</p>
              </div>
            </div>
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs leading-relaxed text-cyan-100/75">
              {previewNextHops
                ? <>Planning ahead from {selectedDestination.city}. The dashed cyan ring and cyan cities show the next flights this plane could make after arriving there.</>
                : origin
                ? <>Blue cities are in this class&apos;s passport. Green cities are new and within range. The class location saves after completing the final lesson module.</>
                : firstDeparture
                  ? <>The first flight will depart from {firstDeparture.city}. Choose a different green city to fly to. The journey saves when the class lands.</>
                  : <>Choose the city where this class begins. It will join the class passport after the first completed flight.</>}
            </div>
          </div>

          <JourneyProgressPanel
            currentDestinationId={selectedClass?.currentDestinationId ?? null}
            visitedDestinationIds={visitedDestinationIds}
            completedLegCount={selectedClass?.completedLegCount ?? 0}
            recentLegs={selectedClass?.recentLegs ?? []}
          />

          <InvestigationProgressPanel investigations={selectedClass?.investigations ?? []} />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-lc-text3">
                {previewNextHops ? `Next hops from ${selectedDestination.city}` : 'Destinations'}
              </h2>
              <span className="shrink-0 text-xs text-lc-text3">
                {previewNextHops ? `${nextHopCandidates.length} in range` : `${WORLD_DESTINATIONS.length} cities`}
              </span>
            </div>
            <div className="space-y-2">
              {WORLD_DESTINATIONS.map((destination) => {
                const km = listDistanceOrigin ? distanceKm(listDistanceOrigin, destination) : 0;
                const currentKm = routeOrigin ? distanceKm(routeOrigin, destination) : 0;
                const active = destination.id === selectedDestination.id;
                const reachable = !routeOrigin || currentKm <= rangeKm || destination.id === routeOrigin.id;
                const visited = visitedDestinationSet.has(destination.id);
                const onwardReachable = previewNextHops && nextHopDestinationIds.has(destination.id);
                return (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => selectDestination(destination.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-lc-blue bg-lc-blue/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-cyan-300/35 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      previewNextHops && destination.id === selectedDestination.id
                        ? 'bg-cyan-300 ring-2 ring-cyan-100/50'
                        : onwardReachable
                          ? 'bg-cyan-300'
                          : destination.id === routeOrigin?.id
                        ? 'bg-lc-amber'
                        : visited
                          ? 'bg-lc-blue ring-2 ring-cyan-100/35'
                          : reachable
                            ? 'bg-lc-success'
                            : 'bg-lc-text3'
                    }`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-lc-text">
                        <span className="truncate">{destination.city}</span>
                        {visited && destination.id !== routeOrigin?.id && <Check className="h-3 w-3 shrink-0 text-lc-blue" aria-label="Visited" />}
                      </span>
                      <span className="block truncate text-xs text-lc-text3">
                        {destination.country} - {listDistanceOrigin ? formatDistance(km) : 'Available departure'}
                        {previewNextHops
                          ? destination.id === selectedDestination.id
                            ? ' - Preview origin'
                            : onwardReachable
                              ? ' - Next hop'
                              : ' - Beyond range'
                          : visited ? ' - Visited' : ''}
                      </span>
                    </span>
                    <ArrowRight className={`h-4 w-4 shrink-0 text-cyan-300/60 transition-transform ${active ? 'translate-x-0.5' : ''}`} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        )}

        <aside className="pointer-events-auto ml-auto flex w-[440px] shrink-0 flex-col rounded-xl border border-white/12 bg-[#06101d]/92 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <ImagePanel image={selectedDestination.heroImage} className="h-28 rounded-t-xl" />
          <div className="border-b border-white/10 px-5 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/75">
                  {isChoosingDeparture ? 'Begin journey in' : isLocalLesson ? 'Exploring locally' : 'Arriving in'}
                </p>
                <h2 className="mt-1 text-3xl font-bold leading-tight text-lc-text">{selectedDestination.city}</h2>
                <p className="mt-1 text-sm text-lc-text3">
                  {selectedDestination.country} &middot; {selectedDestination.region}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                isChoosingDeparture || isReachable
                  ? 'border-lc-success/35 bg-lc-success/10 text-lc-success'
                  : 'border-lc-amber/35 bg-lc-amber/10 text-lc-amber'
              }`}>
                {isChoosingDeparture ? 'Starting city' : isLocalLesson ? 'Local lesson' : isReachable ? 'In range' : 'Lesson only'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-lc-text3">
              <span className="font-semibold text-lc-text">
                {isChoosingDeparture ? 'Set before first flight' : selectedDistanceKm === null ? 'No route' : formatDistance(selectedDistanceKm)}
              </span>
              <span className="text-white/20">&middot;</span>
              <span>{selectedDestination.airports.join(', ')}</span>
              <span className="text-white/20">&middot;</span>
              <span className="capitalize">{selectedDestination.scene.terrain}</span>
              {visitedDestinationSet.has(selectedDestination.id) && (
                <>
                  <span className="text-white/20">&middot;</span>
                  <span className="flex items-center gap-1 font-semibold text-lc-blue">
                    <Check className="h-3 w-3" aria-hidden />
                    In class passport
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              aria-pressed={previewNextHops}
              onClick={() => setPreviewNextHops((value) => !value)}
              className={`mt-3 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                previewNextHops
                  ? 'border-cyan-300/40 bg-cyan-300/[0.10] text-cyan-100'
                  : 'border-white/10 bg-white/[0.035] text-lc-text2 hover:border-cyan-300/30 hover:bg-white/[0.06]'
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                previewNextHops ? 'border-cyan-200/35 bg-cyan-200/10' : 'border-white/10 bg-white/[0.035]'
              }`}>
                {previewNextHops
                  ? <X className="h-4 w-4" aria-hidden />
                  : <ScanSearch className="h-4 w-4 text-cyan-200/75" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">
                  {previewNextHops ? 'Close next-hop preview' : `Preview next hops from ${selectedDestination.city}`}
                </span>
                <span className="mt-0.5 block text-[10px] text-lc-text3">
                  {nextHopCandidates.length} cities are within {formatDistance(rangeKm)} of {selectedDestination.city}
                </span>
              </span>
            </button>
            {previewNextHops && routeOrigin && (
              <p className="mt-2 text-[10px] leading-relaxed text-cyan-100/60">
                Planning preview only. Today&apos;s flight still departs from {routeOrigin.city}, and launch eligibility still uses that route.
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {isChoosingDeparture ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                  <h3 className="text-sm font-semibold text-lc-text">Set the class&apos;s departure city</h3>
                  <p className="mt-2 text-xs leading-relaxed text-lc-text3">
                    This creates a real origin for the first route. No lesson is completed here; the first lesson flies from this city to the destination chosen next.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-xs leading-relaxed text-lc-text3">
                  Choose a city from the map or destination list, then confirm it below. Your starter plane&apos;s range will appear from that departure point.
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text3">Choose today&apos;s source</h3>
                  <span className="text-xs text-lc-text3">{visibleFocusOptions.length} options</span>
                </div>
                {publishedFocusOptions.some((focus) => focus.kind === 'reading') && (
                  <div className="mb-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-[11px] leading-relaxed text-cyan-100/70">
                    Reading language adapts to the class level selected in the planner. Suggested level describes the complexity of the topic.
                  </div>
                )}
                <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/[0.035] p-1">
                  {[
                    ['all', 'All'],
                    ['video', 'Watch'],
                    ['reading', 'Read'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={focusFilter === value}
                      onClick={() => selectFocusFilter(value as FocusFilter)}
                      disabled={!publishedFocusOptions.some((focus) => value === 'all' || focus.kind === value)}
                      title={value === 'reading' && !publishedFocusOptions.some((focus) => focus.kind === 'reading')
                        ? 'Curated readings for this city are still in review'
                        : undefined}
                      className={`min-h-8 rounded-md px-2 text-xs font-semibold transition-colors ${
                        focusFilter === value
                          ? 'bg-lc-blue text-[#06101d]'
                          : 'text-lc-text3 hover:bg-white/[0.06] hover:text-lc-text disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {visibleFocusOptions.map((focusOption) => (
                    <FocusButton
                      key={focusOption.id}
                      focus={focusOption}
                      selected={focusOption.id === selectedFocus.id}
                      onClick={() => setSelectedFocusId(focusOption.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            {isChoosingDeparture ? (
              <button
                type="button"
                onClick={confirmFirstDeparture}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lc-blue px-4 text-sm font-bold text-[#06101d] transition-colors hover:bg-lc-blue-hover"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                Set {selectedDestination.city} as Departure
              </button>
            ) : (
              <>
                <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5">
                  <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/70" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-lc-text">{selectedFocus.title}</p>
                    <p className="truncate text-xs font-semibold text-cyan-200/75">{focusSourceLabel(selectedFocus)}</p>
                  </div>
                </div>
                {selectedFocus.kind === 'reading' && selectedFocus.citations?.length ? (
                  <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                      Grounded in {selectedFocus.citations.length} sources
                    </p>
                    <div className="space-y-1">
                      {selectedFocus.citations.map((citation) => (
                        <a
                          key={citation.url}
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-cyan-200/75 transition-colors hover:text-cyan-100"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                          <span className="truncate">{citation.publisher}: {citation.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={launchSelectedFocus}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lc-blue px-4 text-sm font-bold text-[#06101d] transition-colors hover:bg-lc-blue-hover"
                >
                  <Plane className="h-4 w-4 rotate-45" aria-hidden />
                  {isLocalLesson ? 'Build Local City Lesson' : isReachable ? 'Build This Flight Plan' : 'Build Lesson Without Moving'}
                </button>
                {selectedFocus.kind === 'video' && (
                  <a
                    href={selectedFocus.sourceUrl ?? selectedDestination.heroImage.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-lc-text3 transition-colors hover:text-lc-text2"
                  >
                    Source: {selectedFocus.publisher}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
