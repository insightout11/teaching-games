'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Plane, PlaneTakeoff } from 'lucide-react';

const FREE_ITEMS = [
  '5 Test Flight credits',
  'All games and activities',
  'Live lessons — students join free',
  'History for your Test Flights',
];

const PRO_ITEMS = [
  'Unlimited live lessons',
  'Source-based lessons (video, text, PDF)',
  'Saved and reusable Flight Plans',
  'Ongoing class history and debriefs',
  'Custom topics',
  'Editable progress report drafts',
];

// Tear-off stub: vertical perforation with die-cut notches, plane glyph, and a
// vertical barcode — the geometry that actually reads "boarding pass".
function TicketStub({ amber }: { amber?: boolean }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-between border-l border-dashed py-6 ${
        amber ? 'border-lc-amber/35' : 'border-lc-border'
      }`}
      aria-hidden
    >
      {/* Die-cut notches at the perforation ends */}
      <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-[#070B14]" />
      <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-[#070B14]" />
      <Plane className={`h-6 w-6 rotate-45 ${amber ? 'text-lc-amber' : 'text-lc-text3'}`} />
      {/* Vertical barcode */}
      <div
        className="h-32 w-8 opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, #EAF1FF 0 2px, transparent 2px 5px, #EAF1FF 5px 6px, transparent 6px 10px, #EAF1FF 10px 13px, transparent 13px 16px)',
        }}
      />
      <p className={`font-instrument text-[11px] uppercase tracking-[0.2em] ${amber ? 'text-lc-amber/80' : 'text-lc-text3'}`}>
        LC
      </p>
    </div>
  );
}

export function PricingSection() {
  const reduce = !!useReducedMotion();

  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h2 className="text-shadow-hero text-3xl sm:text-4xl font-bold mb-3 text-white">
            Free to try. Pro when you&apos;re ready.
          </h2>
          <p className="mx-auto max-w-2xl text-lc-text2 leading-relaxed">
            Every new teacher gets 5 free Test Flights — full live lessons, no card required.
            Upgrade to Pro for unlimited teaching.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Free fare */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={reduce ? undefined : { y: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-[1fr_84px] overflow-hidden rounded-2xl border border-lc-border bg-lc-card shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)]"
          >
            <div className="flex flex-col">
              <div className="border-b border-lc-border bg-gradient-to-r from-[#0b1c38]/60 to-transparent px-7 py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-3xl font-bold text-lc-text">Free</p>
                  <p className="text-4xl font-bold text-lc-text">$0</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-7 py-6">
                <ul className="mb-7 space-y-3.5">
                  {FREE_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-lc-text2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lc-text3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-lg bg-lc-blue px-5 py-2.5 text-sm font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
                >
                  <PlaneTakeoff className="h-4 w-4" aria-hidden />
                  Start a Test Flight
                </Link>
              </div>
            </div>
            <TicketStub />
          </motion.div>

          {/* Pro fare */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={reduce ? undefined : { y: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.07 }}
            className="grid grid-cols-[1fr_84px] overflow-hidden rounded-2xl border border-lc-amber/40 bg-lc-card shadow-[0_0_54px_-14px_rgba(245,158,11,0.45),0_24px_60px_-28px_rgba(0,0,0,0.9)]"
          >
            <div className="flex flex-col">
              <div className="border-b border-lc-amber/25 bg-gradient-to-r from-lc-amber/[0.14] to-transparent px-7 py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <p className="text-3xl font-bold text-lc-text">Pro</p>
                    <span className="rounded-full bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-amber">
                      Founding offer
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-lc-text">
                      $79<span className="text-base font-normal text-lc-text3">/yr</span>
                    </p>
                    <p className="text-sm text-lc-text3 line-through">$99</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-lc-text3">Until Aug 31, 2026 · or $8/month</p>
              </div>
              <div className="flex flex-1 flex-col px-7 py-6">
                <ul className="space-y-3.5">
                  {PRO_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-lc-text">
                      <svg className="h-4 w-4 shrink-0 text-lc-amber" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pro"
                  className="mt-7 inline-flex items-center justify-center gap-2 self-start rounded-lg bg-gradient-to-b from-lc-amber to-[#e08600] px-5 py-2.5 text-sm font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105"
                >
                  Go Pro
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
            <TicketStub amber />
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 text-center"
        >
          <Link href="/pro" className="text-sm text-lc-blue hover:text-lc-blue/80 transition-colors">
            See full pricing and FAQ →
          </Link>
          <p className="mt-6 text-xs text-lc-text3">
            Built by an online ESL teacher for online ESL teachers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
