'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const BULLETS = [
  'Students participate from their own browser — no app or login',
  'Teacher keeps control while screen sharing',
  'Works in one-to-one, small group, and online class settings',
  'No student login required',
  'Designed for speaking, vocabulary, grammar, discussion, and review',
  'Works with Zoom, Google Meet, Teams, or any screen-sharing setup',
];

export function CoreValueSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-14"
        >
          Built for online ESL teachers
        </motion.h2>

        <div className="rounded-2xl border border-lc-border bg-lc-card p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BULLETS.map((bullet, i) => (
              <motion.div
                key={bullet}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-lc-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-lc-success" />
                </div>
                <p className="text-sm text-lc-text leading-relaxed">{bullet}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
