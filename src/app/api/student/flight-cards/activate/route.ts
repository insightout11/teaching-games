import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/student/flight-cards/activate
// Public — validated by sessionId + clientId.
// Toggles standard card between 'held' and 'active' (student's activate/deactivate tap).
// Contrail does not use this endpoint — it auto-activates on first submission (Phase 1e).
// Body: { sessionId, clientId, cardId, active: boolean }

export async function POST(request: NextRequest) {
  const { sessionId, clientId, cardId, active } = await request.json() as {
    sessionId?: string;
    clientId?: string;
    cardId?: string;
    active?: boolean;
  };

  if (!sessionId || !clientId || !cardId || active === undefined) {
    return NextResponse.json({ error: 'sessionId, clientId, cardId, and active are required' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId) || !uuidRegex.test(cardId)) {
    return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: card } = await service
    .from('flight_cards')
    .select('id, session_id, client_id, card_key, status')
    .eq('id', cardId)
    .single();

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  if (card.session_id !== sessionId) return NextResponse.json({ error: 'Card not in this session' }, { status: 403 });
  if (card.client_id !== clientId) return NextResponse.json({ error: 'Card not yours' }, { status: 403 });
  if (!['held', 'active'].includes(card.status)) {
    return NextResponse.json({ error: 'Card is no longer live' }, { status: 409 });
  }

  // Contrail is always-active; this toggle only applies to standard cards
  if (card.card_key === 'contrail') {
    return NextResponse.json({ error: 'Contrail does not use manual activation' }, { status: 400 });
  }

  const newStatus = active ? 'active' : 'held';
  if (card.status === newStatus) {
    return NextResponse.json({ status: newStatus }); // idempotent
  }

  await service
    .from('flight_cards')
    .update({ status: newStatus })
    .eq('id', cardId);

  return NextResponse.json({ status: newStatus });
}
