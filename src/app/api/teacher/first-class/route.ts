import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { deviceModeFor, readClassProfile } from '@/lib/class-profile';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

/**
 * "Set up your first class" (replaces the 5 questions about the teacher). Creates the class with its type and
 * settings, adds the class list, and marks onboarding done. The old teacher profile columns are filled from the
 * class so Home's suggestions keep working. RLS authorizes everything (the teacher's own rows).
 */
export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => null) as { name?: unknown; level?: unknown; junior?: unknown; profile?: unknown; students?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';
  if (!name) return NextResponse.json({ error: 'A class name is needed' }, { status: 400 });
  const profile = readClassProfile(body?.profile);
  const level = DIFFICULTIES.includes(body?.level as Difficulty) ? (body?.level as Difficulty) : null;
  const junior = body?.junior === true;
  const students = Array.from(new Set((Array.isArray(body?.students) ? body.students : [])
    .filter((s): s is string => typeof s === 'string').map((s) => s.trim().slice(0, 40)).filter(Boolean))).slice(0, 60);

  const base = {
    teacher_id: user.id, name, default_difficulty: level, junior,
    ...(profile.screens ? { student_device_mode: deviceModeFor(profile.screens) } : {}),
  };
  // class_profile needs migration 067; without it the class is still created (without a type).
  let created = await supabase.from('classes').insert({ ...base, class_profile: profile }).select('id').single();
  if (created.error && /class_profile/.test(created.error.message)) created = await supabase.from('classes').insert(base).select('id').single();
  if (created.error || !created.data) return NextResponse.json({ error: 'Could not create the class' }, { status: 500 });
  const classId = (created.data as { id: string }).id;

  if (students.length) await supabase.from('students').insert(students.map((n) => ({ class_id: classId, name: n })));

  // Home ranks its suggestions from these (retired questions, now answered by the class).
  const levelBand = level === 'Beginner' || level === 'Easy' ? 'beginner' : level === 'Intermediate' ? 'intermediate' : level ? 'advanced' : null;
  await supabase.from('teachers').update({
    onboarding_completed: true,
    profile_class_size: students.length === 1 ? 'one-on-one' : students.length > 6 ? 'classroom' : students.length > 1 ? 'small-group' : null,
    profile_level: levelBand,
    profile_age: profile.age ?? (junior ? 'kids' : null),
    profile_mode: profile.place === 'classroom' ? 'in-person' : profile.place === 'online' ? 'online' : null,
    profile_focus: profile.type === 'conversation' || profile.type === 'free-talk' ? 'speaking' : junior ? 'kids' : null,
  }).eq('id', user.id);

  return NextResponse.json({ classId });
}
