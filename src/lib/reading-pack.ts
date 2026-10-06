/**
 * Reading flight (docs/reading-flight-concept.md): book = course, chapter = lesson. A reading
 * pack holds one lesson's checked content for one level: passages (read aloud in turns, each with
 * a gist tap), the prediction, the 3-question check, 5 words, the cast and a talk question.
 * Library books get packs from Codex (round 15); otherwise the AI writes the same shape from the
 * lesson's text and it must pass the same checks.
 */
export interface ReadingQuestion { q: string; options: string[]; correctIndex: number }
export interface ReadingPack {
  passages: Array<{ text: string; gist?: ReadingQuestion }>;
  predict?: { q: string; options: string[]; outcomeIndex: number };
  check: ReadingQuestion[];
  words: Array<{ word: string; meaning: string }>;
  cast: Array<{ name: string; who: string }>;
  talk?: string;
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function validQuestion(v: unknown): ReadingQuestion | null {
  const x = v as { q?: unknown; options?: unknown; correctIndex?: unknown } | null;
  if (!x || !str(x.q) || !Array.isArray(x.options)) return null;
  const options = x.options.map((o) => str(o, 160)).filter(Boolean);
  if (options.length < 2 || options.length > 4 || new Set(options).size !== options.length) return null;
  if (typeof x.correctIndex !== 'number' || x.correctIndex < 0 || x.correctIndex >= options.length) return null;
  return { q: str(x.q, 200), options, correctIndex: x.correctIndex };
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Accept a pack whose passages rebuild the lesson text (when given) and whose questions are well-formed. */
export function validReadingPack(raw: unknown, text?: string): ReadingPack | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || !Array.isArray(r.passages)) return null;
  const passages = r.passages
    .map((p) => p as Record<string, unknown>)
    .map((p) => ({ text: str(p.text, 2000), gist: validQuestion(p.gist) ?? undefined }))
    .filter((p) => p.text);
  if (passages.length < 2) return null;
  if (text && norm(passages.map((p) => p.text).join(' ')) !== norm(text)) return null;
  const pr = r.predict as { q?: unknown; options?: unknown; outcomeIndex?: unknown } | undefined;
  const predictQ = pr ? validQuestion({ q: pr.q, options: pr.options, correctIndex: pr.outcomeIndex }) : null;
  const check = (Array.isArray(r.check) ? r.check : []).map(validQuestion).filter((q): q is ReadingQuestion => !!q).slice(0, 3);
  const words = (Array.isArray(r.words) ? r.words : []).map((w) => w as Record<string, unknown>)
    .map((w) => ({ word: str(w.word, 40), meaning: str(w.meaning, 120) })).filter((w) => w.word && w.meaning).slice(0, 5);
  const cast = (Array.isArray(r.cast) ? r.cast : []).map((c) => c as Record<string, unknown>)
    .map((c) => ({ name: str(c.name, 40), who: str(c.who, 80) })).filter((c) => c.name).slice(0, 10);
  const talk = str(r.talk, 160);
  return {
    passages,
    ...(predictQ ? { predict: { q: predictQ.q, options: predictQ.options, outcomeIndex: predictQ.correctIndex } } : {}),
    check,
    words,
    cast,
    ...(talk ? { talk } : {}),
  };
}

/** A1–A2 classes read the A2 retelling; everyone else the B1 one. */
export function bookLevelFor(difficulty: string): 'A2' | 'B1' {
  return difficulty === 'Beginner' || difficulty === 'Easy' ? 'A2' : 'B1';
}

/** No pack and no AI: split the text into passages of whole sentences (no questions). */
export function fallbackPassages(text: string, perPassage = 3): Array<{ text: string }> {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["'’”)\]]*\s*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const out: Array<{ text: string }> = [];
  for (let i = 0; i < sentences.length; i += perPassage) out.push({ text: sentences.slice(i, i + perPassage).join(' ') });
  return out;
}

/** Count students who caught the chapter: at least 2 of the 3 check questions right. */
export function caughtChapter(answers: Record<string, Record<number, number>>, check: ReadingQuestion[], offset: number): { caught: number; of: number } {
  const ids = Object.keys(answers);
  const need = Math.min(2, check.length);
  const caught = ids.filter((id) => check.filter((q, i) => answers[id][offset + i] === q.correctIndex).length >= need).length;
  return { caught, of: ids.length };
}
