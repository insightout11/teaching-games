import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { mockStore } from '@/lib/mock/data';

// GET /api/student/roster?sessionId=xxx
// Returns the class roster for a session so students can pick their name on join.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ students: [] });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const session = mockStore.ensureSession(sessionId);
    if (!session || session.status !== 'active') {
      return NextResponse.json({ students: [] });
    }

    const students = mockStore
      .getStudents(session.class_id)
      .map(({ id, name, avatar_seed }) => ({ id, name, avatar_seed }));

    return NextResponse.json({ students });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return NextResponse.json({ students: [] });
  }

  try {
    const supabase = createServiceClient();

    const { data: session } = await supabase
      .from('sessions')
      .select('class_id, status')
      .eq('id', sessionId)
      .single();

    if (!session || session.status !== 'active') {
      return NextResponse.json({ students: [] });
    }

    // Prefer the captain flag; fall back gracefully if the column isn't migrated yet so the
    // join picker never breaks (wings simply won't appear until 053 is applied).
    const withCaptain = await supabase
      .from('students')
      .select('id, name, avatar_seed, is_captain_of_the_day')
      .eq('class_id', session.class_id)
      .order('name');

    if (!withCaptain.error) {
      return NextResponse.json({ students: withCaptain.data ?? [] });
    }

    const { data: students } = await supabase
      .from('students')
      .select('id, name, avatar_seed')
      .eq('class_id', session.class_id)
      .order('name');

    return NextResponse.json({ students: students ?? [] });
  } catch {
    return NextResponse.json({ students: [] });
  }
}
