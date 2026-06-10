# Stripe Billing — Setup & Go-Live

The billing backend is fully built and tested. It stays dormant until the env
vars below are set and the `/pro` page CTA is swapped. Nothing breaks while
dormant — the routes 500/503 cleanly if hit unconfigured.

## What exists

| Piece | File |
|---|---|
| Stripe client + status mapping | `src/lib/billing/stripe.ts` |
| Checkout session creation | `src/app/api/billing/checkout/route.ts` (POST, auth required, body `{ plan: 'yearly' \| 'monthly' }` → `{ url }`) |
| Webhook receiver | `src/app/api/billing/webhook/route.ts` (signature-verified, idempotent) |
| Billing portal (cancel/card/invoices) | `src/app/api/billing/portal/route.ts` (POST, auth required → `{ url }`) |
| Checkout/manage UI component | `src/components/billing/pro-cta.tsx` (**built but not yet mounted on `/pro`**) |
| Tests (20) | `src/__tests__/api/billing.test.ts` |

Entitlement flows through the existing chain untouched: the webhook sets
`teachers.subscription_status = 'active'`, which `get_teacher_credits` /
`useTeacherTier` already treat as Pro. No migration needed — `subscription_status`,
`stripe_customer_id`, `stripe_subscription_id` all exist since migration 001.

## Status mapping (the part to not change casually)

Stripe → `teachers.subscription_status` (CHECK-constrained to free/trial/active/cancelled):

- `active`, `trialing`, **`past_due`** → `'active'` — past_due keeps access while
  Stripe retries the card ("never break mid-class"); if retries fail Stripe
  emits `canceled`/`unpaid` and access ends then.
- `canceled`, `unpaid`, `incomplete_expired` → `'cancelled'`
- `incomplete`, `paused` → no change

Stale-event guard: subscription events whose id ≠ the teacher's stored
`stripe_subscription_id` are ignored (protects resubscribers from late events
of their old subscription).

## Go-live checklist

1. **Stripe dashboard** (test mode first):
   - Create product "LessonCaptain Pro" with two prices: $79/year and $12/month.
   - Copy both price IDs.
2. **Env vars** (`.env.local` locally, Vercel project settings in prod):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_YEARLY=price_...
   STRIPE_PRICE_MONTHLY=price_...
   NEXT_PUBLIC_SITE_URL=https://lessoncaptain.com   # prod only
   ```
3. **Webhook endpoint**:
   - Local: `stripe listen --forward-to localhost:3000/api/billing/webhook`
     (prints the `whsec_` secret).
   - Prod: dashboard → Webhooks → add `https://lessoncaptain.com/api/billing/webhook`
     with events `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`.
4. **Swap the CTA** on `src/app/(public)/pro/page.tsx`: replace the mailto
   block with `<ProCta />` (import from `@/components/billing/pro-cta`) and
   update the "When will self-serve checkout be available?" FAQ entry.
5. **Test-mode verification** (card `4242 4242 4242 4242`):
   - Free account → yearly checkout → completes → `subscription_status='active'`
     in the teachers table → Pro modules unlock with no manual DB edit.
   - "Manage subscription" opens the Stripe portal; cancel → status flips to
     `'cancelled'` at period end (or immediately if configured).
   - A second checkout attempt while active returns `ALREADY_SUBSCRIBED`.
6. Switch to live keys and repeat step 5 once with a real card, then refund.

## Notes

- Teachers manually onboarded before checkout existed (status set by hand in
  Supabase Studio) have no `stripe_customer_id`; the portal route returns
  `NO_STRIPE_CUSTOMER` and the UI tells them to email — intended.
- `allow_promotion_codes: true` is set, so the Aug 31 founding-price change can
  be done later as either a price swap or a promo code without code changes.
- The webhook returns 500 on DB write failures **on purpose** — Stripe retries
  until the paid teacher actually gets unlocked.
