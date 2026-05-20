import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/student/flight-cards/pick
// Public — validated by sessionId + clientId.
// Body: { sessionId, clientId, cardId, replace?: boolean }
//
// Transitions:
//   No existing held/active card:     chosen → 'held', others in deal → 'declined'
//   Existing card + replace not set:  returns { conflict: true, heldCard }
//   Existing card + replace: true:    old card → 'replaced', chosen → 'held', others → 'declined'

export async function POST(request: NextRequest) {
  const { sessionId, clientId, cardId, replace } = await request.json() as {
    sessionId?: string;
    clientId?: string;
    cardId?: string;
    replace?: boolean;
  };

  if (!sessionId || !clientId || !cardId) {
    return NextResponse.json({ error: 'sessionId, clientId, and cardId are required' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId) || !uuidRegex.test(cardId)) {
    return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
  }

  const service = createServiceClient();

  // Validate target card
  const { data: card } = await service
    .from('flight_cards')
    .select('id, session_id, client_id, card_key, deal_index, module_key, status')
    .eq('id', cardId)
    .single();

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  if (card.session_id !== sessionId) return NextResponse.json({ error: 'Card not in this session' }, { status: 403 });
  if (card.client_id !== clientId) return NextResponse.json({ error: 'Card not yours' }, { status: 403 });
  if (card.status !== 'offered') return NextResponse.json({ error: 'Card is no longer available' }, { status: 409 });

  // Check for existing held/active card
  const { data: existing } = await service
    .from('flight_cards')
    .select('id, card_key, module_key')
    .eq('session_id', sessionId)
    .eq('client_id', clientId)
    .in('status', ['held', 'active'])
    .maybeSingle();

  if (existing && !replace) {
    return NextResponse.json({
      conflict: true,
      heldCard: { cardId: existing.id, cardKey: existing.card_key, moduleKey: existing.module_key },
    });
  }

  const now = new Date().toISOString();

  // Replace old card if present
  if (existing) {
    await service
      .from('flight_cards')
      .update({ status: 'replaced', expired_at: now })
      .eq('id', existing.id);
  }

  // Pick the chosen card
  await service
    .from('flight_cards')
    .update({ status: 'held', held_at: now })
    .eq('id', cardId);

  // Decline the other offered cards in this deal
  await service
    .from('flight_cards')
    .update({ status: 'declined' })
    .eq('session_id', sessionId)
    .eq('client_id', clientId)
    .eq('deal_index', card.deal_index)
    .eq('status', 'offered')
    .neq('id', cardId);

  return NextResponse.json({
    held: true,
    card: { cardId: card.id, cardKey: card.card_key, moduleKey: card.module_key },
  });
}
