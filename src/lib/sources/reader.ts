import { fetchPublicText, publicUrl } from './public-fetch';
import type { ReaderResponse } from './types';
/** Readability/jsdom adapter: never execute scripts or load subresources. */

export type ArticleExtractor = (html: string, finalUrl: string) => Promise<{
  title: string;
  text: string;
  publisher: string | null;
  publishedAt: string | null;
} | null>;

/**
 * jsdom is heavy and has broken module loading on the server before, so it loads
 * only when an article is actually read: search must never depend on it.
 */
const lazyExtractArticle: ArticleExtractor = async (html, finalUrl) => {
  const { extractArticle } = await import('./extractor');
  return extractArticle(html, finalUrl);
};

export async function readSource(url: string, fetcher = fetchPublicText, extractor: ArticleExtractor | null = lazyExtractArticle): Promise<ReaderResponse> {
  const originalUrl = publicUrl(url).href;
  const document = await fetcher(originalUrl);
  const base = {
    originalUrl, finalUrl: document.finalUrl, title: new URL(document.finalUrl).hostname,
    publisher: null, publishedAt: null, retrievedAt: new Date().toISOString()
  };
  if (document.mime === 'text/plain')
    return { ...base, text: document.text.slice(0, 12000), status: 'plain-text', reason: null };
  // Explicit unavailable adapter is useful for fixtures and degraded deployments.
  if (!extractor)
    return { ...base, text: '', status: 'unavailable', reason: 'ARTICLE_EXTRACTOR_UNAVAILABLE' };
  const result = await extractor(document.text, document.finalUrl);
  if (!result?.text.trim())
    return { ...base, text: '', status: 'unavailable', reason: 'NO_READABLE_TEXT' };
  return {
    ...base, title: result.title.slice(0, 300) || base.title, text: result.text.slice(0, 12000),
    publisher: result.publisher?.slice(0, 200) ?? null,
    publishedAt: result.publishedAt && Number.isFinite(Date.parse(result.publishedAt)) ? new Date(result.publishedAt).toISOString() : null,
    status: 'extracted', reason: null
  };
}
