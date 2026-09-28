import { fetchPublicText, publicUrl } from './public-fetch';
import type { ReaderResponse } from './types';
import { extractArticle } from './extractor';
/** Readability/jsdom adapter: never execute scripts or load subresources. */

export type ArticleExtractor = (html: string, finalUrl: string) => Promise<{
  title: string;
  text: string;
  publisher: string | null;
  publishedAt: string | null;
} | null>;

export async function readSource(url: string, fetcher = fetchPublicText, extractor: ArticleExtractor | null = extractArticle): Promise<ReaderResponse> {
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
