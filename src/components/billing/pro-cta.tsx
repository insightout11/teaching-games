'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import type { BillingPlan } from '@/lib/billing/stripe';

// Checkout / manage-subscription CTA for the /pro page.
// Logged-out users are sent to /login?next=/pro; Pro users see the portal link.
export function ProCta() {
  const router = useRouter();
  const tier = useTeacherTier();
  const [pending, setPending] = useState<BillingPlan | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: BillingPlan) {
    setPending(plan);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        router.push('/login?next=/pro');
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(data?.error ?? 'Could not start checkout. Please try again.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setPending(null);
    }
  }

  async function openPortal() {
    setPending('portal');
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(
          data?.code === 'NO_STRIPE_CUSTOMER'
            ? 'Your Pro access is managed directly — email hello@lessoncaptain.com for changes.'
            : data?.error ?? 'Could not open the billing portal.'
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Could not open the billing portal.');
    } finally {
      setPending(null);
    }
  }

  if (tier.isPro && !tier.loading) {
    return (
      <div className="relative space-y-3">
        <p className="text-sm text-center font-semibold text-lc-text">You&apos;re on Pro ✈</p>
        <button
          onClick={openPortal}
          disabled={pending !== null}
          className="block w-full text-center py-2.5 rounded-xl border border-lc-border text-sm font-semibold text-lc-text2 hover:border-lc-text3 transition-colors disabled:opacity-60"
        >
          {pending === 'portal' ? 'Opening…' : 'Manage subscription'}
        </button>
        {error && <p className="text-xs text-center text-lc-amber">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      <button
        onClick={() => startCheckout('yearly')}
        disabled={pending !== null}
        className="block w-full text-center py-2.5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:bg-lc-blue/90 transition-colors disabled:opacity-60"
      >
        {pending === 'yearly' ? 'Starting checkout…' : 'Get Pro — $79/year'}
      </button>
      <button
        onClick={() => startCheckout('monthly')}
        disabled={pending !== null}
        className="block w-full text-center py-2.5 rounded-xl border border-lc-border text-sm font-semibold text-lc-text2 hover:border-lc-text3 transition-colors disabled:opacity-60"
      >
        {pending === 'monthly' ? 'Starting checkout…' : 'Or $12/month'}
      </button>
      {error && <p className="text-xs text-center text-lc-amber">{error}</p>}
      <p className="text-xs text-center text-lc-text3">
        Secure checkout via Stripe. Cancel anytime from this page.
      </p>
    </div>
  );
}
