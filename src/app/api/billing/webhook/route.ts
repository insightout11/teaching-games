import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe, mapStripeStatus } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';

// POST /api/billing/webhook
// Stripe webhook receiver. The signature check IS the authentication — this
// route must never require a Supabase session.
//
// Events handled:
//   checkout.session.completed        → activate subscription, store Stripe ids
//   customer.subscription.updated     → map status (active/past_due keep access)
//   customer.subscription.deleted     → set 'cancelled'
//
// All handlers are idempotent (they SET state rather than increment), so
// Stripe's retry/replay behavior is safe. Out-of-order events from an old
// subscription are ignored via the stored stripe_subscription_id guard.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[billing/webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Signature verification needs the raw body byte-for-byte. request.json()
  // would re-serialize and break it — keep this as text().
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[billing/webhook] signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const service = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const teacherId = session.client_reference_id;
        if (!teacherId) {
          console.error('[billing/webhook] checkout.session.completed without client_reference_id', session.id);
          break;
        }

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

        const { error } = await service
          .from('teachers')
          .update({
            subscription_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teacherId);

        if (error) {
          console.error('[billing/webhook] failed to activate teacher:', teacherId, error.message);
          // 500 so Stripe retries — the teacher paid and must be unlocked.
          return NextResponse.json({ error: 'Failed to apply entitlement' }, { status: 500 });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const teacher = await findTeacherForSubscription(service, subscription);

        if (!teacher) {
          // Not necessarily an error: e.g. a subscription created directly in
          // the Stripe dashboard with no teacher metadata. Log and ack.
          console.warn('[billing/webhook] no teacher found for subscription', subscription.id);
          break;
        }

        // Stale-event guard: after a resubscribe the teacher row points at the
        // new subscription; late events from the old one must not flip status.
        if (teacher.stripe_subscription_id && teacher.stripe_subscription_id !== subscription.id) {
          break;
        }

        const newStatus = event.type === 'customer.subscription.deleted'
          ? 'cancelled'
          : mapStripeStatus(subscription.status);
        if (!newStatus) break;

        const { error } = await service
          .from('teachers')
          .update({
            subscription_status: newStatus,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teacher.id);

        if (error) {
          console.error('[billing/webhook] failed to update teacher status:', teacher.id, error.message);
          return NextResponse.json({ error: 'Failed to apply entitlement' }, { status: 500 });
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying them.
        break;
    }
  } catch (err) {
    console.error('[billing/webhook] handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

interface TeacherBillingRow {
  id: string;
  stripe_subscription_id: string | null;
}

/**
 * Resolve which teacher a subscription event belongs to, most reliable first:
 * 1. subscription.metadata.teacher_id (set at checkout — survives everything)
 * 2. stored stripe_subscription_id
 * 3. stored stripe_customer_id
 */
async function findTeacherForSubscription(
  service: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
): Promise<TeacherBillingRow | null> {
  const metadataTeacherId = subscription.metadata?.teacher_id;
  if (metadataTeacherId) {
    const { data } = await service
      .from('teachers')
      .select('id, stripe_subscription_id')
      .eq('id', metadataTeacherId)
      .maybeSingle();
    if (data) return data as TeacherBillingRow;
  }

  const { data: bySubscription } = await service
    .from('teachers')
    .select('id, stripe_subscription_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();
  if (bySubscription) return bySubscription as TeacherBillingRow;

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (customerId) {
    const { data: byCustomer } = await service
      .from('teachers')
      .select('id, stripe_subscription_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (byCustomer) return byCustomer as TeacherBillingRow;
  }

  return null;
}
