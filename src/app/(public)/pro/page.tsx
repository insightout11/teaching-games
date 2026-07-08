export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pro — LessonCaptain',
  description: 'Unlimited live lessons, saved Flight Plans, and source-based content for language teachers.',
};

const FREE_FEATURES = [
  '5 Test Flight credits to try the full product',
  'All games and activities during your Test Flights',
  'Source-based lessons and custom topics included in your Test Flights',
  'Run live lessons — students join free, no accounts',
  'Full Flight Plan experience',
  'History saved for your 5 used Test Flights',
];

const PRO_FEATURES = [
  'Unlimited live lessons for normal teaching use',
  'Source-based lessons from video, text, and PDF',
  'Saved and reusable Flight Plans',
  'Ongoing class history and debriefs for every lesson',
  'Custom topics for your exact curriculum',
  'Students always join free — no accounts needed',
  'Editable progress report drafts from your notes and session history',
];

const FAQ = [
  {
    q: 'What counts as a Test Flight?',
    a: 'Any live lesson launch — a single game, a single activity, or a full Flight Plan. One launch uses one credit, regardless of lesson length.',
  },
  {
    q: 'What happens to my free session history if I upgrade?',
    a: 'It stays saved. Your Test Flight debriefs are always accessible whether you upgrade or not. Pro teachers can also add private notes per student and generate editable progress report drafts from their session history.',
  },
  {
    q: 'When will self-serve checkout be available?',
    a: 'Soon. Pro is in active development. For now, email us and we\'ll get you set up directly — usually within a day.',
  },
  {
    q: 'Is there a school or team plan?',
    a: 'Not yet. School and studio plans are coming. Email us if you need access for multiple teachers.',
  },
];

export default function ProPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-lc-text">Simple, honest pricing</h1>
        <p className="text-lc-text2 text-base leading-relaxed">
          Try the full product free. Upgrade to Pro when you&apos;re ready to teach without limits.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Free */}
        <div className="bg-lc-card border border-lc-border rounded-2xl p-7 space-y-6">
          <div>
            <p className="text-xs font-semibold text-lc-text3 uppercase tracking-wide mb-1">Free</p>
            <p className="text-3xl font-bold text-lc-text">$0</p>
            <p className="text-sm text-lc-text3 mt-1">5 Test Flight credits, no card required</p>
          </div>

          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-lc-text2">
                <svg className="w-4 h-4 text-lc-text3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="block w-full text-center py-2.5 rounded-xl border border-lc-border text-sm font-semibold text-lc-text2 hover:border-lc-text3 transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-lc-card border border-lc-blue/40 rounded-2xl p-7 space-y-6 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-lc-blue/5 to-purple-500/5 pointer-events-none rounded-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide">Pro</p>
              <span className="text-[10px] font-semibold text-lc-amber bg-lc-amber/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Founding offer
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-lc-text">$79<span className="text-base font-normal text-lc-text3">/year</span></p>
              <p className="text-sm text-lc-text3 line-through">$99</p>
            </div>
            <p className="text-sm text-lc-text3 mt-1">
              Founding price until <span className="text-lc-text2 font-medium">August 31, 2026</span> · or $12/month
            </p>
          </div>

          <ul className="relative space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-lc-text">
                <svg className="w-4 h-4 text-lc-blue shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <div className="relative space-y-3">
            <a
              href="mailto:hello@lessoncaptain.com?subject=Pro%20access%20request"
              className="block w-full text-center py-2.5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:bg-lc-blue/90 transition-colors"
            >
              Request Pro access
            </a>
            <p className="text-xs text-center text-lc-text3">
              Self-serve checkout coming soon. For now, we onboard Pro teachers directly.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-sm font-semibold text-lc-text2 uppercase tracking-wide text-center">Questions</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="border-b border-lc-border pb-4 last:border-0">
              <p className="text-sm font-semibold text-lc-text mb-1.5">{q}</p>
              <p className="text-sm text-lc-text3 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="text-center">
        <Link href="/" className="text-xs text-lc-text3 hover:text-lc-text2 transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
