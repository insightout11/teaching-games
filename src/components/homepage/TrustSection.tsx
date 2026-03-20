'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const BULLETS = [
  'Less prep — build a complete lesson in minutes, not hours',
  'More participation — students respond on their own devices in real time',
  'Clearer lesson flow — structured pacing from Takeoff to Landing',
  'Stronger live-class energy — competitive games and instant feedback',
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
          className="text-3xl font-bold text-lc-text mb-6"
        >
          Made for online ESL teachers
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="text-lc-text2 leading-relaxed mb-10"
        >
          LessonCaptain is designed around how online language classes actually work — limited screen
          time, students on phones, lessons that need energy and direction at the same time. It
          gives you the structure to stay in control and the tools to keep students genuinely engaged.
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
