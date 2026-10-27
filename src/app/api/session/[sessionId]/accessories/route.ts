import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { parseAccessory } from '@/lib/accessories';

export const dynamic = 'force-dynamic';

// The accessory each student in this class is wearing (by student id). Empty before migration 072.
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const { data } = await createServiceClient().from('student_accessories').select('student_id, accessory, created_at')
    .eq('class_id', owned.session.class_id).eq('worn', true).order('created_at', { ascending: true });
  const worn: Record<string, unknown> = {};
  for (const row of (data ?? []) as Array<{ student_id: string; accessory: unknown }>) {
    const a = parseAccessory(row.accessory);
    if (a) worn[row.student_id] = a;
  }
  return NextResponse.json({ worn });
}
