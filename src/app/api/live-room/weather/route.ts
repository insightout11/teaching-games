import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { fromWeatherCode, type LiveWeather } from '@/lib/live-room/live-weather';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live-room/weather?lat=..&lng=..
 * Real current weather under the Live Room plane, from Open-Meteo (free, no
 * key). Positions are rounded to half a degree and responses cached for ten
 * minutes, so a whole class flight makes only a handful of upstream calls.
 */
export async function GET(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }
  const rlat = Math.round(lat * 2) / 2;
  const rlng = Math.round(lng * 2) / 2;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${rlat}&longitude=${rlng}&current=weather_code,cloud_cover,wind_speed_10m,is_day&timezone=auto`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 });
    const data = await res.json();
    const c = data?.current ?? {};
    const cloudCover = Math.max(0, Math.min(100, Number(c.cloud_cover) || 0));
    const { condition, label } = fromWeatherCode(Number(c.weather_code) || 0, cloudCover, rlat, c.is_day !== 0);
    const offset = Number(data?.utc_offset_seconds);
    const out: LiveWeather = {
      condition, cloudCover, windKph: Math.round(Number(c.wind_speed_10m) || 0), label,
      ...(Number.isFinite(offset) ? { utcOffsetSeconds: offset } : {}),
    };
    return NextResponse.json(out, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 });
  }
}
