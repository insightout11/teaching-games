'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker as MapLibreMarker, type Popup as MapLibrePopup } from 'maplibre-gl';
import { ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, Gauge, Globe2, Info, Map as MapIcon, MapPin, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PlaneTakeoff, Play, Radar, Route, ScanSearch, Search, Stamp, X } from 'lucide-react';
import { WORLD_DESTINATIONS, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';
import type { DestinationFocus, DestinationFocusKind, DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, destinationsWithinRange, distanceKm, formatDistance, greatCircleLine, rangeRing, type WorldFeature, type WorldFeatureCollection } from '@/lib/world-flight/geo';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { usePlannerStore } from '@/stores/planner-store';
import { recommendNextDestinationId, type WorldFlightClassSummary } from '@/lib/world-flight/journey';
import { getPlaneAsset } from '@/lib/plane-progression';
import { InvestigationProgressPanel } from './investigation-progress-panel';
import { JourneyProgressPanel } from './journey-progress-panel';

type FocusFilter = 'all' | DestinationFocusKind;
type SidebarMode = 'destinations' | 'passport' | 'missions';
type DestinationGroup = { id: string; label: string; destinations: DestinationPack[] };

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
  showReachability = true,
  missionEvidenceDestinationIds: Iterable<string> = [],
  showVisited = true,
) {
  const visited = new Set(visitedDestinationIds);
  const missionEvidence = new Set(missionEvidenceDestinationIds);
  return asFeatureCollection(
    WORLD_DESTINATIONS.map((destination) => {
      const km = origin ? distanceKm(origin, destination) : 0;
      const previewKm = previewOrigin ? distanceKm(previewOrigin, destination) : 0;
      const reachable = showReachability && (!origin || km <= rangeKm || destination.id === origin.id);
      const isOrigin = destination.id === origin?.id;
      const isVisited = showVisited && visited.has(destination.id);
      const isMissionEvidence = missionEvidence.has(destination.id);
      const onwardReachable = !!previewOrigin && previewKm <= rangeKm && destination.id !== previewOrigin.id;
      return {
        type: 'Feature',
        properties: {
          id: destination.id,
          city: destination.city,
          country: destination.country,
          airport: destination.primaryAirport,
          distanceKm: Math.round(km),
          reachable,
          isOrigin,
          visited: isVisited,
          missionEvidence: isMissionEvidence,
          onwardReachable,
          isPreviewOrigin: destination.id === previewOrigin?.id,
          status: isOrigin
            ? 'Current location'
            : isMissionEvidence
              ? 'Mission field note'
              : onwardReachable
                ? 'Possible next hop'
                : isVisited
                  ? 'Visited'
                  : reachable
                    ? 'In range'
                    : 'Beyond range',
        },
        geometry: {
          type: 'Point',
          coordinates: destinationCoord(destination),
        },
      } satisfies WorldFeature;
    }),
  );
}

function journeyRouteFeatures(completedLegs: WorldFlightClassSummary['completedLegs']) {
  return asFeatureCollection(completedLegs.flatMap((leg) => {
    const origin = WORLD_DESTINATIONS.find((destination) => destination.id === leg.originDestinationId);
    const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === leg.destinationId);
    if (!origin || !destination) return [];
    return [{ ...greatCircleLine(origin, destination), properties: { completed: true } }];
  }));
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

function initialDestinationId(classes: WorldFlightClassSummary[]) {
  const initialClass = classes[0];
  const initialOrigin = WORLD_DESTINATIONS.find((destination) => destination.id === initialClass?.currentDestinationId);
  return initialOrigin
    ? defaultNextDestination(initialOrigin, initialClass?.rangeKm ?? STARTER_PLANE_RANGE_KM, initialClass.visitedDestinationIds).id
    : WORLD_DESTINATIONS[0].id;
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
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--wf-bg)] via-[rgba(7,17,31,0.3)] to-transparent" />
      <a
        href={image.sourceUrl}
        target="_blank"
        rel="noreferrer"
        title={`${image.caption} Source: ${image.sourceName}`}
        aria-label={`Photo source: ${image.sourceName}`}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/25 bg-black/60 text-white/80 transition-colors hover:border-white/55 hover:bg-black/80 hover:text-white"
      >
        <Info className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}

