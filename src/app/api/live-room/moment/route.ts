import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { lookupWikipedia } from '@/lib/sources/wikipedia';
import { freePictures } from '@/lib/sources/wikimedia-images';

export const dynamic = 'force-dynamic';

/**
 * A "look outside" card: a picture and two or three short facts for what the plane is passing (free: Wikipedia and
 * Wikimedia, no AI). The teacher has already chosen to show it.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { title?: unknown; kind?: unknown } | null;
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
  if (title.length < 2) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isEvent = body?.kind === 'event';
  const lookupTitle = title.replace(/^the /i, '');
  const [ref, pics] = await Promise.all([
    isEvent ? Promise.resolve(null) : lookupWikipedia(lookupTitle).catch(() => null),
    freePictures(isEvent ? title.split(/[-–,]/)[0] : lookupTitle, 1).catch(() => []),
  ]);
  const lead = ref ? ref.text.split(/\n\n/)[0] : '';
  const facts = (lead.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 3);
  return NextResponse.json({ facts, picture: pics[0] ?? null }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
