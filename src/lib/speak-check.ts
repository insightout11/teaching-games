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
  return { situation: r.situation.trim(), canDo: r.canDo.trim().replace(/[.?]$/, ''), before: r.before, after: r.after };
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
