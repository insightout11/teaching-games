import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripAttractionsContent } from '../types';

/**
 * Build the Attraction-stage content for a destination straight from its real anchors.
 * No AI: the attractions ARE the curated data (name + a one-line "what it is" + optional
 * "why visit"), so the board can seed real, info-bearing option cards. Falls back to an
 * empty list if a city has no travelAnchors yet.
 */
export function buildTripAttractionsContent(destination: DestinationPack): TripAttractionsContent {
  const attractions = (destination.travelAnchors?.attractions ?? []).map((attraction) => {
    const credit = [attraction.image?.creator, attraction.image?.license, attraction.image?.sourceName].filter(Boolean).join(' · ');
    return {
      id: attraction.id,
      name: attraction.name,
      whatItIs: attraction.whatItIs,
      ...(attraction.whyVisit ? { whyVisit: attraction.whyVisit } : {}),
      ...(attraction.image?.url ? { imageUrl: attraction.image.url } : {}),
      ...(attraction.image?.caption ? { imageCaption: attraction.image.caption } : {}),
      ...(credit ? { imageCredit: credit } : {}),
    };
  });

  const localColor = (destination.travelAnchors?.localColor ?? []).map((note) => note.text);

  return {
    activityKey: 'trip-attractions',
    topicContext: destination.city,
    city: destination.city,
    framingPrompt: `You've arrived in ${destination.city}. Which of these real places should you visit — and why?`,
    attractions,
    localColor,
  };
}
