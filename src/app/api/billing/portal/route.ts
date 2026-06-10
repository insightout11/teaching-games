import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe, getSiteOrigin } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';

// POST /api/billing/portal
// Creates a Stripe Billing Portal session (cancel, update card, invoices)
// for the authenticated teacher and returns { url }.
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ error: 'Billing is unavailable in mock mode' }, { status: 503 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: teacherRow } = await service
    .from('teachers')
    .select('stripe_customer_id')
    .eq('id', teacher.id)
    .single();

  if (!teacherRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No self-serve subscription found for this account', code: 'NO_STRIPE_CUSTOMER' },
      { status: 400 }
    );
  }

  const origin = getSiteOrigin(new URL(request.url).origin);

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: teacherRow.stripe_customer_id,
      return_url: `${origin}/pro`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[billing/portal] Stripe error:', err);
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 });
  }
}
