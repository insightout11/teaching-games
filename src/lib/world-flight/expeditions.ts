import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceKm } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';

export type WorldFlightExpeditionStatus = 'active' | 'paused' | 'completed' | 'left';

export interface WorldFlightExpeditionStop {
  destinationId: string;
  recommendedFocusId: string;
  reason: string;
}

export interface WorldFlightExpeditionDefinition {
  id: string;
  title: string;
  subtitle: string;
  centralQuestion: string;
  description: string;
  suggestedLevel: string;
  estimatedLessons: string;
  requiredStopCount: number;
  suggestedOrder: boolean;
  stops: WorldFlightExpeditionStop[];
}

export interface WorldFlightExpeditionSnapshot {
  expeditionId: string;
  title: string;
  destinationIds: string[];
  requiredStopCount: number;
}

export interface WorldFlightExpeditionRunSummary {
  id: string;
  expeditionId: string;
  status: WorldFlightExpeditionStatus;
  visitedDestinationIds: string[];
  activatedAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  leftAt: string | null;
}

export interface WorldFlightExpeditionProgress {
  completedStopCount: number;
  requiredStopCount: number;
  complete: boolean;
  completedDestinationIds: string[];
  remainingDestinationIds: string[];
}

export interface WorldFlightExpeditionRouteGuidance {
  targetDestinationId: string;
  nextDestinationId: string;
  routeDestinationIds: string[];
  direct: boolean;
}

export const WORLD_FLIGHT_EXPEDITIONS: WorldFlightExpeditionDefinition[] = [
  {
    id: 'cities-shaped-by-water',
    title: 'Cities Shaped by Water',
    subtitle: 'Rivers, coasts, canals, and the choices cities make around them.',
    centralQuestion: 'How does living with water shape a city?',
    description: 'Compare how cities use water for movement, work, recreation, protection, and identity.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'vancouver', recommendedFocusId: 'seawall-routine', reason: 'See how a waterfront route becomes part of daily public life.' },
      { destinationId: 'amsterdam', recommendedFocusId: 'water-management', reason: 'Study the systems that keep a low-lying city functioning.' },
      { destinationId: 'bangkok', recommendedFocusId: 'river-boats-video', reason: 'Explore a working river as part of the transport network.' },
      { destinationId: 'recife', recommendedFocusId: 'water-city', reason: 'Connect rivers, bridges, mangroves, and neighborhood life.' },
      { destinationId: 'miami', recommendedFocusId: 'rising-water', reason: 'Examine how a coastal city responds to rising water.' },
      { destinationId: 'panama-city', recommendedFocusId: 'canal-and-water', reason: 'Follow the water systems behind a global shipping route.' },
    ],
  },
  {
    id: 'pacific-connections',
    title: 'Pacific Connections',
    subtitle: 'Island environments, migration, culture, and movement across the Pacific.',
    centralQuestion: 'What connects communities across a very large ocean?',
    description: 'Use a suggested east-to-west sequence, take detours when useful, and compare different Pacific identities.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    requiredStopCount: 4,
    suggestedOrder: true,
    stops: [
      { destinationId: 'vancouver', recommendedFocusId: 'host-nations', reason: 'Begin with land, identity, and the Pacific coast.' },
      { destinationId: 'honolulu', recommendedFocusId: 'hula-story-video', reason: 'Explore how performance can carry history and responsibility.' },
      { destinationId: 'tokyo', recommendedFocusId: 'urban-history-video', reason: 'Study rebuilding and change in a major Pacific metropolis.' },
      { destinationId: 'suva', recommendedFocusId: 'regional-capital', reason: 'See how one city acts as a meeting place for the wider Pacific.' },
      { destinationId: 'auckland', recommendedFocusId: 'pacific-city', reason: 'Examine a city shaped by many Pacific communities.' },
      { destinationId: 'santiago', recommendedFocusId: 'moai-video', reason: 'Connect a South American capital to wider Pacific questions.' },
    ],
  },
  {
    id: 'global-crossroads',
    title: 'Global Crossroads',
    subtitle: 'Cities where regions, routes, institutions, and ideas meet.',
    centralQuestion: 'How does a city become a meeting point for the wider world?',
    description: 'Compare several kinds of connection: geography, trade, aviation, diplomacy, language, and cultural exchange.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'istanbul', recommendedFocusId: 'two-continents-video', reason: 'See how geography makes one city a bridge between regions.' },
      { destinationId: 'dubai', recommendedFocusId: 'airport-history-video', reason: 'Investigate how aviation can turn a city into a global transfer hub.' },
      { destinationId: 'panama-city', recommendedFocusId: 'canal-for-kids-video', reason: 'Follow the engineered passage connecting two oceans and world trade.' },
      { destinationId: 'addis-ababa', recommendedFocusId: 'african-union', reason: 'Explore how diplomacy gives a city influence far beyond its borders.' },
      { destinationId: 'singapore', recommendedFocusId: 'language-policy', reason: 'Study how several languages help a diverse city work across communities.' },
      { destinationId: 'dakar', recommendedFocusId: 'biennale-video', reason: 'See a city connect artists and audiences through a major cultural gathering.' },
    ],
  },
];

