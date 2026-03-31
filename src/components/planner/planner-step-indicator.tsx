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
              {/* Diamond marker — rotate a square 45° */}
              <div
                className={`w-2.5 h-2.5 rotate-45 transition-all ${
                  isActive
                    ? 'bg-lc-blue scale-125 ring-4 ring-lc-blue/20'
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
              <div className={`w-10 border-t border-dashed ${isDone ? 'border-lc-success' : 'border-lc-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
