import { describe, expect, it, vi } from 'vitest';
import { mediaSerperRequest, normalizeSerperMedia, searchSerperMedia } from '@/lib/sources/serper-media';
import { fetchSerperJSON } from '@/lib/sources/serper';

const request = { surface: 'videos' as const, query: 'Japan', page: 0 };

const video = { title: '<b>Japan</b>', link: 'https://youtu.be/2ag4dKkL-pM', imageUrl: 'https://example.com/thumb.jpg', duration: '2:30', date: 'yesterday' };

const data = { searchParameters: { safe: 'active' }, videos: [video] };
describe('five-surface Serper media adapter', () => {
  it.each(['places', 'videos'] as const)('sets server-owned fields and no pagination for %s', surface => {
    expect(mediaSerperRequest({ ...request, surface, safe: 'off', gl: 'us', location: 'private' } as typeof request)).toEqual({
      url: `https://google.serper.dev/${surface}`, body: { q: 'Japan', num: 10, hl: 'en', safe: 'active', autocorrect: false }
    });
    expect(() => mediaSerperRequest({ ...request, surface, page: 1 })).toThrow('INVALID_PAGE');
  });
  it('normalizes video without inventing dates or evidence from snippets', () => {
    const result = normalizeSerperMedia(data, request, '2026-09-12T00:00:00.000Z');
    expect(result.items[0]).toMatchObject({
      kind: 'video', result: {
        title: 'Japan', durationSeconds: 150, publishedAt: null,
        playback: { provider: 'youtube', videoId: '2ag4dKkL-pM' }
      }
    });
    expect(result.nextPage).toBeNull();
    expect(result.filtering).toBe('strict');
    expect(JSON.stringify(result)).not.toContain('snippet');
  });
  it('requires video filter acknowledgement and collection shape', () => {
    expect(() => normalizeSerperMedia({ videos: [video] }, request, '')).toThrow('PROVIDER_RESPONSE_INVALID');
    expect(() => normalizeSerperMedia({ searchParameters: { safe: 'active' }, videos: {} }, request, '')).toThrow();
  });
  it('filters unsafe URLs, deduplicates and keeps unsupported videos as reference-only', () => {
    const result = normalizeSerperMedia({ ...data, videos: [video, video, { ...video, link: 'http://127.0.0.1' }, { ...video, link: 'https://example.com/video', imageUrl: 'javascript:alert(1)', duration: 200 }] }, request, '');
    expect(result.items).toHaveLength(2);
    expect(result.items[1]).toMatchObject({ kind: 'video', result: { playback: null, thumbnailUrl: null, durationSeconds: null } });
  });
  it('maps places with coordinates and address; cid is not a Google Place ID', () => {
    const result = normalizeSerperMedia({ places: [{ title: 'Fuji', address: 'Japan', latitude: 35, longitude: 138, cid: '1234', website: 'http://localhost' }] }, { ...request, surface: 'places' }, '');
    expect(result.filtering).toBe('not-applicable');
    expect(result.items[0]).toMatchObject({ kind: 'place', result: { coordinates: { latitude: 35, longitude: 138 }, websiteUrl: null, providerPlaceId: 'serper:cid:1234' } });
    expect(JSON.stringify(result)).not.toContain('query_place_id');
  });
  it('invalid coordinates remain unknown instead of becoming zero', () => {
    const result = normalizeSerperMedia({ places: [{ title: 'Somewhere', latitude: 99, longitude: '0' }] }, { ...request, surface: 'places' }, '');
    expect(result.items[0]).toMatchObject({ result: { coordinates: null } });
  });
  it('uses bounded fixed-endpoint transport and never follows redirects', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
    await searchSerperMedia(request, 'synthetic-only', fetcher);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://google.serper.dev/videos', expect.objectContaining({ redirect: 'error', cache: 'no-store', method: 'POST' }));
    await expect(fetchSerperJSON({ url: 'https://attacker.test', body: {} }, 'synthetic-only', fetcher)).rejects.toThrow('INVALID_PROVIDER_ENDPOINT');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not retry provider failures, oversized data or invalid JSON', async () => {
    for (const response of [new Response('', { status: 429 }), new Response('x'.repeat(1000001)), new Response('not JSON')]) {
      const fetcher = vi.fn().mockResolvedValue(response);
      await expect(searchSerperMedia(request, 'synthetic-only', fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
});
