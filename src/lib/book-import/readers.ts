'use client';

import type { BookLine, BookPage } from './index';
import { linesFromTextItems, type TextItem } from './pdf-lines';

/**
 * Browser-only readers: a teacher's file → BookPage[] for the book import. Libraries load from
 * cdnjs on demand (no package install, nothing sent to our server while reading):
 *  - PDF: pdf.js text layer with print sizes (headings found by size);
 *  - Word: mammoth → HTML, headings (h1–h3) kept as bigger lines;
 *  - text: paragraphs; "Chapter …" lines become headings by pattern.
 */
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';
const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js';

interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: TextItem[] }> }> }> };
}

export type ReadProgress = (done: number, total: number) => void;

export async function readPdf(file: File, onProgress?: ReadProgress): Promise<BookPage[]> {
  const pdfjs = (await import(/* webpackIgnore: true */ PDFJS)) as PdfJs;
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: BookPage[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const tc = await (await pdf.getPage(n)).getTextContent();
    pages.push({ lines: linesFromTextItems(tc.items) });
    onProgress?.(n, pdf.numPages);
  }
  return pages;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

/** Word: headings → bigger lines; each paragraph → one line ending its paragraph. One "page" per ~40 lines. */
export async function readDocx(file: File): Promise<BookPage[]> {
  await loadScript(MAMMOTH);
  const mammoth = (window as unknown as { mammoth: { convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> } }).mammoth;
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const doc = new DOMParser().parseFromString(value, 'text/html');
  const lines: BookLine[] = [];
  doc.body.querySelectorAll('h1, h2, h3, p, li').forEach((el) => {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    lines.push({ text, size: /^H[1-3]$/.test(el.tagName) ? 20 : 10, para: true });
  });
  return paginate(lines);
}

/** Plain text: blank-line paragraphs; short "Chapter …" lines are picked up by the heading patterns. */
export async function readTxt(file: File): Promise<BookPage[]> {
  const text = (await file.text()).replace(/\r/g, '');
  const lines: BookLine[] = text.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map((t) => ({ text: t, size: 10, para: true }));
  return paginate(lines);
}

function paginate(lines: BookLine[]): BookPage[] {
  const pages: BookPage[] = [];
  for (let i = 0; i < lines.length; i += 40) pages.push({ lines: lines.slice(i, i + 40) });
  return pages;
}

export async function readBookFile(file: File, onProgress?: ReadProgress): Promise<BookPage[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return readPdf(file, onProgress);
  if (name.endsWith('.docx')) return readDocx(file);
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return readTxt(file);
  throw new Error('Please choose a PDF, Word (.docx) or text (.txt) file.');
}
