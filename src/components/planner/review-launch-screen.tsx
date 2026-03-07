'use client';

import { useMemo } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import { FlightPathSVG } from './flight-path-svg';
import { CrewBoardingCard } from './crew-boarding-card';
import { ArrowLeft, CheckCircle2, Rocket } from 'lucide-react';

export function ReviewLaunchScreen() {
  const {
    topic,
    difficulty,
    goals,
    lessonDurationMinutes,
    modules,
    setStep,
    launchLesson,
  } = usePlannerStore();

  const callsign = useMemo(
    () => `MISSION LC-${String(Math.floor(1000 + Math.random() * 9000))}`,
    [],
  );

  const checklist = [
    { label: 'Content generated', done: true },
    { label: 'Modules configured', done: modules.length > 0 },
    { label: 'Systems ready', done: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Callsign */}
      <div className="text-center">
        <p className="text-xs text-lc-text3 uppercase tracking-widest mb-1">Callsign</p>
        <h1 className="text-2xl font-bold text-lc-text tracking-wider">{callsign}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Summary + mini path */}
        <div className="space-y-4">
          <div className="bg-lc-card rounded-xl border border-lc-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider">
              Mission Summary
            </h3>

            <div className="space-y-2 text-sm">
              <Row label="Topic" value={topic} />
              <Row label="Duration" value={`${lessonDurationMinutes} min`} />
              <Row
                label="Goals"
                value={
                  goals.length > 0
                    ? goals.map((g) => GOAL_LABELS[g]).join(', ')
                    : 'Default'
                }
              />
              <Row label="Difficulty" value={difficulty} />
              <Row label="Modules" value={String(modules.length)} />
            </div>
          </div>

          {/* Mini flight path */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-4">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Flight Path
            </h3>
            <FlightPathSVG compact />
          </div>
        </div>

        {/* Right column — Crew boarding + checklist */}
        <div className="space-y-4">
          <CrewBoardingCard />

          {/* Pre-flight checklist */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-5">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Pre-Flight Checklist
            </h3>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${item.done ? 'text-lc-success' : 'text-lc-text3'}`}
                  />
                  <span
                    className={`text-sm ${item.done ? 'text-lc-text' : 'text-lc-text3'}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Launch button */}
          <button
            onClick={launchLesson}
            className="w-full flex items-center justify-center gap-2 py-4 bg-lc-success text-lc-bg rounded-xl font-bold text-lg hover:brightness-110 transition-all"
          >
            <Rocket className="w-5 h-5" />
            Launch Mission
          </button>
        </div>
      </div>

      {/* Back */}
      <div className="flex">
        <button
          onClick={() => setStep('flight-plan')}
          className="flex items-center gap-2 px-4 py-2.5 text-lc-text2 hover:text-lc-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Flight Plan
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-lc-text3">{label}</span>
      <span className="text-lc-text font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
