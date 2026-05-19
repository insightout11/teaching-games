export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Plane, CheckCircle2 } from 'lucide-react';

const PRO_BENEFITS = [
  'Unlimited live lessons — teach every day without counting credits',
  'Saved and reusable Flight Plans for your regular lesson types',
  'Full session history and debriefs for every class',
  'Source-based lessons from YouTube videos, articles, and PDFs',
  'Custom topics for your exact curriculum and learner level',
];

export default function ProPage() {
  return (
    <div className="max-w-xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-lc-amber/15 flex items-center justify-center mx-auto">
          <Plane className="w-7 h-7 text-lc-amber" />
        </div>
        <h1 className="text-2xl font-bold text-lc-text">LessonCaptain Pro</h1>
        <p className="text-lc-text3 text-sm leading-relaxed">
          For teachers who run live lessons regularly and don&apos;t want to think about limits.
          Pro is in active development — early access is available now.
        </p>
      </div>

      {/* Benefits */}
      <div className="bg-lc-card rounded-2xl border border-lc-border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-lc-text2 uppercase tracking-wide">What you get</h2>
        <ul className="space-y-3">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-lc-success shrink-0 mt-0.5" />
              <span className="text-sm text-lc-text">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Early access CTA */}
      <div className="bg-gradient-to-br from-lc-blue/5 to-purple-500/5 rounded-2xl border border-lc-blue/20 p-6 text-center space-y-4">
        <p className="text-sm font-medium text-lc-text">Get early access</p>
        <p className="text-sm text-lc-text3">
          Pro pricing and self-serve signup are coming soon. In the meantime, email us to get
          Pro access — we&apos;re onboarding teachers directly.
        </p>
        <a
          href="mailto:hello@lessoncaptain.com?subject=Pro%20access%20request"
          className="inline-flex items-center justify-center gap-2 bg-lc-blue text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-lc-blue/90 transition-colors"
        >
          Request Pro access
        </a>
      </div>

      <div className="text-center">
        <Link href="/home" className="text-xs text-lc-text3 hover:text-lc-text2 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
