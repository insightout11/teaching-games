'use client';

import { motion } from 'framer-motion';
import { Users, Target, Trophy, StickyNote } from 'lucide-react';

const DATA_POINTS = [
  {
    icon: Users,
    label: 'Participation by student',
    detail: 'See who answered every round',
  },
  {
    icon: Target,
    label: 'Accuracy per round',
    detail: 'Right/wrong breakdown per question',
  },
  {
    icon: Trophy,
    label: 'Leaderboard & scoring history',
    detail: 'Full scores and rankings, round by round',
  },
  {
    icon: StickyNote,
    label: 'Session notes',
    detail: 'Add notes to carry context into the next class',
  },
];

export function TrustSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold mb-4"
          style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DATA_POINTS.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="rounded-xl border border-lc-border bg-lc-card p-5 flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-lc-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-lc-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-lc-text mb-1">{point.label}</p>
                  <p className="text-xs text-lc-text3 leading-relaxed">{point.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
