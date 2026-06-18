import type { DestinationPack } from './types';
import type { SourceMaterial } from '@/types/source-material';

/**
 * Build a travel-flavoured SourceMaterial from a destination + a chosen situation.
 *
 * No AI call here: the existing generators (dialogue-detective, conversation-rounds,
 * vocab-radar) already ground on `summary` via resolveSourceContext, so this just supplies
 * the real-place anchors and the functional framing — they generate the actual dialogue,
 * role-play, and vocabulary. This is what makes Travel-in-World-Flight scale across 54 cities
 * without hand-authoring per-city content.
 */
export function buildTravelContext(destination: DestinationPack, situation: string): SourceMaterial {
  const place = `${destination.city}, ${destination.country}`;
  // Real local anchors the AI can weave in: the primary airport + a few focus titles
  // (genuine landmarks/topics curated for this city).
  const anchors = [
    destination.primaryAirport ? `${destination.primaryAirport} airport` : null,
    ...destination.focusOptions.slice(0, 3).map((f) => f.title),
  ].filter(Boolean).join('; ');

  const summary =
    `Functional travel English. Situation: "${situation}", set in ${place}. ` +
    `Weave in authentic local context where natural (e.g. ${anchors}). ` +
    `Generate dialogues, role-plays, and vocabulary for the real English a traveller needs to ` +
    `handle this situation in ${destination.city} — booking, asking, ordering, clarifying, and ` +
    `solving problems on the spot.`;

  return {
    sourceType: 'travel-english',
    title: `${situation} — ${destination.city}`,
    summary,
    briefingText: summary,
  };
}