export function getWorldFlightExpedition(expeditionId: string) {
  return WORLD_FLIGHT_EXPEDITIONS.find((expedition) => expedition.id === expeditionId) ?? null;
}

export function buildWorldFlightExpeditionSnapshot(expedition: WorldFlightExpeditionDefinition): WorldFlightExpeditionSnapshot {
  return {
    expeditionId: expedition.id,
    title: expedition.title,
    destinationIds: expedition.stops.map((stop) => stop.destinationId),
    requiredStopCount: expedition.requiredStopCount,
  };
}

export function deriveWorldFlightExpeditionProgress(
  expedition: WorldFlightExpeditionDefinition,
  visitedDestinationIds: Iterable<string>,
): WorldFlightExpeditionProgress {
  const visited = new Set(visitedDestinationIds);
  const completedDestinationIds = expedition.stops
    .map((stop) => stop.destinationId)
    .filter((destinationId) => visited.has(destinationId));
  const remainingDestinationIds = expedition.stops
    .map((stop) => stop.destinationId)
    .filter((destinationId) => !visited.has(destinationId));

  return {
    completedStopCount: completedDestinationIds.length,
    requiredStopCount: expedition.requiredStopCount,
    complete: completedDestinationIds.length >= expedition.requiredStopCount,
    completedDestinationIds,
    remainingDestinationIds,
  };
}

export function advanceWorldFlightExpedition(
  snapshot: WorldFlightExpeditionSnapshot,
  visitedDestinationIds: Iterable<string>,
  destinationId: string,
) {
  const visited = new Set(visitedDestinationIds);
  if (snapshot.destinationIds.includes(destinationId)) visited.add(destinationId);
  const nextVisitedDestinationIds = Array.from(visited);

  return {
    visitedDestinationIds: nextVisitedDestinationIds,
    complete: nextVisitedDestinationIds.length >= snapshot.requiredStopCount,
  };
}

