import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripArrivalContent } from '../types';

/**
 * Build the Arrival content for a destination. No AI — immigration Q&A is universal, so the
 * scripted exchange lives in the component and roles are assigned to real students at runtime.
 * This stage is deterministic and always works (unlike the flaky generated scene it replaces).
 */
export function buildTripArrivalContent(destination: DestinationPack): TripArrivalContent {
  const localColor = (destination.travelAnchors?.localColor ?? []).map((note) => note.text);
  return {
    activityKey: 'trip-arrival',
    topicContext: destination.city,
    city: destination.city,
    airport: destination.primaryAirport,
    framingPrompt: `You've landed at ${destination.primaryAirport}. Go through immigration into ${destination.city}.`,
    ...(localColor.length > 0 ? { localColor } : {}),
  };
}
