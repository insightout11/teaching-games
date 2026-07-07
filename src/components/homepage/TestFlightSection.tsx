'use client';

import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import { TakeoffSpark } from '@/components/ui/takeoff-spark';

export function TestFlightSection() {
  const sparkRef = useRef(null);
  const sparkInView = useInView(sparkRef, { once: true, margin: '-80px' });

  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-lc-border bg-lc-card p-10 sm:p-14 flex flex-col items-center text-center gap-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0f1e38 0%, #101A2E 40%, #0a1628 100%)',
            borderColor: 'rgba(77,163,255,0.25)',
            boxShadow: '0 0 0 1px rgba(77,163,255,0.08), inset 0 1px 0 rgba(77,163,255,0.12)',
          }}
        >
          {/* Deep radial glow from center */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(77,163,255,0.09) 0%, transparent 70%)',
            }}
          />

          {/* Top edge light streak */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 opacity-60"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(77,163,255,0.5), transparent)',
            }}
          />

          {/* Warm runway glow from above — ties the card to the runway-lights strip */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Dot grid — fades toward edges */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(77,163,255,0.18) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 20%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 20%, transparent 100%)',
              opacity: 0.4,
            }}
          />

          {/* Corner accent — bottom right */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-48 h-48 opacity-20"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(77,163,255,0.4) 0%, transparent 60%)',
            }}
          />
          {/* Corner accent — top left */}
          <div
            className="pointer-events-none absolute top-0 left-0 w-32 h-32 opacity-15"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle at top left, rgba(77,163,255,0.35) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lc-blue" />
              <span className="text-xs font-semibold tracking-widest uppercase text-lc-blue">
                Test Flight
              </span>
              <div className="w-2 h-2 rounded-full bg-lc-blue" />
            </div>

            <h2 className="text-shadow-hero text-3xl sm:text-4xl font-bold max-w-lg leading-tight text-white">
              Run your first live lesson free
            </h2>

            <p className="text-lc-text2 max-w-md leading-relaxed">
              Pick a game or activity, type in your topic, and run it live with your class. Your account includes free Test Flight credits, so you can run live lessons before upgrading.
            </p>

            <div ref={sparkRef}>
              {sparkInView && <TakeoffSpark size={160} />}
            </div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="inline-block px-8 py-3.5 rounded-lg bg-lc-blue text-[#070B14] font-bold text-base hover:bg-lc-blue-hover transition-colors"
              >
                Start a Test Flight
              </Link>
            </motion.div>

            <p className="text-xs text-lc-text3">
              Sign in with Google — no credit card needed.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
