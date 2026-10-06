/**
 * Book upload → reading course (docs/book-upload-plan.md). Pure functions, run in the teacher's
 * browser after pdf.js / a .docx reader has produced each page's lines (text + print size). No AI:
 *  1. drop running headers/footers and page numbers;
 *  2. find headings (bigger print, or "Chapter / Part / numbered" lines; wrapped titles joined);
 *  3. rebuild paragraphs (rejoin broken lines and hyphenated words);
 *  4. split into chapters (front matter dropped);
 *  5. group chapters into lessons by the class level's word budget (short chapters 2–3 per
 *     lesson, long chapters split at paragraph breaks).
 */
export interface BookLine { text: string; size: number }
export interface BookPage { lines: BookLine[] }
export interface BookChapter { title: string; paragraphs: string[]; words: number }
export interface BookLesson { title: string; chapters: string[]; text: string; words: number }

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** A line's identity across pages: letters only, so "Alice's Adventures in Wonderland4" ≈ "…Wonderland56". */
const signature = (t: string) => t.toLowerCase().replace(/[^a-z]+/g, '');
const isPageNumber = (t: string) => /^\s*(\d{1,4}|[ivxlcdm]{1,7})\s*$/i.test(t);
/** Imprint lines (copyright page, publisher credits) are never story text. */
const isImprint = (t: string) => /^(first published|printed (and bound )?in|printed by|copyright|©|\(c\)|all rights reserved|isbn|published by)\b/i.test(t.trim());

/** 1. Remove running headers/footers (repeated near the top/bottom of many pages) and page numbers. */
export function stripRunningLines(pages: BookPage[]): BookPage[] {
  const EDGE = 2;
  const counts: Record<string, number> = {};
  pages.forEach((p) => {
    const edge = [...p.lines.slice(0, EDGE), ...p.lines.slice(-EDGE)];
    const seen = new Set<string>();
    edge.forEach((l) => {
      const sig = signature(l.text);
      if (sig.length >= 4 && !seen.has(sig)) { seen.add(sig); counts[sig] = (counts[sig] ?? 0) + 1; }
    });
  });
  const threshold = Math.max(3, Math.floor(pages.length * 0.2));
  return pages.map((p) => ({
    lines: p.lines.filter((l, i) => {
      const atEdge = i < EDGE || i >= p.lines.length - EDGE;
      if (isPageNumber(l.text) || isImprint(l.text)) return false;
      // The same line twice in a row on a page (e.g. a publisher's name) is a printing artefact.
      if (i > 0 && p.lines[i - 1].text.trim() === l.text.trim() && words(l.text) <= 4) return false;
      if (atEdge && (counts[signature(l.text)] ?? 0) >= threshold) return false;
      return l.text.trim().length > 0;
    }),
  }));
}

// Capitalised and followed by a number or name: "Chapter 3", "CHAPTER THREE", "Part Two" (never "part closed upon...").
const CHAPTER_WORD = /^(Chapter|CHAPTER|Part|PART|Book|BOOK|Section|SECTION)\s+([0-9]+|[IVXLC]+|[A-Z][a-zA-Z]+)\b/;
const NUMBERED_TITLE = /^(\d{1,3}|[IVXLC]{1,6})[.:)]\s+\S/;
const ROMAN_ALONE = /^[IVXLC]{1,6}\.?$/;

