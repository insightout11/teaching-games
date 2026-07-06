import { destinationClimate, type Climate } from '@/components/world-flight/arrival-scene/weather';
import type { DestinationPack } from '@/lib/world-flight/types';
import type { BoardingCallContent } from '../types';

// Data-seeded Boarding Call content — the Travel takeoff. Three spoken-first prompts about the
// destination ahead (the whole class flies together from a shared origin), plus a climate-aware
// packing hint derived from the destination's baked scene metadata.

const PACKING_HINT: Record<Climate, string> = {
  tropical: 'It’s warm and humid — think light clothes, sunscreen, and a hat.',
  desert: 'Hot and dry — light layers for the day, something warmer for the evening, and water.',
  polar: 'It’s cold — pack warm layers, a hat, and gloves.',
  temperate: 'Mild weather — a light jacket and a mix of layers is a safe bet.',
};

export function buildBoardingCallContent(destination: DestinationPack): BoardingCallContent {
  const climate = destinationClimate(destination.scene);
  return {
    activityKey: 'boarding-call',
    topicContext: `Trip to ${destination.city}`,
    city: destination.city,
    prompts: [
      `What are you packing for ${destination.city}?`,
      `What are you most excited to see in ${destination.city}?`,
      'What’s one worry about the trip?',
    ],
    packingHint: PACKING_HINT[climate],
  };
}
