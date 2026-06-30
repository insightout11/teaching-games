'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Monitor, Zap } from 'lucide-react';
import type { ComponentType } from 'react';

const CONTROL_CHIPS = ['Live leaderboard', 'Timer', 'Student picker', 'Poll', 'Class Board', 'Activity swap'];

interface Accent {
  text: string;
  border: string;
  bg: string;
  glow: string;
  num: string;
}

const STEPS: {
  icon: ComponentType<{ className?: string }>;
  number: string;
  phase: string;
  title: string;
  description: string;
  chips: string[];
  accent: Accent;
}[] = [
  {
    icon: BookOpen,
    number: '01',
    phase: 'Pre-flight',
    title: 'Plan',
    description: 'Choose a preset, topic, level, goal, video, text, or uploaded material.',
    chips: [],
    accent: {
      text: 'text-cyan-300',
      border: 'border-cyan-300/45',
      bg: 'from-cyan-400/20',
      glow: 'shadow-[0_0_44px_-10px_rgba(34,211,238,0.6)]',
      num: 'text-cyan-300/10',
    },
  },
  {
    icon: Monitor,
    number: '02',
    phase: 'Boarding',
    title: 'Share',
    description: 'Screen-share the teacher view. Give students a join link or QR code. No student accounts needed.',
    chips: [],
    accent: {
      text: 'text-violet-300',
      border: 'border-violet-300/45',
      bg: 'from-violet-400/20',
      glow: 'shadow-[0_0_44px_-10px_rgba(167,139,250,0.6)]',
      num: 'text-violet-300/10',
    },
  },
  {
    icon: Zap,
    number: '03',
    phase: 'In-flight',
    title: 'Teach',
    description: 'Run games, activities, and live responses without leaving your screen share.',
    chips: CONTROL_CHIPS,
    accent: {
      text: 'text-amber-300',
      border: 'border-amber-300/45',
      bg: 'from-amber-400/20',
      glow: 'shadow-[0_0_44px_-10px_rgba(245,158,11,0.6)]',
      num: 'text-amber-300/10',
    },
  },
];

export function HowItWorksSection() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="border-t border-lc-border bg-lc-bg/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-lc-blue"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-16 text-center text-3xl font-bold"
          style={{ color: 'white', textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
        >
          Plan. Share. Teach.
        </motion.h2>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          {/* Animated connector (desktop): a base rail, a gradient line that draws on
              scroll, and a signal that travels across — the steps light in sequence. */}
          <div className="pointer-events-none absolute left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] top-10 hidden md:block">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <motion.div
              className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400"
              initial={{ scaleX: reduce ? 1 : 0, opacity: reduce ? 0.8 : 0 }}
              whileInView={{ scaleX: 1, opacity: 0.9 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            {!reduce && (
              <motion.div
                className="absolute top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_5px_rgba(167,139,250,0.7)]"
                initial={{ left: '0%', opacity: 0 }}
                whileInView={{ left: '100%', opacity: [0, 1, 1, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </div>

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const lightDelay = reduce ? 0 : 0.3 + i * 0.45;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: lightDelay }}
                className="flex flex-col items-center gap-4 text-center"
              >
                {/* Icon tile */}
                <motion.div
                  initial={{ scale: reduce ? 1 : 0.85 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: lightDelay, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-br to-transparent backdrop-blur-sm ${step.accent.border} ${step.accent.bg} ${step.accent.glow}`}
                >
                  <Icon className={`h-8 w-8 ${step.accent.text}`} />
                </motion.div>

                <div className="flex flex-col items-center gap-1.5">
                  <p className={`font-instrument text-[10px] font-semibold uppercase tracking-[0.22em] ${step.accent.text}`}>
                    <span className="opacity-60">{step.number}</span> · {step.phase}
                  </p>
                  <h3 className="text-lg font-bold text-lc-text">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-lc-text2">{step.description}</p>

                  {/* Teach: the control deck — chips pop in after the step lights */}
                  {step.chips.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {step.chips.map((chip, ci) => (
                        <motion.span
                          key={chip}
                          initial={{ opacity: 0, scale: reduce ? 1 : 0.8, y: reduce ? 0 : 6 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.32, delay: reduce ? 0 : lightDelay + 0.25 + ci * 0.07 }}
                          className="rounded-full border border-amber-300/25 bg-amber-400/[0.06] px-2.5 py-0.5 text-xs text-amber-100/90"
                        >
                          {chip}
                        </motion.span>
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
