import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { drawCards, getScoringProfileForModule } from '@/lib/flight-cards';

export const dynamic = 'force-dynamic';

// POST /api/session/flight-cards/deal
// Teacher-authenticated. Creates 3 face-down card offers per active client.
// Body: { sessionId: string; moduleKey: string }

export async function POST(request: NextRequest) {
  const authClient = createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, moduleKey } = await request.json() as {
    sessionId?: string;
    moduleKey?: string;
  };

  if (!sessionId || !moduleKey) {
    return NextResponse.json({ error: 'sessionId and moduleKey are required' }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify teacher owns this session
  const { data: session } = await service
    .from('sessions')
    .select('id, class_id, status')
    .eq('id', sessionId)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.status !== 'active') return NextResponse.json({ error: 'Session not active' }, { status: 400 });

  const { data: cls } = await service
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate moduleKey exists in registry
  if (!getScoringProfileForModule(moduleKey) && moduleKey !== '__test__') {
    return NextResponse.json({ error: 'Unknown module key' }, { status: 400 });
  }

  // Get next deal_index
  const { data: lastDeal } = await service
    .from('flight_cards')
    .select('deal_index')
    .eq('session_id', sessionId)
    .order('deal_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const dealIndex = (lastDeal?.deal_index ?? 0) + 1;

  // Expire any cards from previous deals still in a live status
  await service
    .from('flight_cards')
    .update({
      status: 'expired',
      expired_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .in('status', ['held', 'active'])
    .eq('bonus_points_total', 0);

  // Mark partial Contrail as 'used' if it earned something (bonus_points_total > 0)
  await service
    .from('flight_cards')
    .update({
      status: 'used',
      expired_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .in('status', ['held', 'active'])
    .gt('bonus_points_total', 0);

  // Get active client_ids from session_participants (joined in last 90 min)
  const { data: participants } = await service
    .from('session_participants')
    .select('client_id, display_name')
    .eq('session_id', sessionId);

  const activeClients = participants ?? [];

  if (activeClients.length === 0) {
    return NextResponse.json({ dealIndex, studentCount: 0, message: 'No active participants' });
  }

  // Insert 3 offered cards per client
  const rows = activeClients.flatMap(({ client_id, display_name }) => {
    const cards = drawCards(moduleKey, 3);
    return cards.map((cardKey) => ({
      session_id: sessionId,
      client_id,
      display_name,
      card_key: cardKey,
      module_key: moduleKey,
      deal_index: dealIndex,
      status: 'offered',
    }));
  });

  const { error } = await service.from('flight_cards').insert(rows);

  if (error) {
    console.error('[flight-cards/deal] insert error:', error.message);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }

  return NextResponse.json({ dealIndex, studentCount: activeClients.length });
}
