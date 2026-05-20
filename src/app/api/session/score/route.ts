import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/session/score
// Server-side official score insertion. Uses service role to bypass RLS.
// Validates that the requesting teacher owns the session before inserting.
export async function POST(request: NextRequest) {
  const authClient = createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const sessionId = body.session_id as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const service = createServiceClient();

  // Validate teacher owns this session via sessions.class_id → classes.teacher_id
  const { data: session } = await service
    .from('sessions')
    .select('id, class_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: cls } = await service
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Whitelist score fields to prevent arbitrary injection
  const scoreInsert = {
    session_id: sessionId,
    student_id:           (body.student_id           ?? null) as string | null,
    client_id:            (body.client_id            ?? null) as string | null,
    display_name:         (body.display_name         ?? null) as string | null,
    points:               (body.points               as number),
    streak_count:         (body.streak_count         as number  ?? 0),
    streak_bonus:         (body.streak_bonus         as number  ?? 0),
    is_correct:           (body.is_correct           as boolean),
    outcome:              (body.outcome              ?? null) as string | null,
    accuracy_status:      (body.accuracy_status      ?? null) as string | null,
    counts_for_accuracy:  (body.counts_for_accuracy  as boolean ?? false),
    counts_for_leaderboard: (body.counts_for_leaderboard as boolean ?? true),
    scoring_version:      (body.scoring_version      as number  ?? 2),
    prompt_index:         (body.prompt_index         ?? null) as number | null,
    response_data:        (body.response_data        ?? null) as Record<string, unknown> | null,
    team:                 (body.team                 ?? null) as string | null,
  };

  const { data, error } = await service
    .from('scores')
    .insert(scoreInsert)
    .select()
    .single();

  if (error) {
    console.error('[api/session/score] insert error:', error.message, error.details);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
