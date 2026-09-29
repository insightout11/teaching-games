import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live-room/place?lat=..&lng=..
 * Names a map point at every level (area, city, region, country) so a class
 * pin can become the topic at the level the teacher chooses. OpenStreetMap
 * Nominatim reverse geocoding; the point is rounded to ~100 m first and each
 * answer is cached, well within Nominatim's usage policy for occasional clicks.
 */
interface Level { kind: 'area' | 'city' | 'region' | 'country'; label: string }

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
  const rlat = lat.toFixed(3);
  const rlng = lng.toFixed(3);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${rlat}&lon=${rlng}&zoom=14&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'LessonCaptain/1.0 (https://www.lessoncaptain.com)' }, next: { revalidate: 86400 } },
    );
    if (!res.ok) return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 502 });
    const data = await res.json();
    const a = (data?.address ?? {}) as Record<string, string | undefined>;
    const area = a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district ?? a.borough ?? a.village ?? a.hamlet;
    const city = a.city ?? a.town ?? a.municipality ?? a.village;
    const region = a.state ?? a.province ?? a.region ?? a.county;
    const country = a.country;
    const levels: Level[] = [];
    if (area && area !== city) levels.push({ kind: 'area', label: city ? `${area}, ${city}` : area });
    if (city) levels.push({ kind: 'city', label: city });
    if (region && region !== city) levels.push({ kind: 'region', label: region });
    if (country) levels.push({ kind: 'country', label: country });
    const water = !country && typeof data?.name === 'string' && data.name ? data.name as string : null;
    if (!levels.length && water) levels.push({ kind: 'region', label: water });
    return NextResponse.json({ levels, name: (data?.display_name as string | undefined) ?? null });
  } catch {
    return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 502 });
  }
}
