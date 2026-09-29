import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

// PATCH /api/session/settings
// Updates topic, difficulty, and custom_topic on the sessions row.
// Called fire-and-forget from the teacher settings bar whenever settings change.

export async function PATCH(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const { sessionId, topic, difficulty, customTopic, grammarTarget } = body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const update: Record<string, string | null> = {};
  if (typeof topic === 'string') update.topic = topic;
  if (typeof difficulty === 'string') update.difficulty = difficulty;
  if (typeof customTopic === 'string') update.custom_topic = customTopic || null;
  // A new topic needs new phone reference materials: clear the old ones so the
  // follow-up reference-materials call regenerates instead of skipping.
  const clearsReference = 'topic' in update || 'custom_topic' in update;
  if (typeof grammarTarget === 'string') update.grammar_target = grammarTarget;
  else if (grammarTarget === null) update.grammar_target = null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabase();
  if (clearsReference) {
    const { data: current } = await supabase.from('sessions').select('topic, custom_topic').eq('id', sessionId).maybeSingle();
    const changed = ('topic' in update && update.topic !== (current?.topic ?? null))
      || ('custom_topic' in update && update.custom_topic !== (current?.custom_topic ?? null));
    if (changed) {
      update.reference_vocab = null;
      update.reference_expressions = null;
    }
  }
  const { error } = await supabase
    .from('sessions')
    .update(update)
    .eq('id', sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
