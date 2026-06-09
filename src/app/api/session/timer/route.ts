import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

interface TimerPayload {
  type: 'timer';
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  startedAt: string | null;
  updatedAt: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TIMER_SECONDS = 99 * 60 + 59;

function cleanSessionId(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function cleanSeconds(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(MAX_TIMER_SECONDS, Math.floor(num)));
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as {
      sessionId?: unknown;
      state?: {
        totalSeconds?: unknown;
        remainingSeconds?: unknown;
        running?: unknown;
        startedAt?: unknown;
      };
    };

    const sessionId = cleanSessionId(body.sessionId);
    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const totalSeconds = cleanSeconds(body.state?.totalSeconds, 60);
    const remainingSeconds = cleanSeconds(body.state?.remainingSeconds, totalSeconds);
    const running = body.state?.running === true && remainingSeconds > 0;
    const startedAt = running && typeof body.state?.startedAt === 'string'
      ? body.state.startedAt
      : null;

    const payload: TimerPayload = {
      type: 'timer',
      totalSeconds,
      remainingSeconds,
      running,
      startedAt,
      updatedAt: new Date().toISOString(),
    };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('session_private_state')
      .upsert(
        { session_id: sessionId, key: 'timer', payload, updated_at: payload.updatedAt },
        { onConflict: 'session_id,key' }
      );

    if (error) {
      console.error('[timer POST] upsert error:', error);
      return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[timer POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
