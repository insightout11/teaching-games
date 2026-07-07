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

// Illustrative participation rows — same students as the TwoScreens mock,
// one dot per round (filled = answered).
const CREW: { name: string; rounds: boolean[] }[] = [
  { name: 'Mei', rounds: [true, true, true, true, true] },
  { name: 'Diego', rounds: [true, true, false, true, true] },
  { name: 'Yuki', rounds: [true, true, true, true, false] },
  { name: 'Sana', rounds: [false, true, true, true, true] },
];

const ACCURACY = 0.82; // illustrative
// Semicircle sweep: 0% points the needle left (-90°), 100% points right (+90°).
const NEEDLE_DEG = -90 + ACCURACY * 180;

function AccuracyGauge({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 220 128" className="w-full" role="img" aria-label={`Accuracy gauge at ${Math.round(ACCURACY * 100)} percent`}>
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
      {/* Needle — springs past the mark and settles, like the in-app gauge.
          transformBox 'view-box' makes the px origin resolve in viewBox units;
          without it the rotation origin lands off the hub and the needle detaches. */}
      <motion.g
        style={{ transformOrigin: '110px 112px', transformBox: 'view-box' }}
        initial={{ rotate: reduce ? NEEDLE_DEG : -90 }}
        whileInView={{ rotate: NEEDLE_DEG }}
        viewport={{ once: true }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 55, damping: 9, delay: 0.35 }}
      >
        {/* Counterweight tail + blade, one piece through the hub */}
        <line x1="110" y1="124" x2="110" y2="50" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="110" cy="112" r="7" fill="#F59E0B" />
      </motion.g>
      <circle cx="110" cy="112" r="3" fill="#0a1424" />
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

            {/* Accuracy gauge — readout sits below the dial, never over it */}
            <AccuracyGauge reduce={reduce} />
            <div className="mt-2 text-center">
              <p className="font-instrument text-3xl font-semibold text-lc-text">
                {Math.round(ACCURACY * 100)}%
              </p>
              <p className="font-instrument text-[10px] uppercase tracking-[0.2em] text-lc-text3">
                Class accuracy
              </p>
            </div>

            {/* Participation — who answered, round by round */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-instrument text-[10px] uppercase tracking-[0.2em] text-lc-text3">
                  Participation
                </p>
                <p className="font-instrument text-[10px] uppercase tracking-[0.12em] text-lc-text3">
                  Rounds 1–5
                </p>
              </div>
              <ul className="space-y-2.5">
                {CREW.map((s, i) => (
                  <motion.li
                    key={s.name}
                    initial={reduce ? false : { opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: reduce ? 0 : 0.45 + i * 0.1 }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-medium text-lc-text">{s.name}</span>
                    <span className="flex items-center gap-1.5">
                      {s.rounds.map((answered, r) => (
                        <span
                          key={r}
                          className={`h-2.5 w-2.5 rounded-full ${
                            answered ? 'bg-emerald-400/90' : 'border border-white/20 bg-transparent'
                          }`}
                        />
                      ))}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-lc-text3">+ 8 more students</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
