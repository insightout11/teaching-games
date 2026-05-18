'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function TestFlightSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-lc-border bg-lc-card p-10 sm:p-14 flex flex-col items-center text-center gap-6 relative overflow-hidden"
        >
          {/* Route endpoint motif */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg
              className="absolute bottom-0 left-0 w-full h-24 opacity-10"
              viewBox="0 0 600 96"
              fill="none"
            >
              <path
                d="M -20,48 C 80,20 160,76 280,48 C 400,20 480,76 620,48"
                stroke="var(--lc-blue)"
                strokeWidth="1.5"
              />
              <circle cx="280" cy="48" r="6" fill="none" stroke="var(--lc-blue)" strokeWidth="1.5" />
              <circle cx="280" cy="48" r="3" fill="var(--lc-blue)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lc-blue" />
              <span className="text-xs font-semibold tracking-widest uppercase text-lc-blue">
                Test Flight
              </span>
              <div className="w-2 h-2 rounded-full bg-lc-blue" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-lc-text max-w-lg leading-tight">
              Run your first live lesson free
            </h2>

            <p className="text-lc-text2 max-w-md leading-relaxed">
              Pick a game or activity, type in your topic, and run it live with your class. We call each free session a Test Flight — one credit, one full lesson.
            </p>

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
