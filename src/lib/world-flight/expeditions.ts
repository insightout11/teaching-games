import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceKm } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';

export type WorldFlightExpeditionStatus = 'active' | 'paused' | 'completed' | 'left';
export type WorldFlightExpeditionLength = 'short' | 'standard' | 'long';
export type WorldFlightExpeditionTheme =
  | 'Cities'
  | 'Culture'
  | 'Environment'
  | 'Food'
  | 'History'
  | 'Regions'
  | 'Systems';

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
  length: WorldFlightExpeditionLength;
  themes: WorldFlightExpeditionTheme[];
  regions: string[];
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
    length: 'standard',
    themes: ['Environment', 'Systems'],
    regions: ['Global'],
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
    length: 'standard',
    themes: ['Culture', 'Regions'],
    regions: ['Pacific'],
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
    length: 'standard',
    themes: ['Cities', 'Systems'],
    regions: ['Global'],
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
  {
    id: 'mega-cities',
    title: 'Mega-Cities',
    subtitle: 'The systems, pressures, and everyday ingenuity of the world\'s largest cities.',
    centralQuestion: 'What changes when a city becomes enormous?',
    description: 'Compare how very large cities handle movement, housing, food, water, pollution, and public life.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '6-9 lessons',
    length: 'long',
    themes: ['Cities', 'Systems'],
    regions: ['Global'],
    requiredStopCount: 6,
    suggestedOrder: false,
    stops: [
      { destinationId: 'tokyo', recommendedFocusId: 'metro-economics-video', reason: 'Study a transport network built for extraordinary daily demand.' },
      { destinationId: 'shanghai', recommendedFocusId: 'bund-and-pudong', reason: 'Read a global skyline as a story of trade, memory, and rapid change.' },
      { destinationId: 'delhi', recommendedFocusId: 'market-languages', reason: 'See how language keeps complex everyday exchange moving.' },
      { destinationId: 'mumbai', recommendedFocusId: 'dharavi-enterprise', reason: 'Challenge simple stories about density, work, and urban enterprise.' },
      { destinationId: 'lagos', recommendedFocusId: 'mass-transit-video', reason: 'Examine the challenge of moving a rapidly growing population.' },
      { destinationId: 'jakarta', recommendedFocusId: 'warung-life', reason: 'Notice how small everyday places make a huge city usable.' },
      { destinationId: 'mexico-city', recommendedFocusId: 'sinking-city', reason: 'Connect city scale, water demand, and changes beneath the ground.' },
      { destinationId: 'cairo', recommendedFocusId: 'grand-egyptian-museum', reason: 'Consider how a vast capital builds space for shared memory.' },
      { destinationId: 'new-york', recommendedFocusId: 'skyscraper-zoning', reason: 'Read the rules and tradeoffs hidden inside a famous skyline.' },
    ],
  },
  {
    id: 'wild-neighbors',
    title: 'Wild Neighbors',
    subtitle: 'Cities where remarkable ecosystems remain close to everyday life.',
    centralQuestion: 'How can a city make room for the natural world?',
    description: 'Explore parks, forests, mountains, coastlines, and wildlife that sit inside or directly beside major cities.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    length: 'standard',
    themes: ['Environment', 'Cities'],
    regions: ['Global'],
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'cape-town', recommendedFocusId: 'fynbos-biodiversity', reason: 'Meet a city located inside a globally important biodiversity hotspot.' },
      { destinationId: 'nairobi', recommendedFocusId: 'national-park-edge', reason: 'Examine the boundary between a capital city and a national park.' },
      { destinationId: 'vancouver', recommendedFocusId: 'city-in-nature-video', reason: 'See how mountains, ocean, and forests shape the city\'s identity.' },
      { destinationId: 'auckland', recommendedFocusId: 'volcanic-field-video', reason: 'Read a city built across an active volcanic landscape.' },
      { destinationId: 'rio-de-janeiro', recommendedFocusId: 'tijuca-forest', reason: 'Study a large forest restored above dense neighborhoods.' },
      { destinationId: 'perth', recommendedFocusId: 'kings-park-biodiversity', reason: 'Explore urban bushland used for recreation, science, and conservation.' },
    ],
  },
  {
    id: 'food-tells-a-story',
    title: 'Food Tells a Story',
    subtitle: 'Markets, street food, migration, memory, and the routines behind a city\'s taste.',
    centralQuestion: 'What can food reveal about a city and its people?',
    description: 'Follow food beyond recipes to understand movement, identity, work, climate, and shared public life.',
    suggestedLevel: 'Easy to Intermediate',
    estimatedLessons: '4-6 lessons',
    length: 'standard',
    themes: ['Food', 'Culture'],
    regions: ['Global'],
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'bangkok', recommendedFocusId: 'food-identity-video', reason: 'See how a famous food city changes while keeping a recognizable identity.' },
      { destinationId: 'singapore', recommendedFocusId: 'hawker-culture-video', reason: 'Study shared food spaces as heritage and everyday infrastructure.' },
      { destinationId: 'mumbai', recommendedFocusId: 'street-food-video', reason: 'Explore how street food makes a huge city accessible and social.' },
      { destinationId: 'mexico-city', recommendedFocusId: 'markets-and-memory', reason: 'Read markets as places where ordinary memory is carried forward.' },
      { destinationId: 'lima', recommendedFocusId: 'food-and-migration', reason: 'Connect a celebrated food culture to generations of migration.' },
      { destinationId: 'dakar', recommendedFocusId: 'teranga-hospitality', reason: 'Consider how hospitality turns food and welcome into a social practice.' },
    ],
  },
  {
    id: 'cities-rebuilt',
    title: 'Cities Rebuilt',
    subtitle: 'Disaster, conflict, infrastructure, and the choices made after disruption.',
    centralQuestion: 'How does a city decide what to rebuild and what to change?',
    description: 'Compare cities that transformed after earthquakes, war, environmental pressure, or obsolete infrastructure.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    length: 'standard',
    themes: ['History', 'Systems'],
    regions: ['Global'],
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'lisbon', recommendedFocusId: 'earthquake-rebuilding', reason: 'Trace how a devastating earthquake changed the city plan.' },
      { destinationId: 'tokyo', recommendedFocusId: 'earthquake-readiness', reason: 'See how preparation for future disasters shapes daily systems.' },
      { destinationId: 'seoul', recommendedFocusId: 'cheonggyecheon-restoration', reason: 'Study the decision to remove a road and bring a stream back.' },
      { destinationId: 'berlin', recommendedFocusId: 'tempelhofer-feld', reason: 'Explore how an old airport became a major public field.' },
      { destinationId: 'cape-town', recommendedFocusId: 'water-crisis-video', reason: 'Examine how a city changed behavior during a severe water crisis.' },
      { destinationId: 'new-york', recommendedFocusId: 'high-line-park', reason: 'Follow the reuse of industrial infrastructure as public space.' },
    ],
  },
  {
    id: 'creative-capitals',
    title: 'Creative Capitals',
    subtitle: 'Film, music, art, books, fashion, and the communities that make culture visible.',
    centralQuestion: 'How does creativity change the identity and economy of a city?',
    description: 'Compare how creative work grows through neighborhoods, institutions, festivals, technology, and public space.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    length: 'standard',
    themes: ['Culture', 'Cities'],
    regions: ['Global'],
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'lagos', recommendedFocusId: 'nollywood-city', reason: 'See how a major film industry grows through a city of production.' },
      { destinationId: 'dakar', recommendedFocusId: 'biennale-video', reason: 'Follow art as it moves beyond galleries and across a city.' },
      { destinationId: 'seoul', recommendedFocusId: 'hallyu-wave', reason: 'Study how local creative industries build global attention.' },
      { destinationId: 'buenos-aires', recommendedFocusId: 'book-city', reason: 'Explore why bookshops and reading remain central to city identity.' },
      { destinationId: 'los-angeles', recommendedFocusId: 'murals-and-neighborhoods', reason: 'Read public art as a form of neighborhood voice.' },
      { destinationId: 'recife', recommendedFocusId: 'creative-city', reason: 'Connect music, film, technology, and local cultural movements.' },
    ],
  },
  {
    id: 'extreme-climate-cities',
    title: 'Living With Extreme Climate',
    subtitle: 'Heat, cold, monsoon, flooding, drought, and the systems cities build in response.',
    centralQuestion: 'How does climate shape the way a city works?',
    description: 'Compare practical adaptations to very different environmental pressures and evaluate their tradeoffs.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '4-6 lessons',
    length: 'standard',
    themes: ['Environment', 'Systems'],
    regions: ['Global'],
    requiredStopCount: 4,
    suggestedOrder: false,
    stops: [
      { destinationId: 'ulaanbaatar', recommendedFocusId: 'winter-city-systems', reason: 'Study the systems needed to keep a capital working through extreme cold.' },
      { destinationId: 'dubai', recommendedFocusId: 'desert-heat-design', reason: 'See how buildings and public spaces respond to desert heat.' },
      { destinationId: 'reykjavik', recommendedFocusId: 'geothermal-city', reason: 'Explore a city heated by energy from beneath the ground.' },
      { destinationId: 'lima', recommendedFocusId: 'desert-water-and-fog', reason: 'Examine water challenges in a large coastal desert city.' },
      { destinationId: 'mumbai', recommendedFocusId: 'monsoon-city', reason: 'Follow how daily life adjusts to an intense seasonal monsoon.' },
      { destinationId: 'jakarta', recommendedFocusId: 'flood-control-video', reason: 'Evaluate a rapidly growing city\'s attempts to manage flooding.' },
    ],
  },
  {
    id: 'andes-capitals',
    title: 'Andes Capitals',
    subtitle: 'Three South American capitals shaped by mountains, altitude, and regional history.',
    centralQuestion: 'How do the Andes shape city life?',
    description: 'A short regional expedition connecting geography, water, movement, food, and public space.',
    suggestedLevel: 'Easy to Advanced',
    estimatedLessons: '3 lessons',
    length: 'short',
    themes: ['Regions', 'Environment'],
    regions: ['South America'],
    requiredStopCount: 3,
    suggestedOrder: true,
    stops: [
      { destinationId: 'bogota', recommendedFocusId: 'ciclovia-open-streets', reason: 'Begin with a high-altitude capital that regularly gives streets back to people.' },
      { destinationId: 'lima', recommendedFocusId: 'desert-water-and-fog', reason: 'Travel to the Pacific edge of the Andes and examine water in a coastal desert.' },
      { destinationId: 'santiago', recommendedFocusId: 'markets-and-produce', reason: 'Finish beside the mountains by following food networks into the capital.' },
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
    if (expedition.themes.length === 0 || expedition.regions.length === 0) {
      errors.push(`${expedition.id}: missing catalog metadata`);
    }
    if (
      (expedition.length === 'short' && expedition.stops.length > 4)
      || (expedition.length === 'long' && expedition.stops.length < 7)
    ) {
      errors.push(`${expedition.id}: length does not match stop count`);
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
