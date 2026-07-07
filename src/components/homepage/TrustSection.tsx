'use client';

// Illustrative control-room composition (hardcoded content, NOT a live mount) —
// honest to the real Control Room features: accuracy gauge, participation grid,
// leaderboard history, and session notes all exist on the session/class pages.

import { motion, useReducedMotion } from 'framer-motion';
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

// Illustrative roster — 10 of 12 answered
const CREW = [
  { initial: 'M', answered: true },
  { initial: 'D', answered: true },
  { initial: 'Y', answered: true },
  { initial: 'S', answered: true },
  { initial: 'A', answered: true },
  { initial: 'L', answered: false },
  { initial: 'K', answered: true },
  { initial: 'J', answered: true },
  { initial: 'P', answered: true },
  { initial: 'N', answered: false },
  { initial: 'R', answered: true },
  { initial: 'T', answered: true },
];

const ACCURACY = 0.82; // illustrative
// Semicircle sweep: 0% points the needle left (-90°), 100% points right (+90°).
const NEEDLE_DEG = -90 + ACCURACY * 180;

function AccuracyGauge({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 220 132" className="w-full" role="img" aria-label={`Accuracy gauge at ${Math.round(ACCURACY * 100)} percent`}>
      {/* Track */}
      <path d="M 26 112 A 84 84 0 0 1 194 112" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" strokeLinecap="round" />
      {/* Value arc — draws to the accuracy reading */}
      <motion.path
        d="M 26 112 A 84 84 0 0 1 194 112"
        fill="none"
        stroke="url(#trust-gauge-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        initial={{ strokeDashoffset: reduce ? 1 - ACCURACY : 1 }}
        whileInView={{ strokeDashoffset: 1 - ACCURACY }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      {/* Tick marks at 0/25/50/75/100% */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const a = (-180 + t * 180) * (Math.PI / 180);
        const x1 = 110 + Math.cos(a) * 70;
        const y1 = 112 + Math.sin(a) * 70;
        const x2 = 110 + Math.cos(a) * 62;
        const y2 = 112 + Math.sin(a) * 62;
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />;
      })}
      {/* Needle — springs past the mark and settles, like the in-app gauge */}
      <motion.g
        style={{ transformOrigin: '110px 112px' }}
        initial={{ rotate: reduce ? NEEDLE_DEG : -90 }}
        whileInView={{ rotate: NEEDLE_DEG }}
        viewport={{ once: true }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 55, damping: 9, delay: 0.35 }}
      >
        <line x1="110" y1="112" x2="110" y2="46" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
      <circle cx="110" cy="112" r="6" fill="#0a1424" stroke="#F59E0B" strokeWidth="2.5" />
      <defs>
        <linearGradient id="trust-gauge-grad" x1="26" y1="112" x2="194" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4DA3FF" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TrustSection() {
  const reduce = !!useReducedMotion();

  return (
    <section className="py-20 px-6 border-t border-lc-border">
      <div className="max-w-5xl mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,400px)]">
          {/* Copy + the four records */}
          <div>
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-shadow-hero text-3xl font-bold mb-4 text-white"
            >
              After class, the data is waiting
            </motion.h2>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-lc-text2 leading-relaxed mb-8"
            >
              LessonCaptain keeps the data that matters: who participated, what students got
              right, leaderboard results, round history, and notes for next time.
            </motion.p>

            <ul className="space-y-4">
              {DATA_POINTS.map((point, i) => {
                const Icon = point.icon;
                return (
                  <motion.li
                    key={point.label}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3.5"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-lc-blue/25 bg-lc-blue/10">
                      <Icon className="h-4 w-4 text-lc-blue" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-lc-text">{point.label}</span>
                      <span className="block text-xs leading-relaxed text-lc-text3">{point.detail}</span>
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Instrument cluster — the Control Room, miniaturized */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="panel-card overflow-hidden p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-instrument text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                Control Room
              </p>
              <p className="font-instrument text-[10px] uppercase tracking-[0.18em] text-lc-text3">
                After the flight
              </p>
            </div>

            {/* Accuracy gauge */}
            <div className="relative">
              <AccuracyGauge reduce={reduce} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
                <p className="font-instrument text-2xl font-semibold text-lc-text">
                  {Math.round(ACCURACY * 100)}%
                </p>
                <p className="font-instrument text-[9px] uppercase tracking-[0.2em] text-lc-text3">
                  Class accuracy
                </p>
              </div>
            </div>

            {/* Participation grid */}
            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-instrument text-[9px] uppercase tracking-[0.2em] text-lc-text3">
                  Participation
                </p>
                <p className="font-instrument text-[10px] text-emerald-300">
                  {CREW.filter((c) => c.answered).length} / {CREW.length} answered
                </p>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {CREW.map((s, i) => (
                  <motion.span
                    key={i}
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: reduce ? 0 : 0.5 + i * 0.05 }}
                    className={`grid h-9 place-items-center rounded-md border text-xs font-semibold ${
                      s.answered
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/10 bg-white/[0.03] text-lc-text3'
                    }`}
                  >
                    {s.initial}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
