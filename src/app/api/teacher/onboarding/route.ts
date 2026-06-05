import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { TeacherProfile } from '@/lib/teacher-profile';

export const dynamic = 'force-dynamic';

// Persist the onboarding profile on the teacher's own row. RLS ("Teachers see own
// profile", for all using id = auth.uid()) authorizes the update — no service role.
export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Partial<TeacherProfile> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { error } = await supabase
    .from('teachers')
    .update({
      onboarding_completed: true,
      profile_class_size: body.classSize ?? null,
      profile_level: body.level ?? null,
      profile_focus: body.focus ?? null,
      profile_age: body.age ?? null,
      profile_mode: body.mode ?? null,
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
