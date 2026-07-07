'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Plane } from 'lucide-react';

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
      className={`relative flex flex-col items-center justify-between border-l border-dashed py-5 ${
        amber ? 'border-lc-amber/35' : 'border-lc-border'
      }`}
      aria-hidden
    >
      {/* Die-cut notches at the perforation ends */}
      <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-[#070B14]" />
      <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-[#070B14]" />
      <Plane className={`h-5 w-5 rotate-45 ${amber ? 'text-lc-amber' : 'text-lc-text3'}`} />
      {/* Vertical barcode */}
      <div
        className="h-28 w-7 opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, #EAF1FF 0 2px, transparent 2px 5px, #EAF1FF 5px 6px, transparent 6px 10px, #EAF1FF 10px 13px, transparent 13px 16px)',
        }}
      />
      <p className={`font-instrument text-[10px] uppercase tracking-[0.2em] ${amber ? 'text-lc-amber/80' : 'text-lc-text3'}`}>
        LC
      </p>
    </div>
  );
}

export function PricingSection() {
  const reduce = !!useReducedMotion();

  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h2 className="text-shadow-hero text-3xl font-bold mb-3 text-white">
            Free to try. Pro when you&apos;re ready.
          </h2>
          <p className="text-lc-text2 leading-relaxed">
            Every new teacher gets 5 free Test Flights — full live lessons, no card required.
            Upgrade to Pro for unlimited teaching.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Free fare */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-[1fr_72px] overflow-hidden rounded-2xl border border-lc-border bg-lc-card"
          >
            <div>
              <div className="border-b border-lc-border bg-gradient-to-r from-[#0b1c38]/60 to-transparent px-6 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="font-instrument text-[10px] font-semibold uppercase tracking-[0.24em] text-lc-text3">
                      Fare class
                    </p>
                    <p className="text-2xl font-bold text-lc-text">Free</p>
                  </div>
                  <p className="text-3xl font-bold text-lc-text">$0</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <ul className="space-y-3">
                  {FREE_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-lc-text2">
                      <span className="w-1.5 h-1.5 rounded-full bg-lc-text3 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <TicketStub />
          </motion.div>

          {/* Pro fare */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.07 }}
            className="grid grid-cols-[1fr_72px] overflow-hidden rounded-2xl border border-lc-amber/40 bg-lc-card shadow-[0_0_44px_-14px_rgba(245,158,11,0.4)]"
          >
            <div>
              <div className="border-b border-lc-amber/25 bg-gradient-to-r from-lc-amber/[0.14] to-transparent px-6 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-instrument text-[10px] font-semibold uppercase tracking-[0.24em] text-lc-amber">
                        Fare class
                      </p>
                      <span className="text-[10px] font-semibold text-lc-amber bg-lc-amber/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Founding offer
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-lc-text">Pro</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-lc-text">
                      $79<span className="text-sm font-normal text-lc-text3">/yr</span>
                    </p>
                    <p className="text-sm text-lc-text3 line-through">$99</p>
                  </div>
                </div>
                <p className="text-xs text-lc-text3 mt-1">Until Aug 31, 2026 · or $12/month</p>
              </div>
              <div className="px-6 py-5">
                <ul className="space-y-3">
                  {PRO_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-lc-text">
                      <svg className="w-3.5 h-3.5 text-lc-amber shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
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
          className="mt-6 text-center"
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
