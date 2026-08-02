// Shared spotlight (Captain's Pick) vocabulary: tags, payload shape, and the
// anonymous display name. Used by the spotlight API route, the shared-screen
// CaptainPickCard, the cockpit, and captain-suggestions.

export type SpotlightTag = 'question' | 'answer' | 'idea' | 'example' | 'hot-take' | 'wordcraft';

export const SPOTLIGHT_TAGS: SpotlightTag[] = ['question', 'answer', 'idea', 'example', 'hot-take', 'wordcraft'];

export const SPOTLIGHT_TAG_META: Record<SpotlightTag, { label: string }> = {
  question: { label: 'Student Question' },
  answer: { label: 'Student Answer' },
  idea: { label: 'Bright Idea' },
  example: { label: 'Great Example' },
  'hot-take': { label: 'Hot Take' },
  wordcraft: { label: 'Wordcraft' },
};

export function isSpotlightTag(value: unknown): value is SpotlightTag {
  return typeof value === 'string' && (SPOTLIGHT_TAGS as string[]).includes(value);
}

/** Shown on the shared screen when the student opted out of showing their name. */
export const ANONYMOUS_CREW_NAME = 'A classmate';

/** session_private_state key holding one student's spotlight name preference. */
export function spotlightPrefKey(clientId: string): string {
  return `spotlight-pref:${clientId}`;
}

export interface SpotlightPayload {
  type: 'spotlight';
  label: string;
  studentName: string;
  text: string;
  /** What kind of contribution this is — drives the card label + follow-ups. */
  tag?: SpotlightTag;
  /** Exact phrase from `text` worth highlighting (e.g. great vocab use). */
  highlight?: string | null;
  /** The question/prompt this contribution was answering, shown for context on the shared screen. */
  prompt?: string | null;
  /** True when the student asked not to show their name. */
  anonymous?: boolean;
  createdAt: string;
}
