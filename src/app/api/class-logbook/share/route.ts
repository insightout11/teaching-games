import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const body = await request.json().catch(() => null);
  const classId = body?.classId;
  const enabled = body?.enabled !== false;

  if (!classId || typeof classId !== 'string' || !UUID_RE.test(classId)) {
    return NextResponse.json({ error: 'Valid classId is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .maybeSingle();

  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from('classes')
    .update({ logbook_share_enabled: enabled })
    .eq('id', classId)
    .eq('teacher_id', teacher.id)
    .select('logbook_share_token, logbook_share_enabled')
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update logbook sharing' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    shareEnabled: updated.logbook_share_enabled,
    shareToken: updated.logbook_share_token,
  });
}
