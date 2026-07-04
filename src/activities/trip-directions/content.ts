import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripDirectionsContent, TripDirectionsLandmark } from '../types';
import { getCityLandmarks } from '@/data/world-flight/city-landmarks';

/**
 * Build the Find Your Way content for a destination. Landmarks come from the attraction
 * anchors' real coordinates (all 50 cities, validated ≤~40 km sanity). The hero-city table
 * still supplies a NAMED start point (O'Connell Bridge…) where curated; other cities start
 * from the city centre. An empty landmark list (malformed data / stripped anchors) shows a
 * graceful "not available" state rather than a broken map.
 */
export function buildTripDirectionsContent(destination: DestinationPack): TripDirectionsContent {
  const set = getCityLandmarks(destination.id);

  const attractionLandmarks: TripDirectionsLandmark[] = (destination.travelAnchors?.attractions ?? [])
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