export function recommendWorldFlightExpeditionRoute(
  expedition: WorldFlightExpeditionDefinition,
  completedStopIds: Iterable<string>,
  originDestinationId: string | null,
  rangeKm: number,
  destinations: DestinationPack[] = WORLD_DESTINATIONS,
): WorldFlightExpeditionRouteGuidance | null {
  const completed = new Set(completedStopIds);
  const remainingStops = expedition.stops.filter((stop) => !completed.has(stop.destinationId));
  if (remainingStops.length === 0) return null;

  const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
  const validStops = remainingStops.filter((stop) => destinationById.has(stop.destinationId));
  if (validStops.length === 0) return null;

  const origin = originDestinationId ? destinationById.get(originDestinationId) ?? null : null;
  if (!origin) {
    const first = validStops[0];
    return {
      targetDestinationId: first.destinationId,
      nextDestinationId: first.destinationId,
      routeDestinationIds: [first.destinationId],
      direct: true,
    };
  }

  const stopOrder = new Map(validStops.map((stop, index) => [stop.destinationId, index]));
  const directStops = validStops
    .map((stop) => {
      const candidate = destinationById.get(stop.destinationId)!;
      return { stop, distanceKm: candidate.id === origin.id ? 0 : distanceKm(origin, candidate) };
    })
    .filter((candidate) => candidate.distanceKm <= rangeKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || (stopOrder.get(a.stop.destinationId)! - stopOrder.get(b.stop.destinationId)!));

  if (directStops[0]) {
    return {
      targetDestinationId: directStops[0].stop.destinationId,
      nextDestinationId: directStops[0].stop.destinationId,
      routeDestinationIds: [directStops[0].stop.destinationId],
      direct: true,
    };
  }

  type RouteCandidate = { destinationId: string; routeDestinationIds: string[]; totalDistanceKm: number };
  const queue: RouteCandidate[] = [{ destinationId: origin.id, routeDestinationIds: [], totalDistanceKm: 0 }];
  const bestByDestination = new Map<string, { hops: number; totalDistanceKm: number }>([
    [origin.id, { hops: 0, totalDistanceKm: 0 }],
  ]);
  const targetIds = new Set(validStops.map((stop) => stop.destinationId));
  const targetRoutes: RouteCandidate[] = [];
  let shortestTargetHops = Infinity;

  while (queue.length > 0) {
    queue.sort((a, b) => a.routeDestinationIds.length - b.routeDestinationIds.length || a.totalDistanceKm - b.totalDistanceKm);
    const current = queue.shift()!;
    const currentHops = current.routeDestinationIds.length;
    if (currentHops > shortestTargetHops) break;

    if (targetIds.has(current.destinationId)) {
      shortestTargetHops = currentHops;
      targetRoutes.push(current);
      continue;
    }

    const currentDestination = destinationById.get(current.destinationId);
    if (!currentDestination) continue;

    for (const candidate of destinations) {
      if (candidate.id === current.destinationId) continue;
      const legDistanceKm = distanceKm(currentDestination, candidate);
      if (legDistanceKm > rangeKm) continue;

      const routeDestinationIds = [...current.routeDestinationIds, candidate.id];
      const totalDistanceKm = current.totalDistanceKm + legDistanceKm;
      const previousBest = bestByDestination.get(candidate.id);
      if (
        previousBest
        && (
          previousBest.hops < routeDestinationIds.length
          || (previousBest.hops === routeDestinationIds.length && previousBest.totalDistanceKm <= totalDistanceKm)
        )
      ) {
        continue;
      }

      bestByDestination.set(candidate.id, { hops: routeDestinationIds.length, totalDistanceKm });
      queue.push({ destinationId: candidate.id, routeDestinationIds, totalDistanceKm });
    }
  }

  const bestRoute = targetRoutes.sort((a, b) => (
    a.routeDestinationIds.length - b.routeDestinationIds.length
    || a.totalDistanceKm - b.totalDistanceKm
    || (stopOrder.get(a.destinationId)! - stopOrder.get(b.destinationId)!)
  ))[0];
  if (!bestRoute || bestRoute.routeDestinationIds.length === 0) return null;

  return {
    targetDestinationId: bestRoute.destinationId,
    nextDestinationId: bestRoute.routeDestinationIds[0],
    routeDestinationIds: bestRoute.routeDestinationIds,
    direct: false,
  };
}

export function validateWorldFlightExpeditionCatalog() {
  return WORLD_FLIGHT_EXPEDITIONS.flatMap((expedition) => {
    const errors: string[] = [];
    if (expedition.requiredStopCount < 1 || expedition.requiredStopCount > expedition.stops.length) {
      errors.push(`${expedition.id}: invalid required stop count`);
    }
    const destinationIds = expedition.stops.map((stop) => stop.destinationId);
    if (new Set(destinationIds).size !== destinationIds.length) {
      errors.push(`${expedition.id}: duplicate destinations`);
    }
    for (const stop of expedition.stops) {
      const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === stop.destinationId);
      if (!destination) {
        errors.push(`${expedition.id}: missing destination ${stop.destinationId}`);
      } else if (!destination.focusOptions.some((focus) => focus.id === stop.recommendedFocusId)) {
        errors.push(`${expedition.id}: missing focus ${stop.recommendedFocusId} in ${stop.destinationId}`);
      }
    }
    return errors;
  });
}
