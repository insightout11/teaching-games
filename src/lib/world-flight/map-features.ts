import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';
import { destinationCoord, distanceKm, greatCircleLine, type WorldFeature, type WorldFeatureCollection } from '@/lib/world-flight/geo';
import type { WorldFlightClassSummary } from '@/lib/world-flight/journey';
import type { WorldFlightExpeditionDefinition } from '@/lib/world-flight/expeditions';

/**
 * The World Flight map's data: cities (reachable, visited, expedition stops), the class's journey routes and
 * numbered steps, and expedition routes. Shared by the World Flight page and the Live Room map, so both draw the
 * same thing. (Moved unchanged from world-flight-page.tsx, Oct 2026.)
 */

export const EMPTY_FEATURE_COLLECTION: WorldFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export function asFeatureCollection(features: WorldFeature[]): WorldFeatureCollection {
  return { type: 'FeatureCollection', features };
}

export function destinationFeatures(
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

export function journeyRouteFeatures(completedLegs: WorldFlightClassSummary['completedLegs'], activeLegId: string | null) {
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

export function journeyStepFeatures(completedLegs: WorldFlightClassSummary['completedLegs'], activeLegId: string | null) {
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

export function expeditionRouteFeatures(expedition: WorldFlightExpeditionDefinition | null) {
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

