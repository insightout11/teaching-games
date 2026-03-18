'use client';

import { GOAL_LABELS } from '@/lib/flight-plan-config';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import { goalToScoringMode } from '@/stores/session-store';
import type { ScoringMode } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';

const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  competitive: 'Competitive',
  accuracy: 'Accuracy',
  participation: 'Participation',
};

const SCORING_MODE_CLASSES: Record<ScoringMode, string> = {
  competitive: 'text-amber-400 bg-amber-400/10',
  accuracy: 'text-lc-blue bg-lc-blue/10',
  participation: 'text-emerald-400 bg-emerald-400/10',
};

export function PresetCard({ preset, disabled = false }: { preset: FlightPlanPreset; disabled?: boolean }) {
  const { loadPreset, setStep } = usePlannerStore();

  const handleClick = () => {
    if (disabled) return;
    loadPreset(preset);
    setStep('flight-plan');
  };

  const scoringMode = preset.scoringMode ?? goalToScoringMode(preset.goal);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`text-left p-4 bg-lc-surface rounded-xl border border-lc-border transition-all group ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-lc-blue/50'
      }`}
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
      <div className="mt-3">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${SCORING_MODE_CLASSES[scoringMode]}`}>
          {SCORING_MODE_LABELS[scoringMode]}
        </span>
      </div>
    </button>
  );
}
