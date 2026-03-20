'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LessonCaptainFlightPlan, type FlightPlanStep } from '@/components/ui/flight-plan';

const DEMO_STEPS: FlightPlanStep[] = [
  { id: 'takeoff', type: 'Takeoff', name: 'Mission Selector', kind: 'terminal' },
  { id: 'm1', type: 'Presentation', name: 'Vocab Radar', kind: 'module' },
  { id: 'm2', type: 'Practice', name: 'Vocab Sprint', kind: 'module' },
  { id: 'm3', type: 'Production', name: 'Story Sprint', kind: 'module' },
  { id: 'landing', type: 'Landing', name: 'Quick Pulse', kind: 'terminal' },
];

const PLAN_SLOTS = [
  { stage: 'Takeoff', name: 'Mission Selector', duration: '~2 min', status: 'done' },
  { stage: 'Presentation', name: 'Vocab Radar', duration: '~5 min', status: 'done' },
  { stage: 'Practice', name: 'Vocab Sprint', duration: '~10 min', status: 'active' },
  { stage: 'Production', name: 'Story Sprint', duration: '~15 min', status: 'upcoming' },
  { stage: 'Landing', name: 'Quick Pulse', duration: '~3 min', status: 'upcoming' },
];

export function HeroSection() {
  // Animate the active stop: 0 → 1 → 2, then hold at 2
  const [activeIndex, setActiveIndex] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveIndex(1), 1000);
    const t2 = setTimeout(() => setActiveIndex(2), 2200);
    const t3 = setTimeout(() => setPanelVisible(true), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-16 pb-24 px-6">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 60% 40%, rgba(77,163,255,0.06) 0%, transparent 70%)',
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

        {/* Right: Real flight plan component + panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-0"
        >
          {/* The actual LessonCaptain flight plan visualization */}
          <div className="w-full rounded-t-2xl overflow-hidden" style={{ height: 200 }}>
            <LessonCaptainFlightPlan
              steps={DEMO_STEPS}
              width={560}
              height={200}
              mode="runtime"
              activeIndex={activeIndex}
            />
          </div>

          {/* Mock Flight Plan panel — slides up after route settles */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={panelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="rounded-b-xl border border-t-0 border-lc-border bg-lc-card overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-lc-border">
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
                  className={`flex items-center justify-between px-4 py-2.5 ${
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
                        className={`text-[10px] font-semibold uppercase tracking-wide ${
                          slot.status === 'active' ? 'text-lc-blue' : 'text-lc-text3'
                        }`}
                      >
                        {slot.stage}
                      </p>
                      <p
                        className={`text-sm font-medium ${
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
        </motion.div>
      </div>
    </section>
  );
}
