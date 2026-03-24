/**
 * Standard Topics — the 20 pre-approved topic IDs available on the Standard (free) tier.
 *
 * Standard users select from this list via a dropdown; Pro users enter any free-form topic.
 * Topics are keyed by slug ID (sent in API requests) and carry a display label (used in AI prompts).
 *
 * Pool curation: each topic should be pre-seeded in the content cache via the admin ingest endpoint
 * so that Standard-tier plays are served from cache, keeping AI costs minimal.
 */

export const STANDARD_TOPICS = {
  'present-simple':      'Present Simple',
  'present-continuous':  'Present Continuous',
  'past-simple':         'Past Simple',
  'past-perfect':        'Past Perfect',
  'present-perfect':     'Present Perfect',
  'future-forms':        'Future Forms',
  'conditionals':        'Conditionals',
  'modal-verbs':         'Modal Verbs',
  'passive-voice':       'Passive Voice',
  'reported-speech':     'Reported Speech',
  'business-english':    'Business English',
  'travel-tourism':      'Travel & Tourism',
  'technology':          'Technology',
  'environment':         'Environment',
  'food-culture':        'Food & Culture',
  'health-lifestyle':    'Health & Lifestyle',
  'work-careers':        'Work & Careers',
  'education':           'Education',
  'media-communication': 'Media & Communication',
  'social-issues':       'Social Issues',
} as const;

export type StandardTopicId = keyof typeof STANDARD_TOPICS;
export type StandardTopicLabel = (typeof STANDARD_TOPICS)[StandardTopicId];

/** Type-guard: true if the string is a valid StandardTopicId */
export function isValidStandardTopicId(id: string): id is StandardTopicId {
  return Object.prototype.hasOwnProperty.call(STANDARD_TOPICS, id);
}

/** Return the display label for a validated StandardTopicId */
export function getStandardTopicLabel(id: StandardTopicId): StandardTopicLabel {
  return STANDARD_TOPICS[id];
}

/** All Standard Topic entries as [id, label] pairs — useful for rendering a <select> */
export const STANDARD_TOPIC_ENTRIES = Object.entries(STANDARD_TOPICS) as [StandardTopicId, StandardTopicLabel][];

/**
 * Pro-gated module keys.
 * Any request containing one of these requires isPro OR onboarding credits (or session already consumed one).
 * Standard-tier users without credits attempting these will receive a 402.
 */
export const PRO_ACTIVITY_KEYS = new Set([
  'hot-take-arena',
  'expert-panel',
  'scenario-simulator',
  'scene-igniter',
  'problem-solvers',
  'character-cards',
  'grammar-proof',
  'fact-detective',
  'final-answer',
  'lightning-round',
]);

export const PRO_GAME_KEYS = new Set([
  'grammar-boss',
  'story-sprint',
]);

/** True if any of the requested activity or game keys require Pro access */
export function hasProModules(activities?: string[], games?: string[]): boolean {
  return (
    (activities ?? []).some((k) => PRO_ACTIVITY_KEYS.has(k)) ||
    (games ?? []).some((k) => PRO_GAME_KEYS.has(k))
  );
}
