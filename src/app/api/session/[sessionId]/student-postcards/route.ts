import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { getDestinationById } from '@/data/world-flight/destinations';

export const dynamic = 'force-dynamic';

// GET: the postcards students sent home after the class's previous lesson (for reading out during boarding).
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;
  const since = new Date(Date.now() - 21 * 24 * 3600_000).toISOString();
  const { data } = await createServiceClient().from('student_postcards')
    .select('id, session_id, name, destination_id, message, created_at')
    .eq('class_id', owned.session.class_id).neq('session_id', params.sessionId).gte('created_at', since)
    .order('created_at', { ascending: false }).limit(40);
  const rows = (data ?? []) as Array<{ id: string; session_id: string; name: string; destination_id: string; message: string; created_at: string }>;
  // only the most recent lesson's postcards
  const latest = rows[0]?.session_id;
  const postcards = rows.filter((r) => r.session_id === latest).map((r) => ({ id: r.id, name: r.name, message: r.message }));
  const city = latest ? getDestinationById(rows[0].destination_id)?.city ?? null : null;
  return NextResponse.json({ city, postcards });
}
