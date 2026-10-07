/**
 * Live memory, step 1 (docs/live-memory-concept.md): the room remembers the lesson as it happens. A small record per
 * session, kept in the browser during class (a refresh never loses it) and saved to a teacher-only table
 * (`session_memory`, migration 058). Topics, words, material and activities only: no recordings, no transcripts,
 * no student names, nothing about the teacher's performance.
 */
export interface LessonMemory {
  topics: Array<{ title: string; kind: string; at: string }>;
  words: string[];
  material: Array<{ title: string; kind: string }>;
  activities: Array<{ name: string; at: string }>;
  updatedAt: string;
}

const CAP = { topics: 40, words: 80, material: 40, activities: 60, text: 160 };

export function emptyLessonMemory(): LessonMemory {
  return { topics: [], words: [], material: [], activities: [], updatedAt: new Date(0).toISOString() };
}

const clean = (v: unknown, max = CAP.text): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const nowIso = () => new Date().toISOString();

/** A new topic, unless it's the same as the last one. */
export function addTopic(m: LessonMemory, title: string, kind: string): LessonMemory {
  const t = clean(title);
  if (!t || m.topics[m.topics.length - 1]?.title === t) return m;
  return { ...m, topics: [...m.topics, { title: t, kind: clean(kind, 20) || 'topic', at: nowIso() }].slice(-CAP.topics), updatedAt: nowIso() };
}

/** Words that came up (deduplicated, case-insensitive, first spelling kept). */
export function addWords(m: LessonMemory, words: string[]): LessonMemory {
  const seen = new Set(m.words.map((w) => w.toLowerCase()));
  const add = words.map((w) => clean(w, 40)).filter((w) => w && !seen.has(w.toLowerCase()) && (seen.add(w.toLowerCase()), true));
  if (!add.length) return m;
  return { ...m, words: [...m.words, ...add].slice(0, CAP.words), updatedAt: nowIso() };
}

/** Material explored (by title), once each. */
export function addMaterial(m: LessonMemory, title: string, kind: string): LessonMemory {
  const t = clean(title);
  if (!t || m.material.some((x) => x.title === t)) return m;
  return { ...m, material: [...m.material, { title: t, kind: clean(kind, 20) || 'item' }].slice(0, CAP.material), updatedAt: nowIso() };
}

/** An activity or flight launched. */
export function addActivity(m: LessonMemory, name: string): LessonMemory {
  const n = clean(name, 80);
  if (!n) return m;
  return { ...m, activities: [...m.activities, { name: n, at: nowIso() }].slice(-CAP.activities), updatedAt: nowIso() };
}

/** Accept a record from the client: known fields only, capped, strings trimmed. */
export function sanitizeLessonMemory(raw: unknown): LessonMemory | null {
  const r = raw as Partial<LessonMemory> | null;
  if (!r || typeof r !== 'object') return null;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const out: LessonMemory = {
    topics: arr<{ title?: unknown; kind?: unknown; at?: unknown }>(r.topics)
      .map((t) => ({ title: clean(t?.title), kind: clean(t?.kind, 20) || 'topic', at: clean(t?.at, 40) }))
      .filter((t) => t.title).slice(-CAP.topics),
    words: arr<unknown>(r.words).map((w) => clean(w, 40)).filter(Boolean).slice(0, CAP.words),
    material: arr<{ title?: unknown; kind?: unknown }>(r.material)
      .map((x) => ({ title: clean(x?.title), kind: clean(x?.kind, 20) || 'item' }))
      .filter((x) => x.title).slice(0, CAP.material),
    activities: arr<{ name?: unknown; at?: unknown }>(r.activities)
      .map((a) => ({ name: clean(a?.name, 80), at: clean(a?.at, 40) }))
      .filter((a) => a.name).slice(-CAP.activities),
    updatedAt: clean(r.updatedAt, 40) || nowIso(),
  };
  return out.topics.length || out.words.length || out.material.length || out.activities.length ? out : null;
}

export const lessonMemoryStorageKey = (sessionId: string) => `lc-lesson-memory-${sessionId}`;
