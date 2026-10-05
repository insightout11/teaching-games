import type { DestinationPack } from '@/lib/world-flight/types';
import type { SourceMaterial } from '@/types/source-material';
import type { ActivityGeneratedContent } from '@/activities/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { buildTripItinerary } from '@/lib/world-flight/travel-context';
import { buildTripAttractionsContent } from '@/activities/trip-attractions';
import { buildTripMealContent } from '@/activities/trip-meal';
import { buildTripHotelContent } from '@/activities/trip-hotel/content';
import { buildTripAnnouncementContent } from '@/activities/trip-announcement/content';
import { buildTripGettingThereContent } from '@/activities/trip-getting-there';
import { buildTripDirectionsContent } from '@/activities/trip-directions';
import { buildTripArrivalContent } from '@/activities/trip-arrival';
import { buildBoardingCallContent } from '@/activities/boarding-call';

/**
 * Everything a Travel flight needs for one city, built from the city's real data (no AI):
 * every stop's content plus the arrival source. Used by the World Flight map launch and by the
 * Live Room's flight panel (the trip goes to the room's destination).
 */
export interface TripPack {
  topic: string;
  sourceMaterial: SourceMaterial;
  stageSources: Record<string, SourceMaterial>;
  preGenerated: Record<string, ActivityGeneratedContent>;
}

export function buildTripPack(destination: DestinationPack): TripPack {
  const itinerary = buildTripItinerary(destination);
  return {
    topic: `Trip to ${destination.city}`,
    sourceMaterial: itinerary.arrival,
    stageSources: {},
    // Boarding Call (takeoff) and Trip Recap (landing) are data-seeded and need no source.
    preGenerated: {
      'boarding-call': buildBoardingCallContent(destination),
      'trip-arrival': buildTripArrivalContent(destination),
      'trip-announcement': buildTripAnnouncementContent(destination),
      'trip-plan': { activityKey: 'trip-plan', topicContext: destination.city, city: destination.city } as ActivityGeneratedContent,
      'trip-getting-there': buildTripGettingThereContent(destination),
      'trip-directions': buildTripDirectionsContent(destination),
      'trip-attractions': buildTripAttractionsContent(destination),
      'trip-hotel': buildTripHotelContent(destination),
      'trip-meal': buildTripMealContent(destination),
    },
  };
}

/** The World Flight destination for a room city (by id, then by name). */
export function findTripDestination(id: string | null | undefined, city: string | null | undefined): DestinationPack | null {
  return WORLD_DESTINATIONS.find((d) => d.id === id)
    ?? WORLD_DESTINATIONS.find((d) => !!city && d.city.toLowerCase() === city.toLowerCase())
    ?? null;
}
