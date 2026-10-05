/**
 * Listening Flight (docs/listening-flight-concept.md): library clips with checked listening packs
 * (3 timed segments: question, options, exact key line). The flight plays a "listening window"
 * around the segments at takeoff and landing (gist questions = the before → after) and Radio
 * Check plays the segments themselves (detail questions).
 */
export interface PackSegment { start: number; end: number; question: string; options: string[]; correctIndex: number; keyLine: string }
export interface ListeningPack { segments: PackSegment[]; gist?: GistQuestion[]; harder?: GistQuestion; words?: Array<{ word: string; meaning: string; at?: number }> }
export interface GistQuestion { q: string; options: string[]; correctIndex: number }

/** Window caps (owner decision): ~90s for kids, ~3 min for teens/adults. */
export const WINDOW_CAP_KIDS = 90;
export const WINDOW_CAP = 180;
const PAD = 8;

export function validPack(raw: unknown): ListeningPack | null {
  const p = raw as Partial<ListeningPack> | null;
  if (!p || !Array.isArray(p.segments)) return null;
  const segments = p.segments.filter((s) =>
    s && typeof s.start === 'number' && typeof s.end === 'number' && s.end > s.start
    && typeof s.question === 'string' && Array.isArray(s.options) && s.options.length >= 2
    && typeof s.correctIndex === 'number' && s.correctIndex >= 0 && s.correctIndex < s.options.length);
  if (segments.length === 0) return null;
  const gist = (Array.isArray(p.gist) ? p.gist : []).filter(validGist);
  const words = (Array.isArray(p.words) ? p.words : []).filter((w) => w && typeof w.word === 'string' && typeof w.meaning === 'string');
  return { segments, ...(gist.length >= 3 ? { gist: gist.slice(0, 3) } : {}), ...(validGist(p.harder) ? { harder: p.harder } : {}), ...(words.length ? { words } : {}) };
}

export function validGist(g: unknown): g is GistQuestion {
  const x = g as Partial<GistQuestion> | null;
  return !!x && typeof x.q === 'string' && x.q.trim().length > 3 && Array.isArray(x.options) && x.options.length >= 2
    && x.options.length <= 4 && x.options.every((o) => typeof o === 'string' && o.trim()) && new Set(x.options).size === x.options.length
    && typeof x.correctIndex === 'number' && x.correctIndex >= 0 && x.correctIndex < x.options.length;
}

/** The stretch of the clip the class hears at takeoff and landing: around the pack's segments, capped. */
export function listeningWindow(pack: ListeningPack, kids: boolean): { start: number; end: number } {
  const cap = kids ? WINDOW_CAP_KIDS : WINDOW_CAP;
  const first = Math.min(...pack.segments.map((s) => s.start));
  const last = Math.max(...pack.segments.map((s) => s.end));
  const start = Math.max(0, Math.floor(first - PAD));
  const end = Math.min(Math.ceil(last + PAD), start + cap);
  return { start, end };
}

/** The transcript lines inside the window (raw transcript = JSON [{ text, offset ms }]). */
export function windowTranscript(rawTranscript: string | undefined, start: number, end: number): string[] {
  if (!rawTranscript) return [];
  try {
    const parts = JSON.parse(rawTranscript) as Array<{ text?: string; offset?: number }>;
    if (!Array.isArray(parts)) return [];
    return parts
      .filter((p) => typeof p.offset === 'number' && p.offset / 1000 >= start && p.offset / 1000 < end && p.text)
      .map((p) => String(p.text).replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Kids get the shorter window. */
export function isKidsLevel(difficulty: string): boolean {
  return difficulty === 'Beginner' || difficulty === 'Easy';
}

/** Radio Check content straight from a pack: checked segments, no AI. */
export function packToRadioCheck(pack: ListeningPack, youtubeId: string, title: string, topic: string) {
  return {
    activityKey: 'radio-check' as const,
    topicContext: topic,
    title,
    mode: 'video' as const,
    youtubeId,
    segments: pack.segments.map((s) => ({ question: s.question, options: s.options, correctIndex: s.correctIndex, keyLine: s.keyLine, start: s.start, end: s.end })),
  };
}

/** Fallback gist when the AI can't write one: "What is it mostly about?" with other clips' titles as decoys. */
export function fallbackGist(title: string, decoyTitles: string[]): GistQuestion[] {
  const decoys = decoyTitles.filter((t) => t && t !== title).slice(0, 2);
  if (decoys.length < 2) return [];
  const options = [title, ...decoys];
  const k = title.length % 3;
  const rotated = options.slice(k).concat(options.slice(0, k));
  return [{ q: 'What is the recording mostly about?', options: rotated, correctIndex: rotated.indexOf(title) }];
}

/** Count students who caught the gist: at least 2 of 3 (or all if fewer questions). */
export function caughtGist(answers: Record<string, Record<number, number>>, questions: GistQuestion[], upTo: number): { caught: number; of: number } {
  const ids = Object.keys(answers);
  const need = Math.min(2, upTo);
  const caught = ids.filter((id) => {
    let right = 0;
    for (let i = 0; i < upTo; i++) if (answers[id][i] === questions[i]?.correctIndex) right++;
    return right >= need;
  }).length;
  return { caught, of: ids.length };
}

export interface ListeningClipOption { sourceType: string; id: string; title: string; cefr: string; ageBand: string; minutes: number }

const LEVEL_CEFR: Record<string, string[]> = { Beginner: ['A1', 'A2'], Easy: ['A1', 'A2'], Intermediate: ['A2', 'B1'], Advanced: ['B1', 'B2'], Expert: ['B2', 'C1'] };

/** Clips for the Listening flight, nearest the class level first. */
export function listeningClipsFor(entries: Array<{ sourceType: string; entry: Record<string, unknown> }>, difficulty: string): ListeningClipOption[] {
  const want = LEVEL_CEFR[difficulty] ?? [];
  return entries
    .map(({ sourceType, entry }) => {
      const pack = validPack(entry.listeningPack);
      const win = pack ? listeningWindow(pack, isKidsLevel(difficulty)) : null;
      return {
        sourceType,
        id: String(entry.id),
        title: String(entry.title),
        cefr: String(entry.cefr ?? ''),
        ageBand: String(entry.ageBand ?? ''),
        minutes: win ? Math.max(1, Math.round((win.end - win.start) / 60)) : 0,
      };
    })
    .filter((c) => c.minutes > 0)
    .sort((a, b) => Number(want.indexOf(b.cefr) >= 0) - Number(want.indexOf(a.cefr) >= 0) || a.title.localeCompare(b.title));
}
