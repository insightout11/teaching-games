/**
 * Travel-moment deck — the "and then something happens" payoff of the Attraction stage.
 *
 * Flow: the class discusses 3+ real attractions on the Class Board, ranks them, then a
 * single travel moment is drawn and lands on their #1 pick. The structure of the stage is
 * FIXED (always the same board); only this moment is randomized — so it never gets stale
 * without turning the attraction discussion itself into a spinner.
 *
 * The deck is weighted so obstacles are the MINORITY: mostly good luck, choices, and local
 * colour, with the occasional snag. "It's sold out" every time is exactly what we're avoiding.
 *
 * City-agnostic by design: `{place}` is filled with the chosen attraction's name at draw time,
 * so one deck replays across all 54 cities. (Optional per-city `localColor` flavouring can be
 * layered on later once travelAnchors lands — not required for this to work.)
 */

export type TravelMomentType = 'opportunity' | 'choice' | 'local-color' | 'obstacle';

export interface TravelMoment {
  id: string;
  type: TravelMomentType;
  /** Shown to the class. `{place}` is replaced with the chosen attraction name. */
  situation: string;
  /** The speaking demand — what students actually have to do with language. */
  speakingTask: string;
}

/**
 * Relative draw weight per type. Opportunity/choice dominate; obstacles are rare.
 * Each card inherits its type's weight, so adding cards to a type does not change the
 * type's overall share disproportionately — the mix stays intentional.
 */
export const TRAVEL_MOMENT_TYPE_WEIGHTS: Record<TravelMomentType, number> = {
  opportunity: 4,
  choice: 3,
  'local-color': 2,
  obstacle: 1,
};

export const TRAVEL_MOMENTS: readonly TravelMoment[] = [
  // — Opportunity (most common): something good happens —
  {
    id: 'street-performance',
    type: 'opportunity',
    situation: 'A free street performance has started right outside {place}.',
    speakingTask: 'React to it and decide together whether to stop and watch or keep moving.',
  },
  {
    id: 'friendly-local',
    type: 'opportunity',
    situation: 'A friendly local near {place} offers to show you a spot the tourists miss.',
    speakingTask: 'Ask them questions about it and decide, politely, whether to follow.',
  },
  {
    id: 'perfect-timing',
    type: 'opportunity',
    situation: 'You reach {place} just as it opens — no crowds, no queue.',
    speakingTask: 'Say what you want to see first and why, before the crowds arrive.',
  },
  {
    id: 'photo-and-chat',
    type: 'opportunity',
    situation: 'Someone offers to take your photo at {place} and starts a friendly chat.',
    speakingTask: 'Make small talk: where you\'re from, what you think of the city so far.',
  },

  // — Choice (common): a fork with no wrong answer —
  {
    id: 'two-hours-left',
    type: 'choice',
    situation: 'You only have two hours left. Spend it all at {place}, or fit in one more nearby spot?',
    speakingTask: 'Argue for your plan and reach an agreement as a group.',
  },
  {
    id: 'friend-wants-cafe',
    type: 'choice',
    situation: 'A friend wants to skip {place} and sit in a café instead.',
    speakingTask: 'Try to convince each other — then agree on what you\'ll actually do.',
  },
  {
    id: 'weather-turning',
    type: 'choice',
    situation: 'The weather is turning. Rush to {place} now, or change the plan?',
    speakingTask: 'Weigh it out loud and decide together.',
  },

  // — Local colour (occasional): a real custom to notice and respect —
  {
    id: 'unspoken-rule',
    type: 'local-color',
    situation: 'At {place}, everyone is doing something you don\'t recognise (staying quiet, taking off shoes, not filming).',
    speakingTask: 'Ask someone what\'s polite here, then explain the rule back in your own words.',
  },
  {
    id: 'haggling',
    type: 'local-color',
    situation: 'A vendor near {place} expects you to haggle over the price.',
    speakingTask: 'Decide whether to try, then role-play the exchange to a friendly price.',
  },
  {
    id: 'local-recommendation',
    type: 'local-color',
    situation: 'A local insists the real must-see is somewhere you hadn\'t heard of.',
    speakingTask: 'Ask what makes it special and decide whether to trust the tip.',
  },

  // — Obstacle (rare): a genuine snag to solve —
  {
    id: 'long-queue',
    type: 'obstacle',
    situation: 'There\'s a long queue at {place}.',
    speakingTask: 'Ask staff how long the wait is and decide as a group what to do.',
  },
  {
    id: 'closed-today',
    type: 'obstacle',
    situation: '{place} is unexpectedly closed today.',
    speakingTask: 'Ask a local for the next best thing and make a new plan.',
  },
];

function fillPlace(template: string, place: string): string {
  return template.replace(/\{place\}/g, place);
}

export interface DrawTravelMomentOptions {
  /** The attraction the class ranked #1 — filled into `{place}`. */
  place: string;
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number;
  /** Moment ids to skip (e.g. already seen this session). */
  exclude?: string[];
  /**
   * Real per-city "things you should know" notes (from travelAnchors.localColor). When the
   * draw lands on a local-colour moment and these are provided, one real custom is used
   * instead of the generic template — so the moment teaches something true about the city.
   */
  localColor?: string[];
}

/**
 * Draw one travel moment, weighted by type, with `{place}` resolved to the chosen attraction.
 * Falls back to the full deck if `exclude` would empty the pool.
 */
export function drawTravelMoment({ place, rng = Math.random, exclude = [], localColor = [] }: DrawTravelMomentOptions): TravelMoment {
  const excluded = new Set(exclude);
  const filtered = TRAVEL_MOMENTS.filter((moment) => !excluded.has(moment.id));
  const candidates = filtered.length > 0 ? filtered : TRAVEL_MOMENTS;

  const weights = candidates.map((moment) => TRAVEL_MOMENT_TYPE_WEIGHTS[moment.type]);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let threshold = rng() * total;
  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    threshold -= weights[i];
    if (threshold < 0) {
      chosen = candidates[i];
      break;
    }
  }

  // Local-colour moments use a REAL city custom when one is available.
  if (chosen.type === 'local-color' && localColor.length > 0) {
    const note = localColor[Math.floor(rng() * localColor.length) % localColor.length];
    return {
      ...chosen,
      situation: fillPlace(`On your way to {place}, a local mentions something you should know: "${note}"`, place),
      speakingTask: fillPlace("Ask one question about it, and say how you'll handle it at {place}.", place),
    };
  }

  return {
    ...chosen,
    situation: fillPlace(chosen.situation, place),
    speakingTask: fillPlace(chosen.speakingTask, place),
  };
}
