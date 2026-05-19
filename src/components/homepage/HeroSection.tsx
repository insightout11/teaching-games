'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LessonCaptainFlightPlan, type FlightPlanStep } from '@/components/ui/flight-plan';

const DEMO_STEPS: FlightPlanStep[] = [
  { id: 'takeoff', type: 'Takeoff', name: 'Mission Selector', kind: 'terminal' },
  { id: 'm1', type: 'Presentation', name: 'Prediction Round', kind: 'module' },
  { id: 'm2', type: 'Practice', name: 'Dialogue Detective', kind: 'module' },
  { id: 'm3', type: 'Production', name: 'Hot Take Arena', kind: 'module' },
  { id: 'landing', type: 'Landing', name: 'Quick Pulse', kind: 'terminal' },
];

const PLAN_SLOTS = [
  { stage: 'Takeoff', name: 'Mission Selector', duration: '~2 min', status: 'done' },
  { stage: 'Presentation', name: 'Prediction Round', duration: '~5 min', status: 'done' },
  { stage: 'Practice', name: 'Dialogue Detective', duration: '~12 min', status: 'active' },
  { stage: 'Production', name: 'Hot Take Arena', duration: '~15 min', status: 'upcoming' },
  { stage: 'Landing', name: 'Quick Pulse', duration: '~3 min', status: 'upcoming' },
];

const FLIGHT_PLAN_HEIGHT = 300;

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    observer.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveIndex(1), 900);
    const t2 = setTimeout(() => setActiveIndex(2), 2000);
    const t3 = setTimeout(() => setPanelVisible(true), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-6 pb-16 px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 30%, rgba(77,163,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        {/* Top: headline + CTA — single column, integrated into scene */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-lc-blue">
              <span className="w-4 h-px bg-lc-blue" />
              Live Lesson Layer for Online ESL
            </span>
            <h1
              className="text-4xl sm:text-5xl font-bold text-lc-text leading-tight"
              style={{ textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
            >
              Run interactive ESL lessons while you screen share.
            </h1>
            <p className="text-lg text-lc-text2 leading-relaxed">
              Plan a structured lesson, screen-share the teacher view, and let students join from any browser to answer questions, play games, vote, and participate live.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/login"
                    className="inline-block px-6 py-3 rounded-lg bg-lc-blue text-[#070B14] font-semibold text-base hover:bg-lc-blue-hover transition-colors"
                  >
                    Start a Test Flight
                  </Link>
                </motion.div>
                <Link
                  href="/explore"
                  className="inline-block px-6 py-3 rounded-lg border border-lc-border text-lc-text2 font-semibold text-base hover:border-lc-blue hover:text-lc-text transition-colors"
                >
                  Browse games and activities
                </Link>
              </div>
              <p className="text-sm text-lc-text2">
                Works with Zoom, Google Meet, Teams, or any screen-sharing setup.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Full-width flight plan visualization */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl overflow-hidden border border-lc-border"
        >
          {/* Flight plan animation — hidden on mobile (layout breaks below ~480px) */}
          <div
            ref={containerRef}
            style={{ height: FLIGHT_PLAN_HEIGHT }}
            className="hidden sm:block w-full"
          >
            <LessonCaptainFlightPlan
              steps={DEMO_STEPS}
              width={containerWidth}
              height={FLIGHT_PLAN_HEIGHT}
              mode="runtime"
              activeIndex={activeIndex}
            />
          </div>

          {/* Panel — slides up after route settles */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={panelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="border-t border-lc-border bg-lc-card"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-lc-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lc-blue animate-pulse" />
                <span className="text-sm font-semibold text-lc-text">Flight Plan</span>
              </div>
              <span className="text-xs text-lc-text3 font-medium">Speaking Circle · 37 min</span>
            </div>

            {/* Slots — horizontal on wider screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-lc-border">
              {PLAN_SLOTS.map((slot) => (
                <div
                  key={slot.stage}
                  className={`flex flex-col gap-1 px-5 py-3 ${
                    slot.status === 'active' ? 'bg-lc-blue/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        slot.status === 'done'
                          ? 'bg-lc-success'
                          : slot.status === 'active'
                          ? 'bg-lc-blue'
                          : 'bg-lc-border'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        slot.status === 'active' ? 'text-lc-blue' : 'text-lc-text3'
                      }`}
                    >
                      {slot.stage}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      slot.status === 'upcoming' ? 'text-lc-text2' : 'text-lc-text'
                    }`}
                  >
                    {slot.name}
                  </p>
                  <span
                    className={`text-xs font-medium w-fit px-1.5 py-0.5 rounded-full ${
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
