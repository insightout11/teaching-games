'use client';

import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import { FlightPathSVG } from './flight-path-svg';
import { ReplaceDrawer } from './replace-drawer';
import { ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';

export function FlightPlanScreen() {
  const {
    topic,
    lessonDurationMinutes,
    goals,
    modules,
    generationStatus,
    generationError,
    setStep,
    initModules,
    generateContent,
  } = usePlannerStore();

  const isGenerating = generationStatus === 'generating';

  const handleContinue = async () => {
    await generateContent();
    // Check if generation succeeded (store updates synchronously within generateContent)
    const state = usePlannerStore.getState();
    if (state.generationStatus === 'ready') {
      setStep('launch');
    }
  };

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
      <div className="bg-lc-card rounded-xl border border-lc-border p-6">
        <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-4">
          Flight Path
        </h3>
        <FlightPathSVG />
        <p className="text-xs text-lc-text3 mt-4 text-center">
          Drag to reorder middle modules. Click a module to replace it.
        </p>
      </div>

      {/* Error */}
      {generationError && (
        <div className="bg-lc-danger/10 border border-lc-danger/25 text-lc-danger px-4 py-3 rounded-lg text-sm">
          {generationError}
        </div>
      )}

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
            onClick={handleContinue}
            disabled={isGenerating || modules.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-lc-blue text-white rounded-xl font-semibold hover:bg-lc-blue-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Replace drawer */}
      <ReplaceDrawer />
    </div>
  );
}
