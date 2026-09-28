import { describe, expect, it, vi } from 'vitest';
import { serperRequest, normalizeSerper, searchSerper, searchRequest } from '@/lib/sources/serper';
import { readSource } from '@/lib/sources/reader';
const request = { query: 'Japan', tab: 'web' as const, page: 0 };
describe('Serper adapter and reader', () => {
  it.each(['web', 'news'] as const)('maps %s without fabricating freshness or pagination', tab => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ link: `https://example.com/${i}`, title: 'Story', date: '2 hours ago', snippet: 'Passage' }));
    const result = normalizeSerper({ searchParameters: { safe: 'active' }, [tab === 'web' ? 'organic' : 'news']: rows }, { ...request, tab, page: 9 }, '2026-09-11T00:00:00Z');
    expect(result.results).toHaveLength(10); expect(result.results[0].publishedAt).toBeNull();
    expect(result.nextPage).toBeNull();
  });
  it('rejects malformed or unacknowledged filtering responses', () => {
    for (const data of [{ organic: [] }, { searchParameters: { safe: 'off' }, organic: [] }, { searchParameters: { safe: 'active' } }]) {
      expect(() => normalizeSerper(data, request, '2026-09-11T00:00:00Z')).toThrow('PROVIDER_RESPONSE_INVALID');
    }
    expect(normalizeSerper({ searchParameters: { safe: 'active' }, organic: [] }, request, '2026-09-11T00:00:00Z').results).toEqual([]);
  });
  it('uses one bounded POST with server-owned parameters', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ searchParameters: { safe: 'active' }, organic: [] })));
    await searchSerper(request, 'synthetic-token', fetcher);
    expect(fetcher).toHaveBeenCalledWith('https://google.serper.dev/search', expect.objectContaining({ method: 'POST', redirect: 'error', cache: 'no-store',
      headers: expect.objectContaining({ 'X-API-KEY': 'synthetic-token' }) }));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('owns filtering, language, freshness and pagination settings', () => {
    const outbound = serperRequest({ ...request, tab: 'news', page: 2 });
    expect(outbound.url).toBe('https://google.serper.dev/news');
    expect(outbound.body).toEqual({ q: 'Japan', num: 10, safe: 'active', hl: 'en', autocorrect: false, page: 3, tbs: 'qdr:w' });
    expect(serperRequest({ ...request, tab: 'images' }).body).not.toHaveProperty('page');
    expect(() => searchRequest({ ...request, tab: 'images', page: 1 })).toThrow('INVALID_PAGE');
    expect(serperRequest(searchRequest({ ...request, safe: 'off', gl: 'us', hl: 'xx' })).body).toMatchObject({safe: 'active', hl: 'en'});
  });
  it.each(['', 'x'.repeat(301), Array(52).fill('a').join(' ')])('rejects invalid query', query => {
    expect(() => searchRequest({ ...request, query })).toThrow('INVALID_QUERY');
  });
  it('keeps source/image URLs distinct, ignores discovery dates, and strips unsafe references', () => {
    const result = normalizeSerper({ searchParameters: { safe: 'active' }, images: [
      { title: '<b>Fuji</b>', link: 'https://example.com/article', page_fetched: '2026-09-11', imageUrl: 'https://images.example.com/fuji.jpg' },
      { title: 'Bad', link: 'http://127.0.0.1', imageUrl: 'https://images.example.com/fuji.jpg' },
    ] }, { ...request, tab: 'images' }, '2026-09-11T00:00:00Z');
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ title: 'Fuji', url: 'https://example.com/article', publishedAt: null, imageUrl: 'https://images.example.com/fuji.jpg' });
    expect(result.nextPage).toBeNull();
  });
  it('does not retry provider throttling or return its error body', async () => {
    const fetcher = vi.fn(async () => new Response('private provider detail', { status: 429 }));
    await expect(searchSerper(request, 'synthetic-token', fetcher)).rejects.toThrow('PROVIDER_RATE_LIMIT');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]).toBeDefined();
  });
  it('returns an honest HTML extraction fallback without returning source HTML', async () => {
    const result = await readSource('https://example.com', async () => ({ finalUrl: 'https://example.com/article', mime: 'text/html', text: '<script>secret()</script>' }), null);
    expect(result).toMatchObject({ status: 'unavailable', reason: 'ARTICLE_EXTRACTOR_UNAVAILABLE', text: '', publishedAt: null });
  });
  it('caps extracted text and preserves extraction status', async () => {
    const result = await readSource('https://example.com', async () => ({ finalUrl: 'https://example.com/article', mime: 'text/html', text: '<p>article</p>' }),
      async () => ({ title: 'Article', text: 'a'.repeat(14000), publisher: 'Source', publishedAt: null }));
    expect(result.text).toHaveLength(12000); expect(result.status).toBe('extracted');
  });
});
