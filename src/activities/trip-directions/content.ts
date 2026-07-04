import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripDirectionsContent, TripDirectionsLandmark } from '../types';
import { getCityLandmarks } from '@/data/world-flight/city-landmarks';

/**
 * Build the Find Your Way content for a destination. Prefers real attraction coordinates once
 * Codex adds them (docs/travel-landmark-coords-codex-brief.md); until then uses the interim
 * hero-city landmark table. Returns an empty landmark list for cities without coords yet —
 * the activity then shows a "not available for this city" state rather than a broken map.
 */
export function buildTripDirectionsContent(destination: DestinationPack): TripDirectionsContent {
  const set = getCityLandmarks(destination.id);

  const attractionLandmarks: TripDirectionsLandmark[] = (destination.travelAnchors?.attractions ?? [])
    .map((attraction) => attraction as { id: string; name: string; lat?: number; lng?: number })
    .filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')
    .map((a) => ({ id: a.id, name: a.name, lat: a.lat as number, lng: a.lng as number }));

  const landmarks = attractionLandmarks.length >= 3 ? attractionLandmarks : (set?.landmarks ?? []);
  const center = set?.center ?? { lat: destination.lat, lng: destination.lng };
  const start = set?.start ?? { id: 'city-centre', name: `${destination.city} centre`, lat: destination.lat, lng: destination.lng };

  return {
    activityKey: 'trip-directions',
    topicContext: destination.city,
    city: destination.city,
    center,
    start,
    landmarks,
  };
}
