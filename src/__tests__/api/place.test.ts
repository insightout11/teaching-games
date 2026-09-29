import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));

import { GET } from '@/app/api/live-room/place/route';

const get = (q: string) => GET(new Request(`http://x/api/live-room/place?${q}`));

describe('place route', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('names a pin at every level, area to country', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      display_name: 'Kitsilano, Vancouver, British Columbia, Canada',
      address: { neighbourhood: 'Kitsilano', city: 'Vancouver', state: 'British Columbia', country: 'Canada' },
    })));
    vi.stubGlobal('fetch', fetchMock);
    const data = await (await get('lat=49.26811&lng=-123.1629')).json();
    expect(data.levels).toEqual([
      { kind: 'area', label: 'Kitsilano, Vancouver' },
      { kind: 'city', label: 'Vancouver' },
      { kind: 'region', label: 'British Columbia' },
      { kind: 'country', label: 'Canada' },
    ]);
    // Rounded to ~100 m before leaving our server.
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('lat=49.268&lon=-123.163');
  });

  it('fails soft and rejects bad input', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 503 })));
    expect((await get('lat=1&lng=2')).status).toBe(502);
    expect((await get('lat=abc&lng=2')).status).toBe(400);
  });
});
