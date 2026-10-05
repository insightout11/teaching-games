/**
 * Speak v2, Pass the Line: the whole class builds ONE conversation together. Each line belongs
 * to one of two roles; the mic passes to the next student every line, so nobody performs a whole
 * scene alone. Round 1 follows the line cues, round 2 adds a twist card, round 3 drops the cues.
 */
export interface PassLineCue { role: 0 | 1; cue: string }

export interface PassTheLineContent {
  /** One sentence: where we are, who's talking. */
  setup: string;
  roles: [string, string];
  cues: PassLineCue[];
  twists: string[];
}

export const ROUNDS = 3;
/** Round 2's twist lands after this many lines. */
export const TWIST_AFTER = 3;
/** Round 3 (no cues) runs this many lines. */
export const FREE_LINES = 8;

export function validPassTheLine(raw: unknown): PassTheLineContent | null {
  const r = raw as Partial<PassTheLineContent> | null;
  if (!r || typeof r.setup !== 'string' || !r.setup.trim()) return null;
  if (!Array.isArray(r.roles) || r.roles.length !== 2 || r.roles.some((x) => typeof x !== 'string' || !x.trim())) return null;
  if (!Array.isArray(r.cues) || r.cues.length < 4) return null;
  const cues = r.cues
    .filter((c) => c && (c.role === 0 || c.role === 1) && typeof c.cue === 'string' && c.cue.trim())
    .slice(0, 10)
    .map((c) => ({ role: c.role, cue: c.cue.trim() }));
  if (cues.length < 4) return null;
  const twists = (Array.isArray(r.twists) ? r.twists : []).filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
  if (twists.length === 0) return null;
  return { setup: r.setup.trim(), roles: [r.roles[0].trim(), r.roles[1].trim()], cues, twists: twists.slice(0, 4) };
}

export function fallbackPassTheLine(topic: string): PassTheLineContent {
  const t = topic.trim() || 'the weekend';
  return {
    setup: `Two friends meet after school and talk about ${t}.`,
    roles: ['Friend A', 'Friend B'],
    cues: [
      { role: 0, cue: 'Say hello and ask how they are' },
      { role: 1, cue: 'Answer, then ask what they think about ' + t },
      { role: 0, cue: 'Give your opinion with a reason' },
      { role: 1, cue: 'Agree or disagree, and say why' },
      { role: 0, cue: 'Ask a follow-up question' },
      { role: 1, cue: 'Answer with an example' },
      { role: 0, cue: 'Suggest doing something together' },
      { role: 1, cue: 'Say yes or no, then say goodbye' },
    ],
    twists: ['Your friend completely disagrees with you!', 'You suddenly have to leave in one minute.', 'A third friend joins and asks what you are talking about.'],
  };
}

/** Who speaks line `i` of the whole activity: the mic passes round the class in fair order. */
export function speakerIndex(globalLine: number, classSize: number): number {
  return classSize > 0 ? globalLine % classSize : 0;
}
