'use client';

import { motion } from 'framer-motion';
import { Target, Layers, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: Target,
    number: '01',
    title: 'Pick a goal',
    description:
      'Choose from speaking, grammar, vocabulary, debate, or creativity. LessonCaptain builds the lesson structure around it.',
  },
  {
    icon: Layers,
    number: '02',
    title: 'Get a lesson',
    description:
      'A complete Flight Plan is generated — sequenced activities and games, pacing chips, your topic applied throughout.',
  },
  {
    icon: Zap,
    number: '03',
    title: 'Teach',
    description:
      'Students join on their phones. Real-time responses, live leaderboard, full engagement from the first minute.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold tracking-widest uppercase text-lc-blue text-center mb-3"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-3xl font-bold text-lc-text text-center mb-14"
        >
          Pick a goal. Get a lesson. Teach.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-lc-border" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-lc-card border border-lc-border flex items-center justify-center">
                  <Icon className="w-8 h-8 text-lc-blue" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-lc-text3 mb-1">
                    {step.number}
                  </p>
                  <h3 className="text-lg font-bold text-lc-text mb-2">{step.title}</h3>
                  <p className="text-sm text-lc-text2 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
