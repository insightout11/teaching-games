'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker as MapLibreMarker, type Popup as MapLibrePopup } from 'maplibre-gl';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronLeft, Clock3, Compass, ExternalLink, Gauge, Globe2, Info, Loader2, Lock, Map as MapIcon, MapPin, Minus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plane, PlaneTakeoff, Play, Plus, Radar, RotateCcw, Route, ScanSearch, Search, Stamp, Star, Trophy, X } from 'lucide-react';
import { WORLD_DESTINATIONS, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';
import type { DestinationFocus, DestinationFocusKind, DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, destinationsWithinRange, distanceKm, formatDistance, greatCircleLine, rangeRing, type WorldFeature, type WorldFeatureCollection } from '@/lib/world-flight/geo';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';
import { inferSourceGenre, bestPresetForGenre } from '@/lib/preset-fit';
import { buildTravelContext } from '@/lib/world-flight/travel-context';
import { usePlannerStore } from '@/stores/planner-store';
import { recommendNextDestinationId, type WorldFlightClassSummary } from '@/lib/world-flight/journey';
import { getPlaneAsset, getPlaneRangeKm, getPlaneTier, PLANE_TIERS, type PlaneEntry } from '@/lib/plane-progression';
import { getWorldFlightUpgradeState } from '@/lib/world-flight/progression';
import {
  deriveWorldFlightExpeditionProgress,
  getWorldFlightExpedition,
  recommendWorldFlightExpeditionRoute,
  WORLD_FLIGHT_EXPEDITIONS,
  type WorldFlightExpeditionDefinition,
  type WorldFlightExpeditionRunSummary,
} from '@/lib/world-flight/expeditions';
import { ExpeditionPanel } from './expedition-panel';
import { InvestigationProgressPanel } from './investigation-progress-panel';
import { JourneyProgressPanel } from './journey-progress-panel';
import { PassportArrivalReplay } from './passport-arrival-replay';

type FocusFilter = 'all' | DestinationFocusKind;
type SidebarMode = 'destinations' | 'expeditions' | 'passport' | 'missions' | 'hangar';
type DestinationGroup = { id: string; label: string; destinations: DestinationPack[] };
type WorldFlightClassStatePatch = Partial<Pick<
  WorldFlightClassSummary,
  'currentDestinationId' | 'planeTier' | 'planeKey' | 'planeSelectionRequired' | 'rangeKm' | 'flightHours' | 'crewStars'
>>;
type WorldFlightUpgradeResponse = {
  state?: {
    classId: string;
    currentDestinationId: string | null;
    planeTier: number;
    planeKey: string;
    planeSelectionRequired: boolean;
    rangeKm: number;
    flightHours: number;
    crewStars: number;
  };
  error?: string;
};
type WorldFlightPlaneResponse = WorldFlightUpgradeResponse;
type RangeUpgradeNotice = {
  tier: number;
  fromRangeKm: number;
  toRangeKm: number;
  newlyReachableDestinationIds: string[];
  newlyReachableCityNames: string[];
};
type AircraftVotePhase = 'idle' | 'voting' | 'revealed';

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
  passportHighlightDestinationId: string | null = null,
  expeditionDestinationIds: Iterable<string> = [],
  completedExpeditionDestinationIds: Iterable<string> = [],
  expeditionRecommendedDestinationId: string | null = null,
  newlyReachableDestinationIds: Iterable<string> = [],
) {
  const visited = new Set(visitedDestinationIds);
  const missionEvidence = new Set(missionEvidenceDestinationIds);
  const orderedExpeditionDestinations = Array.from(expeditionDestinationIds);
  const expeditionDestinations = new Set(orderedExpeditionDestinations);
  const expeditionOrder = new Map(orderedExpeditionDestinations.map((destinationId, index) => [destinationId, index + 1]));
  const completedExpeditionDestinations = new Set(completedExpeditionDestinationIds);
  const newlyReachableDestinations = new Set(newlyReachableDestinationIds);
  return asFeatureCollection(
    WORLD_DESTINATIONS.map((destination) => {
      const km = origin ? distanceKm(origin, destination) : 0;
      const previewKm = previewOrigin ? distanceKm(previewOrigin, destination) : 0;
      const reachable = showReachability && (!origin || km <= rangeKm || destination.id === origin.id);
      const isOrigin = destination.id === origin?.id;
      const isVisited = showVisited && visited.has(destination.id);
      const isMissionEvidence = missionEvidence.has(destination.id);
      const isExpeditionStop = expeditionDestinations.has(destination.id);
      const isNewlyReachable = newlyReachableDestinations.has(destination.id);
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
          expeditionStop: isExpeditionStop,
          expeditionComplete: completedExpeditionDestinations.has(destination.id),
          expeditionRecommended: destination.id === expeditionRecommendedDestinationId,
          expeditionOrder: expeditionOrder.get(destination.id) ?? 0,
          newlyReachable: isNewlyReachable,
          onwardReachable,
          isPreviewOrigin: destination.id === previewOrigin?.id,
          muted: !showReachability && !isVisited && !isMissionEvidence,
          passportHighlight: destination.id === passportHighlightDestinationId,
          status: isOrigin
            ? 'Current location'
            : isMissionEvidence
              ? 'Mission field note'
              : isExpeditionStop
                ? 'Expedition stop'
              : isNewlyReachable
                ? 'Newly reachable'
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

function journeyRouteFeatures(completedLegs: WorldFlightClassSummary['completedLegs'], activeLegId: string | null) {
  return asFeatureCollection(completedLegs.flatMap((leg, index) => {
    const origin = WORLD_DESTINATIONS.find((destination) => destination.id === leg.originDestinationId);
    const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === leg.destinationId);
    if (!origin || !destination) return [];
    return [{
      ...greatCircleLine(origin, destination),
      properties: {
        legId: leg.id,
        routeNumber: index + 1,
        originCity: origin.city,
        destinationCity: destination.city,
        focusTitle: leg.focusTitle ?? 'Completed city lesson',
        distanceKm: Math.round(leg.distanceKm),
        completedAt: leg.completedAt ?? '',
        active: leg.id === activeLegId,
      },
    }];
  }));
}

function journeyStepFeatures(completedLegs: WorldFlightClassSummary['completedLegs'], activeLegId: string | null) {
  return asFeatureCollection(completedLegs.flatMap((leg, index) => {
    const origin = WORLD_DESTINATIONS.find((candidate) => candidate.id === leg.originDestinationId);
    const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === leg.destinationId);
    if (!destination) return [];
    const routeCoordinates = origin ? greatCircleLine(origin, destination).geometry.coordinates : [];
    const markerCoordinates = routeCoordinates[Math.floor(routeCoordinates.length / 2)] ?? destinationCoord(destination);
    return [{
      type: 'Feature',
      properties: {
        legId: leg.id,
        routeNumber: index + 1,
        active: leg.id === activeLegId,
        originCity: origin?.city ?? 'Journey origin',
        destinationCity: destination.city,
        focusTitle: leg.focusTitle ?? 'Completed city lesson',
        distanceKm: Math.round(leg.distanceKm),
        completedAt: leg.completedAt ?? '',
      },
      geometry: {
        type: 'Point',
        coordinates: markerCoordinates,
      },
    } satisfies WorldFeature];
  }));
}

function expeditionRouteFeatures(expedition: WorldFlightExpeditionDefinition | null) {
  if (!expedition) return EMPTY_FEATURE_COLLECTION;
  const stops = expedition.stops
    .map((stop) => WORLD_DESTINATIONS.find((destination) => destination.id === stop.destinationId) ?? null)
    .filter((destination): destination is DestinationPack => Boolean(destination));

  return asFeatureCollection(stops.slice(1).map((destination, index) => {
    const origin = stops[index];
    return {
      ...greatCircleLine(origin, destination),
      properties: {
        routeNumber: index + 1,
        originCity: origin.city,
        destinationCity: destination.city,
        suggestedOrder: expedition.suggestedOrder,
      },
    };
  }));
}

function fitMapToExpedition(map: MapLibreMap, expedition: WorldFlightExpeditionDefinition, listOpen: boolean, isCompact: boolean) {
  const stops = expedition.stops
    .map((stop) => WORLD_DESTINATIONS.find((destination) => destination.id === stop.destinationId) ?? null)
    .filter((destination): destination is DestinationPack => Boolean(destination));
  if (stops.length === 0) return;
  if (stops.length === 1) {
    map.easeTo({ center: destinationCoord(stops[0]), zoom: 3.2, duration: 700 });
    return;
  }

  const longitudes = stops
    .map((destination) => ((destination.lng % 360) + 360) % 360)
    .sort((a, b) => a - b);
  let largestGap = -1;
  let routeStart = longitudes[0];
  for (let index = 0; index < longitudes.length; index += 1) {
    const current = longitudes[index];
    const next = index === longitudes.length - 1 ? longitudes[0] + 360 : longitudes[index + 1];
    if (next - current > largestGap) {
      largestGap = next - current;
      routeStart = next % 360;
    }
  }
  const unwrappedLongitudes = longitudes.map((longitude) => longitude < routeStart ? longitude + 360 : longitude);
  const latitudes = stops.map((destination) => destination.lat);

  map.fitBounds(
    [
      [Math.min(...unwrappedLongitudes), Math.min(...latitudes)],
      [Math.max(...unwrappedLongitudes), Math.max(...latitudes)],
    ],
    {
      padding: {
        left: listOpen && !isCompact ? 420 : 96,
        right: 96,
        top: 110,
        bottom: 110,
      },
      maxZoom: 3.4,
      duration: 850,
    },
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

function MapLegend({
  mode,
  previewNextHops,
  activeExpedition,
  expeditionRecommended,
  rangeUpgradeActive,
}: {
  mode: SidebarMode;
  previewNextHops: boolean;
  activeExpedition: boolean;
  expeditionRecommended: boolean;
  rangeUpgradeActive: boolean;
}) {
  const items = mode === 'missions'
    ? [
      ['bg-violet-400 ring-2 ring-violet-100/60', 'Mission field note'],
      ['bg-lc-text3', 'Other city'],
    ]
    : mode === 'expeditions'
      ? [
        ['bg-rose-100 ring-2 ring-rose-300/80', 'Expedition stop'],
        ['bg-lc-blue ring-2 ring-cyan-100/50', 'Already visited'],
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
        ...(rangeUpgradeActive ? [['bg-lc-amber ring-2 ring-lc-amber/50', 'Newly reachable']] : []),
        ['bg-[#8395B1] ring-1 ring-[#B6C6DA]/70', 'Beyond range'],
        ...(activeExpedition ? [['bg-transparent ring-2 ring-rose-300', 'Expedition stop']] : []),
        ...(expeditionRecommended ? [['bg-rose-200 ring-2 ring-rose-100/70', 'Expedition next hop']] : []),
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

function RangeUpgradeNoticeCard({
  notice,
  onClose,
}: {
  notice: RangeUpgradeNotice;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="pointer-events-auto absolute bottom-20 left-4 right-4 overflow-hidden rounded-xl border border-lc-amber/45 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.18),transparent_34%),var(--wf-surface)] p-4 shadow-2xl shadow-black/45 md:bottom-16 md:left-1/2 md:right-auto md:w-[min(560px,calc(100vw-3rem))] md:-translate-x-1/2"
      initial={{ opacity: 0, y: 26, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 210, damping: 20 }}
    >
      <CloudRevealLayer />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <motion.span
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-lc-amber/45 bg-lc-amber/15 text-lc-amber shadow-[0_0_30px_rgba(245,158,11,0.18)]"
            initial={{ rotate: -12, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 260, damping: 15 }}
          >
            <Gauge className="h-5 w-5" aria-hidden />
          </motion.span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lc-amber/80">Range expanded</p>
            <h2 className="font-display mt-1 text-xl leading-tight text-lc-text">
              Tier {notice.tier}: {formatDistance(notice.fromRangeKm)} to {formatDistance(notice.toRangeKm)}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-lc-text2">
              {notice.newlyReachableCityNames.length > 0
                ? `Newly reachable: ${notice.newlyReachableCityNames.join(', ')}${notice.newlyReachableDestinationIds.length > notice.newlyReachableCityNames.length ? ', and more' : ''}.`
                : 'The class has more routing flexibility from its current city.'}
            </p>
            {notice.newlyReachableCityNames.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {notice.newlyReachableCityNames.slice(0, 4).map((city) => (
                  <span key={city} className="rounded-full border border-cyan-200/25 bg-cyan-300/[0.08] px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
                    {city}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss range upgrade notice"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-lc-text2 transition-colors hover:border-white/30 hover:text-lc-text"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}

function CloudRevealLayer({ className = '' }: { className?: string }) {
  const clouds: Array<{ top: string; left?: string; right?: string; width: number; delay: number; x: number }> = [
    { top: '10%', left: '-12%', width: 180, delay: 0.05, x: -46 },
    { top: '34%', left: '-8%', width: 130, delay: 0.18, x: -34 },
    { top: '14%', right: '-14%', width: 190, delay: 0.1, x: 48 },
    { top: '48%', right: '-10%', width: 150, delay: 0.24, x: 38 },
  ];

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.16),transparent_34%)]" />
      {clouds.map((cloud, index) => (
        <motion.span
          key={`${cloud.top}-${index}`}
          className="absolute h-12 rounded-full bg-white/18 blur-xl"
          style={{
            top: cloud.top,
            left: cloud.left,
            right: cloud.right,
            width: cloud.width,
          }}
          initial={{ opacity: 0.65, x: 0, scale: 1 }}
          animate={{ opacity: 0.12, x: cloud.x, scale: 1.18 }}
          transition={{ duration: 1.25, delay: cloud.delay, ease: 'easeOut' }}
        />
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

function createRouteHoverContent(properties: Record<string, unknown>) {
  const container = document.createElement('div');
  container.className = 'wf-map-popup';

  const heading = document.createElement('strong');
  heading.textContent = `Flight ${properties.routeNumber}: ${properties.originCity} to ${properties.destinationCity}`;
  container.appendChild(heading);

  const lesson = document.createElement('span');
  lesson.textContent = String(properties.focusTitle ?? 'Completed city lesson');
  container.appendChild(lesson);

  const detail = document.createElement('span');
  const completedAt = typeof properties.completedAt === 'string' && properties.completedAt
    ? new Date(properties.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Completed flight';
  detail.textContent = `${formatDistance(Number(properties.distanceKm) || 0)} - ${completedAt}`;
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
      className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-sm px-1 text-[10px] font-semibold uppercase tracking-[0.04em] transition-colors ${
        active
          ? 'bg-cyan-300/15 text-cyan-50 shadow-sm'
          : 'text-lc-text2 hover:bg-white/[0.06] hover:text-lc-text'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function CrewProgressSummaryCard({
  planeTier,
  planeName,
  rangeKm,
  flightHours,
  crewStars,
  selectionRequired,
  actionStatus,
  onClaimUpgrade,
  onOpenPassport,
  onOpenHangar,
}: {
  planeTier: number;
  planeName: string;
  rangeKm: number;
  flightHours: number;
  crewStars: number;
  selectionRequired: boolean;
  actionStatus: 'idle' | 'working' | 'error';
  onClaimUpgrade: () => void;
  onOpenPassport: () => void;
  onOpenHangar: () => void;
}) {
  const upgradeState = getWorldFlightUpgradeState({ planeTier, rangeKm, flightHours, crewStars });
  const claimable = upgradeState.claimableTier !== null && !selectionRequired;
  const pendingTier = getPlaneTier(planeTier);
  const targetRangeKm = upgradeState.claimableRangeKm ?? upgradeState.nextRangeTier?.rangeKm ?? upgradeState.currentRangeKm;
  const nextMilestone = upgradeState.nextMilestone;
  const targetMilestone = selectionRequired ? upgradeState.latestUnlockedMilestone : nextMilestone;
  const hourTarget = targetMilestone?.requiredFlightHours ?? Math.max(flightHours, 1);
  const starTarget = targetMilestone?.requiredCrewStars ?? Math.max(crewStars, 1);
  const hourProgress = Math.min(100, Math.round((flightHours / Math.max(hourTarget, 1)) * 100));
  const starProgress = Math.min(100, Math.round((crewStars / Math.max(starTarget, 1)) * 100));

  return (
    <div className={`rounded-lg border p-3 ${
      claimable || selectionRequired
        ? 'border-lc-amber/35 bg-lc-amber/[0.075]'
        : 'border-cyan-200/18 bg-cyan-300/[0.055]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
            <Plane className="h-3.5 w-3.5" aria-hidden />
            Crew progress
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-lc-text">
            {selectionRequired
              ? `Tier ${planeTier} aircraft ready`
              : claimable
              ? `Tier ${upgradeState.claimableTier} range ready`
              : upgradeState.fullyUpgraded
                ? 'Maximum range active'
                : `${formatDistance(upgradeState.currentRangeKm)} range`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenHangar}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.04] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2 transition-colors hover:border-cyan-200/35 hover:text-lc-text"
          >
            <Plane className="h-3.5 w-3.5" aria-hidden />
            Hangar
          </button>
          <button
            type="button"
            onClick={onOpenPassport}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.04] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2 transition-colors hover:border-cyan-200/35 hover:text-lc-text"
          >
            <Stamp className="h-3.5 w-3.5" aria-hidden />
            Passport
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <CrewProgressMeter icon={<Clock3 className="h-3.5 w-3.5" />} label="Flight Hours" value={flightHours} target={hourTarget} percent={hourProgress} />
        <CrewProgressMeter icon={<Star className="h-3.5 w-3.5" />} label="Crew Stars" value={crewStars} target={starTarget} percent={starProgress} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-lc-text3">
        Hours come from completed city lessons. Stars come from strong class participation. Claimed tiers still need an aircraft choice in Hangar.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[var(--wf-surface)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-lc-text3">Range</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-lc-text">
            {selectionRequired
              ? `Choose for ${formatDistance(pendingTier.rangeKm)}`
              : `${formatDistance(upgradeState.currentRangeKm)}${targetRangeKm > upgradeState.currentRangeKm ? ` -> ${formatDistance(targetRangeKm)}` : ''}`}
          </p>
        </div>
        {selectionRequired ? (
          <button
            type="button"
            onClick={onOpenHangar}
            className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-lc-amber/35 bg-lc-amber/15 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-lc-amber transition-colors hover:bg-lc-amber/22"
          >
            <Plane className="h-3.5 w-3.5" aria-hidden />
            Choose
          </button>
        ) : claimable ? (
          <button
            type="button"
            onClick={onClaimUpgrade}
            disabled={actionStatus === 'working'}
            className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-lc-amber/35 bg-lc-amber/15 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-lc-amber transition-colors hover:bg-lc-amber/22 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionStatus === 'working'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              : <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
            Claim
          </button>
        ) : (
          <span className="shrink-0 text-right text-[10px] font-medium leading-snug text-lc-text3">
            {upgradeState.fullyUpgraded
              ? planeName
              : `${upgradeState.needsFlightHours}h + ${upgradeState.needsCrewStars} stars needed`}
          </span>
        )}
      </div>
      {actionStatus === 'error' && (
        <p className="mt-2 text-xs font-medium text-red-300">Could not claim the upgrade. Refresh and try again.</p>
      )}
    </div>
  );
}

function CrewProgressMeter({
  icon,
  label,
  value,
  target,
  percent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-lc-text">{value}/{target}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function HangarProgressMeter({
  label,
  value,
  target,
  percent,
}: {
  label: string;
  value: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-lc-text3">{label}</span>
        <span className="shrink-0 text-xs font-bold text-cyan-100">{value}/{target}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lc-amber"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function UpgradeRulesPanel({
  selectionRequired,
}: {
  selectionRequired: boolean;
}) {
  const rules = [
    ['Flight Hours', '+1 for each completed World Flight lesson.'],
    ['Crew Stars', 'Earned when the class participates and lands strong.'],
    ['Plane Tier', 'Claimed when both hour and star targets are met.'],
    ['Range', 'Activates after the class chooses an aircraft.'],
  ];

  return (
    <div className={`rounded-lg border px-3 py-3 ${
      selectionRequired
        ? 'border-lc-amber/25 bg-lc-amber/[0.06]'
        : 'border-white/10 bg-white/[0.03]'
    }`}>
      <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/70">
        How upgrades work
      </p>
      <div className="mt-3 grid gap-2">
        {rules.map(([label, description]) => (
          <div key={label} className="grid grid-cols-[86px_1fr] gap-2 text-xs leading-snug">
            <span className="font-semibold text-lc-text2">{label}</span>
            <span className="text-lc-text3">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AircraftVoteCeremony({
  planes,
  rangeKm,
  selectionRequired,
  currentPlaneKey,
  actionStatus,
  onEquipPlane,
}: {
  planes: PlaneEntry[];
  rangeKm: number;
  selectionRequired: boolean;
  currentPlaneKey: string;
  actionStatus: 'idle' | 'working' | 'error';
  onEquipPlane: (planeKey: string) => void;
}) {
  const planeKeys = useMemo(() => planes.map((plane) => plane.key).join('|'), [planes]);
  const initialVotes = useMemo(
    () => Object.fromEntries(planes.map((plane) => [plane.key, 0])),
    [planes],
  );
  const [phase, setPhase] = useState<AircraftVotePhase>('idle');
  const [votesByPlaneKey, setVotesByPlaneKey] = useState<Record<string, number>>(initialVotes);

  useEffect(() => {
    setPhase('idle');
    setVotesByPlaneKey(initialVotes);
  }, [initialVotes, planeKeys, selectionRequired]);

  if (planes.length <= 1) return null;

  const voteTotal = planes.reduce((total, plane) => total + (votesByPlaneKey[plane.key] ?? 0), 0);
  const topVoteCount = Math.max(0, ...planes.map((plane) => votesByPlaneKey[plane.key] ?? 0));
  const topPlanes = topVoteCount > 0
    ? planes.filter((plane) => (votesByPlaneKey[plane.key] ?? 0) === topVoteCount)
    : [];
  const winner = topPlanes.length === 1 ? topPlanes[0] : null;
  const voteOpen = phase === 'voting';
  const revealed = phase === 'revealed';

  function adjustVote(planeKey: string, delta: number) {
    setVotesByPlaneKey((current) => ({
      ...current,
      [planeKey]: Math.max(0, (current[planeKey] ?? 0) + delta),
    }));
  }

  function resetVote() {
    setPhase('voting');
    setVotesByPlaneKey(initialVotes);
  }

  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.055] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-instrument flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Aircraft vote
          </p>
          <h3 className="mt-1 text-sm font-semibold text-lc-text">
            {revealed && winner
              ? `${winner.name} wins`
              : revealed && topPlanes.length > 1
                ? 'Runoff needed'
                : selectionRequired
                  ? 'Let the class choose the new plane'
                  : 'Run a class vote anytime'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-lc-text3">
            Tally a quick show-of-hands vote, reveal the result, then equip the winning aircraft.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-lc-text2">
          {voteTotal} votes
        </span>
      </div>

      {phase === 'idle' ? (
        <button
          type="button"
          onClick={() => setPhase('voting')}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/35 bg-cyan-300/12 px-3 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-300/18"
        >
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          Start class vote
        </button>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {planes.map((plane) => (
              <AircraftVoteOptionCard
                key={plane.key}
                plane={plane}
                rangeKm={rangeKm}
                votes={votesByPlaneKey[plane.key] ?? 0}
                totalVotes={voteTotal}
                current={plane.key === currentPlaneKey}
                leading={topPlanes.some((candidate) => candidate.key === plane.key)}
                disabled={!voteOpen || actionStatus === 'working'}
                onAddVote={() => adjustVote(plane.key, 1)}
                onRemoveVote={() => adjustVote(plane.key, -1)}
              />
            ))}
          </div>

          <AnimatePresence>
            {revealed && (
              <AircraftVoteRevealPanel
                winner={winner}
                topPlanes={topPlanes}
                rangeKm={rangeKm}
              />
            )}
          </AnimatePresence>

          <div className="mt-3 flex flex-wrap gap-2">
            {voteOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => setPhase('revealed')}
                  disabled={voteTotal === 0}
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-lc-amber/35 bg-lc-amber/15 px-3 text-[11px] font-semibold uppercase tracking-wide text-lc-amber transition-colors hover:bg-lc-amber/22 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trophy className="h-3.5 w-3.5" aria-hidden />
                  Reveal winner
                </button>
                <button
                  type="button"
                  onClick={resetVote}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 text-[11px] font-semibold uppercase tracking-wide text-lc-text2 transition-colors hover:border-cyan-200/35 hover:text-lc-text"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Reset
                </button>
              </>
            ) : (
              <>
                {winner ? (
                  <button
                    type="button"
                    onClick={() => onEquipPlane(winner.key)}
                    disabled={actionStatus === 'working'}
                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-lc-success/35 bg-lc-success/15 px-3 text-[11px] font-semibold uppercase tracking-wide text-lc-success transition-colors hover:bg-lc-success/22 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionStatus === 'working'
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      : <Plane className="h-3.5 w-3.5" aria-hidden />}
                    Equip winner
                  </button>
                ) : (
                  topPlanes.map((plane) => (
                    <button
                      key={plane.key}
                      type="button"
                      onClick={() => onEquipPlane(plane.key)}
                      disabled={actionStatus === 'working'}
                      className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-lc-amber/35 bg-lc-amber/15 px-3 text-[11px] font-semibold uppercase tracking-wide text-lc-amber transition-colors hover:bg-lc-amber/22 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plane className="h-3.5 w-3.5" aria-hidden />
                      Equip {plane.name}
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={resetVote}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 text-[11px] font-semibold uppercase tracking-wide text-lc-text2 transition-colors hover:border-cyan-200/35 hover:text-lc-text"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Vote again
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AircraftVoteRevealPanel({
  winner,
  topPlanes,
  rangeKm,
}: {
  winner: PlaneEntry | null;
  topPlanes: PlaneEntry[];
  rangeKm: number;
}) {
  const title = winner ? `${winner.name} wins` : 'Runoff needed';
  const detail = winner
    ? `${formatDistance(rangeKm)} range is ready for the class.`
    : `Top aircraft: ${topPlanes.map((plane) => plane.name).join(', ')}`;
  const displayPlane = winner ?? topPlanes[0] ?? null;

  return (
    <motion.div
      className="relative mt-3 overflow-hidden rounded-lg border border-lc-amber/35 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.20),transparent_38%),rgba(245,158,11,0.075)] p-3"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 230, damping: 19 }}
    >
      <CloudRevealLayer />
      <div className="relative flex items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-white/12 bg-[var(--wf-inset)] p-2">
          {displayPlane && (
            <motion.img
              src={displayPlane.webp}
              alt=""
              draggable={false}
              className="max-h-full max-w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]"
              initial={{ x: -24, opacity: 0, scale: 0.88 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 220, damping: 17 }}
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-instrument text-[10px] font-semibold uppercase tracking-[0.16em] text-lc-amber">Class choice revealed</p>
          <h4 className="mt-1 truncate text-sm font-bold text-lc-text">{title}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-lc-text2">{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function AircraftVoteOptionCard({
  plane,
  rangeKm,
  votes,
  totalVotes,
  current,
  leading,
  disabled,
  onAddVote,
  onRemoveVote,
}: {
  plane: PlaneEntry;
  rangeKm: number;
  votes: number;
  totalVotes: number;
  current: boolean;
  leading: boolean;
  disabled: boolean;
  onAddVote: () => void;
  onRemoveVote: () => void;
}) {
  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  return (
    <div className={`rounded-md border px-3 py-2.5 ${
      leading && totalVotes > 0
        ? 'border-lc-amber/35 bg-lc-amber/[0.08]'
        : 'border-white/10 bg-white/[0.035]'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-sm bg-[var(--wf-inset)] p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plane.webp} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-lc-text">{plane.name}</p>
            {current && <span className="shrink-0 rounded-full bg-cyan-300/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-100/80">Current</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-lc-text3">{formatDistance(rangeKm)} range</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-lc-amber"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRemoveVote}
            disabled={disabled || votes === 0}
            aria-label={`Remove vote from ${plane.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-lc-text2 transition-colors hover:text-lc-text disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <span className="w-7 text-center text-sm font-bold text-lc-text">{votes}</span>
          <button
            type="button"
            onClick={onAddVote}
            disabled={disabled}
            aria-label={`Add vote to ${plane.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 transition-colors hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function HangarPanel({
  currentPlaneKey,
  unlockedTier,
  rangeKm,
  flightHours,
  crewStars,
  selectionRequired,
  actionStatus,
  onEquipPlane,
}: {
  currentPlaneKey: string;
  unlockedTier: number;
  rangeKm: number;
  flightHours: number;
  crewStars: number;
  selectionRequired: boolean;
  actionStatus: 'idle' | 'working' | 'error';
  onEquipPlane: (planeKey: string) => void;
}) {
  const currentPlane = getPlaneAsset(currentPlaneKey);
  const currentTier = getPlaneTier(unlockedTier);
  const currentPlaneInTier = currentTier.choices.some((plane) => plane.key === currentPlane.key);
  const lockedTiers = PLANE_TIERS.filter((tier) => tier.tier > currentTier.tier);
  const upgradeState = getWorldFlightUpgradeState({ planeTier: unlockedTier, rangeKm, flightHours, crewStars });
  const targetMilestone = selectionRequired
    ? upgradeState.latestUnlockedMilestone
    : upgradeState.nextMilestone;
  const hourTarget = targetMilestone?.requiredFlightHours ?? Math.max(flightHours, 1);
  const starTarget = targetMilestone?.requiredCrewStars ?? Math.max(crewStars, 1);
  const hourProgress = Math.min(100, Math.round((flightHours / Math.max(hourTarget, 1)) * 100));
  const starProgress = Math.min(100, Math.round((crewStars / Math.max(starTarget, 1)) * 100));
  const rangeTargetKm = selectionRequired
    ? currentTier.rangeKm
    : upgradeState.nextRangeTier?.rangeKm ?? upgradeState.currentRangeKm;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <motion.div
        className={`relative overflow-hidden rounded-xl border p-4 ${
        selectionRequired
          ? 'border-lc-amber/40 bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,0.18),transparent_34%),rgba(245,158,11,0.075)]'
          : 'border-cyan-300/22 bg-[radial-gradient(circle_at_18%_0%,rgba(103,232,249,0.13),transparent_35%),rgba(103,232,249,0.045)]'
      }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {selectionRequired && <CloudRevealLayer />}
        <div className="relative flex items-start gap-4">
          <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[var(--wf-inset)] p-2 shadow-inner shadow-black/25">
            <motion.img
              src={currentPlane.front3qWebp ?? currentPlane.webp}
              alt=""
              draggable={false}
              className="max-h-full max-w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.38)]"
              animate={selectionRequired ? { y: [0, -3, 0] } : { y: 0 }}
              transition={selectionRequired ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
              Class aircraft
            </p>
            <h2 className="font-display mt-1 text-2xl leading-tight text-lc-text">{currentPlane.name}</h2>
            <p className="mt-1 text-xs text-lc-text3">
              {currentPlaneInTier ? currentTier.label : 'Previous aircraft'} · {formatDistance(getPlaneRangeKm(currentPlane.key))}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <HangarProgressMeter label="Flight hours" value={flightHours} target={hourTarget} percent={hourProgress} />
              <HangarProgressMeter label="Crew stars" value={crewStars} target={starTarget} percent={starProgress} />
            </div>
          </div>
        </div>
        <div className="relative mt-4 rounded-lg border border-white/10 bg-[var(--wf-surface)]/75 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-lc-text3">Range status</p>
              <p className="mt-0.5 text-sm font-semibold text-lc-text">
                {selectionRequired
                  ? `${formatDistance(rangeKm)} to ${formatDistance(currentTier.rangeKm)} after aircraft choice`
                  : upgradeState.fullyUpgraded
                    ? `${formatDistance(rangeKm)} - top range`
                    : `${formatDistance(rangeKm)} now - ${formatDistance(rangeTargetKm)} next`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              selectionRequired
                ? 'border-lc-amber/35 bg-lc-amber/15 text-lc-amber'
                : 'border-cyan-200/25 bg-cyan-300/10 text-cyan-100'
            }`}>
              {selectionRequired ? 'Choose plane' : `Tier ${currentTier.tier}`}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-lc-text2">
            {selectionRequired
              ? `Tier ${currentTier.tier} is unlocked. The class must choose one aircraft below before the next moving flight.`
              : upgradeState.fullyUpgraded
                ? 'The class has reached the current top range tier.'
                : `Next upgrade needs ${upgradeState.needsFlightHours} more flight hour${upgradeState.needsFlightHours === 1 ? '' : 's'} and ${upgradeState.needsCrewStars} more crew star${upgradeState.needsCrewStars === 1 ? '' : 's'}.`}
          </p>
        </div>
      </motion.div>

      <div className="mt-4 space-y-3">
        <AircraftVoteCeremony
          planes={currentTier.choices}
          rangeKm={currentTier.rangeKm}
          selectionRequired={selectionRequired}
          currentPlaneKey={currentPlane.key}
          actionStatus={actionStatus}
          onEquipPlane={onEquipPlane}
        />
        <UpgradeRulesPanel selectionRequired={selectionRequired} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-instrument text-[11px] font-semibold uppercase tracking-[0.14em] text-lc-text2">
            Aircraft details
          </h3>
          <span className="text-[11px] font-semibold text-cyan-100/70">{formatDistance(currentTier.rangeKm)}</span>
        </div>
        <div className="space-y-2">
          {currentTier.choices.map((plane) => (
            <PlaneChoiceCard
              key={plane.key}
              plane={plane}
              rangeKm={currentTier.rangeKm}
              equipped={plane.key === currentPlane.key && !selectionRequired}
              pending={plane.key === currentPlane.key && selectionRequired}
              disabled={actionStatus === 'working' || (plane.key === currentPlane.key && !selectionRequired)}
              actionStatus={actionStatus}
              actionLabel={selectionRequired ? 'Equip' : 'Switch'}
              onChoose={() => onEquipPlane(plane.key)}
            />
          ))}
        </div>
        {actionStatus === 'error' && (
          <p className="mt-3 rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200">
            Could not equip that aircraft. Refresh and try again.
          </p>
        )}
      </div>

      {lockedTiers.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-instrument text-[11px] font-semibold uppercase tracking-[0.14em] text-lc-text2">Future aircraft</h3>
          {lockedTiers.map((tier) => (
            <div key={tier.tier} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-lc-text3" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-lc-text2">{tier.label}</span>
                  <span className="block truncate text-[11px] text-lc-text3">
                    {tier.choices.map((plane) => plane.name).join(', ')}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-lc-text3">{formatDistance(tier.rangeKm)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaneChoiceCard({
  plane,
  rangeKm,
  equipped,
  pending,
  disabled,
  actionStatus,
  actionLabel,
  onChoose,
}: {
  plane: PlaneEntry;
  rangeKm: number;
  equipped: boolean;
  pending: boolean;
  disabled: boolean;
  actionStatus: 'idle' | 'working' | 'error';
  actionLabel: string;
  onChoose: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      equipped
        ? 'border-lc-success/35 bg-lc-success/[0.08]'
        : pending
          ? 'border-lc-amber/35 bg-lc-amber/[0.08]'
          : 'border-white/10 bg-white/[0.035]'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[var(--wf-inset)] p-2">
          <motion.img
            src={plane.webp}
            alt=""
            draggable={false}
            className="max-h-full max-w-full object-contain"
            initial={equipped || pending ? { x: -12, opacity: 0.75 } : false}
            animate={equipped || pending ? { x: 0, opacity: 1, scale: 1.04 } : { x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-lc-text">{plane.name}</p>
          <p className="mt-0.5 text-xs text-lc-text3">{formatDistance(rangeKm)} range</p>
          {pending && <p className="mt-0.5 text-[11px] font-medium text-lc-amber">Current plane until the class chooses.</p>}
        </div>
        <button
          type="button"
          onClick={onChoose}
          disabled={disabled}
          className={`inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
            equipped
              ? 'border-lc-success/30 bg-lc-success/10 text-lc-success disabled:opacity-85'
              : 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/18 disabled:opacity-60'
          }`}
        >
          {actionStatus === 'working'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            : equipped
              ? <Check className="h-3.5 w-3.5" aria-hidden />
              : <Plane className="h-3.5 w-3.5" aria-hidden />}
          {equipped ? 'Equipped' : actionStatus === 'working' ? 'Equipping' : actionLabel}
        </button>
      </div>
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
  const sidebarModeRef = useRef<SidebarMode>('destinations');
  const selectedClassRef = useRef<WorldFlightClassSummary | null>(null);
  const pendingExpeditionFocusIdRef = useRef<string | null>(null);
  const routeAnimationRef = useRef<number | null>(null);
  const rangeAnimationRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState(() => initialDestinationId(initialClasses));
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  // World-Flight-eligible flight plans (grows as Debate/Travel are authored).
  const [selectedPresetId, setSelectedPresetId] = useState<string>('all-around-flight-60');
  const [launchStep, setLaunchStep] = useState<'source' | 'flight-plan'>('source');
  const [selectedSituation, setSelectedSituation] = useState<string>('');
  const worldFlightPresets = ['all-around-flight-60', 'speak-60', 'travel-60', 'debate-60']
    .map((id) => FLIGHT_PLAN_PRESETS.find((p) => p.id === id))
    .filter((p): p is FlightPlanPreset => Boolean(p));
  const travelSituations = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'travel-60')?.scenarios?.options ?? [];
  const selectedPreset = worldFlightPresets.find((p) => p.id === selectedPresetId) ?? worldFlightPresets[0];
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
  const [selectedPassportLegId, setSelectedPassportLegId] = useState<string | null>(null);
  const [hoveredPassportLegId, setHoveredPassportLegId] = useState<string | null>(null);
  const [selectedPassportDestinationId, setSelectedPassportDestinationId] = useState<string | null>(null);
  const [replayDestinationId, setReplayDestinationId] = useState<string | null>(null);
  const [previewExpeditionId, setPreviewExpeditionId] = useState(
    () => initialClasses[0]?.expeditionRuns.find((run) => run.status === 'active' || run.status === 'paused')?.expeditionId
      ?? WORLD_FLIGHT_EXPEDITIONS[0].id,
  );
  const [expeditionActionStatus, setExpeditionActionStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [upgradeActionStatus, setUpgradeActionStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [planeActionStatus, setPlaneActionStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [classStatePatches, setClassStatePatches] = useState<Record<string, WorldFlightClassStatePatch>>({});
  const [rangeUpgradeNotice, setRangeUpgradeNotice] = useState<RangeUpgradeNotice | null>(null);
  const [expeditionRunsByClass, setExpeditionRunsByClass] = useState<Record<string, WorldFlightExpeditionRunSummary[]>>(
    () => Object.fromEntries(initialClasses.map((cls) => [cls.id, cls.expeditionRuns])),
  );

  const baseSelectedClass = initialClasses.find((cls) => cls.id === selectedClassId) ?? null;
  const selectedClass = useMemo(
    () => baseSelectedClass
      ? { ...baseSelectedClass, ...(classStatePatches[baseSelectedClass.id] ?? {}) }
      : null,
    [baseSelectedClass, classStatePatches],
  );
  const selectedExpeditionRuns = selectedClassId ? expeditionRunsByClass[selectedClassId] ?? [] : [];
  const currentExpeditionRun = selectedExpeditionRuns.find((run) => run.status === 'active' || run.status === 'paused') ?? null;
  const currentExpedition = currentExpeditionRun ? getWorldFlightExpedition(currentExpeditionRun.expeditionId) : null;
  const currentExpeditionProgress = useMemo(
    () => currentExpedition
      ? deriveWorldFlightExpeditionProgress(currentExpedition, currentExpeditionRun?.visitedDestinationIds ?? [])
      : null,
    [currentExpedition, currentExpeditionRun?.visitedDestinationIds],
  );
  const previewExpedition = getWorldFlightExpedition(previewExpeditionId) ?? WORLD_FLIGHT_EXPEDITIONS[0];
  const previewExpeditionRun = selectedExpeditionRuns.find((run) => run.expeditionId === previewExpedition.id && run.status !== 'left') ?? null;
  const previewExpeditionProgress = useMemo(
    () => deriveWorldFlightExpeditionProgress(previewExpedition, previewExpeditionRun?.visitedDestinationIds ?? []),
    [previewExpedition, previewExpeditionRun?.visitedDestinationIds],
  );
  const activeExpeditionDestinationIds = currentExpeditionRun?.status === 'active'
    ? currentExpedition?.stops.map((stop) => stop.destinationId) ?? EMPTY_DESTINATION_IDS
    : EMPTY_DESTINATION_IDS;
  const completedExpeditionDestinationIds = currentExpeditionRun?.status === 'active'
    ? currentExpeditionRun.visitedDestinationIds
    : EMPTY_DESTINATION_IDS;
  const activePassportLegId = hoveredPassportLegId ?? selectedPassportLegId;
  const activePassportLeg = selectedClass?.completedLegs.find((leg) => leg.id === activePassportLegId) ?? null;
  const passportHighlightDestinationId = hoveredPassportLegId
    ? activePassportLeg?.destinationId ?? selectedPassportDestinationId
    : selectedPassportDestinationId ?? activePassportLeg?.destinationId ?? null;
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
  const planeSelectionRequired = selectedClass?.planeSelectionRequired ?? false;
  const newlyReachableDestinationIds = rangeUpgradeNotice?.newlyReachableDestinationIds ?? EMPTY_DESTINATION_IDS;
  const expeditionRouteGuidance = useMemo(
    () => currentExpeditionRun?.status === 'active' && currentExpedition
      ? recommendWorldFlightExpeditionRoute(
        currentExpedition,
        currentExpeditionRun.visitedDestinationIds,
        routeOrigin?.id ?? null,
        rangeKm,
      )
      : null,
    [currentExpedition, currentExpeditionRun, rangeKm, routeOrigin?.id],
  );
  const currentExpeditionNextDestination = expeditionRouteGuidance
    ? WORLD_DESTINATIONS.find((destination) => destination.id === expeditionRouteGuidance.nextDestinationId) ?? null
    : null;
  const currentExpeditionTargetDestination = expeditionRouteGuidance
    ? WORLD_DESTINATIONS.find((destination) => destination.id === expeditionRouteGuidance.targetDestinationId) ?? null
    : null;
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
  // Best-fit flight plan for the chosen focus, derived from its inferred genre.
  // Drives the "Recommended" marker; degrades gracefully (Captain's) for plain sources.
  const recommendedPresetId = selectedFocus
    ? bestPresetForGenre(
        inferSourceGenre({ skills: selectedFocus.skills, lessonGoal: selectedFocus.lessonGoal, title: selectedFocus.title, subtitle: selectedFocus.subtitle }),
        worldFlightPresets.map((p) => p.id),
      )
    : null;
  const recommendedPreset = worldFlightPresets.find((p) => p.id === recommendedPresetId) ?? null;
  // Reset to the source step whenever the city changes.
  useEffect(() => { setLaunchStep('source'); }, [selectedDestination?.id]);
  // Pick content → pre-select the recommended flight plan (teacher can override in step 2).
  useEffect(() => {
    if (recommendedPresetId) setSelectedPresetId(recommendedPresetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFocusId]);
  const isReachable = !!routeOrigin && ((selectedDistanceKm ?? 0) <= rangeKm || selectedDestination.id === routeOrigin.id);
  const isLocalLesson = routeOrigin?.id === selectedDestination.id;
  const movingFlightBlockedByPlaneChoice = planeSelectionRequired && isReachable && !isLocalLesson;
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
    setSelectedFocusId(pendingExpeditionFocusIdRef.current);
    pendingExpeditionFocusIdRef.current = null;
    setFocusFilter('all');
  }, [selectedDestinationId]);

  useEffect(() => {
    sidebarModeRef.current = sidebarMode;
  }, [sidebarMode]);

  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  useEffect(() => {
    if (sidebarMode !== 'passport') return;
    const latestLeg = selectedClass?.completedLegs[selectedClass.completedLegs.length - 1] ?? null;
    if (!selectedPassportLegId || !selectedClass?.completedLegs.some((leg) => leg.id === selectedPassportLegId)) {
      const focusDestinationId = latestLeg?.destinationId ?? selectedClass?.currentDestinationId ?? null;
      setSelectedPassportLegId(latestLeg?.id ?? null);
      setSelectedPassportDestinationId(focusDestinationId);
      if (focusDestinationId) setSelectedDestinationId(focusDestinationId);
    }
  }, [selectedClass, selectedPassportLegId, sidebarMode]);

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

  function selectExpeditionDestination(destinationId: string, focusId?: string) {
    pendingExpeditionFocusIdRef.current = focusId ?? null;
    setSelectedDestinationId(destinationId);
    setFocusFilter('all');
    setSidebarMode('destinations');
    if (!isWide) setListOpen(false);
    setDetailsOpen(true);
  }

  function previewExpeditionRoute(expeditionId: string) {
    setPreviewExpeditionId(expeditionId);
    setSidebarMode('expeditions');
    setPreviewNextHops(false);
    setDetailsOpen(false);
  }

  async function handleExpeditionAction(
    action: 'activate' | 'pause' | 'resume' | 'leave',
    expeditionId: string,
    runId?: string,
  ) {
    if (!selectedClassId) {
      setExpeditionActionStatus('error');
      return;
    }
    setExpeditionActionStatus('working');
    try {
      const response = await fetch('/api/world-flight/expeditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, action, expeditionId, runId }),
      });
      const result = await response.json() as { run?: WorldFlightExpeditionRunSummary; error?: string };
      if (!response.ok || !result.run) throw new Error(result.error ?? 'Failed to update expedition');

      setExpeditionRunsByClass((current) => {
        const existing = current[selectedClassId] ?? [];
        const returnedRun = result.run!;
        const priorRun = existing.find((run) => run.id === returnedRun.id);
        const nextRun = action === 'activate'
          ? returnedRun
          : { ...priorRun, ...returnedRun, visitedDestinationIds: priorRun?.visitedDestinationIds ?? returnedRun.visitedDestinationIds };
        const nextRuns = existing
          .map((run) => (
            action === 'activate' && (run.status === 'active' || run.status === 'paused')
              ? { ...run, status: 'left' as const, leftAt: returnedRun.activatedAt }
              : run
          ))
          .filter((run) => run.id !== nextRun.id);
        return { ...current, [selectedClassId]: [nextRun, ...nextRuns] };
      });
      setExpeditionActionStatus('idle');
    } catch {
      setExpeditionActionStatus('error');
    }
  }

  async function claimRangeUpgrade() {
    if (!selectedClassId) {
      setUpgradeActionStatus('error');
      return;
    }

    const classId = selectedClassId;
    setUpgradeActionStatus('working');
    setRangeUpgradeNotice(null);
    try {
      const response = await fetch('/api/world-flight/upgrades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      const result = await response.json() as WorldFlightUpgradeResponse;
      if (!response.ok || !result.state) throw new Error(result.error ?? 'Failed to claim upgrade');

      setClassStatePatches((current) => ({
        ...current,
        [classId]: {
          ...(current[classId] ?? {}),
          currentDestinationId: result.state!.currentDestinationId,
          planeTier: result.state!.planeTier,
          planeKey: result.state!.planeKey,
          planeSelectionRequired: result.state!.planeSelectionRequired,
          rangeKm: result.state!.rangeKm,
          flightHours: result.state!.flightHours,
          crewStars: result.state!.crewStars,
        },
      }));
      setSidebarMode('hangar');
      setPreviewNextHops(false);
      setDetailsOpen(false);
      setListOpen(true);
      setUpgradeActionStatus('idle');
    } catch {
      setUpgradeActionStatus('error');
    }
  }

  async function equipPlane(planeKey: string) {
    if (!selectedClassId) {
      setPlaneActionStatus('error');
      return;
    }

    const classId = selectedClassId;
    const priorOrigin = origin;
    const fromRangeKm = selectedClass?.rangeKm ?? STARTER_PLANE_RANGE_KM;
    setPlaneActionStatus('working');
    try {
      const response = await fetch('/api/world-flight/planes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, planeKey }),
      });
      const result = await response.json() as WorldFlightPlaneResponse;
      if (!response.ok || !result.state) throw new Error(result.error ?? 'Failed to equip aircraft');
      const newlyReachable = priorOrigin
        ? WORLD_DESTINATIONS
            .filter((destination) => (
              destination.id !== priorOrigin.id
              && distanceKm(priorOrigin, destination) > fromRangeKm
              && distanceKm(priorOrigin, destination) <= result.state!.rangeKm
              && !visitedDestinationSet.has(destination.id)
            ))
            .sort((a, b) => distanceKm(priorOrigin, a) - distanceKm(priorOrigin, b))
        : [];

      setClassStatePatches((current) => ({
        ...current,
        [classId]: {
          ...(current[classId] ?? {}),
          currentDestinationId: result.state!.currentDestinationId,
          planeTier: result.state!.planeTier,
          planeKey: result.state!.planeKey,
          planeSelectionRequired: result.state!.planeSelectionRequired,
          rangeKm: result.state!.rangeKm,
          flightHours: result.state!.flightHours,
          crewStars: result.state!.crewStars,
        },
      }));
      if (result.state.rangeKm > fromRangeKm) {
        setRangeUpgradeNotice({
          tier: result.state.planeTier,
          fromRangeKm,
          toRangeKm: result.state.rangeKm,
          newlyReachableDestinationIds: newlyReachable.map((destination) => destination.id),
          newlyReachableCityNames: newlyReachable.slice(0, 5).map((destination) => destination.city),
        });
      } else {
        setRangeUpgradeNotice(null);
      }
      setSidebarMode('destinations');
      setPreviewNextHops(false);
      setDetailsOpen(false);
      setListOpen(true);
      if (newlyReachable[0]) setSelectedDestinationId(newlyReachable[0].id);
      setPlaneActionStatus('idle');
    } catch {
      setPlaneActionStatus('error');
    }
  }

  function inspectPassportLeg(legId: string) {
    const leg = selectedClass?.completedLegs.find((candidate) => candidate.id === legId);
    if (!leg) return;
    setSelectedPassportLegId(leg.id);
    setSelectedPassportDestinationId(leg.destinationId);
    setSelectedDestinationId(leg.destinationId);
  }

  function inspectPassportDestination(destinationId: string) {
    const relatedLeg = [...(selectedClass?.completedLegs ?? [])]
      .reverse()
      .find((leg) => leg.destinationId === destinationId || leg.originDestinationId === destinationId);
    setSelectedPassportDestinationId(destinationId);
    setSelectedPassportLegId(relatedLeg?.id ?? null);
    setSelectedDestinationId(destinationId);
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
    setSelectedPassportLegId(null);
    setHoveredPassportLegId(null);
    setSelectedPassportDestinationId(null);
    setPreviewExpeditionId(
      nextClass?.expeditionRuns.find((run) => run.status === 'active' || run.status === 'paused')?.expeditionId
        ?? WORLD_FLIGHT_EXPEDITIONS[0].id,
    );
    setExpeditionActionStatus('idle');
    setUpgradeActionStatus('idle');
    setPlaneActionStatus('idle');
    setRangeUpgradeNotice(null);
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
      map.addSource('world-flight-expedition-routes', {
        type: 'geojson',
        data: toMapData(EMPTY_FEATURE_COLLECTION),
      });
      map.addSource('world-flight-journey-steps', {
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
          'line-opacity': ['case', ['get', 'active'], 0.06, 0.1],
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
          'line-opacity': ['case', ['get', 'active'], 0.2, 0.62],
        },
      });
      map.addLayer({
        id: 'world-flight-journey-routes-selected-glow',
        type: 'line',
        source: 'world-flight-journey-routes',
        filter: ['==', 'active', true],
        paint: {
          'line-color': '#F59E0B',
          'line-width': 9,
          'line-opacity': 0.2,
          'line-blur': 5,
        },
      });
      map.addLayer({
        id: 'world-flight-journey-routes-selected',
        type: 'line',
        source: 'world-flight-journey-routes',
        filter: ['==', 'active', true],
        paint: {
          'line-color': '#F8D28B',
          'line-width': 3.25,
          'line-opacity': 0.96,
        },
      });
      map.addLayer({
        id: 'world-flight-journey-route-arrows',
        type: 'symbol',
        source: 'world-flight-journey-routes',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '>',
          'text-font': ['Noto Sans Bold'],
          'text-size': 18,
          'text-rotate': 0,
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': ['case', ['get', 'active'], '#F8D28B', '#BDEBFF'],
          'text-halo-color': '#071522',
          'text-halo-width': 1.5,
          'text-opacity': ['case', ['get', 'active'], 1, 0.78],
        },
      });
      map.addLayer({
        id: 'world-flight-journey-routes-hitbox',
        type: 'line',
        source: 'world-flight-journey-routes',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 16,
          'line-opacity': 0,
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-routes-glow',
        type: 'line',
        source: 'world-flight-expedition-routes',
        paint: {
          'line-color': '#FDA4AF',
          'line-width': 9,
          'line-opacity': 0.13,
          'line-blur': 5,
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-routes-line',
        type: 'line',
        source: 'world-flight-expedition-routes',
        paint: {
          'line-color': '#FFE4E6',
          'line-width': 2.5,
          'line-opacity': ['case', ['get', 'suggestedOrder'], 0.9, 0.68],
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-route-arrows',
        type: 'symbol',
        source: 'world-flight-expedition-routes',
        filter: ['==', 'suggestedOrder', true],
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '>',
          'text-font': ['Noto Sans Bold'],
          'text-size': 17,
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#FFE4E6',
          'text-halo-color': '#071522',
          'text-halo-width': 1.5,
          'text-opacity': 0.92,
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
        id: 'world-flight-passport-city-highlight',
        type: 'circle',
        source: 'world-flight-cities',
        filter: ['==', 'passportHighlight', true],
        paint: {
          'circle-radius': 13,
          'circle-color': '#F59E0B',
          'circle-opacity': 0.12,
          'circle-stroke-color': '#F8D28B',
          'circle-stroke-width': 2.5,
          'circle-stroke-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-recommended',
        type: 'circle',
        source: 'world-flight-cities',
        filter: ['==', 'expeditionRecommended', true],
        paint: {
          'circle-radius': 16,
          'circle-color': '#FDA4AF',
          'circle-opacity': 0.12,
          'circle-stroke-color': '#FFE4E6',
          'circle-stroke-width': 2.5,
          'circle-stroke-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-stops',
        type: 'circle',
        source: 'world-flight-cities',
        filter: ['==', 'expeditionStop', true],
        paint: {
          'circle-radius': 12,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': ['case', ['get', 'expeditionComplete'], '#86EFAC', '#FDA4AF'],
          'circle-stroke-width': 2.5,
          'circle-stroke-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'world-flight-city-dots',
        type: 'circle',
        source: 'world-flight-cities',
        paint: {
          'circle-radius': ['case', ['get', 'isOrigin'], 8, ['get', 'isPreviewOrigin'], 8, ['get', 'newlyReachable'], 8, ['get', 'missionEvidence'], 7, ['get', 'onwardReachable'], 6.5, ['get', 'visited'], 7, ['get', 'reachable'], 6, ['get', 'muted'], 4.5, 5.25],
          'circle-color': ['case', ['get', 'isOrigin'], '#F59E0B', ['get', 'isPreviewOrigin'], '#22D3EE', ['get', 'newlyReachable'], '#F8D28B', ['get', 'missionEvidence'], '#A78BFA', ['get', 'onwardReachable'], '#67E8F9', ['get', 'visited'], '#4DA3FF', ['get', 'reachable'], '#2FE59B', ['get', 'muted'], '#6F7F9C', '#8395B1'],
          'circle-stroke-color': ['case', ['get', 'isPreviewOrigin'], '#ECFEFF', ['get', 'newlyReachable'], '#FFF7D6', ['get', 'missionEvidence'], '#EDE9FE', ['get', 'onwardReachable'], '#CFFAFE', ['get', 'visited'], '#BDE3FF', ['get', 'reachable'], '#07111f', ['get', 'muted'], '#07111f', '#B6C6DA'],
          'circle-stroke-width': ['case', ['get', 'isPreviewOrigin'], 3, ['get', 'newlyReachable'], 3, ['get', 'missionEvidence'], 3, ['get', 'onwardReachable'], 2.5, ['get', 'visited'], 2.5, ['get', 'reachable'], 2, ['get', 'muted'], 2, 1.25],
          'circle-opacity': ['case', ['get', 'isOrigin'], 1, ['get', 'isPreviewOrigin'], 1, ['get', 'newlyReachable'], 1, ['get', 'missionEvidence'], 1, ['get', 'onwardReachable'], 1, ['get', 'visited'], 1, ['get', 'reachable'], 0.95, ['get', 'muted'], 0.55, 0.82],
        },
      });
      map.addLayer({
        id: 'world-flight-expedition-stop-labels',
        type: 'symbol',
        source: 'world-flight-cities',
        filter: ['>', 'expeditionOrder', 0],
        layout: {
          'text-field': ['to-string', ['get', 'expeditionOrder']],
          'text-font': ['Noto Sans Bold'],
          'text-size': 9,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#071522',
          'text-halo-color': '#FFE4E6',
          'text-halo-width': 0.5,
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
      map.addLayer({
        id: 'world-flight-journey-step-dots',
        type: 'circle',
        source: 'world-flight-journey-steps',
        paint: {
          'circle-radius': ['case', ['get', 'active'], 10, 8],
          'circle-color': ['case', ['get', 'active'], '#F59E0B', '#12304A'],
          'circle-stroke-color': ['case', ['get', 'active'], '#F8D28B', '#9EDFFF'],
          'circle-stroke-width': ['case', ['get', 'active'], 2.5, 2],
          'circle-opacity': 0.98,
        },
      });
      map.addLayer({
        id: 'world-flight-journey-step-labels',
        type: 'symbol',
        source: 'world-flight-journey-steps',
        layout: {
          'text-field': ['to-string', ['get', 'routeNumber']],
          'text-font': ['Noto Sans Bold'],
          'text-size': 10,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#F7FBFF',
        },
      });

      const handleCityMapClick = (event: maplibregl.MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        setSelectedDestinationId(id);
        if (sidebarModeRef.current === 'passport') {
          const relatedLeg = [...(selectedClassRef.current?.completedLegs ?? [])]
            .reverse()
            .find((leg) => leg.destinationId === id || leg.originDestinationId === id);
          setSelectedPassportDestinationId(id);
          setSelectedPassportLegId(relatedLeg?.id ?? null);
        } else {
          setSidebarMode('destinations');
        }
      };
      map.on('click', 'world-flight-city-dots', handleCityMapClick);
      map.on('click', 'world-flight-city-labels', handleCityMapClick);
      map.on('click', 'world-flight-visited-checks', handleCityMapClick);
      map.on('click', 'world-flight-journey-step-dots', (event) => {
        const legId = event.features?.[0]?.properties?.legId as string | undefined;
        const leg = selectedClassRef.current?.completedLegs.find((candidate) => candidate.id === legId);
        if (!leg) return;
        setSelectedPassportLegId(leg.id);
        setSelectedPassportDestinationId(leg.destinationId);
        setSelectedDestinationId(leg.destinationId);
      });
      map.on('click', 'world-flight-journey-step-labels', (event) => {
        const legId = event.features?.[0]?.properties?.legId as string | undefined;
        const leg = selectedClassRef.current?.completedLegs.find((candidate) => candidate.id === legId);
        if (!leg) return;
        setSelectedPassportLegId(leg.id);
        setSelectedPassportDestinationId(leg.destinationId);
        setSelectedDestinationId(leg.destinationId);
      });
      map.on('click', 'world-flight-journey-routes-hitbox', (event) => {
        const legId = event.features?.[0]?.properties?.legId as string | undefined;
        const leg = selectedClassRef.current?.completedLegs.find((candidate) => candidate.id === legId);
        if (!leg) return;
        setSelectedPassportLegId(leg.id);
        setSelectedPassportDestinationId(leg.destinationId);
        setSelectedDestinationId(leg.destinationId);
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
      const showRoutePopup = (event: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const properties = event.features?.[0]?.properties as Record<string, unknown> | undefined;
        if (!properties) return;
        const legId = properties.legId as string | undefined;
        if (legId) setHoveredPassportLegId(legId);
        const popup = hoverPopupRef.current ?? new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: 'wf-map-popup-shell',
        });
        hoverPopupRef.current = popup;
        popup.setLngLat(event.lngLat).setDOMContent(createRouteHoverContent(properties)).addTo(map);
      };
      const hideRoutePopup = () => {
        map.getCanvas().style.cursor = '';
        setHoveredPassportLegId(null);
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
      map.on('mouseenter', 'world-flight-journey-routes-hitbox', showRoutePopup);
      map.on('mousemove', 'world-flight-journey-routes-hitbox', showRoutePopup);
      map.on('mouseleave', 'world-flight-journey-routes-hitbox', hideRoutePopup);
      map.on('mouseenter', 'world-flight-journey-step-dots', showRoutePopup);
      map.on('mousemove', 'world-flight-journey-step-dots', showRoutePopup);
      map.on('mouseleave', 'world-flight-journey-step-dots', hideRoutePopup);
      map.on('mouseenter', 'world-flight-journey-step-labels', showRoutePopup);
      map.on('mousemove', 'world-flight-journey-step-labels', showRoutePopup);
      map.on('mouseleave', 'world-flight-journey-step-labels', hideRoutePopup);

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
      sidebarMode === 'passport' ? journeyRouteFeatures(selectedClass?.completedLegs ?? [], activePassportLegId) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-journey-steps', map)?.setData(toMapData(
      sidebarMode === 'passport' ? journeyStepFeatures(selectedClass?.completedLegs ?? [], activePassportLegId) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-expedition-routes', map)?.setData(toMapData(
      sidebarMode === 'expeditions' ? expeditionRouteFeatures(previewExpedition) : EMPTY_FEATURE_COLLECTION,
    ));
    getSource('world-flight-cities', map)?.setData(toMapData(
      destinationFeatures(
        sidebarMode === 'missions' || sidebarMode === 'expeditions' ? null : routeOrigin,
        rangeKm,
        visitedDestinationIds,
        sidebarMode === 'destinations' && previewNextHops ? selectedDestination : null,
        sidebarMode === 'destinations',
        sidebarMode === 'missions' ? missionEvidenceDestinationIds : EMPTY_DESTINATION_IDS,
        sidebarMode !== 'missions',
        sidebarMode === 'passport' ? passportHighlightDestinationId : null,
        sidebarMode === 'expeditions'
          ? previewExpedition.stops.map((stop) => stop.destinationId)
          : sidebarMode === 'destinations' ? activeExpeditionDestinationIds : EMPTY_DESTINATION_IDS,
        sidebarMode === 'expeditions'
          ? previewExpeditionProgress.completedDestinationIds
          : sidebarMode === 'destinations' ? completedExpeditionDestinationIds : EMPTY_DESTINATION_IDS,
        sidebarMode === 'destinations' ? expeditionRouteGuidance?.nextDestinationId ?? null : null,
        sidebarMode === 'destinations' ? newlyReachableDestinationIds : EMPTY_DESTINATION_IDS,
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
  }, [activeExpeditionDestinationIds, activePassportLegId, completedExpeditionDestinationIds, expeditionRouteGuidance?.nextDestinationId, mapReady, missionEvidenceDestinationIds, newlyReachableDestinationIds, passportHighlightDestinationId, previewExpedition, previewExpeditionProgress.completedDestinationIds, previewNextHops, rangeKm, routeOrigin, selectedClass?.completedLegs, selectedDestination, sidebarMode, visitedDestinationIds]);

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
    if (sidebarMode !== 'expeditions') {
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
    }
  }, [detailsOpen, isCompact, listOpen, mapReady, routeOrigin, selectedDestination, sidebarMode]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || sidebarMode !== 'expeditions') return;
    fitMapToExpedition(mapRef.current, previewExpedition, listOpen, isCompact);
  }, [isCompact, listOpen, mapReady, previewExpedition, sidebarMode]);

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
    if (movingFlightBlockedByPlaneChoice) {
      setSidebarMode('hangar');
      setDetailsOpen(false);
      setListOpen(true);
      return;
    }

    const preset = FLIGHT_PLAN_PRESETS.find((p) => p.id === selectedPresetId);
    const store = usePlannerStore.getState();
    store.reset();
    // Travel generates its own functional scenario from the city + situation (ignores the focus);
    // every other preset runs on the chosen focus/source.
    if (selectedPresetId === 'travel-60') {
      const situation = selectedSituation || travelSituations[0] || 'A travel situation';
      store.setTopic(situation);
      store.setSourceMaterial(buildTravelContext(selectedDestination, situation));
    } else {
      store.setTopic(selectedFocus.title);
      store.setSourceMaterial(selectedFocus.sourceMaterial);
    }
    store.setDifficulty(selectedFocus.difficulty);
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
    : sidebarMode === 'expeditions'
      ? 'Choose a class expedition.'
    : sidebarMode === 'hangar'
      ? 'Choose the class aircraft.'
    : sidebarMode === 'passport'
      ? 'The class journey so far.'
      : 'Complete flight missions.';
  const sidebarDescription = sidebarMode === 'destinations'
    ? 'Pick a city, choose a source, and build a full lesson around it.'
    : sidebarMode === 'expeditions'
      ? 'Preview ready-made routes on the map, then guide the class through a shared question.'
    : sidebarMode === 'hangar'
      ? 'Pick from the unlocked aircraft tier before the class flies again.'
    : sidebarMode === 'passport'
      ? 'Revisit flights, collect city stamps, and share what the class has accomplished.'
      : 'Collect field notes from completed city lessons to unlock each mission.';
  const sidebarModeLabel = sidebarMode === 'destinations'
    ? 'Destinations'
    : sidebarMode === 'expeditions'
      ? 'Expeditions'
    : sidebarMode === 'hangar'
      ? 'Hangar'
      : sidebarMode === 'passport' ? 'Passport' : 'Missions';

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
            {selectedClass && sidebarMode !== 'passport' && (
              <CrewProgressSummaryCard
                planeTier={selectedClass.planeTier ?? 0}
                planeName={planeName}
                rangeKm={rangeKm}
                flightHours={selectedClass.flightHours ?? 0}
                crewStars={selectedClass.crewStars ?? 0}
                selectionRequired={planeSelectionRequired}
                actionStatus={upgradeActionStatus}
                onClaimUpgrade={claimRangeUpgrade}
                onOpenPassport={() => setSidebarMode('passport')}
                onOpenHangar={() => setSidebarMode('hangar')}
              />
            )}
            <div className="grid grid-cols-3 gap-1 rounded-md border border-white/15 bg-[var(--wf-surface)] p-1">
              <SidebarModeButton active={sidebarMode === 'destinations'} icon={<MapIcon className="h-3.5 w-3.5" />} label="Cities" onClick={() => setSidebarMode('destinations')} />
              <SidebarModeButton active={sidebarMode === 'expeditions'} icon={<Compass className="h-3.5 w-3.5" />} label="Routes" onClick={() => setSidebarMode('expeditions')} />
              <SidebarModeButton active={sidebarMode === 'missions'} icon={<Radar className="h-3.5 w-3.5" />} label="Missions" onClick={() => setSidebarMode('missions')} />
            </div>
            {sidebarMode !== 'expeditions' && currentExpeditionRun && currentExpedition && currentExpeditionProgress && (
              <button
                type="button"
                onClick={() => previewExpeditionRoute(currentExpedition.id)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-rose-200/25 bg-rose-300/[0.055] px-3 py-2.5 text-left transition-colors hover:border-rose-200/45 hover:bg-rose-300/[0.09]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Compass className="h-4 w-4 shrink-0 text-rose-200/85" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-rose-100/70">
                      {currentExpeditionRun.status === 'paused' ? 'Paused expedition' : 'Current expedition'}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-lc-text">{currentExpedition.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-lc-text3">
                      {currentExpeditionRun.status === 'paused'
                        ? 'Open to resume or review the route'
                        : currentExpeditionNextDestination
                          ? expeditionRouteGuidance?.direct
                            ? `Next stop: ${currentExpeditionNextDestination.city}`
                            : `Next flight: ${currentExpeditionNextDestination.city} toward ${currentExpeditionTargetDestination?.city ?? 'an Expedition stop'}`
                          : 'Open route guidance'}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-rose-100/75">
                  {currentExpeditionProgress.completedStopCount}/{currentExpeditionProgress.requiredStopCount}
                </span>
              </button>
            )}
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
                {planeSelectionRequired && (
                  <button
                    type="button"
                    onClick={() => setSidebarMode('hangar')}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-lc-amber/30 bg-lc-amber/[0.08] px-3 py-2.5 text-left transition-colors hover:bg-lc-amber/[0.12]"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-lc-amber">Aircraft choice required</span>
                      <span className="mt-0.5 block truncate text-[11px] text-lc-text3">Choose the class plane before the next moving flight.</span>
                    </span>
                    <Plane className="h-4 w-4 shrink-0 text-lc-amber" aria-hidden />
                  </button>
                )}
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
              planeTier={selectedClass?.planeTier ?? 0}
              planeName={planeName}
              rangeKm={rangeKm}
              flightHours={selectedClass?.flightHours ?? 0}
              crewStars={selectedClass?.crewStars ?? 0}
              planeSelectionRequired={planeSelectionRequired}
              upgradeActionStatus={upgradeActionStatus}
              investigations={selectedClass?.investigations ?? []}
              expeditionRuns={selectedExpeditionRuns}
              selectedLegId={selectedPassportLegId}
              selectedDestinationId={selectedPassportDestinationId}
              onSelectLeg={inspectPassportLeg}
              onHoverLeg={setHoveredPassportLegId}
              onSelectDestination={inspectPassportDestination}
              onReplayArrival={setReplayDestinationId}
              onClaimUpgrade={claimRangeUpgrade}
              onOpenHangar={() => setSidebarMode('hangar')}
            />
          )}

          {sidebarMode === 'missions' && (
            <InvestigationProgressPanel
              investigations={selectedClass?.investigations ?? []}
              onLaunchDesignMission={launchDesignMission}
            />
          )}

          {sidebarMode === 'hangar' && (
            <HangarPanel
              currentPlaneKey={selectedClass?.planeKey ?? 'starter-biplane'}
              unlockedTier={selectedClass?.planeTier ?? 0}
              rangeKm={rangeKm}
              flightHours={selectedClass?.flightHours ?? 0}
              crewStars={selectedClass?.crewStars ?? 0}
              selectionRequired={planeSelectionRequired}
              actionStatus={planeActionStatus}
              onEquipPlane={equipPlane}
            />
          )}

          {sidebarMode === 'expeditions' && (
            <ExpeditionPanel
              runs={selectedExpeditionRuns}
              routeOrigin={routeOrigin}
              rangeKm={rangeKm}
              routeGuidance={expeditionRouteGuidance}
              actionStatus={expeditionActionStatus}
              onAction={handleExpeditionAction}
              onSelectDestination={selectExpeditionDestination}
              previewExpeditionId={previewExpedition.id}
              onPreviewExpedition={previewExpeditionRoute}
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
                const newlyReachable = newlyReachableDestinationIds.includes(destination.id);
                const onwardReachable = previewNextHops && nextHopDestinationIds.has(destination.id);
                const expeditionStop = activeExpeditionDestinationIds.includes(destination.id);
                const expeditionRecommended = expeditionRouteGuidance?.nextDestinationId === destination.id;
                return (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => selectDestination(destination.id)}
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-lc-blue bg-lc-blue/10'
                        : expeditionRecommended
                          ? 'border-rose-200/45 bg-rose-300/[0.075]'
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
                        : newlyReachable
                          ? 'bg-lc-amber ring-2 ring-lc-amber/50'
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
                        {expeditionStop && <Compass className="h-3 w-3 shrink-0 text-rose-200" aria-label="Active expedition stop" />}
                        {expeditionRecommended && <Route className="h-3 w-3 shrink-0 text-rose-100" aria-label="Recommended expedition next hop" />}
                      </span>
                      <span className="block truncate text-xs text-lc-text3">
                        {destination.country} - {listDistanceOrigin ? formatDistance(km) : 'Available departure'}
                        {previewNextHops
                          ? destination.id === selectedDestination.id
                            ? ' - Preview origin'
                            : onwardReachable
                              ? ' - Next hop'
                              : ' - Beyond range'
                          : expeditionRecommended
                            ? expeditionRouteGuidance?.direct ? ' - Expedition stop in range' : ' - Expedition bridge city'
                            : newlyReachable ? ' - Newly reachable'
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
                movingFlightBlockedByPlaneChoice
                  ? 'border-lc-amber/35 bg-lc-amber/10 text-lc-amber'
                  : isChoosingDeparture || isReachable
                  ? 'border-lc-success/35 bg-lc-success/10 text-lc-success'
                  : 'border-white/20 bg-white/[0.04] text-lc-text2'
              }`}>
                {movingFlightBlockedByPlaneChoice ? 'Choose plane' : isChoosingDeparture ? 'Starting city' : isLocalLesson ? 'Local lesson' : isReachable ? 'In range' : 'Beyond range'}
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
            ) : launchStep === 'source' ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text3">1 · Choose today&apos;s source</h3>
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
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLaunchStep('source')}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200/80 transition-colors hover:text-cyan-100"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Back to source
                </button>
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5">
                  <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/70" aria-hidden />
                  <div className="min-w-0">
                    {selectedPresetId === 'travel-60' ? (
                      <>
                        <p className="truncate text-sm font-semibold text-lc-text">Travel — {selectedDestination.city}</p>
                        <p className="truncate text-xs font-semibold text-cyan-200/75">Generated from the city — pick a situation below</p>
                      </>
                    ) : (
                      <>
                        <p className="truncate text-sm font-semibold text-lc-text">{selectedFocus.title}</p>
                        <p className="truncate text-xs font-semibold text-cyan-200/75">{focusSourceLabel(selectedFocus)}</p>
                        {recommendedPreset && (
                          <p className="mt-0.5 truncate text-[11px] text-lc-text3">Best as a <span className="font-semibold text-cyan-200/80">{recommendedPreset.name}</span> lesson</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text3">2 · Choose your flight plan</h3>
                  <span className="text-xs text-lc-text3">{worldFlightPresets.length} options</span>
                </div>
                <div className="space-y-1.5">
                  {[...worldFlightPresets]
                    .sort((a, b) => (a.id === recommendedPresetId ? -1 : 0) - (b.id === recommendedPresetId ? -1 : 0))
                    .map((preset) => {
                    const selected = preset.id === selectedPresetId;
                    const recommended = preset.id === recommendedPresetId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${selected ? 'border-cyan-300/60 bg-cyan-300/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}
                      >
                        <PlaneTakeoff className={`h-4 w-4 shrink-0 ${selected ? 'text-cyan-300' : 'text-lc-text3'}`} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={`truncate text-sm font-semibold ${selected ? 'text-cyan-100' : 'text-lc-text'}`}>{preset.name}</span>
                            {recommended && (
                              <span className="shrink-0 rounded-full bg-cyan-300/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200">Recommended</span>
                            )}
                          </span>
                          {preset.tagline && <span className="block truncate text-[11px] text-lc-text3">{preset.tagline}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedPresetId === 'travel-60' && travelSituations.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-lc-text3">Travel situation</p>
                    <p className="mb-2 text-[11px] text-lc-text3">Travel writes its own scenario from {selectedDestination.city} — pick a situation.</p>
                    <div className="flex flex-col gap-1.5">
                      {travelSituations.map((s) => {
                        const active = s === (selectedSituation || travelSituations[0]);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSituation(s)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${active ? 'border-rose-300/60 bg-rose-300/[0.10] text-rose-100' : 'border-white/10 bg-white/[0.025] text-lc-text2 hover:border-white/20'}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
            ) : launchStep === 'source' ? (
              <button
                type="button"
                onClick={() => setLaunchStep('flight-plan')}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-lc-blue px-4 text-sm font-bold text-[var(--wf-bg)] transition-colors hover:bg-lc-blue-hover"
              >
                Choose flight plan
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={launchSelectedFocus}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ${
                    movingFlightBlockedByPlaneChoice
                      ? 'border border-lc-amber/35 bg-lc-amber/15 text-lc-amber hover:bg-lc-amber/22'
                      : 'bg-lc-blue text-[var(--wf-bg)] hover:bg-lc-blue-hover'
                  }`}
                >
                  {movingFlightBlockedByPlaneChoice
                    ? <Plane className="h-4 w-4" aria-hidden />
                    : <PlaneTakeoff className="h-4 w-4" aria-hidden />}
                  {movingFlightBlockedByPlaneChoice
                    ? 'Choose Aircraft in Hangar'
                    : !isReachable && !isLocalLesson
                    ? 'Build Lesson Without Moving'
                    : selectedPresetId === 'travel-60'
                      ? `Build Travel — ${(selectedSituation || travelSituations[0] || 'Travel').split(' — ')[0]}`
                      : `Build ${selectedPreset?.name ?? 'Flight Plan'}`}
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
        <MapLegend
          mode={sidebarMode}
          previewNextHops={previewNextHops}
          activeExpedition={sidebarMode === 'expeditions' || activeExpeditionDestinationIds.length > 0}
          expeditionRecommended={Boolean(expeditionRouteGuidance)}
          rangeUpgradeActive={Boolean(rangeUpgradeNotice?.newlyReachableDestinationIds.length)}
        />
        {rangeUpgradeNotice && (
          <RangeUpgradeNoticeCard notice={rangeUpgradeNotice} onClose={() => setRangeUpgradeNotice(null)} />
        )}
      </div>
      {replayDestinationId && (
        <PassportArrivalReplay
          destinationId={replayDestinationId}
          planeKey={selectedClass?.planeKey ?? 'starter-biplane'}
          onClose={() => setReplayDestinationId(null)}
        />
      )}
    </div>
  );
}
