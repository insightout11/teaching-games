import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripTransportContent } from '../types';

function slug(value: string, fallback: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;
}

/**
 * Build the Getting There content for a destination from its real transport options.
 * No AI: the transport modes ARE the curated data (real service + time + cost + note), so
 * students compare genuine ways into the city, pick one, then role-play buying the ticket or
 * directing the driver. Falls back to an empty list if a city has no transport yet.
 */
export function buildTripGettingThereContent(destination: DestinationPack): TripTransportContent {
  const options = (destination.travelAnchors?.transport ?? []).map((option, index) => ({
    id: slug(option.mode, `option-${index}`),
    mode: option.mode,
    ...(option.approxTimeMin != null ? { approxTimeMin: option.approxTimeMin } : {}),
    ...(option.approxCost ? { approxCost: option.approxCost } : {}),
    ...(option.note ? { note: option.note } : {}),
  }));

  return {
    activityKey: 'trip-getting-there',
    topicContext: destination.city,
    city: destination.city,
    airport: destination.primaryAirport,
    framingPrompt: `You've landed at ${destination.primaryAirport}. How do you want to get into ${destination.city}?`,
    options,
  };
}
