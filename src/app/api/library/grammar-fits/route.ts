import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { findTopicBriefing } from '@/lib/topic-briefings';

export const dynamic = 'force-dynamic';

// GET /api/library/grammar-fits?topic=volcanoes — the grammar points that fit a banked topic (Codex round 29), for
// the prepare sheet's Grammar lesson. Empty when the topic isn't in the bank.
export async function GET(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const topic = (request.nextUrl.searchParams.get('topic') ?? '').trim().slice(0, 120);
  const entry = topic ? findTopicBriefing(topic) : null;
  const fits = (entry as { grammarFits?: Array<{ target: string; why: string; example: string }> } | null)?.grammarFits ?? [];
  return NextResponse.json({ fits: fits.slice(0, 3) });
}
