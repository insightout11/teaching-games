import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { savePostcard } from '@/lib/world-flight/souvenir-store';
import { citySouvenirs } from '@/lib/world-flight/souvenirs';

export const dynamic = 'force-dynamic';

// The class postcard from the city this lesson flew to: the teacher types what the class said. Saving it earns the
// city's postcard souvenir (if it has one). Only the teacher who owns the session can write it.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const body = (await request.json().catch(() => null)) as { prompt?: unknown; message?: unknown } | null;
  const message = typeof body?.message === 'string' ? body.message.replace(/\s+/g, ' ').trim().slice(0, 500) : '';
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 200) : '';
  if (!message) return NextResponse.json({ error: 'Write the postcard first' }, { status: 400 });

  // The city is the one this lesson is flying to (its leg), not something the request chooses.
  const { data: leg } = await createServiceClient().from('class_world_flight_legs').select('destination_id, moves_class').eq('session_id', params.sessionId).maybeSingle();
  const destinationId = (leg as { destination_id?: string } | null)?.destination_id;
  if (!destinationId || citySouvenirs(destinationId).length === 0) {
    return NextResponse.json({ error: 'Postcards are written from a World Flight city' }, { status: 400 });
  }

  const saved = await savePostcard(owned.session.class_id, params.sessionId, destinationId, prompt, message);
  if (!saved.ok) return NextResponse.json({ error: 'Could not save the postcard yet' }, { status: 503 });
  return NextResponse.json({ ok: true, souvenir: saved.souvenir ? { id: saved.souvenir.id, name: saved.souvenir.name } : null });
}
