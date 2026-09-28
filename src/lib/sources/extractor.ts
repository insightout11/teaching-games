import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { assertSource } from './validation';
import type { ArticleExtractor } from './reader';

/** Parse supplied bytes only: never fromURL, runScripts or resources:usable. */
export const extractArticle: ArticleExtractor = async (html, finalUrl) => {
  assertSource(Buffer.byteLength(html, 'utf8') <= 2 * 1024 * 1024, 'SOURCE_TOO_LARGE', 413);
  // Reject pathological element density before allocating a DOM. Readability
  // also checks the actual parsed node count. Neither limit executes page code.
  assertSource((html.match(/</g)?.length ?? 0) <= 20_000, 'SOURCE_TOO_COMPLEX', 422);
  const dom = new JSDOM(html, { url: finalUrl, contentType: 'text/html', virtualConsole: new VirtualConsole() });
  try {
    const document = dom.window.document;
    const reportedDate = document.querySelector('meta[property="article:published_time"], meta[name="datePublished"]')?.getAttribute('content') ?? null;
    const parsed = new Readability(document, { maxElemsToParse: 20_000, charThreshold: 150 }).parse();
    if (!parsed?.textContent?.trim() || parsed.textContent.trim().length < 100) return null;
    return { title: parsed.title ?? '', text: parsed.textContent.trim(), publisher: parsed.siteName ?? null,
      publishedAt: reportedDate && /^\d{4}-\d{2}-\d{2}(T|$)/.test(reportedDate) ? reportedDate : null };
  } finally { dom.window.close(); }
};
