'use client';

// Illustrative composition (NOT a real session mount, NOT a screenshot): the teacher's
// projected screen during a live round + a student's phone controller mid-answer. All
// content is hardcoded. Honest to the locked rule — the teacher screen is always
// projected, so it never shows an answer key.

import { motion } from 'framer-motion';
import { Trophy, Users, QrCode, Smartphone, Hand } from 'lucide-react';

const LEADERBOARD = [
  { rank: 1, name: 'Mei', score: 240 },
  { rank: 2, name: 'Diego', score: 215 },
  { rank: 3, name: 'Yuki', score: 190 },
];

const CHOICES = [
  { key: 'A', label: 'It saves time', muted: false },
  { key: 'B', label: 'It builds confidence', muted: false },
  { key: 'C', label: 'It lowers the cost', muted: false },
];

const CLAIMS = [
  { icon: QrCode, text: 'Students join via link or QR' },
  { icon: Smartphone, text: 'No student accounts' },
  { icon: Hand, text: 'Teacher keeps control' },
];

export function TwoScreensSection() {
  return (
    <section className="border-t border-lc-border px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lc-blue">
            One room, two screens
          </p>
          <h2
            className="text-shadow-hero text-3xl font-bold text-lc-text sm:text-4xl"
          >
            You run the lesson. They join from their phones.
          </h2>
          <p className="mt-4 text-lc-text2">
            Screen-share the teacher view. Every student plays along on their own device —
            no installs, no logins, no lost class time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-4xl"
        >
          {/* ── Teacher screen (projected) ──────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-lc-border bg-[#0a1424] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.85)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-lc-border bg-[#0c1830] px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <div className="ml-3 hidden flex-1 items-center rounded-md bg-black/30 px-3 py-1 text-[11px] text-lc-text3 sm:flex">
                lessoncaptain.com/sessions/live
              </div>
              <span className="font-instrument ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            {/* Round body */}
            <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-instrument rounded-md bg-violet-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                    Flash Quiz
                  </span>
                  <span className="font-instrument text-[11px] uppercase tracking-wide text-lc-text3">
                    Round 3 of 6
                  </span>
                </div>
                <p className="text-xl font-bold leading-snug text-lc-text sm:text-2xl">
                  Why do online classes use live games?
                </p>
                {/* Choice tiles — neutral, no correct answer revealed (projected screen) */}
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {CHOICES.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-center gap-2.5 rounded-lg border border-lc-border bg-lc-card/60 px-3 py-2.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lc-blue/15 text-xs font-bold text-lc-blue">
                        {c.key}
                      </span>
                      <span className="text-sm text-lc-text2">{c.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-lc-text3">
                    <Users className="h-4 w-4" aria-hidden />
                    <span>
                      <span className="font-semibold text-lc-text">11</span> / 12 answered
                    </span>
                  </div>
                  {/* Timer ring */}
                  <div className="flex items-center gap-2 text-sm text-lc-text3">
                    <span className="font-instrument inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-lc-amber/70 text-[11px] font-bold text-lc-amber">
                      08
                    </span>
                    <span>seconds left</span>
                  </div>
                </div>
              </div>

              {/* Live leaderboard */}
              <div className="w-full rounded-xl border border-lc-border bg-lc-card/50 p-4 sm:w-56">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-lc-text2">
                  <Trophy className="h-4 w-4 text-lc-amber" aria-hidden />
                  Leaderboard
                </p>
                <ul className="space-y-2">
                  {LEADERBOARD.map((e) => (
                    <li key={e.rank} className="flex items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          e.rank === 1
                            ? 'bg-lc-amber text-[#1a0f00]'
                            : 'bg-lc-surface text-lc-text2'
                        }`}
                      >
                        {e.rank}
                      </span>
                      <span className="flex-1 truncate text-sm text-lc-text">{e.name}</span>
                      <span className="font-instrument text-sm font-semibold text-lc-text2">
                        {e.score}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Student controller (phone) — overlaid corner ─────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto -mt-10 w-48 sm:absolute sm:-bottom-12 sm:-right-6 sm:mt-0"
          >
            <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-[#10192c] bg-[#0a1424] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]">
              <div className="border-b border-lc-border bg-[#0c1830] px-4 py-2 text-center">
                <p className="text-[11px] font-semibold text-lc-text">You · Mei</p>
                <p className="font-instrument text-[9px] uppercase tracking-wide text-emerald-300">
                  Tap your answer
                </p>
              </div>
              <div className="space-y-2 p-3">
                {CHOICES.map((c, i) => (
                  <button
                    key={c.key}
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                      i === 1
                        ? 'bg-lc-blue text-[#070B14]'
                        : 'border border-lc-border bg-lc-card/70 text-lc-text2'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                        i === 1 ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-lc-surface text-lc-text3'
                      }`}
                    >
                      {c.key}
                    </span>
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Caption row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-auto mt-16 flex max-w-3xl flex-col gap-4 sm:flex-row sm:justify-center sm:gap-10"
        >
          {CLAIMS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2.5 text-sm text-lc-text2">
              <Icon className="h-5 w-5 text-lc-blue" aria-hidden />
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
