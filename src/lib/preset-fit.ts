// Source → preset fit.
//
// The composable primitive is the source's SEMANTIC GENRE (what the material *is*).
// Preset-fit is a derived view: a static genre→preset score map. The genre is the
// reusable signal a future create-your-own / NL→lesson composer consumes; "fit" and
// the World Flight recommendation are just one read of it.
//
// Genre is inferred from signals the source already carries (skills, lesson goal,
// title) — see inferSourceGenre. That heuristic can later be replaced/augmented by an
// LLM classification at ingest without changing any consumer (they read `genre`).

export type SourceGenre =
  | 'opinion'      // argumentative / persuasive — two credible sides
  | 'expository'   // informational / explainer — the all-round default
  | 'narrative'    // story / personal account / experience
  | 'travelogue'   // place, travel, getting-around, functional real-world
  | 'how-to'       // procedural / instructional / language-form focused
  | 'dialogue';    // interview / conversation / Q&A

export const GENRE_LABELS: Record<SourceGenre, string> = {
  opinion: 'Opinion piece',
  expository: 'Explainer',
  narrative: 'Story',
  travelogue: 'Travel / place',
  'how-to': 'How-to',
  dialogue: 'Interview / dialogue',
};

// Fit scores 0–3 per preset, keyed by preset id. Captain's (all-around) keeps a high
// baseline everywhere — it's the safe generalist and the graceful default.
const GENRE_FIT: Record<SourceGenre, Record<string, number>> = {
  opinion:    { 'all-around-flight-60': 2, 'debate-60': 3, 'speak-60': 2, 'travel-60': 0, 'grammar-60': 1 },
  expository: { 'all-around-flight-60': 3, 'debate-60': 1, 'speak-60': 2, 'travel-60': 1, 'grammar-60': 1 },
  narrative:  { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 3, 'travel-60': 1, 'grammar-60': 1 },
  travelogue: { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 2, 'travel-60': 3, 'grammar-60': 1 },
  'how-to':   { 'all-around-flight-60': 2, 'debate-60': 0, 'speak-60': 1, 'travel-60': 1, 'grammar-60': 3 },
  dialogue:   { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 3, 'travel-60': 2, 'grammar-60': 2 },
};

// Tie-break priority when two presets score equally — Captain's wins as the safe
// generalist, then the more specialised plans.
const PRESET_PRIORITY = ['all-around-flight-60', 'debate-60', 'speak-60', 'travel-60', 'grammar-60'];

/** Fit score (0–3) of a preset for a genre. Unknown preset → 0. */
export function fitScore(genre: SourceGenre, presetId: string): number {
  return GENRE_FIT[genre]?.[presetId] ?? 0;
}

export type FitTier = 'best' | 'good' | 'weak' | 'poor';

export function fitTier(score: number): FitTier {
  if (score >= 3) return 'best';
  if (score === 2) return 'good';
  if (score === 1) return 'weak';
  return 'poor';
}

/**
 * Best-fit preset for a genre among an eligible set (e.g. the World-Flight-eligible
 * presets). Highest score wins; ties resolve by PRESET_PRIORITY (Captain's first).
 * Returns null if the eligible set is empty.
 */
export function bestPresetForGenre(genre: SourceGenre, eligiblePresetIds: string[]): string | null {
  if (eligiblePresetIds.length === 0) return null;
  return [...eligiblePresetIds].sort((a, b) => {
    const diff = fitScore(genre, b) - fitScore(genre, a);
    if (diff !== 0) return diff;
    return PRESET_PRIORITY.indexOf(a) - PRESET_PRIORITY.indexOf(b);
  })[0];
}

interface GenreSignal {
  skills?: string[];
  lessonGoal?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Best-effort genre from signals a source already carries. Conservative: most
 * informational sources fall through to 'expository' (→ Captain's). Swap for an LLM
 * classification at ingest later without touching consumers.
 */
export function inferSourceGenre(signal: GenreSignal): SourceGenre {
  const skills = (signal.skills ?? []).map((s) => s.toLowerCase());
  const text = [signal.lessonGoal, signal.title, signal.subtitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const has = (re: RegExp) => re.test(text);
  const hasSkill = (...names: string[]) => names.some((n) => skills.includes(n));

  // Opinion / debate — strongest, most specific signal.
  if (hasSkill('debate', 'persuasion') || has(/\b(debate|argue|argument|opinion|controvers|persuad|pros and cons|for and against|should we|take a side)\b/)) {
    return 'opinion';
  }
  // How-to / language form.
  if (has(/\b(how to|how-to|step[- ]by[- ]step|tutorial|guide to|instructions|recipe|grammar|tense|conditional|sentence structure)\b/)) {
    return 'how-to';
  }
  // Functional travel / place navigation.
  if (has(/\b(getting around|directions|itinerary|check[- ]in|book a|order(ing)? food|public transport|travel tips|at the airport|at the hotel)\b/)) {
    return 'travelogue';
  }
  // Interview / conversation.
  if (hasSkill('role-play') || has(/\b(interview|conversation|dialogue|talk show|q&a|in conversation with)\b/)) {
    return 'dialogue';
  }
  // Story / personal account.
  if (hasSkill('creativity') || has(/\b(story|narrative|personal account|memoir|the experience of|a day in the life)\b/)) {
    return 'narrative';
  }
  return 'expository';
}
