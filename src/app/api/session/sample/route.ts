import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import {
  SAMPLE_TOPIC,
  SAMPLE_DIFFICULTY,
  SAMPLE_DURATION_MINUTES,
  SAMPLE_STUDENTS,
  SAMPLE_ROUNDS,
  SAMPLE_SESSION_NOTE,
  buildSampleScores,
} from '@/lib/sample-session';

export const dynamic = 'force-dynamic';

// POST /api/session/sample
//
// Seeds (or returns) the teacher's explorable sample lesson: a real, ENDED
// session in their hidden demo class with hand-authored students, rounds,
// scores, and a debrief note. Every production surface (end summary,
// leaderboard, Control Room) renders it natively — nothing is simulated live.
//
// Idempotent: an existing fully-seeded sample session is reused; a partially
// seeded one (e.g. an earlier failure) is deleted and rebuilt.

const DEMO_CLASS_NAME = 'Demo Class';

export async function POST() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ error: 'Sample lesson is unavailable in mock mode' }, { status: 503 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const supabase = createServiceClient();

  // ── 1. Find-or-create the hidden demo class ───────────────────────────────
  const { data: existingClass } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacher.id)
    .eq('is_demo', true)
    .limit(1)
    .maybeSingle();

  let classId = existingClass?.id as string | undefined;

  if (!classId) {
    const { data: created, error: createError } = await supabase
      .from('classes')
      .insert({ teacher_id: teacher.id, name: DEMO_CLASS_NAME, is_demo: true })
      .select('id')
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? 'Failed to create demo class' }, { status: 500 });
    }
    classId = created.id;
  }

  // ── 2. Reuse a fully-seeded sample session if one exists ─────────────────
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('class_id', classId)
    .eq('status', 'ended')
    .eq('topic', SAMPLE_TOPIC)
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    const { count } = await supabase
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', existingSession.id);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ sessionId: existingSession.id, classId });
    }
    // Partially seeded (earlier failure) — delete and rebuild. Cascades clean
    // up rounds/scores/participants.
    await supabase.from('sessions').delete().eq('id', existingSession.id);
  }

  // ── 3. Find-or-create the five sample students ────────────────────────────
  const studentIdByName: Record<string, string> = {};
  for (const persona of SAMPLE_STUDENTS) {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', classId)
      .eq('name', persona.name)
      .maybeSingle();

    if (existing) {
      studentIdByName[persona.name] = existing.id;
      continue;
    }

    const { data: created, error: studentError } = await supabase
      .from('students')
      .insert({ class_id: classId, name: persona.name, avatar_seed: persona.avatarSeed })
      .select('id')
      .single();
    if (studentError || !created) {
      return NextResponse.json({ error: studentError?.message ?? 'Failed to seed sample students' }, { status: 500 });
    }
    studentIdByName[persona.name] = created.id;
  }

  // ── 4. Create the ended session ───────────────────────────────────────────
  const endedAt = new Date(Date.now() - 3 * 60_000);
  const startedAt = new Date(endedAt.getTime() - SAMPLE_DURATION_MINUTES * 60_000);

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      class_id: classId,
      status: 'ended',
      topic: SAMPLE_TOPIC,
      difficulty: SAMPLE_DIFFICULTY,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? 'Failed to create sample session' }, { status: 500 });
  }

  // ── 5. Participants, rounds, scores, debrief note ─────────────────────────
  const { error: participantsError } = await supabase.from('session_participants').upsert(
    SAMPLE_STUDENTS.map((s) => ({
      session_id: session.id,
      student_id: studentIdByName[s.name],
      client_id: s.clientId,
      display_name: s.name,
      avatar_seed: s.avatarSeed,
      joined_at: startedAt.toISOString(),
    })),
    { onConflict: 'session_id,client_id', ignoreDuplicates: true },
  );

  const { error: roundsError } = await supabase.from('rounds').insert(
    SAMPLE_ROUNDS.map((r) => ({
      session_id: session.id,
      game_type: r.gameType,
      round_number: r.roundNumber,
      game_config: { sample: true },
    })),
  );

  const { error: scoresError } = await supabase
    .from('scores')
    .insert(buildSampleScores(session.id, studentIdByName, startedAt));

  const { error: noteError } = await supabase.from('session_notes').insert({
    session_id: session.id,
    teacher_id: teacher.id,
    content: SAMPLE_SESSION_NOTE,
  });

  const seedError = scoresError ?? roundsError ?? participantsError ?? noteError;
  if (seedError) {
    console.error('[api/session/sample] seeding error:', seedError.message);
    // Scores are what make the sample worth exploring — without them, fail
    // loudly. (The partial session is rebuilt on the next attempt.)
    if (scoresError) {
      return NextResponse.json({ error: 'Failed to seed sample lesson data' }, { status: 500 });
    }
  }

  return NextResponse.json({ sessionId: session.id, classId });
}
