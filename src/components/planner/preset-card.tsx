'use client';

import { GOAL_LABELS } from '@/lib/flight-plan-config';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import { usePlannerStore } from '@/stores/planner-store';

export function PresetCard({ preset }: { preset: FlightPlanPreset }) {
  const { loadPreset, setStep } = usePlannerStore();

  const handleClick = () => {
    loadPreset(preset);
    setStep('flight-plan');
  };

  return (
    <button
      onClick={handleClick}
      className="text-left p-4 bg-lc-surface rounded-xl border border-lc-border hover:border-lc-blue/50 transition-all group"
    >
      <h3 className="font-semibold text-lc-text group-hover:text-lc-blue transition-colors">
        {preset.name}
      </h3>
      <p className="text-sm text-lc-text2 mt-1">{preset.description}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-lc-text3">
        <span>{preset.lessonDurationMinutes} min</span>
        <span className="w-1 h-1 rounded-full bg-lc-border" />
        <span>{GOAL_LABELS[preset.goal]}</span>
        <span className="w-1 h-1 rounded-full bg-lc-border" />
        <span>{preset.moduleSequence.length + 2} modules</span>
      </div>
    </button>
  );
}
