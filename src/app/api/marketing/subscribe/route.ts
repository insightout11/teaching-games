import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { EMAIL_PATTERN, VALIDATION } from '@/lib/config/rate-limits';

export const dynamic = 'force-dynamic';

// POST /api/marketing/subscribe
// Body: { email: string, source?: string }
// Public, unauthenticated. Upserts into marketing_subscribers, ignoring conflicts on
// the unique email so re-submitting an existing address is a silent success.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; source?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body?.source === 'string' ? body.source.slice(0, 40) : null;

  if (!email || email.length > VALIDATION.EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from('marketing_subscribers')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    console.error('[marketing/subscribe] insert error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
