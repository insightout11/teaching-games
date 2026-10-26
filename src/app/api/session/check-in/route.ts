import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { broadcastInputSpecFromServer } from '@/lib/supabase/realtime-broadcast';
import { CHECK_IN_EVENT, inputSpecChannelName } from '@/lib/input-spec';

export const dynamic = 'force-dynamic';

/**
 * Live Room passenger check-in (Oct 2026): the teacher calls one student to the desk for their weekly chat. Their phone
 * shows the prompt; everyone else's phone ignores it. `clientId: null` ends check-in.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
  const clientId = typeof body?.clientId === 'string' ? body.clientId.slice(0, 80) : null;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.slice(0, 160) : '';
  const where = body?.where === true;
  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });

  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (owned.error) return owned.error;

  const delivery = await broadcastInputSpecFromServer(inputSpecChannelName(sessionId), CHECK_IN_EVENT, { clientId, prompt, where, at: Date.now() });
  return NextResponse.json({ delivered: delivery.status === 'sent' });
}
