import { createHash } from 'node:crypto';
import { assertSource, object, SourceError } from './validation';
import { publicUrl } from './public-fetch';
import type { SearchRequest, SearchResponse, SourceResult } from './types';

export function searchRequest(input: unknown): SearchRequest {
  object(input);
  assertSource(typeof input.query === 'string', 'INVALID_QUERY');
  const query = input.query.trim();
  assertSource(query.length > 0 && query.length <= 300 && query.split(/\s+/).length <= 50, 'INVALID_QUERY');
  assertSource(['web', 'images', 'news'].includes(String(input.tab)), 'INVALID_TAB');
  const page = input.page ?? 0;
  assertSource(Number.isInteger(page) && Number(page) >= 0 && Number(page) <= 9 &&
    (input.tab !== 'images' || page === 0), 'INVALID_PAGE');
  return { query, tab: input.tab as SearchRequest['tab'], page: Number(page) };
}

const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').slice(0, limit) : '';

const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

function url(value: unknown): string | null {
  try {
    return publicUrl(value).href;
  } catch {
    return null;
  }
}

function date(value: unknown): string | null {
  // Only supplied absolute timestamps; never age/page_fetched/discovery time.
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value) && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString() : null;
}

export function normalizeSerper(input: unknown, request: SearchRequest, retrievedAt: string): SearchResponse {
  const data = obj(input);
  // Do not label a response strictly filtered unless the provider acknowledges
  // the setting. Live acceptance must still establish its actual behavior.
  assertSource(obj(data.searchParameters).safe === 'active', 'PROVIDER_RESPONSE_INVALID', 502);
  const supplied = data[request.tab === 'web' ? 'organic' : request.tab];
  assertSource(Array.isArray(supplied), 'PROVIDER_RESPONSE_INVALID', 502);
  const collection = supplied as unknown[];
  const results: SourceResult[] = [];
  const seen = new Set<string>();
  for (const item of collection.slice(0, 10)) {
    const raw = obj(item), original = url(raw.link);
    const image = request.tab === 'images' ? url(raw.imageUrl) : null;
    if (!original || (request.tab === 'images' && !image) || seen.has(original + image))
      continue;
    seen.add(original + image);
    results.push({
      id: createHash('sha256').update(original + (image ?? '')).digest('hex'),
      title: clean(raw.title, 300) || new URL(original).hostname,
      url: original, description: clean(raw.snippet, 1500),
      publisher: clean(raw.source ?? raw.domain, 200) || new URL(original).hostname,
      publishedAt: date(raw.date), imageUrl: image
    });
  }
  // Serper's public examples provide no authoritative next-page signal.
  // A full page is not proof of another page; conservatively offer no Next.
  // Do not probe a second paid page or invent a moreResults field.
  return {
    ...request, results, nextPage: null,
    strictFiltering: true, filtered: false,
    retrievedAt
  };
}

export function serperRequest(input: SearchRequest) {
  const request = searchRequest(input);
  return {
    url: `https://google.serper.dev/${request.tab === 'web' ? 'search' : request.tab}`,
    body: {
      q: request.query, num: 10, safe: 'active', hl: 'en', autocorrect: false,
      // No caller country/location. Omitting gl is NOT a verified global mode;
      // deployment must verify provider geography behavior before enabling search.
      ...(request.tab === 'images' ? {} : { page: request.page + 1 }),
      ...(request.tab === 'news' ? { tbs: 'qdr:w' } : {})
    },
  };
}

export async function searchSerper(request: SearchRequest, token: string, fetcher = fetch): Promise<SearchResponse> {
  const outbound = serperRequest(request);
  return normalizeSerper(await fetchSerperJSON(outbound, token, fetcher), searchRequest(request), new Date().toISOString());
}
/** Fixed provider endpoints only; shared bounded transport, no retries/refunds. */

export async function fetchSerperJSON(outbound: {
  url: string;
  body: object;
}, token: string, fetcher = fetch): Promise<unknown> {
  assertSource(/^https:\/\/google\.serper\.dev\/(search|images|news|places|videos)$/.test(outbound.url), 'INVALID_PROVIDER_ENDPOINT');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetcher(outbound.url, {
      method: 'POST', body: JSON.stringify(outbound.body),
      signal: controller.signal, redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-API-KEY': token }
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new SourceError(response.status === 429 ? 'PROVIDER_RATE_LIMIT' : 'PROVIDER_UNAVAILABLE', response.status === 429 ? 429 : 502);
    }
    assertSource(response.body, 'PROVIDER_RESPONSE_INVALID', 502);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done)
          break;
        size += value.length;
        if (size > 1000000) {
          await reader.cancel();
          throw new SourceError('PROVIDER_RESPONSE_TOO_LARGE', 502);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof SourceError)
      throw error;
    throw new SourceError('PROVIDER_UNAVAILABLE', 502);
  } finally {
    clearTimeout(timer);
  }
}
