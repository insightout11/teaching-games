import type { BookLine, BookPage } from './index';
import type { RawPageRead } from './page-reader';

/**
 * Scanned books: decide when a file needs its pages read by the AI, check each page result, and turn
 * results into the same BookPage lines the PDF/Word readers produce (so chapters, lessons, picture
 * books, Simplified and Previously all work unchanged).
 */

/** A PDF needs reading when its own text layer is (almost) empty: a scan with no hidden text. */
export function needsReading(pages: BookPage[]): boolean {
  if (pages.length === 0) return false;
  const counts = pages.map((p) => p.lines.reduce((n, l) => n + (l.text.trim() ? l.text.trim().split(/\s+/).length : 0), 0));
  const withText = counts.filter((n) => n >= 5).length;
  return withText < pages.length * 0.3;
}

export interface PageRead { text: string; heading: string; readable: boolean }

const REFUSAL = /^(i('m| am) (sorry|unable)|i can(no|')t|as an ai|the image (shows|contains|depicts)|this (image|page) (shows|contains|depicts))/i;

/** Accept one page's result: real words (not OCR noise), a page-sized length, no refusal or picture description. */
export function validPageRead(raw: RawPageRead | undefined): PageRead | null {
  if (!raw || typeof raw !== 'object') return null;
  const text = typeof raw.text === 'string' ? raw.text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() : '';
  const heading = typeof raw.heading === 'string' ? raw.heading.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  // Drop-cap openings printed in capitals ("HE found", "AND rushed") read as normal words.
  const fixed = text
    // A word split at a line end that kept its hyphen and a space ("Cot- ton-tail", "some- thing").
    .replace(/([a-z])- ([a-z])/g, '$1$2')
    .replace(/(^|\n\n)([A-Z])([A-Z]+)(?=[,;]? [a-z])/g, (_, a: string, b: string, c: string) => a + b + c.toLowerCase());
  if (raw.readable === false) return { text: '', heading: '', readable: false };
  if (REFUSAL.test(fixed)) return null;
  const tokens = fixed.split(/\s+/).filter(Boolean);
  if (tokens.length > 900) return null;
  if (tokens.length >= 5) {
    const wordy = tokens.filter((t) => /^[^A-Za-z]*[A-Za-z][A-Za-z'’-]*[^A-Za-z]*$/.test(t)).length;
    if (wordy / tokens.length < 0.7) return null;
  }
  return { text: fixed, heading, readable: true };
}

/** A read page → BookPage lines: the heading in bigger print, each paragraph a whole-paragraph line. */
export function readToBookPage(r: PageRead | null): BookPage {
  if (!r || !r.readable) return { lines: [] };
  const lines: BookLine[] = [];
  const paras = r.text.split(/\n\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  // The model sometimes repeats the heading as the first line of text; keep it once.
  if (r.heading) {
    lines.push({ text: r.heading, size: 20, para: true });
    if (paras[0] && paras[0].toLowerCase() === r.heading.toLowerCase()) paras.shift();
  }
  // The last paragraph runs on to the next page unless it ends a sentence (so page breaks don't split it).
  paras.forEach((t, i) => lines.push({ text: t, size: 10, para: i < paras.length - 1 || /[.!?…:;]["'’”)\]]*$/.test(t) }));
  return { lines };
}

/** Batches of page numbers for the reading calls (each call well under the 60s limit). */
export function readBatches(pageNumbers: number[], size = 5): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < pageNumbers.length; i += size) out.push(pageNumbers.slice(i, i + size));
  return out;
}

/**
 * Some picture books print a line of the story under each picture. If a page's whole text already appears on
 * the page before or after, it's a caption: keep the page as a picture, so the line isn't read twice.
 */
export function dropRepeatedCaptions(reads: Array<PageRead | null>): Array<PageRead | null> {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  const texts = reads.map((r) => (r?.readable ? norm(r.text) : ''));
  return reads.map((r, i) => {
    const t = texts[i];
    if (!r || !t || t.split(' ').length > 40) return r;
    const near = [texts[i - 1], texts[i + 1]].filter((x): x is string => !!x && x.length > t.length);
    return near.some((x) => x.includes(t)) ? { ...r, text: '' } : r;
  });
}
