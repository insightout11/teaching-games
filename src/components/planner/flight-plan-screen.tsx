'use client';

import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildPlannerFlightPlanSteps } from '@/lib/flight-plan-helpers';
import { ReplaceDrawer } from './replace-drawer';
import { ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';

export function FlightPlanScreen() {
  const {
    topic,
    lessonDurationMinutes,
    goals,
    modules,
    setStep,
    initModules,
  } = usePlannerStore();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-lc-card rounded-xl border border-lc-border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lc-text truncate">{topic}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-lc-text3">
              <span>{lessonDurationMinutes} min</span>
              {goals.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-lc-border" />
                  <span className="truncate">
                    {goals.map((g) => GOAL_LABELS[g]).join(', ')}
                  </span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-lc-border" />
              <span>{modules.length} modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight path */}
      <div>
        <LessonCaptainFlightPlan
          steps={buildPlannerFlightPlanSteps(modules)}
          mode="planner"
        />
        <p className="text-xs text-lc-text3 mt-3 text-center">
          Click Regenerate to reshuffle modules, or use Replace on the review screen.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('mission-setup')}
          className="flex items-center gap-2 px-4 py-2.5 text-lc-text2 hover:text-lc-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => initModules()}
            className="flex items-center gap-2 px-4 py-2.5 bg-lc-surface border border-lc-border rounded-xl text-sm font-medium text-lc-text2 hover:text-lc-text hover:border-lc-blue/40 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>

          <button
            onClick={() => setStep('launch')}
            disabled={modules.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-lc-blue text-white rounded-xl font-semibold hover:bg-lc-blue-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Replace drawer */}
      <ReplaceDrawer />
    </div>
  );
}
