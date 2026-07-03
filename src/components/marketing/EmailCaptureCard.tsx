'use client';

import { useState } from 'react';
import { Mail, Send, Check, Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/posthog';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export function EmailCaptureCard({
  source,
}: {
  source: 'homepage' | 'video-lesson' | 'seo-games' | 'seo-activities';
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting' || status === 'done') return;
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/marketing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      setStatus('done');
      trackEvent('email_captured', { source });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className="rounded-2xl border p-6 sm:p-8 text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0f1e38 0%, #101A2E 40%, #0a1628 100%)',
        borderColor: 'rgba(77,163,255,0.25)',
        boxShadow: '0 0 0 1px rgba(77,163,255,0.08), inset 0 1px 0 rgba(77,163,255,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(77,163,255,0.09) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lc-blue/30 bg-lc-blue/10">
          <Mail className="h-5 w-5 text-lc-blue" aria-hidden />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Get one ready-to-run lesson idea each week
        </h3>
        <p className="max-w-sm text-sm text-lc-text2">
          A short email with a lesson you can fly with your class in minutes.
        </p>

        {status === 'done' ? (
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <Check className="h-4 w-4" aria-hidden />
            You&apos;re on the list.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-1 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              disabled={status === 'submitting'}
              className="min-w-0 flex-1 rounded-xl border border-lc-border bg-lc-surface px-4 py-2.5 text-sm text-lc-text placeholder-lc-text3 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || !email.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lc-blue px-5 py-2.5 text-sm font-bold text-[#070B14] transition-colors hover:bg-lc-blue-hover disabled:opacity-50"
            >
              {status === 'submitting' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Sign up
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-xs font-medium text-amber-300">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  );
}
