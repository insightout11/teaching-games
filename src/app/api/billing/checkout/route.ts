import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe, getPriceId, getSiteOrigin, isBillingPlan } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';

// POST /api/billing/checkout
// Body: { plan: 'yearly' | 'monthly' }
// Creates a Stripe Checkout Session for the authenticated teacher and returns { url }.
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ error: 'Billing is unavailable in mock mode' }, { status: 503 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { plan?: unknown } | null;
  const plan = body?.plan;
  if (!isBillingPlan(plan)) {
    return NextResponse.json({ error: 'plan must be "yearly" or "monthly"' }, { status: 400 });
  }

  const priceId = getPriceId(plan);
  if (!priceId) {
    console.error(`[billing/checkout] missing Stripe price id for plan: ${plan}`);
    return NextResponse.json({ error: 'Billing is not configured' }, { status: 500 });
  }

  const service = createServiceClient();
  const { data: teacherRow } = await service
    .from('teachers')
    .select('subscription_status, stripe_customer_id')
    .eq('id', teacher.id)
    .single();

  if (!teacherRow) {
    return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 });
  }

  if (teacherRow.subscription_status === 'active') {
    return NextResponse.json(
      { error: 'You already have an active subscription. Use "Manage subscription" instead.', code: 'ALREADY_SUBSCRIBED' },
      { status: 400 }
    );
  }

  const origin = getSiteOrigin(new URL(request.url).origin);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id + subscription metadata are how webhooks map Stripe
      // objects back to a teacher — do not remove either.
      client_reference_id: teacher.id,
      subscription_data: { metadata: { teacher_id: teacher.id } },
      metadata: { teacher_id: teacher.id },
      ...(teacherRow.stripe_customer_id
        ? { customer: teacherRow.stripe_customer_id }
        : { customer_email: teacher.email || undefined }),
      allow_promotion_codes: true,
      success_url: `${origin}/home?upgraded=1`,
      cancel_url: `${origin}/pro?checkout=cancelled`,
    });

    if (!session.url) {
      console.error('[billing/checkout] Stripe session created without url', session.id);
      return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[billing/checkout] Stripe error:', err);
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
  }
}
