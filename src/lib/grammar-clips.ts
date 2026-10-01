import grammarLibrary from '@/data/grammar-library.json';

/**
 * Grammar Spotlight "Watch it": the grammar library clip (BBC Grammar Gameshow / Grammar
 * Snacks) that teaches a target. Known targets map to a title phrase; free-text targets fall
 * back to a keyword match on the clip titles.
 */
export interface GrammarClip { id: string; title: string; youtubeId: string }

const CLIPS = (grammarLibrary as Array<{ id: string; title: string; youtubeId?: string }>)
  .filter((c) => c.youtubeId)
  .map((c) => ({ id: c.id, title: c.title.replace(/�/g, '-'), youtubeId: c.youtubeId! }));

const TARGET_TITLE: Record<string, string> = {
  'present simple': 'Present Simple and Present Continuous',
  'present continuous': 'Present Simple and Present Continuous',
  'past simple': 'Past Simple',
  'past continuous': 'Past Continuous',
  'present perfect': 'Present Perfect and Past Simple',
  'present perfect continuous': 'Present Perfect Simple and Continuous',
  'future (will)': 'Will:',
  'future (going to)': 'Be Going To',
  'future continuous': 'Future Forms',
  'conditional': 'First Conditional',
  'passive voice': 'Passives',
  'comparatives & superlatives': 'Comparatives',
};

const STOP = new Set(['the', 'and', 'a', 'an', 'of', 'to', '&', 'voice', 'forms', 'form', 'tense']);

export function findGrammarClip(target?: string | null): GrammarClip | null {
  const t = (target ?? '').toLowerCase().trim();
  if (!t) return null;
  const phrase = TARGET_TITLE[t];
  if (phrase) {
    const hit = CLIPS.find((c) => c.title.toLowerCase().includes(phrase.toLowerCase()));
    if (hit) return hit;
  }
  // Free text: every meaningful word of the target appears in the title.
  const words = t.split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return null;
  return CLIPS.find((c) => words.every((w) => c.title.toLowerCase().includes(w))) ?? null;
}
