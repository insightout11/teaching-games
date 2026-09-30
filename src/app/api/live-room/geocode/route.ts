import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live-room/geocode?q=Mount Agung, Bali
 * Finds coordinates for a place name so a shown place always opens on OUR map
 * (search results sometimes carry only an address). OpenStreetMap Nominatim
 * search, one result, cached a day — occasional teacher clicks only.
 */
export async function GET(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 200);
  if (q.length < 2) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  // Search results often carry very specific addresses that OSM won't match
  // exactly, so widen step by step: full text → name + last two parts
  // (region, country) → name alone.
  const parts = q.split(',').map((p) => p.trim()).filter(Boolean);
  const tries = Array.from(new Set([
    q,
    parts.length > 3 ? [parts[0], ...parts.slice(-2)].join(', ') : '',
    parts[0] ?? '',
  ].filter((t) => t.length >= 2)));

  try {
    for (const attempt of tries) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(attempt)}`,
        { headers: { 'User-Agent': 'LessonCaptain/1.0 (https://www.lessoncaptain.com)' }, next: { revalidate: 86400 } },
      );
      if (!res.ok) return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 502 });
      const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
      const hit = data?.[0];
      const lat = Number(hit?.lat);
      const lng = Number(hit?.lon);
      if (hit && Number.isFinite(lat) && Number.isFinite(lng)) {
        return NextResponse.json({ point: { lat, lng }, name: hit.display_name ?? null });
      }
    }
    return NextResponse.json({ point: null });
  } catch {
    return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 502 });
  }
}
