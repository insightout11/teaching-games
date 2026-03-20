'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import Link from 'next/link';

const ROUTE_PATH =
  'M 10,30 C 55,10 120,50 165,30 C 210,10 285,50 330,30 C 375,10 445,50 490,30';

const STOPS = [
  { x: 10, y: 30, label: 'Takeoff', active: false },
  { x: 165, y: 30, label: 'Practice', active: true },
  { x: 330, y: 30, label: 'Production', active: false },
  { x: 490, y: 30, label: 'Landing', active: false },
];

const PLAN_SLOTS = [
  { stage: 'Takeoff', name: 'Vocab Radar', duration: '~5 min', status: 'done' },
  { stage: 'Practice', name: 'Vocab Sprint', duration: '~10 min', status: 'active' },
  { stage: 'Production', name: 'Story Sprint', duration: '~15 min', status: 'upcoming' },
  { stage: 'Landing', name: 'Quick Pulse', duration: '~3 min', status: 'upcoming' },
];

export function HeroSection() {
  const routeControls = useAnimation();
  const stopControls = useAnimation();
  const panelControls = useAnimation();

  useEffect(() => {
    async function runSequence() {
      await routeControls.start({ pathLength: 1, opacity: 1, transition: { duration: 2, ease: 'easeInOut' } });
      await stopControls.start('show');
      await panelControls.start({ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } });
    }
    runSequence();
  }, [routeControls, stopControls, panelControls]);

  return (
    <section className="relative overflow-hidden pt-20 pb-24 px-6">
      {/* Subtle radial glow behind hero */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 60% 40%, rgba(77,163,255,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-lc-blue mb-4">
              <span className="w-4 h-px bg-lc-blue" />
              Live Classroom Platform
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-lc-text leading-tight">
              The live classroom platform for ESL teachers
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg text-lc-text2 leading-relaxed"
          >
            Build a structured lesson in minutes. Run it live with games, activities,
            and instant student engagement — all from one screen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-lg bg-lc-blue text-[#070B14] font-semibold text-base hover:bg-lc-blue-hover transition-colors"
              >
                Start a Test Flight
              </Link>
            </motion.div>
            <p className="text-sm text-lc-text3">
              Run a real live session with a preset or a custom lesson.
            </p>
          </motion.div>
        </div>

        {/* Right: Flight path + mock panel */}
        <div className="flex flex-col gap-4">
          {/* SVG Route Animation */}
          <div className="relative px-2">
            <svg
              viewBox="0 0 500 60"
              fill="none"
              className="w-full h-auto"
              aria-hidden="true"
            >
              {/* Faint rail */}
              <path
                d={ROUTE_PATH}
                stroke="var(--lc-border)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Animated route line */}
              <motion.path
                d={ROUTE_PATH}
                stroke="var(--lc-blue)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={routeControls}
              />
              {/* Stop dots */}
              {STOPS.map((stop, i) => (
                <motion.g
                  key={stop.label}
                  variants={{
                    hidden: { opacity: 0, scale: 0 },
                    show: {
                      opacity: 1,
                      scale: 1,
                      transition: { delay: i * 0.25, duration: 0.3, type: 'spring', stiffness: 300 },
                    },
                  }}
                  initial="hidden"
                  animate={stopControls}
                >
                  {stop.active && (
                    <>
                      {/* Outer glow ring */}
                      <motion.circle
                        cx={stop.x}
                        cy={stop.y}
                        r={10}
                        fill="none"
                        stroke="var(--lc-blue)"
                        strokeWidth="1"
                        opacity={0.3}
                        animate={{ r: [10, 14, 10] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      />
                      <circle cx={stop.x} cy={stop.y} r={5} fill="var(--lc-blue)" />
                    </>
                  )}
                  {!stop.active && (
                    <circle
                      cx={stop.x}
                      cy={stop.y}
                      r={4}
                      fill="var(--lc-card)"
                      stroke="var(--lc-blue)"
                      strokeWidth="1.5"
                    />
                  )}
                </motion.g>
              ))}
            </svg>

            {/* Stage labels */}
            <div className="flex justify-between px-0 mt-1">
              {STOPS.map((stop) => (
                <span
                  key={stop.label}
                  className={`text-[10px] font-medium tracking-wide ${
                    stop.active ? 'text-lc-blue' : 'text-lc-text3'
                  }`}
                >
                  {stop.label}
                </span>
              ))}
            </div>
          </div>

          {/* Mock Flight Plan Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={panelControls}
            className="rounded-xl border border-lc-border bg-lc-card overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-lc-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lc-blue animate-pulse" />
                <span className="text-sm font-semibold text-lc-text">Flight Plan</span>
              </div>
              <span className="text-xs text-lc-text3 font-medium">Vocab Blitz · 45 min</span>
            </div>

            {/* Slots */}
            <div className="divide-y divide-lc-border">
              {PLAN_SLOTS.map((slot) => (
                <div
                  key={slot.stage}
                  className={`flex items-center justify-between px-4 py-3 ${
                    slot.status === 'active'
                      ? 'bg-lc-blue/5 border-l-2 border-lc-blue'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        slot.status === 'done'
                          ? 'bg-lc-success'
                          : slot.status === 'active'
                          ? 'bg-lc-blue'
                          : 'bg-lc-border'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          slot.status === 'active' ? 'text-lc-blue' : 'text-lc-text3'
                        }`}
                      >
                        {slot.stage}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          slot.status === 'upcoming' ? 'text-lc-text2' : 'text-lc-text'
                        }`}
                      >
                        {slot.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      slot.status === 'active'
                        ? 'bg-lc-blue/15 text-lc-blue'
                        : slot.status === 'done'
                        ? 'bg-lc-success/10 text-lc-success'
                        : 'bg-lc-surface text-lc-text3'
                    }`}
                  >
                    {slot.duration}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
