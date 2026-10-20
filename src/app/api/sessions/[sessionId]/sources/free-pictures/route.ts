import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { freePictures } from '@/lib/sources/wikimedia-images';

export const dynamic = 'force-dynamic';

/** Free Wikimedia pictures for the current topic, for the private window (no key, no cost, no daily cap). */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { query?: unknown; strict?: unknown } | null;
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 100) : '';
  if (query.length < 2) return NextResponse.json({ pictures: [] });

  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const pictures = await freePictures(query, 8, { strict: body?.strict === true }).catch(() => []);
  return NextResponse.json({ pictures }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