/** 2. Is this line a heading? Bigger print (vs the body text), or a chapter-like pattern that's short. */
export function isHeading(line: BookLine, bodySize: number): boolean {
  const t = line.text.trim();
  if (!t || words(t) > 12) return false;
  const big = bodySize > 0 && line.size >= bodySize * 1.2;
  const pattern = CHAPTER_WORD.test(t) || NUMBERED_TITLE.test(t) || ROMAN_ALONE.test(t);
  if (big) return true; // big print: a title, even in quotes ("‘Tiger! Tiger!’", "“Rikki-Tikki-Tavi”")
  // Normal-size pattern lines: never a dialogue fragment ("Wah!’").
  const dialogue = /^[‘'"“]/.test(t) || /[’'"”]$/.test(t);
  return pattern && !dialogue;
}

const endsSentence = (t: string) => /[.!?…:;]["'’”)\]]*$/.test(t.trim());

/** Join two lines of body text: rejoin a word hyphenated across the break, else a space. */
function joinLines(a: string, b: string): string {
  const left = a.replace(/\s+$/, '');
  const right = b.replace(/^\s+/, '');
  // "read-" + "ing" → "reading"; "MAR-" + "MALADE" → "MARMALADE" (same case on both sides).
  if (/[a-z]-$/.test(left) && /^[a-z]/.test(right)) return left.slice(0, -1) + right;
  if (/[A-Z]{2,}-$/.test(left) && /^[A-Z]{2,}/.test(right)) return left.slice(0, -1) + right;
  return `${left} ${right}`;
}

/** "T H E TA L E O F" → "THE TALE OF": letter-spaced display titles joined back into words. */
export function unspace(t: string): string {
  const tokens = t.trim().split(/\s+/);
  // Single letters only ("T H E TA L E"), so ordinary short words ("7. I Go to Bristol") never count.
  const singles = tokens.filter((x) => /^[A-Za-z]$/.test(x)).length;
  return tokens.length >= 4 && singles / tokens.length >= 0.7 ? tokens.join('').replace(/([a-z])([A-Z])/g, '$1 $2') : t;
}

/** Project Gutenberg files: keep only the book between the START and END markers (no licence). */
export function trimGutenberg(pages: BookPage[]): BookPage[] {
  const flat = pages.flatMap((p, i) => p.lines.map((l, j) => ({ i, j, t: l.text })));
  const start = flat.find((x) => /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG/i.test(x.t));
  const end = flat.find((x) => /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i.test(x.t));
  if (!start && !end) return pages;
  return pages.map((p, i) => ({
    lines: p.lines.filter((_, j) => {
      const afterStart = !start || i > start.i || (i === start.i && j > start.j);
      const beforeEnd = !end || i < end.i || (i === end.i && j < end.j);
      return afterStart && beforeEnd;
    }),
  }));
}

/** 3–4. Pages → chapters: headings start chapters; body lines become paragraphs. */
export function toChapters(rawPages: BookPage[]): BookChapter[] {
  const pages = stripRunningLines(trimGutenberg(rawPages)).map((p) => ({ lines: p.lines.map((l) => ({ ...l, text: unspace(l.text) })) }));
  const bodySize = median(pages.flatMap((p) => p.lines.filter((l) => words(l.text) >= 6).map((l) => l.size)));
  const lineLen = median(pages.flatMap((p) => p.lines.map((l) => l.text.trim().length)).filter((n) => n > 20));
  const chapters: Array<{ title: string; paragraphs: string[] }> = [{ title: '', paragraphs: [] }];
  let para = '';
  let lastWasHeading = false;
  const flush = () => { if (para.trim()) chapters[chapters.length - 1].paragraphs.push(para.trim()); para = ''; };

  pages.forEach((p) => p.lines.forEach((l) => {
    const t = l.text.replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (isHeading(l, bodySize)) {
      flush();
      const cur = chapters[chapters.length - 1];
      // Consecutive heading lines are one title ("Chapter I." + "Down the Rabbit-Hole"; a wrapped title).
      if (lastWasHeading && cur.paragraphs.length === 0) cur.title = /-$/.test(cur.title) ? `${cur.title}${t}` : `${cur.title} ${t}`.trim();
      else chapters.push({ title: t, paragraphs: [] });
      lastWasHeading = true;
      return;
    }
    lastWasHeading = false;
    para = para ? joinLines(para, t) : t;
    // A short line that ends a sentence closes the paragraph.
    if (endsSentence(t) && t.length < lineLen * 0.75) flush();
  }));
  flush();

  const out = chapters
    .map((c) => ({ title: tidyTitle(c.title), rawTitle: c.title, paragraphs: c.paragraphs, words: c.paragraphs.reduce((n, x) => n + words(x), 0) }))
    // Part headers with no text of their own go.
    .filter((c, i, all) => c.words >= 60 || (c.words > 0 && i > 0 && all.slice(0, i).some((x) => x.words >= 60)));
  // Short front matter (title page, preface) before real chapters isn't a lesson.
  const looksLikeChapter = (t: string) => CHAPTER_WORD.test(t) || NUMBERED_TITLE.test(t) || /^Chapter /.test(t);
  if (out.length > 2 && out[0].words < 400 && !looksLikeChapter(out[0].title) && out.slice(1, 4).some((c) => looksLikeChapter(c.title))) out.shift();
  return out.map(({ title, paragraphs, words: n }) => ({ title, paragraphs, words: n }));
}

function tidyTitle(t: string): string {
  let s = t.replace(/\s+/g, ' ').trim();
  // "PART ONE The Old Buccaneer 1. The Old Sea-dog…" → "1. The Old Sea-dog…" (the part name is a divider).
  const numbered = s.match(/^PART\s+\S+.*?\s((?:\d{1,3}|[IVXLC]{1,6})\.\s.*)$/i);
  if (numbered) s = numbered[1];
  return s.replace(/^(chapter)\s+/i, 'Chapter ').trim() || 'Opening';
}

/** Word budget per lesson by class level (owner decision). */
export const LESSON_WORDS: Record<string, { min: number; max: number }> = {
  Beginner: { min: 300, max: 600 },
  Easy: { min: 300, max: 600 },
  Intermediate: { min: 800, max: 1200 },
  Advanced: { min: 1500, max: 2500 },
  Expert: { min: 1500, max: 2500 },
};

/** 5. Group chapters into lessons: short chapters together (up to max), long chapters split at paragraphs. */
export function planLessons(chapters: BookChapter[], difficulty: string): BookLesson[] {
  const { min, max } = LESSON_WORDS[difficulty] ?? LESSON_WORDS.Intermediate;
  // Long chapters become parts first.
  const units: Array<{ title: string; chapter: string; paragraphs: string[]; words: number }> = [];
  chapters.forEach((c) => {
    if (c.words <= max) { units.push({ title: c.title, chapter: c.title, paragraphs: c.paragraphs, words: c.words }); return; }
    const parts = Math.ceil(c.words / max);
    const target = c.words / parts;
    let cur: string[] = [];
    let n = 0;
    let k = 1;
    c.paragraphs.forEach((p, i) => {
      cur.push(p);
      n += words(p);
      const last = i === c.paragraphs.length - 1;
      if ((n >= target && k < parts) || last) {
        units.push({ title: `${c.title} (part ${k})`, chapter: c.title, paragraphs: cur, words: n });
        cur = []; n = 0; k++;
      }
    });
  });
  // Then group consecutive units up to max, aiming past min.
  const lessons: BookLesson[] = [];
  let group: typeof units = [];
  const close = () => {
    if (!group.length) return;
    const titles = Array.from(new Set(group.map((u) => u.chapter)));
    const title = group.length === 1 ? group[0].title : `${group[0].title} – ${group[group.length - 1].title}`;
    lessons.push({ title, chapters: titles, text: group.flatMap((u) => u.paragraphs).join('\n\n'), words: group.reduce((n, u) => n + u.words, 0) });
    group = [];
  };
  units.forEach((u) => {
    const total = group.reduce((n, x) => n + x.words, 0);
    if (group.length && (total >= min || total + u.words > max)) close();
    group.push(u);
  });
  close();
  return lessons;
}
