import situationsBank from '@/data/speak-situations.json';
/**
 * Speak v2: the situation check, Speak's before → after. At takeoff each phone picks the reply
 * they'd use in a real situation from the topic, says how confident they'd feel, and answers a
 * can-do ("Could you … in English?"). At landing: the same situation with NEW reply options (so
 * it isn't memory), the same two questions, and the class-level change is revealed. Class counts
 * only, never names.
 */
export interface SpeakReplySet {
  replies: string[];
  /** Index of the natural reply. */
  natural: number;
}

export interface SpeakSituation {
  /** One or two sentences: where you are and what was just said to you. */
  situation: string;
  /** "Order food at a café in English" (shown as "Could you …?"). */
  canDo: string;
  before: SpeakReplySet;
  after: SpeakReplySet;
  /** Junior situations: sticker ids that show the scene (src/data/sticker-words.json). */
  pictures?: string[];
}

/** One phone's answer: reply index, confidence 0–2, can-do yes/no. */
export interface SpeakAnswer { reply: number; confidence: number; canDo: boolean }

export interface SpeakSummary { n: number; natural: number; confident: number; canDo: number }

export function summariseSpeak(answers: Record<string, SpeakAnswer>, set: SpeakReplySet): SpeakSummary {
  const list = Object.keys(answers).map((k) => answers[k]);
  return {
    n: list.length,
    natural: list.filter((a) => a.reply === set.natural).length,
    confident: list.filter((a) => a.confidence >= 2).length,
    canDo: list.filter((a) => a.canDo).length,
  };
}

/** Accept only a well-formed situation (the AI's), else null so the fallback is used. */
export function validSpeakSituation(raw: unknown): SpeakSituation | null {
  const r = raw as Partial<SpeakSituation> | null;
  const okSet = (s: unknown): s is SpeakReplySet => {
    const v = s as Partial<SpeakReplySet> | null;
    return !!v && Array.isArray(v.replies) && v.replies.length >= 3 && v.replies.length <= 4
      && v.replies.every((x) => typeof x === 'string' && x.trim().length > 0)
      && new Set(v.replies).size === v.replies.length
      && typeof v.natural === 'number' && v.natural >= 0 && v.natural < v.replies.length;
  };
  if (!r || typeof r.situation !== 'string' || !r.situation.trim() || typeof r.canDo !== 'string' || !r.canDo.trim()) return null;
  if (!okSet(r.before) || !okSet(r.after)) return null;
  const overlap = r.before.replies.some((x) => r.after!.replies.indexOf(x) >= 0);
  if (overlap) return null;
  const pictures = Array.isArray(r.pictures) ? r.pictures.filter((x): x is string => typeof x === 'string').slice(0, 3) : [];
  return { situation: r.situation.trim(), canDo: r.canDo.trim().replace(/[.?]$/, ''), before: r.before, after: r.after, ...(pictures.length ? { pictures } : {}) };
}

/** Deterministic fallback from the topic, so the takeoff never blocks on AI. */
export function fallbackSpeakSituation(topic: string): SpeakSituation {
  const t = topic.trim() || 'your weekend';
  return {
    situation: `A new friend asks you: "So, what do you think about ${t}?"`,
    canDo: `Talk about ${t} for one minute in English`,
    before: {
      replies: ['Yes.', `I think it's really interesting, because it's part of my life.`, `I am of the opinion that the subject is interesting.`, `I don't know what is it.`],
      natural: 1,
    },
    after: {
      replies: ['Maybe.', `I am interested in the subject of it.`, `Honestly, I love it, especially because it's fun to talk about.`, `It is a thing that I am thinking.`],
      natural: 2,
    },
  };
}

export const CONFIDENCE_LABELS = ['Not yet', 'A bit', 'Confident'];

// ─── The checked situations bank (src/data/speak-situations.json, library round 11) ──────────

interface BankSituation extends SpeakSituation { id: string; topics: string[]; topicIds?: string[]; ageBand: 'kids' | 'teens' | 'junior'; cefr: string }

const words = (s: string) => (s.toLowerCase().match(/[a-zé]{3,}/g) ?? []).map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
const LEVEL_CEFR: Record<string, string[]> = { Beginner: ['A1'], Easy: ['A1', 'A2'], Intermediate: ['A2', 'B1'], Advanced: ['B1', 'B2'], Expert: ['B2'] };

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Shuffle a reply set by a seed (stable per topic) and keep `natural` pointing at the same reply. */
export function shuffleReplySet(set: SpeakReplySet, seed: number): SpeakReplySet {
  const order = set.replies.map((_, i) => i);
  let s = seed || 1;
  for (let i = order.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { replies: order.map((i) => set.replies[i]), natural: order.indexOf(set.natural) };
}

/**
 * A hand-checked situation for the topic, or null. Matches the topic's words against each
 * situation's topic tags (strong) and text (weak); prefers the lesson's level. Reply order is
 * shuffled per topic so the natural reply isn't always in the same place.
 */
/** `topicId`: the banked topic's id (server-side lookup, keeps the topic bank off the client). */
export function bankSituationFor(topic: string, difficulty?: string, junior = false, topicId?: string | null): SpeakSituation | null {
  const q = words(topic);
  const pool = (situationsBank as BankSituation[]).filter((s) => (junior ? s.ageBand === 'junior' : s.ageBand !== 'junior'));
  // Junior classes always get a Junior situation (short replies, pictures): the best topic match, else one by topic seed.
  if (junior && pool.length && !q.length) return fromBank(pool[hash(topic.toLowerCase()) % pool.length], topic);
  if (!q.length) return null;
  const levels = (difficulty && LEVEL_CEFR[difficulty]) || [];
  // A banked topic (Codex round 27 linked every topic): its own situation, preferring the lesson's level.
  if (topicId) {
    const linked = pool.filter((s) => s.topicIds?.includes(topicId));
    if (linked.length) return fromBank(linked.find((s) => levels.includes(s.cefr)) ?? linked[0], topic);
  }
  let best: { s: BankSituation; score: number } | null = null;
  for (const s of pool) {
    const tags = s.topics.flatMap(words);
    const text = words(`${s.situation} ${s.canDo}`);
    let score = 0;
    q.forEach((w) => { if (tags.indexOf(w) >= 0) score += 3; else if (text.indexOf(w) >= 0) score += 1; });
    if (score < 3) continue;
    if (levels.indexOf(s.cefr) >= 0) score += 2;
    if (!best || score > best.score) best = { s, score };
  }
  if (!best) return junior && pool.length ? fromBank(pool[hash(topic.toLowerCase()) % pool.length], topic) : null;
  return fromBank(best.s, topic);
}

function fromBank(s: BankSituation, topic: string): SpeakSituation {
  const seed = hash(topic.toLowerCase());
  const { situation, canDo, before, after, pictures } = s;
  return { situation, canDo, before: shuffleReplySet(before, seed), after: shuffleReplySet(after, seed + 7), ...(pictures?.length ? { pictures } : {}) };
}
