import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { classAlbum, saveLandmarkPhoto } from '@/lib/world-flight/album-store';
import { createServiceClient } from '@/lib/supabase/service';
import { drawnLandmarksNear } from '@/lib/live-room/landmarks-ahead';
import { getDestinationById } from '@/data/world-flight/destinations';
import { LANDMARK_CATALOG } from '@/data/world/landmark-catalog';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

// The lobby strip: the class's newest photos, and landmarks near the cities it has been to that it has not photographed.
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const service = createServiceClient();
  const classId = owned.session.class_id;
  const [album, legs] = await Promise.all([
    classAlbum(service, classId, 30),
    service.from('class_world_flight_legs').select('destination_id').eq('class_id', classId).eq('status', 'completed'),
  ]);
  const have = new Set(album.map((p) => p.landmarkId));
  const name = (id: string) => LANDMARK_CATALOG.find((l) => l.id === id)?.name ?? id;
  const toFind: Array<{ id: string; name: string; hint: string }> = [];
  for (const id of Array.from(new Set(((legs.data ?? []) as Array<{ destination_id: string }>).map((l) => l.destination_id)))) {
    const d = getDestinationById(id);
    if (!d) continue;
    for (const l of drawnLandmarksNear(d)) if (!have.has(l.id) && !toFind.some((x) => x.id === l.id)) toFind.push({ id: l.id, name: l.name, hint: `Near ${d.city}` });
  }
  return NextResponse.json({ photos: album.slice(0, 6).map((p) => ({ id: p.id, name: name(p.landmarkId), rare: p.rare, url: p.url })), toFind: toFind.slice(0, 3) });
}

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

// Best discovery (Oct 2026): the class's photo of the winning landmark becomes this flight's album cover.
export async function PATCH(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { coverLandmarkId?: unknown } | null;
  const landmarkId = clean(body?.coverLandmarkId, 80);
  if (!LANDMARK_CATALOG.some((l) => l.id === landmarkId)) return NextResponse.json({ error: 'Unknown landmark' }, { status: 400 });
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const service = createServiceClient();
  await service.from('class_landmark_photos').update({ flight_cover: false }).eq('session_id', params.sessionId);
  const { error: e } = await service.from('class_landmark_photos').update({ flight_cover: true }).eq('session_id', params.sessionId).eq('landmark_id', landmarkId);
  if (e) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ saved: true });
}
