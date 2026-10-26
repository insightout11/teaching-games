import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UNLOCK_ID = /^(country|mascot):[A-Za-z0-9 .,'()-]{1,100}$/;

// What this class has earned (country items, mascot parts). Before migration 070 it is simply empty.
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const { data } = await createServiceClient().from('class_unlocks').select('unlock_id, session_id, earned_at').eq('class_id', owned.session.class_id);
  return NextResponse.json({ unlocks: data ?? [] });
}

// The teacher's "We talked about it" (or a real sky sighting): the class earns it once, ever.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { unlockId?: unknown } | null;
  const unlockId = typeof body?.unlockId === 'string' ? body.unlockId.trim() : '';
  if (!UNLOCK_ID.test(unlockId)) return NextResponse.json({ error: 'Invalid unlock' }, { status: 400 });
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const { error: insertError } = await createServiceClient().from('class_unlocks').upsert(
    { class_id: owned.session.class_id, unlock_id: unlockId, session_id: params.sessionId },
    { onConflict: 'class_id,unlock_id', ignoreDuplicates: true },
  );
  if (insertError) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ saved: true });
}
