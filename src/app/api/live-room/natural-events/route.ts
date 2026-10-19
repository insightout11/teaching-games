import { NextResponse } from 'next/server';
import type { NaturalEvent } from '@/lib/live-room/moments';

export const dynamic = 'force-dynamic';

/**
 * NASA EONET: natural events happening now (wildfires, volcanoes, severe storms, sea and lake ice). Free and public;
 * cached for an hour. Used only to suggest a "look outside" moment near today's route.
 */
export async function GET() {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=14&category=wildfires,volcanoes,severeStorms,seaLakeIce', { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ events: [] });
    const data = await res.json() as { events?: Array<{ id: string; title: string; categories?: Array<{ title: string }>; geometry?: Array<{ type: string; coordinates: unknown }> }> };
    const events: NaturalEvent[] = [];
    for (const e of data.events ?? []) {
      const g = (e.geometry ?? []).filter((x) => x.type === 'Point').pop();
      const c = g?.coordinates as [number, number] | undefined;
      if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
      events.push({ id: e.id, title: e.title.slice(0, 100), category: e.categories?.[0]?.title ?? 'Natural event', lng: c[0], lat: c[1] });
    }
    return NextResponse.json({ events: events.slice(0, 300) }, { headers: { 'Cache-Control': 'public, max-age=1800' } });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
