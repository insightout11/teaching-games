import grammarLibrary from '@/data/grammar-library.json';

/**
 * Grammar Spotlight "Watch it": the grammar library clip (BBC Grammar Gameshow / Grammar
 * Snacks / others) that teaches a target. Clips carry `grammar:<point>` tags (library round 3);
 * known targets map to a tag, free-text targets fall back to a keyword match on the titles.
 */
export interface GrammarClip { id: string; title: string; youtubeId: string }

type LibraryClip = { id: string; title: string; youtubeId?: string; topicTags?: string[]; durationSecs?: number | null };

const CLIPS = (grammarLibrary as LibraryClip[])
  .filter((c) => c.youtubeId)
  .map((c) => ({ id: c.id, title: c.title.replace(/�/g, '-'), youtubeId: c.youtubeId!, tags: c.topicTags ?? [], secs: c.durationSecs ?? null }));

const TARGET_TAG: Record<string, string> = {
  'present simple': 'grammar:present-simple',
  'present continuous': 'grammar:present-continuous',
  'past simple': 'grammar:past-simple',
  'past continuous': 'grammar:past-continuous',
  'present perfect': 'grammar:present-perfect',
  'present perfect continuous': 'grammar:present-perfect',
  'past perfect': 'grammar:past-perfect',
  'future (will)': 'grammar:future-will',
  'future (going to)': 'grammar:future-going-to',
  'future continuous': 'grammar:future-will',
  'conditional': 'grammar:conditionals',
  'passive voice': 'grammar:passive',
  'relative clause': 'grammar:relative-clauses',
  'reported speech': 'grammar:reported-speech',
  'comparatives & superlatives': 'grammar:comparatives-superlatives',
  'question forms': 'grammar:questions',
};

const STOP = new Set(['the', 'and', 'a', 'an', 'of', 'to', '&', 'voice', 'forms', 'form', 'tense']);

/** Shorter clips first (a 3-minute clip suits a live class better than a 9-minute one). */
const byLength = (a: { secs: number | null }, b: { secs: number | null }) => (a.secs ?? 600) - (b.secs ?? 600);

export function findGrammarClip(target?: string | null): GrammarClip | null {
  const t = (target ?? '').toLowerCase().trim();
  if (!t) return null;
  const tag = TARGET_TAG[t];
  const tagged = tag ? CLIPS.filter((c) => c.tags.includes(tag)).sort(byLength) : [];
  const pick = tagged[0]
    // Free text: every meaningful word of the target appears in the title.
    ?? (() => {
      const words = t.split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));
      return words.length ? CLIPS.filter((c) => words.every((w) => c.title.toLowerCase().includes(w))).sort(byLength)[0] : undefined;
    })();
  return pick ? { id: pick.id, title: pick.title, youtubeId: pick.youtubeId } : null;
}
