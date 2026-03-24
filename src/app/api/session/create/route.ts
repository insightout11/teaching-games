import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuthWithCredits, consumeCredit } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const classId = body?.classId;

  if (!classId || typeof classId !== 'string') {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }

  // Credit gate: 1 credit = 1 session. Pro/developer users are unlimited.
  const { teacher, error: authError } = await requireAuthWithCredits();
  if (authError) return authError;

  const supabase = createServerSupabase();

  // Verify class exists and belongs to teacher (RLS enforces ownership)
  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .single();

  if (classError || !cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ class_id: classId })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? 'Failed to create session' },
      { status: 500 },
    );
  }

  // Consume 1 credit for Standard-tier teachers (Pro/developer are unlimited)
  if (teacher && !teacher.isPro && !teacher.isDeveloper) {
    await consumeCredit(teacher.id);
  }

  return NextResponse.json({ sessionId: session.id });
}
