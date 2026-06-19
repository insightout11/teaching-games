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
  | 'discussion'   // share-your-view, cultural / experiential — suits open speaking
  | 'expository'   // informational / explainer — the all-round default
  | 'narrative'    // story / personal account / experience
  | 'travelogue'   // place, travel, getting-around, functional real-world
  | 'how-to'       // procedural / instructional / language-form focused
  | 'dialogue';    // interview / conversation / Q&A

export const GENRE_LABELS: Record<SourceGenre, string> = {
  opinion: 'Opinion piece',
  discussion: 'Discussion / culture',
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
  discussion: { 'all-around-flight-60': 2, 'debate-60': 2, 'speak-60': 3, 'travel-60': 1, 'grammar-60': 1 },
  expository: { 'all-around-flight-60': 3, 'debate-60': 1, 'speak-60': 2, 'travel-60': 1, 'grammar-60': 1 },
  narrative:  { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 3, 'travel-60': 1, 'grammar-60': 1 },
  travelogue: { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 2, 'travel-60': 3, 'grammar-60': 1 },
  'how-to':   { 'all-around-flight-60': 2, 'debate-60': 0, 'speak-60': 1, 'travel-60': 1, 'grammar-60': 3 },
  dialogue:   { 'all-around-flight-60': 2, 'debate-60': 1, 'speak-60': 3, 'travel-60': 2, 'grammar-60': 2 },
};

// Short, display-ready preset names for "Best for: …" badges (avoids importing the
// full preset list into every surface).
export const PRESET_FIT_LABELS: Record<string, string> = {
  'all-around-flight-60': "Captain's Flight",
  'debate-60': 'Debate',
  'speak-60': 'Speak',
  'travel-60': 'Travel',
  'grammar-60': 'Grammar',
};

// All five presets — the eligible set for non-World-Flight surfaces (library, paste).
export const ALL_FIT_PRESET_IDS = ['all-around-flight-60', 'debate-60', 'speak-60', 'travel-60', 'grammar-60'];

// Tie-break priority when two presets score equally. Captain's only wins ties among
// the generalist genres; for clearly-typed sources the specialist plan should lead, so
// keep Captain's mid-list (it already has a high baseline that wins on score where it
// genuinely fits).
const PRESET_PRIORITY = ['debate-60', 'travel-60', 'speak-60', 'all-around-flight-60', 'grammar-60'];

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
  // Substring match so e.g. the 'travel English' skill matches 'travel'.
  const skill = (...names: string[]) => names.some((n) => skills.some((s) => s.includes(n)));

  // Order matters — most specific / most differentiating first.

  // 1. Opinion / debate — genuinely two-sided.
  if (skill('opinion', 'debate', 'persuasion', 'argument') ||
      has(/\b(debate|argue|evaluate whether|for and against|pros and cons|take a side|controvers|persuad|should we)\b/)) {
    return 'opinion';
  }
  // 2. Functional travel / directions.
  if (skill('travel', 'directions', 'navigation') ||
      has(/\b(directions|the route|getting around|how to get|public transport|transport hub|the metro|the subway|commut|travel tips|at the airport|at the hotel|check[- ]in)\b/)) {
    return 'travelogue';
  }
  // 3. How-to / language form.
  if (has(/\b(how to|how-to|step[- ]by[- ]step|tutorial|guide to|grammar|tense|conditional|sentence structure)\b/)) {
    return 'how-to';
  }
  // 4. Interview / conversation.
  if (skill('role-play', 'interview') || has(/\b(interview|conversation|dialogue|talk show|q&a|in conversation with)\b/)) {
    return 'dialogue';
  }
  // 5. Discussion / share-your-view — talk-oriented (cultural, experiential).
  if (skill('discussion', 'opinion-sharing') ||
      has(/\b(discuss|share your|what do you think|what makes|your experience|tell us about)\b/)) {
    return 'discussion';
  }
  // 6. Story / personal account.
  if (skill('storytelling', 'creativity') || has(/\b(a story|personal account|memoir|a day in the life)\b/)) {
    return 'narrative';
  }
  return 'expository';
}

/**
 * Resolve a source's genre, preferring an explicit (LLM-classified, stored) genre and
 * falling back to the heuristic. Consumers always call this — so once a `genre` is
 * populated at ingest, the heuristic is bypassed with no other change.
 */
export function resolveSourceGenre(signal: GenreSignal & { genre?: SourceGenre | null }): SourceGenre {
  if (signal.genre && signal.genre in GENRE_FIT) return signal.genre;
  return inferSourceGenre(signal);
}

/**
 * Convenience for "Best for: <preset>" badges: returns the best-fit preset's id +
 * display label for a source, among an eligible set (defaults to all five presets).
 */
export function recommendedPresetForSource(
  signal: GenreSignal & { genre?: SourceGenre | null },
  eligiblePresetIds: string[] = ALL_FIT_PRESET_IDS,
): { presetId: string; label: string } | null {
  const genre = resolveSourceGenre(signal);
  const presetId = bestPresetForGenre(genre, eligiblePresetIds);
  if (!presetId) return null;
  return { presetId, label: PRESET_FIT_LABELS[presetId] ?? presetId };
}
