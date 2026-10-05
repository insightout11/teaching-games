import motionsBank from '@/data/debate-motions.json';

/**
 * Debate v2 (docs/debate-v2-concept.md): one motion carries the whole flight — Motion Pulse (the
 * before), Evidence Cards, tap-to-claim prep, Tag-team Debate, Switch Sides, Opinion Shift (the
 * after). Checked motions from the bank when the topic matches (owner decision), else generated.
 */
export interface DebateEvidence { fact: string; side: 'for' | 'against'; source: string }

export interface DebateMotion {
  motion: string;
  /** The takeoff question, e.g. "Should schools ban phones?" (re-asked by the Opinion Shift). */
  pulse: string;
  forPoints: string[];
  againstPoints: string[];
  evidence: DebateEvidence[];
}

interface BankMotion extends DebateMotion { id: string; topics: string[]; ageBand: 'kids' | 'teens'; cefr: string }

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const strList = (v: unknown, n: number, max = 140) => (Array.isArray(v) ? v.map((x) => clean(x, max)).filter(Boolean).slice(0, n) : []);

/** Accept a well-formed motion (the AI's or the bank's), else null. */
export function validMotion(raw: unknown): DebateMotion | null {
  const r = raw as Record<string, unknown> | null;
  if (!r) return null;
  const motion = clean(r.motion, 120);
  const forPoints = strList(r.forPoints, 4);
  const againstPoints = strList(r.againstPoints, 4);
  if (!motion || forPoints.length < 2 || againstPoints.length < 2) return null;
  const pulse = clean(r.pulse, 140) || `Do you agree: ${motion}?`;
  const evidence = (Array.isArray(r.evidence) ? r.evidence : [])
    .map((e) => e as Record<string, unknown>)
    .filter((e) => (e.side === 'for' || e.side === 'against') && clean(e.fact, 240))
    .map((e) => ({ fact: clean(e.fact, 240), side: e.side as 'for' | 'against', source: clean(e.source, 120) }))
    .slice(0, 6);
  return { motion, pulse: pulse.endsWith('?') ? pulse : `${pulse}?`, forPoints, againstPoints, evidence };
}

const words = (s: string) => (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
const STOP = new Set(['should', 'the', 'and', 'for', 'are', 'more', 'than', 'with', 'their', 'have', 'every', 'all']);
const LEVEL_CEFR: Record<string, string[]> = { Beginner: ['A2'], Easy: ['A2'], Intermediate: ['A2', 'B1'], Advanced: ['B1', 'B2'], Expert: ['B2'] };

/** A checked motion for the topic, or null: topic tags count most, then the motion's own words; level preferred. */
export function bankMotionFor(topic: string, difficulty?: string): DebateMotion | null {
  const q = words(topic).filter((w) => !STOP.has(w));
  if (!q.length) return null;
  const levels = (difficulty && LEVEL_CEFR[difficulty]) || [];
  let best: { m: BankMotion; score: number } | null = null;
  for (const m of motionsBank as BankMotion[]) {
    const tags = m.topics.flatMap(words);
    const text = words(m.motion);
    let score = 0;
    q.forEach((w) => { if (text.indexOf(w) >= 0) score += 3; else if (tags.indexOf(w) >= 0) score += 2; });
    if (score < 3) continue;
    if (levels.indexOf(m.cefr) >= 0) score += 1;
    if (!best || score > best.score) best = { m, score };
  }
  return best ? validMotion(best.m) : null;
}

/** Last resort so the flight never blocks: the topic as a motion, with generic but usable points. */
export function fallbackMotion(topic: string): DebateMotion {
  const t = topic.trim().replace(/\?$/, '') || 'Homework should be optional';
  const motion = t;
  return {
    motion,
    pulse: /\?$/.test(topic.trim()) ? topic.trim() : `Do you agree: ${motion}?`,
    forPoints: ['It helps people in everyday life.', 'It gives more choice and freedom.', 'Many people already support it.'],
    againstPoints: ['It could cost too much.', 'It might cause new problems.', 'There are better ways to do it.'],
    evidence: [],
  };
}

/** The motion for a lesson: checked → generated (validated by the caller) → fallback. */
export function motionFor(topic: string, difficulty?: string, generated?: unknown): DebateMotion {
  return bankMotionFor(topic, difficulty) ?? validMotion(generated) ?? fallbackMotion(topic);
}
