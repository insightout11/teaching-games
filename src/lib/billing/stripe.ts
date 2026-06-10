import Stripe from 'stripe';

// Lazy singleton so the SDK is only constructed when a billing route runs
// (build-time imports must not throw when STRIPE_SECRET_KEY is absent).
let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export type BillingPlan = 'yearly' | 'monthly';

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === 'yearly' || value === 'monthly';
}

export function getPriceId(plan: BillingPlan): string | null {
  const priceId = plan === 'yearly'
    ? process.env.STRIPE_PRICE_YEARLY
    : process.env.STRIPE_PRICE_MONTHLY;
  return priceId || null;
}

/**
 * Map a Stripe subscription status onto teachers.subscription_status, which is
 * constrained by CHECK to 'free' | 'trial' | 'active' | 'cancelled'.
 *
 * 'past_due' keeps access: Stripe retries the payment for days and either
 * recovers (→ active) or gives up (→ canceled/unpaid, handled below). Cutting
 * access during retries would break a teacher mid-lesson over a card hiccup.
 *
 * Returns null when the event should not change entitlement.
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'cancelled' | null {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return 'active';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'cancelled';
    // 'incomplete' = checkout not finished; 'paused' = trial ended without
    // payment method. Neither should flip an existing entitlement.
    case 'incomplete':
    case 'paused':
    default:
      return null;
  }
}

/** Site origin for Stripe redirect URLs. Prefers the configured public URL so
 *  preview deploys and proxies don't leak internal hosts into receipts. */
export function getSiteOrigin(fallbackOrigin: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || fallbackOrigin;
}
