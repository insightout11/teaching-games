import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripMealContent } from '../types';

/**
 * Build the Local Table content for a destination straight from its real dishes.
 * No AI: the dishes ARE the curated data (name + a one-line "what it is" + optional note),
 * so the menu shows real local food students can learn about and choose from. Falls back to
 * an empty list if a city has no travelAnchors yet.
 */
export function buildTripMealContent(destination: DestinationPack): TripMealContent {
  const dishes = (destination.travelAnchors?.dishes ?? []).map((dish) => {
    // Real dish photos land via travelAnchors curation (Codex) — read defensively until then.
    const image = (dish as { image?: { url?: string } }).image;
    return {
      id: dish.id,
      name: dish.name,
      whatItIs: dish.whatItIs,
      ...(dish.note ? { note: dish.note } : {}),
      ...(image?.url ? { imageUrl: image.url } : {}),
    };
  });

  return {
    activityKey: 'trip-meal',
    topicContext: destination.city,
    city: destination.city,
    framingPrompt: `Time to eat in ${destination.city}. Look at the real local dishes — which one do you want to try?`,
    dishes,
  };
}
