'use client';

import type { PlannerStep } from '@/stores/planner-store';

const STEPS: { key: PlannerStep; label: string }[] = [
  { key: 'mission-setup', label: 'Mission Setup' },
  { key: 'flight-plan', label: 'Flight Plan' },
  { key: 'launch', label: 'Launch' },
];

export function PlannerStepIndicator({ current }: { current: PlannerStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  isActive
                    ? 'bg-lc-blue scale-125 ring-2 ring-lc-blue/30'
                    : isDone
                      ? 'bg-lc-success'
                      : 'bg-lc-border'
                }`}
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-lc-text' : isDone ? 'text-lc-success' : 'text-lc-text3'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px ${isDone ? 'bg-lc-success' : 'bg-lc-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
