import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';

const schema: AISchema = {
  type: 'object',
  properties: {
    report: { type: 'string' },
  },
  required: ['report'],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function gameKeyToLabel(key: string): string {
  return key
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface ScoreRow { session_id: string; is_correct: boolean | null; accuracy_status: string | null; counts_for_accuracy: boolean | null; scoring_version: number | null; streak_count: number; points: number; }
interface RoundRow  { session_id: string; game_type: string; }
interface NoteRow   { session_id: string; note: string; }
interface SessionRow { id: string; started_at: string; ended_at: string | null; topic: string | null; difficulty: string | null; custom_topic: string | null; }

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { studentId, classId, sessionCount } = await request.json() as {
    studentId: string;
    classId: string;
    sessionCount: number; // 3 | 5 | 10 | 0 (0 = all)
  };

  if (!studentId || !classId) {
    return NextResponse.json({ error: 'Missing studentId or classId' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Verify class ownership
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify student belongs to class
  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .eq('class_id', classId)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  // Find sessions where student has scores
  const { data: scoreSessionRows } = await supabase
    .from('scores')
    .select('session_id')
    .eq('student_id', studentId);

  const sessionIds = Array.from(
    new Set((scoreSessionRows ?? []).map((r: { session_id: string }) => r.session_id))
  );

  if (sessionIds.length === 0) {
    return NextResponse.json({ error: 'No session data found for this student' }, { status: 422 });
  }

  // Fetch sessions for those IDs, filtered to this class and ended
  let sessionQuery = supabase
    .from('sessions')
    .select('id, started_at, ended_at, topic, difficulty, custom_topic')
    .in('id', sessionIds)
    .eq('class_id', classId)
    .eq('status', 'ended')
    .order('started_at', { ascending: false });

  if (sessionCount > 0) sessionQuery = sessionQuery.limit(sessionCount);

  const { data: sessions } = await sessionQuery;

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: 'No completed sessions found for this student' }, { status: 422 });
  }

  const sessionIdsFinal = (sessions as SessionRow[]).map((s) => s.id);

  // Batch fetch supporting data
  const [{ data: allScores }, { data: allRounds }, { data: allNotes }] = await Promise.all([
    supabase
      .from('scores')
      .select('session_id, is_correct, accuracy_status, counts_for_accuracy, scoring_version, streak_count, points')
      .in('session_id', sessionIdsFinal)
      .eq('student_id', studentId),
    supabase
      .from('rounds')
      .select('session_id, game_type')
      .in('session_id', sessionIdsFinal),
    supabase
      .from('student_session_notes')
      .select('session_id, note')
      .in('session_id', sessionIdsFinal)
      .eq('student_id', studentId),
  ]);

  const scores  = (allScores  ?? []) as ScoreRow[];
  const rounds  = (allRounds  ?? []) as RoundRow[];
  const notes   = (allNotes   ?? []) as NoteRow[];

  // Build per-session summaries
  const summaries = (sessions as SessionRow[]).map((session) => {
    const sessionScores = scores.filter((s) => s.session_id === session.id);
    const sessionRounds = rounds.filter((r) => r.session_id === session.id);
    const sessionNote   = notes.find((n)   => n.session_id === session.id);

    // V2-aware: use counts_for_accuracy + accuracy_status; fall back to legacy is_correct
    const scorable = sessionScores.filter((s) =>
      s.counts_for_accuracy === true || (s.scoring_version !== 2 && s.is_correct !== null)
    );
    const correct = scorable.filter((s) =>
      s.accuracy_status === 'correct' || (!s.accuracy_status && s.is_correct === true)
    ).length;
    const accuracy  = scorable.length > 0 ? Math.round((correct / scorable.length) * 100) : null;
    const bestStreak = sessionScores.reduce((max, s) => Math.max(max, s.streak_count ?? 0), 0);
    const games = Array.from(new Set(sessionRounds.map((r) => gameKeyToLabel(r.game_type))));

    return {
      date: formatDate(session.started_at),
      topic: session.custom_topic || session.topic || 'General',
      difficulty: session.difficulty || 'Intermediate',
      games,
      accuracy,
      correct,
      total: scorable.length,
      bestStreak,
      teacherNote: sessionNote?.note?.trim() || null,
    };
  });

  const dateRange = summaries.length === 1
    ? summaries[0].date
    : `${summaries[summaries.length - 1].date} – ${summaries[0].date}`;

  const sessionLines = summaries.map((s, i) => {
    const lines = [
      `Session ${i + 1} — ${s.date}`,
      `Topic: ${s.topic} (${s.difficulty})`,
      s.games.length > 0 ? `Activities: ${s.games.join(', ')}` : 'Activities: not recorded',
      s.accuracy !== null
        ? `Accuracy: ${s.accuracy}% (${s.correct}/${s.total} correct)`
        : 'No accuracy data recorded',
    ];
    if (s.bestStreak >= 3) lines.push(`Best answer streak: ${s.bestStreak}`);
    if (s.teacherNote) lines.push(`Teacher's note: ${s.teacherNote}`);
    return lines.join('\n');
  }).join('\n\n');

  const prompt = `You are generating a private progress report draft for a language class teacher.

Student: ${student.name}
Period: ${dateRange}
Sessions reviewed: ${summaries.length}

--- Session data ---
${sessionLines}
--- End of data ---

Write a progress report in exactly this structure. Use plain text with ** for section headers and - for bullets.

**Student Progress Report**
**Student:** ${student.name}
**Period:** ${dateRange}

**Overview**
[1 short paragraph summarising overall engagement and progress across the sessions]

**Strengths**
- [2–4 specific bullets drawn from the data]

**Areas to Keep Practicing**
- [2–4 specific bullets drawn from the data]

**Class Participation**
[1 short paragraph or 2–3 bullets about attendance, engagement, and effort]

**Suggested Next Steps**
- [2–4 actionable bullets the teacher or student can act on]

**Teacher's Note**
[1 optional closing sentence. If no teacher notes were provided, write a brief encouraging closing instead.]

Rules:
- Tone: friendly, professional, specific. Suitable for sharing with a student, parent, or school admin after teacher review.
- Length: 250–400 words total.
- Base all claims strictly on the data above. If data is thin, say less — never invent specifics.
- Do not use the word "impressive" or hollow filler phrases.
`;

  const result = await generateJSON<{ report: string }>(prompt, schema, { taskClass: 'content-generation' });

  return NextResponse.json({ report: result.report });
}
