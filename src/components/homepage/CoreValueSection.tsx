'use client';

import { motion } from 'framer-motion';
import { Radio, Map, Activity } from 'lucide-react';

const CARDS = [
  {
    icon: Activity,
    title: 'Energy without chaos',
    description:
      'Competitive games and live scoring keep students engaged, while structured pacing keeps the class on track.',
  },
  {
    icon: Map,
    title: 'Structure without overplanning',
    description:
      'Your Flight Plan sequences the lesson for you. Adjust as you go — no rigid scripts, no prep spirals.',
  },
  {
    icon: Radio,
    title: 'Live-class support built in',
    description:
      'Activities, polls, and games are the lesson. Real-time responses feed directly into your teaching decisions.',
  },
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
          className="text-3xl sm:text-4xl font-bold text-lc-text text-center mb-4"
        >
          The control room for live teaching
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="text-lc-text2 text-center max-w-xl mx-auto mb-14"
        >
          One interface to plan, launch, and manage your entire lesson from a single screen.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-lc-border bg-lc-card p-6 flex flex-col gap-4 cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-lc-blue/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-lc-blue" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-lc-text mb-2">{card.title}</h3>
                  <p className="text-sm text-lc-text2 leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
