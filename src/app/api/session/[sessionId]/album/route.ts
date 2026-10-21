import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { saveLandmarkPhoto } from '@/lib/world-flight/album-store';
import { LANDMARK_CATALOG } from '@/data/world/landmark-catalog';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

// Landmark Album: the teacher's Take photo saves the picture to the class album. Scenery only, no student data.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const landmarkId = clean(body?.landmarkId, 80);
  if (!LANDMARK_CATALOG.some((l) => l.id === landmarkId)) return NextResponse.json({ error: 'Unknown landmark' }, { status: 400 });
  const image = typeof body?.image === 'string' ? body.image : '';
  const saved = await saveLandmarkPhoto({
    classId: owned.session.class_id, sessionId: params.sessionId, landmarkId, image,
    timeOfDay: clean(body?.timeOfDay, 20), weather: clean(body?.weather, 20), fromCity: clean(body?.fromCity, 80), toCity: clean(body?.toCity, 80),
  });
  if (!saved.ok) return NextResponse.json({ error: 'Could not save the photo yet' }, { status: 503 });
  return NextResponse.json({ ok: true, rare: saved.rare });
}
