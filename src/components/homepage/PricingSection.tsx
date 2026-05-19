'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
];

export function PricingSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h2
            className="text-3xl font-bold mb-3"
            style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
          >
            Free to try. Pro when you&apos;re ready.
          </h2>
          <p className="text-lc-text2 leading-relaxed">
            Every new teacher gets 5 free Test Flights — full live lessons, no card required.
            Upgrade to Pro for unlimited teaching.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-lc-border bg-lc-card p-6 space-y-5"
          >
            <div>
              <p className="text-xs font-semibold text-lc-text3 uppercase tracking-wide mb-1">Free</p>
              <p className="text-2xl font-bold text-lc-text">$0</p>
            </div>
            <ul className="space-y-2.5">
              {FREE_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-lc-text2">
                  <span className="w-1.5 h-1.5 rounded-full bg-lc-text3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.07 }}
            className="rounded-2xl border border-lc-blue/40 bg-lc-card p-6 space-y-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-lc-blue/5 to-purple-500/5 pointer-events-none rounded-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide">Pro</p>
                <span className="text-[10px] font-semibold text-lc-amber bg-lc-amber/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Founding offer
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-lc-text">$79<span className="text-sm font-normal text-lc-text3">/year</span></p>
                <p className="text-sm text-lc-text3 line-through">$99</p>
              </div>
              <p className="text-xs text-lc-text3 mt-0.5">Until Aug 31, 2026 · or $12/month</p>
            </div>
            <ul className="relative space-y-2.5">
              {PRO_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-lc-text">
                  <svg className="w-3.5 h-3.5 text-lc-blue shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 text-center"
        >
          <Link href="/pro" className="text-sm text-lc-blue hover:text-lc-blue/80 transition-colors">
            See full pricing and FAQ →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
