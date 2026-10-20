import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live-room/iss
 * Where the International Space Station is right now (wheretheiss.at: free, no key), and whether it is in sunlight
 * (only then can it be seen from a dark sky below). Cached for 20 seconds.
 */
export async function GET() {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', { next: { revalidate: 20 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json({ error: 'Unavailable' }, { status: 502 });
    const d = await res.json() as { latitude?: number; longitude?: number; altitude?: number; visibility?: string };
    if (!Number.isFinite(d.latitude) || !Number.isFinite(d.longitude)) return NextResponse.json({ error: 'Unavailable' }, { status: 502 });
    return NextResponse.json({ lat: d.latitude, lng: d.longitude, altitudeKm: Math.round(d.altitude ?? 420), sunlit: d.visibility === 'daylight' });
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 502 });
  }
}
