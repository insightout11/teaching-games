import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

interface ScreenAnswerPayload {
  type: 'screen-answer';
  question: string;
  answer: string;
  createdAt: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUESTION_LENGTH = 700;
const MAX_ANSWER_LENGTH = 2000;

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as {
      sessionId?: unknown;
      question?: unknown;
      answer?: unknown;
    };

    const sessionId = cleanText(body.sessionId, 80);
    const question = cleanText(body.question, MAX_QUESTION_LENGTH);
    const answer = cleanText(body.answer, MAX_ANSWER_LENGTH);

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }
    if (!answer) {
      return NextResponse.json({ error: 'answer is required' }, { status: 400 });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const payload: ScreenAnswerPayload = {
      type: 'screen-answer',
      question,
      answer,
      createdAt: new Date().toISOString(),
    };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('session_private_state')
      .upsert(
        { session_id: sessionId, key: 'screen-answer', payload, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,key' }
      );

    if (error) {
      console.error('[screen-answer POST] upsert error:', error);
      return NextResponse.json({ error: 'Failed to show answer' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[screen-answer POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
