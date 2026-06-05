import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function cleanOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const options: string[] = [];

  for (const item of value) {
    const option = cleanText(item, 42);
    const key = option.toLowerCase();
    if (!option || seen.has(key)) continue;
    seen.add(key);
    options.push(option);
    if (options.length >= 6) break;
  }

  return options;
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as {
      sessionId?: unknown;
      question?: unknown;
      options?: unknown;
      metadata?: unknown;
    };

    const sessionId = cleanText(body.sessionId, 80);
    const question = cleanText(body.question, 220);
    const options = cleanOptions(body.options);
    const metadata = body.metadata && typeof body.metadata === 'object'
      ? body.metadata as Record<string, unknown>
      : null;

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }
    if (options.length < 2) {
      return NextResponse.json({ error: 'At least two poll options are required' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      return NextResponse.json({
        ok: true,
        poll: {
          id: 'mock-poll',
          session_id: sessionId,
          question,
          options,
          is_active: true,
          metadata,
          created_at: new Date().toISOString(),
        },
      });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const supabase = createServiceClient();

    const { error: closeError } = await supabase
      .from('polls')
      .update({ is_active: false })
      .eq('session_id', sessionId)
      .eq('is_active', true);

    if (closeError) {
      console.error('[session poll POST] close active poll error:', closeError);
      return NextResponse.json({ error: 'Failed to close active poll' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('polls')
      .insert({
        session_id: sessionId,
        question,
        options,
        is_active: true,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('[session poll POST] create poll error:', error);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, poll: data });
  } catch (error) {
    console.error('[session poll POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
