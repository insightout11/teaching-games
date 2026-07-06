import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';

// Shared logic for AI-varied lines on the Travel arc's scripted stops (Arrival, Getting There,
// Local Table). The line-by-line PerformedExchange engine is unchanged: the AI only supplies the
// LINES. Two kinds of gap coexist and must be preserved:
//   • `___`  — a blank the STUDENT fills in their own words (with a hint).
//   • {token} — a value the APP substitutes per traveller (their chosen dish/transport, the city…),
//               so each traveller's live choice is still woven into the script.
// Any structural failure means we fall back to the hardcoded deterministic script — a garbled or
// ungrounded scene must never reach class.

export type TripStopKey = 'arrival' | 'getting-there' | 'meal';

export interface TripExchangeLine {
  speaker: 'service' | 'traveller';
  text: string;
  hint?: string;
}

export type TripScriptTier = 'basic' | 'standard' | 'advanced';

/** Tokens that MUST appear in a stop's script — the per-traveller anchor it's designed around. */
export const REQUIRED_TOKENS: Record<TripStopKey, string[]> = {
  arrival: [],
  'getting-there': ['{mode}'],
  meal: ['{dish}'],
};

const MAX_LINE_LEN = 120;

/**
 * Validate an AI-produced script against the engine's structural contract. Returns the cleaned
 * lines, or null (→ caller uses the deterministic fallback).
 */
export function validateTripScript(raw: unknown, stop: TripStopKey): TripExchangeLine[] | null {
  if (!Array.isArray(raw)) return null;
  const lines: TripExchangeLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const speaker = (item as { speaker?: unknown }).speaker;
    const text = (item as { text?: unknown }).text;
    const hint = (item as { hint?: unknown }).hint;
    if (speaker !== 'service' && speaker !== 'traveller') return null;
    if (typeof text !== 'string' || !text.trim() || text.length > MAX_LINE_LEN) return null;
    lines.push({
      speaker,
      text: text.trim(),
      ...(typeof hint === 'string' && hint.trim() ? { hint: hint.trim() } : {}),
    });
  }
  if (lines.length < 4 || lines.length > 16) return null;
  if (lines[0].speaker !== 'service') return null;

  const travellerLines = lines.filter((l) => l.speaker === 'traveller');
  if (travellerLines.length < 2) return null;
  // At least one student free-fill blank must survive — that's the point of the exchange.
  if (!travellerLines.some((l) => l.text.includes('___'))) return null;

  // Speakers must alternate sensibly — never more than two of the same in a row.
  let run = 1;
  for (let i = 1; i < lines.length; i++) {
    run = lines[i].speaker === lines[i - 1].speaker ? run + 1 : 1;
    if (run > 2) return null;
  }

  // The stop's per-traveller anchor token must be present.
  const joined = lines.map((l) => `${l.text} ${l.hint ?? ''}`).join(' ');
  for (const tok of REQUIRED_TOKENS[stop]) {
    if (!joined.includes(tok)) return null;
  }
  return lines;
}

/**
 * Substitute {token} placeholders with this traveller's values. Any leftover unknown token is
 * turned into a student blank so a literal "{foo}" can never reach the screen.
 */
export function applyTripTokens(lines: TripExchangeLine[], tokens: Record<string, string>): TripExchangeLine[] {
  const sub = (s: string): string =>
    s.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key] : '___'));
  return lines.map((l) => ({
    speaker: l.speaker,
    text: sub(l.text),
    ...(l.hint ? { hint: sub(l.hint) } : {}),
  }));
}

export function tripTierFor(difficulty: Difficulty): TripScriptTier {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return 'basic';
  if (difficulty === 'Intermediate') return 'standard';
  return 'advanced';
}

export interface TripScriptAnchors {
  airport?: string;
  localColor?: string[];
}

const LINE_TARGET: Record<TripScriptTier, string> = {
  basic: '6 short lines',
  standard: '8–10 lines',
  advanced: '10–14 lines, with one small complication to negotiate',
};

const STOP_BRIEF: Record<TripStopKey, { role: string; scene: string; tokenRules: string; blankRule: string }> = {
  arrival: {
    role: 'an immigration officer (service) and an arriving traveller',
    scene: 'passport control — the officer asks arrival questions and waves the traveller through',
    tokenRules: 'Use {city} for the city and {airport} for the airport — never write their names directly.',
    blankRule: 'Leave 1–2 `___` blanks for the traveller to fill personally (length of stay, where they are staying), each with a short hint.',
  },
  'getting-there': {
    role: 'transport staff or a driver (service) and a traveller getting into the city',
    scene: 'a ticket desk / taxi rank — the traveller buys their way into the city',
    tokenRules: 'You MUST use {mode} wherever the transport goes, {cost} for the price, and {time} for the minutes — never invent a specific mode, price, or time. Use {city} for the city.',
    blankRule: 'Leave at least one `___` blank for a traveller decision (single or return, or whether to switch), with a hint.',
  },
  meal: {
    role: 'a waiter (service) and a traveller ordering a meal',
    scene: 'a local restaurant — the traveller orders, asks what is in the dish, and wraps up',
    tokenRules: 'You MUST use {dish} wherever the ordered dish goes — never invent a dish name. You may use {city} for the city.',
    blankRule: 'Leave at least one `___` blank for a traveller choice (a drink, or how they like it), with a hint.',
  },
};

/** Build the generation prompt for one stop + tier, grounded on the destination's anchors. */
export function buildTripScriptPrompt(stop: TripStopKey, city: string, tier: TripScriptTier, anchors: TripScriptAnchors, difficulty: Difficulty): string {
  const brief = STOP_BRIEF[stop];
  const localColor = anchors.localColor && anchors.localColor.length > 0
    ? `\nLocal colour to weave in naturally where it fits: ${anchors.localColor.join('; ')}.`
    : '';
  return `Write a short, natural role-play script for an ESL Travel lesson in ${city}.

Scene: ${brief.scene}. Two speakers: ${brief.role}.
Level: ${difficultyDescriptions[difficulty]} — ${LINE_TARGET[tier]}.${localColor}

RULES:
- Start with the "service" speaker, then alternate service / traveller sensibly.
- Each line is one natural spoken sentence (max ~18 words).
- ${brief.tokenRules}
- ${brief.blankRule} A "___" blank is for the STUDENT to say their own words — do NOT fill it in.
- You may use {traveller} inside a hint to refer to the current traveller by name (e.g. "How long is {traveller}'s trip?").
- Do not use any other curly-brace tokens than the ones named above.

Return JSON: { "lines": [ { "speaker": "service" | "traveller", "text": "...", "hint": "optional short hint for a blank" } ] }.`;
}
