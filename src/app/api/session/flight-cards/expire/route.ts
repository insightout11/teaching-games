import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/session/flight-cards/expire
// Teacher-authenticated. Called when a module starts to expire all prior held/active cards.
// Body: { sessionId: string; dealIndex: number }
//
// Terminal status rules:
//   bonus_points_total > 0  →  'used'    (card produced value)
//   bonus_points_total = 0  →  'expired' (card produced nothing)

export async function POST(request: NextRequest) {
  const authClient = createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, dealIndex } = await request.json() as {
    sessionId?: string;
    dealIndex?: number;
  };

  if (!sessionId || dealIndex === undefined) {
    return NextResponse.json({ error: 'sessionId and dealIndex are required' }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify teacher owns session
  const { data: session } = await service
    .from('sessions')
    .select('id, class_id')
    .eq('id', sessionId)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { data: cls } = await service
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();

  // Cards that earned nothing → expired
  await service
    .from('flight_cards')
    .update({ status: 'expired', expired_at: now })
    .eq('session_id', sessionId)
    .lte('deal_index', dealIndex)
    .in('status', ['held', 'active'])
    .eq('bonus_points_total', 0);

  // Cards that earned something → used
  await service
    .from('flight_cards')
    .update({ status: 'used', expired_at: now })
    .eq('session_id', sessionId)
    .lte('deal_index', dealIndex)
    .in('status', ['held', 'active'])
    .gt('bonus_points_total', 0);

  return NextResponse.json({ ok: true });
}
