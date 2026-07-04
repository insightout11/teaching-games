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

/**
 * The fixed spine of the whole-trip Travel arc. Every city runs the same stages in the same
 * order — that repetition across destinations IS the spaced practice.
 */
export type TripStageId =
  | 'departures'      // Character Cards — airport personas
  | 'arrival'         // Scene Igniter — immigration / arrival scene
  | 'getting-there'   // roleplay — airport → city
  | 'hotel'           // Conversation Rounds — front-desk task
  | 'attraction'      // Class Board — discuss + rank real attractions
  | 'local-table'     // Conversation Rounds — order a real local dish
  | 'landing';        // in-your-words — trip recap

const LANGUAGE_RULE =
  'Generate the real English a traveller needs for this moment — asking, booking, ordering, ' +
  'clarifying, and solving small problems on the spot. Keep it functional and spoken.';

function anchorList(items: Array<{ name: string }>, max = 3): string {
  return items.slice(0, max).map((item) => item.name).join(', ');
}

/**
 * Build one grounded `SourceMaterial` per trip stage from a destination's real anchors.
 * No AI call here — the stage generators (scene-igniter, conversation-rounds, vocab, board)
 * already ground on `summary` via resolveSourceContext; this just supplies the real-place
 * framing so the same arc produces city-specific language across all destinations.
 *
 * Falls back gracefully when `travelAnchors` is absent (attraction/meal stages still work,
 * just without named anchors — the generator invents plausible local detail).
 */
export function buildTripItinerary(destination: DestinationPack): Record<TripStageId, SourceMaterial> {
  const place = `${destination.city}, ${destination.country}`;
  const airport = destination.primaryAirport ? `${destination.primaryAirport} airport` : `${destination.city}'s airport`;
  const anchors = destination.travelAnchors;

  const dishes = anchors?.dishes ?? [];
  const attractions = anchors?.attractions ?? [];
  const transport = anchors?.transport ?? [];

  const stage = (title: string, focus: string): SourceMaterial => {
    const summary = `Functional travel English in ${place}. ${focus} ${LANGUAGE_RULE}`;
    return { sourceType: 'travel-english', title: `${title} — ${destination.city}`, summary, briefingText: summary };
  };

  const transportFocus = transport.length > 0
    ? `Getting from ${airport} into the city — real options here include ${transport.map((t) => t.mode).slice(0, 3).join(', ')}. Weigh them, then handle the exchange (buy the ticket, tell the driver the address).`
    : `Getting from ${airport} into the city centre — choose a way in (train, taxi, bus, or rideshare) and handle the exchange: buy the ticket or tell the driver the address.`;

  const attractionFocus = attractions.length > 0
    ? `Out and about at real city attractions: ${anchorList(attractions)}. Discuss which to visit and why, then react to what happens there.`
    : `Out and about at the city's main attractions — discuss which to visit and why, then react to what happens there.`;

  const mealFocus = dishes.length > 0
    ? `A meal of real local food. Dishes to choose from: ${anchorList(dishes, 5)}. Order a chosen dish, ask what's in it, handle the bill.`
    : `A meal of real local food — order a local dish, ask what's in it, and handle the bill.`;

  return {
    departures: stage('Departures', `At ${airport} before the flight — checking in, boarding, and small talk at the gate.`),
    arrival: stage('Arrival', `Arriving through immigration at ${airport}. Cast the scene with ONE immigration officer who asks the questions (purpose of visit, length of stay, where you are staying) and the arriving traveller(s) who answer — a realistic, friendly border-control exchange, not a group of tourists chatting.`),
    'getting-there': stage('Getting There', transportFocus),
    hotel: stage('Hotel Check-In', `At the hotel front desk — checking in, asking about the room and amenities, and reporting a problem.`),
    attraction: stage('Attractions', attractionFocus),
    'local-table': stage('Local Table', mealFocus),
    landing: stage('Trip Recap', `Looking back on the day in ${destination.city} — the best moment, a recommendation, what you'd do differently.`),
  };
}