function MapLegend({ mode, previewNextHops }: { mode: SidebarMode; previewNextHops: boolean }) {
  const items = mode === 'missions'
    ? [
      ['bg-violet-400 ring-2 ring-violet-100/60', 'Mission field note'],
      ['bg-lc-text3', 'Other city'],
    ]
    : mode === 'passport'
      ? [
        ['bg-lc-amber', 'Current location'],
        ['bg-lc-blue ring-2 ring-cyan-100/50', 'Visited'],
        ['bg-lc-text3', 'Not visited'],
      ]
      : [
        ['bg-lc-amber', 'Current location'],
        ['bg-lc-blue ring-2 ring-cyan-100/50', 'Visited'],
        [previewNextHops ? 'bg-cyan-300' : 'bg-lc-success', previewNextHops ? 'Possible next hop' : 'In range'],
        ['bg-lc-text3', 'Beyond range'],
      ];

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-md border border-cyan-200/20 bg-[var(--wf-surface)] px-3 py-2 shadow-xl shadow-black/35 md:flex">
      {items.map(([dotClass, label]) => (
        <span key={label} className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-lc-text2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function createCityHoverContent(properties: Record<string, unknown>) {
  const container = document.createElement('div');
  container.className = 'wf-map-popup';

  const heading = document.createElement('strong');
  heading.textContent = `${properties.city}, ${properties.country}`;
  container.appendChild(heading);

  const detail = document.createElement('span');
  const distance = Number(properties.distanceKm);
  detail.textContent = `${properties.status}${Number.isFinite(distance) && distance > 0 ? ` · ${formatDistance(distance)}` : ''}`;
  container.appendChild(detail);

  return container;
}

function SidebarModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-9 items-center justify-center gap-1.5 rounded-sm px-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'bg-cyan-300/15 text-cyan-50 shadow-sm'
          : 'text-lc-text2 hover:bg-white/[0.06] hover:text-lc-text'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
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
  const primarySkill = focus.skills.find((skill) => skill !== 'younger learners') ?? focus.skills[0];

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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--wf-bg)]/45" />
        </div>
        <div className="min-w-0 flex-1 p-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-lc-text">{focus.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-lc-text3">{focus.subtitle}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/75">
                {icon}
                {focusSourceLabel(focus)}
              </p>
            </div>
            {selected && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lc-blue text-[var(--wf-bg)]">
                <Check className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-lc-amber/25 bg-lc-amber/10 px-2 py-0.5 text-[11px] font-semibold text-lc-amber">
              {focus.kind === 'reading' ? `Suggested: ${focus.difficulty}` : focus.difficulty}
            </span>
            {primarySkill && (
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[11px] text-lc-text2">{primarySkill}</span>
            )}
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
  const planeMarkerRef = useRef<MapLibreMarker | null>(null);
  const hoverPopupRef = useRef<MapLibrePopup | null>(null);
  const routeAnimationRef = useRef<number | null>(null);
  const rangeAnimationRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState(() => initialDestinationId(initialClasses));
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('all');
  const [listOpen, setListOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isWide, setIsWide] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClasses[0]?.id ?? null);
  const [firstDepartureId, setFirstDepartureId] = useState<string | null>(null);
  const [previewNextHops, setPreviewNextHops] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('destinations');

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
  const planeAsset = getPlaneAsset(selectedClass?.planeKey);
  const planeName = planeAsset.name;
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
  const missionEvidenceDestinationIds = useMemo(
    () => selectedClass?.investigations.flatMap((investigation) => (
      investigation.requirements.flatMap((requirement) => requirement.evidence?.destinationId ?? [])
    )) ?? EMPTY_DESTINATION_IDS,
    [selectedClass?.investigations],
  );
  const destinationGroups = useMemo<DestinationGroup[]>(() => {
    const query = destinationQuery.trim().toLowerCase();
    const matchesQuery = WORLD_DESTINATIONS.filter((destination) => (
      !query || `${destination.city} ${destination.country} ${destination.region} ${destination.airports.join(' ')}`.toLowerCase().includes(query)
    ));
    const sorted = [...matchesQuery].sort((a, b) => (
      listDistanceOrigin ? distanceKm(listDistanceOrigin, a) - distanceKm(listDistanceOrigin, b) : a.city.localeCompare(b.city)
    ));

    if (!listDistanceOrigin) return [{ id: 'available', label: 'Available departures', destinations: sorted }];

    const inRange: DestinationPack[] = [];
    const visited: DestinationPack[] = [];
    const beyondRange: DestinationPack[] = [];
    for (const destination of sorted) {
      const reachable = distanceKm(listDistanceOrigin, destination) <= rangeKm || destination.id === listDistanceOrigin.id;
      if (!previewNextHops && (visitedDestinationSet.has(destination.id) || destination.id === routeOrigin?.id)) visited.push(destination);
      else if (reachable) inRange.push(destination);
      else beyondRange.push(destination);
    }

    return [
      { id: 'in-range', label: previewNextHops ? 'Possible next hops' : 'In range', destinations: inRange },
      ...(!previewNextHops ? [{ id: 'visited', label: 'Visited', destinations: visited }] : []),
      { id: 'beyond-range', label: 'Beyond range', destinations: beyondRange },
    ].filter((group) => group.destinations.length > 0);
  }, [destinationQuery, listDistanceOrigin, previewNextHops, rangeKm, routeOrigin?.id, visitedDestinationSet]);

  useEffect(() => {
    setSelectedFocusId(null);
    setFocusFilter('all');
  }, [selectedDestinationId]);

  // Keep the map primary on projected/narrow windows while preserving fast panel access.
  useEffect(() => {
    const wideMq = window.matchMedia('(min-width: 1536px)');
    const compactMq = window.matchMedia('(max-width: 1279px)');
    const apply = () => {
      setIsWide(wideMq.matches);
      setIsCompact(compactMq.matches);
      setListOpen(wideMq.matches);
      setDetailsOpen(!compactMq.matches);
    };
    apply();
    wideMq.addEventListener('change', apply);
    compactMq.addEventListener('change', apply);
    return () => {
      wideMq.removeEventListener('change', apply);
      compactMq.removeEventListener('change', apply);
    };
  }, []);

  function selectDestination(id: string) {
    setSelectedDestinationId(id);
    setSidebarMode('destinations');
    if (!isWide) setListOpen(false);
    setDetailsOpen(true);
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
      style: WORLD_FLIGHT_MAP_STYLE,
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
        lineMetrics: true,
        data: toMapData(EMPTY_FEATURE_COLLECTION),
      });
      map.addSource('world-flight-journey-routes', {
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
        id: 'world-flight-range-glow',
        type: 'line',
        source: 'world-flight-range',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 7,
          'line-opacity': 0.14,
          'line-blur': 4,
        },
      });
      map.addLayer({
        id: 'world-flight-range-line',
        type: 'line',
        source: 'world-flight-range',
        paint: {
          'line-color': '#CFEFFF',
          'line-width': 2.25,
          'line-opacity': 0.85,
        },
      });
      map.addLayer({
        id: 'world-flight-journey-routes-glow',
        type: 'line',
        source: 'world-flight-journey-routes',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 6,
          'line-opacity': 0.1,
          'line-blur': 4,
        },
      });
      map.addLayer({
        id: 'world-flight-journey-routes-line',
        type: 'line',
        source: 'world-flight-journey-routes',
        paint: {
          'line-color': '#7DD3FC',
          'line-width': 2,
          'line-opacity': 0.68,
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
          'line-width': 2.5,
          'line-opacity': 0.88,
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#67E8F9', 0.01, 'rgba(103,232,249,0)'],
        },
      });
      map.addLayer({
        id: 'world-flight-next-range-line',
        type: 'line',
        source: 'world-flight-next-range',
        paint: {
          'line-color': '#67E8F9',
          'line-width': 1.75,
          'line-opacity': 0.75,
          'line-dasharray': [2, 2],
        },
      });
      map.addLayer({
        id: 'world-flight-city-dots',
        type: 'circle',
        source: 'world-flight-cities',
        paint: {
          'circle-radius': ['case', ['get', 'isOrigin'], 8, ['get', 'isPreviewOrigin'], 8, ['get', 'missionEvidence'], 7, ['get', 'onwardReachable'], 6.5, ['get', 'visited'], 7, ['get', 'reachable'], 6, 4.5],
          'circle-color': ['case', ['get', 'isOrigin'], '#F59E0B', ['get', 'isPreviewOrigin'], '#22D3EE', ['get', 'missionEvidence'], '#A78BFA', ['get', 'onwardReachable'], '#67E8F9', ['get', 'visited'], '#4DA3FF', ['get', 'reachable'], '#2FE59B', '#6F7F9C'],
          'circle-stroke-color': ['case', ['get', 'isPreviewOrigin'], '#ECFEFF', ['get', 'missionEvidence'], '#EDE9FE', ['get', 'onwardReachable'], '#CFFAFE', ['get', 'visited'], '#BDE3FF', '#07111f'],
          'circle-stroke-width': ['case', ['get', 'isPreviewOrigin'], 3, ['get', 'missionEvidence'], 3, ['get', 'onwardReachable'], 2.5, ['get', 'visited'], 2.5, 2],
          'circle-opacity': ['case', ['get', 'isOrigin'], 1, ['get', 'isPreviewOrigin'], 1, ['get', 'missionEvidence'], 1, ['get', 'onwardReachable'], 1, ['get', 'visited'], 1, ['get', 'reachable'], 0.95, 0.55],
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
      map.addLayer({
        id: 'world-flight-visited-checks',
        type: 'symbol',
        source: 'world-flight-cities',
        filter: ['all', ['==', 'visited', true], ['==', 'isOrigin', false]],
        layout: {
          'text-field': '✓',
          'text-font': ['Noto Sans Bold'],
          'text-size': 10,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#071522',
        },
      });

      map.on('click', 'world-flight-city-dots', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) {
          setSelectedDestinationId(id);
          setSidebarMode('destinations');
        }
      });
      map.on('click', 'world-flight-city-labels', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) {
          setSelectedDestinationId(id);
          setSidebarMode('destinations');
        }
      });
      map.on('click', 'world-flight-visited-checks', (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) {
          setSelectedDestinationId(id);
          setSidebarMode('destinations');
        }
      });
      const showCityPopup = (event: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const properties = event.features?.[0]?.properties as Record<string, unknown> | undefined;
        if (!properties) return;
        const popup = hoverPopupRef.current ?? new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: 'wf-map-popup-shell',
        });
        hoverPopupRef.current = popup;
        popup.setLngLat(event.lngLat).setDOMContent(createCityHoverContent(properties)).addTo(map);
      };
      const hideCityPopup = () => {
        map.getCanvas().style.cursor = '';
        hoverPopupRef.current?.remove();
      };
      map.on('mouseenter', 'world-flight-city-dots', showCityPopup);
      map.on('mousemove', 'world-flight-city-dots', showCityPopup);
      map.on('mouseleave', 'world-flight-city-dots', hideCityPopup);
      map.on('mouseenter', 'world-flight-city-labels', showCityPopup);
      map.on('mousemove', 'world-flight-city-labels', showCityPopup);
      map.on('mouseleave', 'world-flight-city-labels', hideCityPopup);
      map.on('mouseenter', 'world-flight-visited-checks', showCityPopup);
      map.on('mousemove', 'world-flight-visited-checks', showCityPopup);
      map.on('mouseleave', 'world-flight-visited-checks', hideCityPopup);

      setMapReady(true);
    });

    return () => {
      if (routeAnimationRef.current) cancelAnimationFrame(routeAnimationRef.current);
      if (rangeAnimationRef.current) cancelAnimationFrame(rangeAnimationRef.current);
      planeMarkerRef.current?.remove();
      hoverPopupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    getSource('world-flight-range', map)?.setData(toMapData(
      sidebarMode === 'destinations' && routeOrigin ? rangeRing(routeOrigin, rangeKm) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-next-range', map)?.setData(toMapData(
      sidebarMode === 'destinations' && previewNextHops ? rangeRing(selectedDestination, rangeKm) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-journey-routes', map)?.setData(toMapData(
      sidebarMode === 'passport' ? journeyRouteFeatures(selectedClass?.completedLegs ?? []) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-cities', map)?.setData(toMapData(
      destinationFeatures(
        sidebarMode === 'missions' ? null : routeOrigin,
        rangeKm,
        visitedDestinationIds,
        sidebarMode === 'destinations' && previewNextHops ? selectedDestination : null,
        sidebarMode === 'destinations',
        sidebarMode === 'missions' ? missionEvidenceDestinationIds : EMPTY_DESTINATION_IDS,
        sidebarMode !== 'missions',
      ),
    ));

    if (rangeAnimationRef.current) cancelAnimationFrame(rangeAnimationRef.current);
    if (sidebarMode === 'destinations' && routeOrigin) {
      const start = performance.now();
      const animateRange = (now: number) => {
        const progress = Math.min((now - start) / 500, 1);
        map?.setPaintProperty('world-flight-range-line', 'line-opacity', 0.85 * progress);
        map?.setPaintProperty('world-flight-range-glow', 'line-opacity', 0.14 * progress);
        if (progress < 1) rangeAnimationRef.current = requestAnimationFrame(animateRange);
      };
      rangeAnimationRef.current = requestAnimationFrame(animateRange);
    }
  }, [mapReady, routeOrigin, rangeKm, selectedDestination, previewNextHops, visitedDestinationIds, sidebarMode, selectedClass?.completedLegs, missionEvidenceDestinationIds]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const routeSource = getSource('world-flight-route', map);
    routeSource?.setData(toMapData(sidebarMode === 'destinations' && routeOrigin ? greatCircleLine(routeOrigin, selectedDestination) : EMPTY_FEATURE_COLLECTION));
    if (routeAnimationRef.current) cancelAnimationFrame(routeAnimationRef.current);
    if (sidebarMode === 'destinations' && routeOrigin) {
      const start = performance.now();
      const animateRoute = (now: number) => {
        const progress = Math.min((now - start) / 700, 1);
        const visibleProgress = Math.min(progress, 0.985);
        map?.setPaintProperty('world-flight-route-line', 'line-gradient', [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          '#67E8F9',
          visibleProgress,
          '#67E8F9',
          Math.min(visibleProgress + 0.015, 1),
          'rgba(103,232,249,0)',
        ]);
        if (progress < 1) routeAnimationRef.current = requestAnimationFrame(animateRoute);
      };
      routeAnimationRef.current = requestAnimationFrame(animateRoute);
    }
    map?.easeTo({
      center: destinationCoord(selectedDestination),
      zoom: selectedDestination.id === routeOrigin?.id ? 3.2 : 3.05,
      duration: 650,
      padding: {
        left: listOpen && !isCompact ? 380 : 96,
        right: sidebarMode === 'destinations' && detailsOpen && !isCompact ? 460 : 96,
        top: 80,
        bottom: 80,
      },
    });
  }, [detailsOpen, isCompact, listOpen, mapReady, routeOrigin, selectedDestination, sidebarMode]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!routeOrigin) {
      planeMarkerRef.current?.remove();
      planeMarkerRef.current = null;
      return;
    }

    const element = document.createElement('div');
    element.className = 'wf-plane-marker';
    const image = document.createElement('img');
    image.src = planeAsset.webp;
    image.alt = `${planeAsset.name} at ${routeOrigin.city}`;
    element.appendChild(image);

    planeMarkerRef.current?.remove();
    planeMarkerRef.current = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat(destinationCoord(routeOrigin))
      .addTo(mapRef.current);
  }, [mapReady, planeAsset.name, planeAsset.webp, routeOrigin]);

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

  function launchDesignMission(investigationId: string) {
    if (!selectedClassId) return;
    const investigation = selectedClass?.investigations.find((candidate) => candidate.id === investigationId);
    const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'design-studio-60');
    if (!investigation || investigation.designMissionStatus !== 'ready' || !preset) return;

    const store = usePlannerStore.getState();
    store.reset();
    store.setTopic(investigation.designMissionTitle);
    store.loadPreset(preset);
    store.setSelectedClassId(selectedClassId);
    store.setWorldFlightDesignMissionContext({ investigationId });
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

  const sidebarTitle = sidebarMode === 'destinations'
    ? 'Choose the next city lesson.'
    : sidebarMode === 'passport'
      ? 'The class journey so far.'
      : 'Complete flight missions.';
  const sidebarDescription = sidebarMode === 'destinations'
    ? 'Pick a city, choose a source, and build a full lesson around it.'
    : sidebarMode === 'passport'
      ? 'Revisit flights, collect city stamps, and share what the class has accomplished.'
      : 'Collect field notes from completed city lessons to unlock each mission.';
  const sidebarModeLabel = sidebarMode === 'destinations' ? 'Destinations' : sidebarMode === 'passport' ? 'Passport' : 'Missions';

  return (
    <div className="relative -m-6 min-h-[calc(100dvh-0px)] overflow-hidden bg-[var(--wf-bg)] lg:-m-8">
      <div className="absolute inset-0">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--wf-bg)]">
            <div className="w-72 border border-cyan-200/20 bg-[var(--wf-surface)] p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3 text-cyan-100">
                <PlaneTakeoff className="h-5 w-5" aria-hidden />
                <span className="font-instrument text-[11px] font-semibold uppercase tracking-[0.18em]">World Flight</span>
              </div>
              <div className="mt-5 h-px overflow-hidden bg-white/10">
                <div className="wf-loading-route h-full w-full bg-cyan-300" />
              </div>
              <p className="mt-3 text-sm text-lc-text2">Preparing the class route map...</p>
            </div>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.30)_0%,transparent_38%,transparent_62%,rgba(7,17,31,0.32)_100%)]" />
      </div>

      <div className="pointer-events-none relative z-10 flex h-[100dvh] min-h-[640px] gap-4 p-4 sm:p-6 lg:gap-5 lg:p-8">
        {!listOpen && (
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="pointer-events-auto flex h-fit items-center gap-2 self-start rounded-md border border-cyan-200/30 bg-[var(--wf-surface)] px-4 py-3 text-sm font-semibold text-lc-text shadow-2xl shadow-black/45 transition-colors hover:border-cyan-200/55 hover:bg-[var(--wf-surface-raised)]"
          >
            <PanelLeftOpen className="h-4 w-4 text-cyan-300/80" aria-hidden />
            {sidebarModeLabel}
          </button>
        )}
        {listOpen && (
        <section className="pointer-events-auto flex w-[min(380px,calc(100vw-2rem))] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/25 bg-[var(--wf-surface)] shadow-2xl shadow-black/50 max-sm:absolute max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:h-[70dvh] max-sm:w-auto">
          <div className="border-b border-white/15 bg-[var(--wf-surface-raised)] px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-instrument flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                <Globe2 className="h-4 w-4" aria-hidden />
                World Flight
              </div>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                aria-label={`Collapse ${sidebarModeLabel.toLowerCase()}`}
                title="Collapse"
                className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md border border-cyan-200/25 bg-[var(--wf-inset)] text-cyan-100 shadow-sm transition-colors hover:border-cyan-200/55 hover:bg-[var(--wf-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              >
                <PanelLeftClose className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <h1 className="font-display mt-3 text-2xl leading-tight text-lc-text">{sidebarTitle}</h1>
            <p className="mt-2 text-sm leading-relaxed text-lc-text2">{sidebarDescription}</p>
          </div>

          <div className="space-y-3 border-b border-white/15 bg-[var(--wf-inset)] px-5 py-4">
            <div>
              <label htmlFor="world-flight-class" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-lc-text2">
                Class journey
              </label>
              {initialClasses.length > 0 ? (
                <div className="relative">
                  <select
                    id="world-flight-class"
                    value={selectedClassId ?? ''}
                    onChange={(event) => selectClass(event.target.value)}
                    className="min-h-10 w-full appearance-none rounded-md border border-white/15 bg-[var(--wf-surface)] px-3 pr-10 text-sm font-semibold text-lc-text outline-none transition-colors hover:border-cyan-200/30 focus:border-cyan-300/55"
                  >
                    {initialClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/75" aria-hidden />
                </div>
              ) : (
                <p className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-lc-text3">
                  Create a class in the planner to begin its journey.
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-white/15 bg-[var(--wf-surface)] p-1">
              <SidebarModeButton active={sidebarMode === 'destinations'} icon={<MapIcon className="h-3.5 w-3.5" />} label="Destinations" onClick={() => setSidebarMode('destinations')} />
              <SidebarModeButton active={sidebarMode === 'passport'} icon={<Stamp className="h-3.5 w-3.5" />} label="Passport" onClick={() => setSidebarMode('passport')} />
              <SidebarModeButton active={sidebarMode === 'missions'} icon={<Radar className="h-3.5 w-3.5" />} label="Missions" onClick={() => setSidebarMode('missions')} />
            </div>
            {sidebarMode === 'destinations' && (
              <>
              <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-lc-text2">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {origin ? 'Origin' : 'Departure'}
                </div>
                <p className="mt-1 text-sm font-semibold text-lc-text">{routeOrigin?.city ?? 'Choose a city'}</p>
                <p className="text-xs text-lc-text3">{routeOrigin?.primaryAirport ?? 'Required before first flight'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-lc-text2">
                  <Gauge className="h-3.5 w-3.5" aria-hidden />
                  Range
                </div>
                <p className="mt-1 text-sm font-semibold text-lc-text">{routeOrigin ? formatDistance(rangeKm) : 'Set after departure'}</p>
                <p className="text-xs text-lc-text3">{selectedClass ? planeName : 'Select a class later'}</p>
              </div>
            </div>
              </>
            )}
          </div>

          {sidebarMode === 'passport' && (
            <JourneyProgressPanel
              classId={selectedClassId}
              className={selectedClass?.name ?? 'Class journey'}
              currentDestinationId={selectedClass?.currentDestinationId ?? null}
              visitedDestinationIds={visitedDestinationIds}
              completedLegs={selectedClass?.completedLegs ?? []}
              planeName={planeName}
              rangeKm={rangeKm}
              investigations={selectedClass?.investigations ?? []}
              onSelectDestination={selectDestination}
            />
          )}

          {sidebarMode === 'missions' && (
            <InvestigationProgressPanel
              investigations={selectedClass?.investigations ?? []}
              onLaunchDesignMission={launchDesignMission}
            />
          )}

          {sidebarMode === 'destinations' && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="sticky top-0 z-10 -mx-1 mb-4 bg-[var(--wf-surface)] px-1 pb-2">
              <label htmlFor="world-flight-destination-search" className="sr-only">Search destinations</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/60" aria-hidden />
                <input
                  id="world-flight-destination-search"
                  type="search"
                  value={destinationQuery}
                  onChange={(event) => setDestinationQuery(event.target.value)}
                  placeholder="Search city, country, or airport"
                  className="min-h-10 w-full rounded-md border border-white/15 bg-[var(--wf-inset)] pl-9 pr-3 text-sm text-lc-text outline-none placeholder:text-lc-text3 focus:border-cyan-300/50"
                />
              </div>
            </div>
            <div className="space-y-5">
              {destinationGroups.map((group) => (
                <section key={group.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="font-instrument truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-lc-text2">{group.label}</h2>
                    <span className="shrink-0 text-[11px] text-lc-text3">{group.destinations.length}</span>
                  </div>
                  <div className="space-y-2">
              {group.destinations.map((destination) => {
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
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-lc-blue bg-lc-blue/10'
                        : 'border-white/10 bg-white/[0.025] hover:border-cyan-300/35 hover:bg-white/[0.055]'
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
                </section>
              ))}
              {destinationGroups.length === 0 && (
                <p className="py-6 text-center text-sm text-lc-text2">No destinations match “{destinationQuery}”.</p>
              )}
            </div>
          </div>}
        </section>
        )}

        {sidebarMode === 'destinations' && !detailsOpen && (
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="pointer-events-auto ml-auto flex h-fit items-center gap-2 rounded-md border border-cyan-200/30 bg-[var(--wf-surface)] px-4 py-3 text-sm font-semibold text-lc-text shadow-2xl shadow-black/45 transition-colors hover:border-cyan-200/55 hover:bg-[var(--wf-surface-raised)]"
          >
            <PanelRightOpen className="h-4 w-4 text-cyan-100/80" aria-hidden />
            City details
          </button>
        )}

        {sidebarMode === 'destinations' && detailsOpen && (
        <aside className="pointer-events-auto absolute bottom-4 right-4 top-4 ml-auto flex w-[min(440px,calc(100vw-2rem))] shrink-0 flex-col overflow-hidden rounded-lg border border-white/15 bg-[var(--wf-surface)] shadow-2xl shadow-black/50 max-sm:left-4 max-sm:top-auto max-sm:h-[70dvh] max-sm:w-auto xl:static">
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            aria-label="Collapse city details"
            title="Collapse city details"
            className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-white/30 bg-black/65 text-white shadow-md transition-colors hover:border-cyan-100/70 hover:bg-black/85"
          >
            <PanelRightClose className="h-5 w-5" aria-hidden />
          </button>
          <ImagePanel image={selectedDestination.heroImage} className="h-28 rounded-t-xl" />
          <div className="border-b border-white/10 px-5 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/75">
                  {isChoosingDeparture ? 'Begin journey in' : isLocalLesson ? 'Exploring locally' : 'Arriving in'}
                </p>
                <h2 className="font-display mt-1 text-3xl leading-tight text-lc-text">{selectedDestination.city}</h2>
                <p className="mt-1 text-sm text-lc-text3">
                  {selectedDestination.country} &middot; {selectedDestination.region}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                isChoosingDeparture || isReachable
                  ? 'border-lc-success/35 bg-lc-success/10 text-lc-success'
                  : 'border-white/20 bg-white/[0.04] text-lc-text2'
              }`}>
                {isChoosingDeparture ? 'Starting city' : isLocalLesson ? 'Local lesson' : isReachable ? 'In range' : 'Beyond range'}
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
                <span className="mt-0.5 block text-[11px] text-lc-text3">
                  {nextHopCandidates.length} cities are within {formatDistance(rangeKm)} of {selectedDestination.city}
                </span>
              </span>
            </button>
            {previewNextHops && routeOrigin && (
              <p className="mt-2 text-[11px] leading-relaxed text-cyan-100/70">
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
                          ? 'bg-lc-blue text-[var(--wf-bg)]'
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
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lc-blue px-4 text-sm font-bold text-[var(--wf-bg)] transition-colors hover:bg-lc-blue-hover"
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
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {selectedFocus.kind === 'reading' && (
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.07] px-2 py-1 text-[11px] font-semibold text-cyan-100/80">
                      Adapts to class level
                    </span>
                  )}
                  {selectedFocus.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] text-lc-text2">
                      {skill}
                    </span>
                  ))}
                </div>
                {selectedFocus.kind === 'reading' && selectedFocus.citations?.length ? (
                  <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-lc-text2">
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
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lc-blue px-4 text-sm font-bold text-[var(--wf-bg)] transition-colors hover:bg-lc-blue-hover"
                >
                  <PlaneTakeoff className="h-4 w-4" aria-hidden />
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
        )}
        <MapLegend mode={sidebarMode} previewNextHops={previewNextHops} />
      </div>
    </div>
  );
}
