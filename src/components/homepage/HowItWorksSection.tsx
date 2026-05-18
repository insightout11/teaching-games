'use client';

import { motion } from 'framer-motion';
import { BookOpen, Monitor, Zap } from 'lucide-react';

const CONTROL_CHIPS = [
  'Live leaderboard',
  'Timer',
  'Student picker',
  'Freeze input',
  'Activity swap',
];

const STEPS = [
  {
    icon: BookOpen,
    number: '01',
    title: 'Plan',
    description:
      'Choose a preset, topic, level, goal, video, text, or uploaded material.',
    chips: [] as string[],
  },
  {
    icon: Monitor,
    number: '02',
    title: 'Share',
    description:
      'Screen-share the teacher view. Give students a join link or QR code. No student accounts needed.',
    chips: [] as string[],
  },
  {
    icon: Zap,
    number: '03',
    title: 'Teach',
    description:
      'Run games, activities, and live responses without leaving your screen share.',
    chips: CONTROL_CHIPS,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-6 border-t border-lc-border bg-lc-bg/40">
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
          className="text-3xl font-bold text-center mb-14"
          style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
        >
          Plan. Share. Teach.
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
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold tracking-widest uppercase text-lc-text2">
                    {step.number}
                  </p>
                  <h3 className="text-lg font-bold text-lc-text">{step.title}</h3>
                  <p className="text-sm text-lc-text2 leading-relaxed">{step.description}</p>
                  {step.chips.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                      {step.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-lc-border px-2.5 py-0.5 text-xs text-lc-text2"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
