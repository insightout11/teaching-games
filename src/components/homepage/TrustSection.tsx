'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const BULLETS = [
  'Participation by student',
  'Accuracy per round',
  'Leaderboard and scoring history',
  'Session notes for continuity',
];

export function TrustSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold mb-6"
          style={{ color: 'white' }}
        >
          After class, the data is waiting
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="text-lc-text2 leading-relaxed mb-10"
        >
          LessonCaptain keeps the data that matters: who participated, what students got right, leaderboard
          results, round history, and notes for next time.
        </motion.p>

        <div className="flex flex-col gap-4">
          {BULLETS.map((bullet, i) => (
            <motion.div
              key={bullet}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-lc-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-lc-blue" />
              </div>
              <p className="text-sm text-lc-text2 leading-relaxed">{bullet}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
