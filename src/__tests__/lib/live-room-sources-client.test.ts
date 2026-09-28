import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSource, searchSources, SourcesError, sourcesMessage } from '@/components/session/live-room/sources-client';

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300, json: async () => body });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('live room sources client', () => {
  it('maps each search surface to room items', async () => {
    const fetchFn = mockFetch(200, {
      items: [
        { kind: 'reference', surface: 'images', result: { id: 'i1', title: 'Stadium', url: 'https://a.com/p', description: '', publisher: null, publishedAt: null, imageUrl: 'https://a.com/i.jpg' } },
        { kind: 'reference', surface: 'news', result: { id: 'n1', title: 'News', url: 'https://b.com', description: 'd', publisher: 'BBC', publishedAt: null, imageUrl: null } },
        { kind: 'place', result: { id: 'p1', title: 'Azteca', address: 'Mexico City', coordinates: { latitude: 19.3, longitude: -99.15 }, referenceUrl: 'https://maps', websiteUrl: null, providerPlaceId: null } },
        { kind: 'video', result: { id: 'v1', title: 'Clip', referenceUrl: 'https://youtu.be/abcdefghijk', publisher: null, publishedAt: null, durationSeconds: null, thumbnailUrl: null, playback: { provider: 'youtube', videoId: 'abcdefghijk' } } },
      ],
    });
    const items = await searchSources('s1', 'web', 'world cup');
    expect(fetchFn).toHaveBeenCalledWith('/api/sessions/s1/sources/search', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ surface: 'web', query: 'world cup', page: 0 });
    expect(items.map((i) => i.kind)).toEqual(['image', 'news', 'place', 'video']);
    expect(items[2].coordinates).toEqual({ latitude: 19.3, longitude: -99.15 });
    expect(items[3].videoId).toBe('abcdefghijk');
  });

  it('treats a missing API (404) as disabled', async () => {
    mockFetch(404, null);
    await expect(searchSources('s1', 'web', 'x')).rejects.toMatchObject({ code: 'SOURCES_DISABLED' });
  });

  it('surfaces API error codes with teacher-friendly copy', async () => {
    mockFetch(429, { error: 'SOURCE_LIMIT' });
    const err = await searchSources('s1', 'news', 'x').catch((e) => e);
    expect(err).toBeInstanceOf(SourcesError);
    expect(sourcesMessage(err.code)).toMatch(/Daily search limit/);
  });

  it('rejects unreadable articles', async () => {
    mockFetch(200, { originalUrl: 'https://a.com', finalUrl: 'https://a.com', title: '', text: '', publisher: null, status: 'unavailable' });
    await expect(readSource('s1', 'https://a.com')).rejects.toMatchObject({ code: 'NO_READABLE_TEXT' });
  });
});
