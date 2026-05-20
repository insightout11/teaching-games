import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// POST /api/session/score
// Server-side official score insertion. Uses service role to bypass RLS.
// Validates that the requesting teacher owns the session before inserting.
export async function POST(request: NextRequest) {
  const authClient = createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const sessionId = body.session_id as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const service = createServiceClient();

  // Validate teacher owns this session via sessions.class_id → classes.teacher_id
  const { data: session } = await service
    .from('sessions')
    .select('id, class_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: cls } = await service
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Whitelist score fields to prevent arbitrary injection
  const scoreInsert = {
    session_id: sessionId,
    student_id:           (body.student_id           ?? null) as string | null,
    client_id:            (body.client_id            ?? null) as string | null,
    display_name:         (body.display_name         ?? null) as string | null,
    points:               (body.points               as number),
    streak_count:         (body.streak_count         as number  ?? 0),
    streak_bonus:         (body.streak_bonus         as number  ?? 0),
    is_correct:           (body.is_correct           as boolean),
    outcome:              (body.outcome              ?? null) as string | null,
    accuracy_status:      (body.accuracy_status      ?? null) as string | null,
    counts_for_accuracy:  (body.counts_for_accuracy  as boolean ?? false),
    counts_for_leaderboard: (body.counts_for_leaderboard as boolean ?? true),
    scoring_version:      (body.scoring_version      as number  ?? 2),
    prompt_index:         (body.prompt_index         ?? null) as number | null,
    response_data:        (body.response_data        ?? null) as Record<string, unknown> | null,
    team:                 (body.team                 ?? null) as string | null,
  };

  const { data, error } = await service
    .from('scores')
    .insert(scoreInsert)
    .select()
    .single();

  if (error) {
    console.error('[api/session/score] insert error:', error.message, error.details);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Phase 1c: standard card bonus (Contrail excluded until Phase 1e)
  // Cards resolve on the next official score row (counts_for_leaderboard=true) — win or lose.
  // Proxy rows (counts_for_leaderboard=false) are skipped; card stays active.
  // bonus > 0 → 'used'; bonus = 0 → 'expired'. card_id always written for audit trail.
  // Best-effort — score is already committed; failures here do not roll back the score.
  if (data && scoreInsert.client_id && scoreInsert.counts_for_leaderboard !== false) {
    try {
      const { data: card } = await service
        .from('flight_cards')
        .select('id, card_key, bonus_points_total')
        .eq('session_id', sessionId)
        .eq('client_id', scoreInsert.client_id)
        .eq('status', 'active')
        .neq('card_key', 'contrail')
        .maybeSingle();

      if (card) {
        const outcome = scoreInsert.outcome as string | null;
        const accuracyStatus = scoreInsert.accuracy_status as string | null;
        let cardBonus = 0;

        switch (card.card_key) {
          case 'takeoff':
            if (outcome === 'genuine' || outcome === 'on-task' || outcome === 'standout') cardBonus = 1;
            break;
          case 'clear-skies':
            if (accuracyStatus === 'correct') cardBonus = 1;
            break;
          case 'afterburner':
            if (accuracyStatus === 'correct') cardBonus = 2;
            break;
          case 'full-throttle':
            if (outcome === 'standout') cardBonus = 3;
            break;
        }

        const now = new Date().toISOString();
        const newStatus = cardBonus > 0 ? 'used' : 'expired';

        await service
          .from('scores')
          .update({ card_id: card.id, card_bonus: cardBonus })
          .eq('id', data.id);
        await service
          .from('flight_cards')
          .update({
            status: newStatus,
            expired_at: now,
            ...(cardBonus > 0 ? { bonus_points_total: (card.bonus_points_total ?? 0) + cardBonus } : {}),
          })
          .eq('id', card.id);
      }
    } catch (e) {
      console.error('[api/session/score] card bonus error:', e);
    }

    // Phase 1e: Contrail — multi-submission card, auto-activates, capped at 3 bonuses
    // Auto-activates on first official score row (held → active).
    // +1 per genuine/on-task/standout; invalid rows leave card active without bonus.
    // At 3 activations → 'used'. Module end → expire API handles remaining held/active Contrail.
    try {
      const { data: contrailCard } = await service
        .from('flight_cards')
        .select('id, activations_count, bonus_points_total')
        .eq('session_id', sessionId)
        .eq('client_id', scoreInsert.client_id)
        .eq('card_key', 'contrail')
        .in('status', ['held', 'active'])
        .maybeSingle();

      if (contrailCard) {
        const outcome = scoreInsert.outcome as string | null;
        const earnsBonus = outcome === 'genuine' || outcome === 'on-task' || outcome === 'standout';
        const newActivations = (contrailCard.activations_count ?? 0) + (earnsBonus ? 1 : 0);
        const newBonusTotal = (contrailCard.bonus_points_total ?? 0) + (earnsBonus ? 1 : 0);
        const atCap = newActivations >= 3;
        const newStatus = atCap ? 'used' : 'active';

        if (earnsBonus) {
          await service
            .from('scores')
            .update({ card_id: contrailCard.id, card_bonus: 1 })
            .eq('id', data.id);
        }

        await service
          .from('flight_cards')
          .update({
            status: newStatus,
            activations_count: newActivations,
            bonus_points_total: newBonusTotal,
            ...(atCap ? { expired_at: new Date().toISOString() } : {}),
          })
          .eq('id', contrailCard.id);
      }
    } catch (e) {
      console.error('[api/session/score] contrail bonus error:', e);
    }
  }

  return NextResponse.json({ data });
}
