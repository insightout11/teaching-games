import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));

import { GET } from '@/app/api/live-room/weather/route';
import { fromWeatherCode } from '@/lib/live-room/live-weather';

const get = (q: string) => GET(new Request(`http://x/api/live-room/weather?${q}`));

describe('live weather', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('maps weather codes onto World Flight conditions', () => {
    expect(fromWeatherCode(0, 5, 40, true)).toEqual({ condition: 'clear', label: 'clear skies' });
    expect(fromWeatherCode(2, 45, 40, true)).toEqual({ condition: 'clear', label: 'partly cloudy' });
    expect(fromWeatherCode(3, 95, 40, true).condition).toBe('overcast');
    expect(fromWeatherCode(61, 90, 40, true)).toEqual({ condition: 'rain', label: 'rain' });
    expect(fromWeatherCode(73, 90, 60, true).condition).toBe('snow');
    expect(fromWeatherCode(95, 100, 10, true).condition).toBe('storm');
    expect(fromWeatherCode(0, 10, 68, false).condition).toBe('aurora');
    expect(fromWeatherCode(0, 10, 30, false).condition).toBe('clear');
  });

  it('asks Open-Meteo for a rounded position and returns the condition', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ current: { weather_code: 63, cloud_cover: 98, wind_speed_10m: 22.4, is_day: 1 } })));
    vi.stubGlobal('fetch', fetchMock);
    const data = await (await get('lat=37.56&lng=126.97')).json();
    expect(data).toEqual({ condition: 'rain', cloudCover: 98, windKph: 22, label: 'heavy rain' });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('latitude=37.5&longitude=127');
  });

  it('fails soft when the weather service is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    expect((await get('lat=1&lng=2')).status).toBe(502);
  });

  it('rejects bad coordinates', async () => {
    expect((await get('lat=95&lng=0')).status).toBe(400);
  });
});
