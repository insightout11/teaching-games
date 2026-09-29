import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { broadcastInputSpecFromServer } from '@/lib/supabase/realtime-broadcast';
import { inputSpecChannelName, ROOM_LAUNCH_EVENT } from '@/lib/input-spec';

export const dynamic = 'force-dynamic';

/**
 * Live Room: tells student phones an activity is on its way ("Get ready: …")
 * the instant the teacher launches it, while its content is still generating.
 * Name only; the activity itself still arrives through the input-spec path.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!sessionId || !name) return NextResponse.json({ error: 'sessionId and name are required' }, { status: 400 });

  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (owned.error) return owned.error;

  const delivery = await broadcastInputSpecFromServer(inputSpecChannelName(sessionId), ROOM_LAUNCH_EVENT, { name, at: Date.now() });
  return NextResponse.json({ delivered: delivery.status === 'sent' });
}
