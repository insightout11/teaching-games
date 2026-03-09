import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const classId = body?.classId;

  if (!classId || typeof classId !== 'string') {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  return NextResponse.json({ sessionId: session.id });
}
