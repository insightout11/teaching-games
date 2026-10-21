import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { commonsFile, freePictures } from '@/lib/sources/wikimedia-images';

export const dynamic = 'force-dynamic';

/** Free Wikimedia pictures for the current topic, for the private window (no key, no cost, no daily cap). */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { query?: unknown; strict?: unknown } | null;
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 255) : '';
  if (query.length < 2) return NextResponse.json({ pictures: [] });

  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  // an exact file chosen ahead of time (quiz rounds) is fetched as it is; otherwise a search
  if (/^File:/i.test(query)) {
    const one = await commonsFile(query).catch(() => null);
    return NextResponse.json({ pictures: one ? [one] : [] }, { headers: { 'Cache-Control': 'private, max-age=86400' } });
  }
  const pictures = await freePictures(query.slice(0, 100), 8, { strict: body?.strict === true }).catch(() => []);
  return NextResponse.json({ pictures }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
