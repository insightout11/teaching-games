'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const LEFT_PRESETS = ['Game Day', 'Vocab Blitz', 'Speaking Circle'];
const RIGHT_PRESETS = ['Hot Take Arena', 'Connections', 'Vocab Sprint'];

export function PresetsSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl font-bold text-center mb-3"
          style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
        >
          Two ways to start
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="text-lc-text2 text-center max-w-xl mx-auto mb-12"
        >
          Run a full structured lesson or launch a single activity right now — both take under a minute to set up.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left: Plan a full lesson */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-lc-border bg-lc-card p-7 flex flex-col gap-5"
          >
            <div>
              <h3 className="text-lg font-bold text-lc-text mb-2">Plan a full lesson</h3>
              <p className="text-sm text-lc-text2 leading-relaxed">
                Build a Flight Plan with takeoff, practice, production, and landing activities. Content generates automatically — you run the class.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LEFT_PRESETS.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-lc-blue/10 px-3 py-1 text-xs font-medium text-lc-blue"
                >
                  {name}
                </span>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-auto inline-block text-sm font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors"
            >
              Build a Flight Plan →
            </Link>
          </motion.div>

          {/* Right: Launch one activity now */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-lc-border bg-lc-card p-7 flex flex-col gap-5"
          >
            <div>
              <h3 className="text-lg font-bold text-lc-text mb-2">Launch one activity now</h3>
              <p className="text-sm text-lc-text2 leading-relaxed">
                Pick a game or speaking activity and run it immediately during class. No lesson plan required.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RIGHT_PRESETS.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-lc-blue/10 px-3 py-1 text-xs font-medium text-lc-blue"
                >
                  {name}
                </span>
              ))}
            </div>
            <Link
              href="/showcase"
              className="mt-auto inline-block text-sm font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors"
            >
              Browse activities →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
