'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { DIFFICULTIES } from '@/lib/difficulty';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';
import { PresetCard } from './preset-card';
import { ScenarioPickerModal } from './scenario-picker-modal';
import { SourceInputPanel } from './source-input-panel';
import { useTeacherTier } from '@/hooks/use-teacher-tier';

const DURATIONS = [30, 45, 60, 90] as const;

export function MissionSetupScreen() {
  const {
    topic,
    difficulty,
    goals,
    lessonDurationMinutes,
    activeTab,
    setTopic,
    setDifficulty,
    toggleGoal,
    setDuration,
    setActiveTab,
    initModules,
    setStep,
    loadPreset,
  } = usePlannerStore();

  const { sourceMaterial } = usePlannerStore();
  const [pendingPreset, setPendingPreset] = useState<FlightPlanPreset | null>(null);
  const { isDeveloper } = useTeacherTier();
  const visiblePresets = FLIGHT_PLAN_PRESETS.filter((p) => !p.isDeveloper || isDeveloper);

  const canGenerate = topic.trim().length > 0 || !!sourceMaterial;

  const handleGenerate = () => {
    initModules();
    setStep('flight-plan');
  };

  function handlePresetClick(preset: FlightPlanPreset) {
    // Source-backed lessons and presets without scenarios can load directly.
    if (sourceMaterial || !preset.scenarios) {
      loadPreset(preset);
      setStep('flight-plan');
      return;
    }
    setPendingPreset(preset);
  }

  return (
    <div className={`${activeTab === 'presets' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto space-y-6`}>
      {/* Tabs */}
      <div className="flex gap-1 bg-lc-bg border border-lc-border rounded-xl p-1">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'presets'
              ? 'bg-lc-blue text-white shadow-sm'
              : 'text-lc-text2 hover:text-lc-text hover:bg-lc-card'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'build'
              ? 'bg-lc-blue text-white shadow-sm'
              : 'text-lc-text2 hover:text-lc-text hover:bg-lc-card'
          }`}
        >
          Build
        </button>
      </div>

      {/* Tab hint */}
      <p className="text-xs text-lc-text3 -mt-2">
        {activeTab === 'presets'
          ? 'Start from a ready-made template — fastest way to get going.'
          : 'Set every detail yourself — topic, goals, difficulty, and source material.'}
      </p>

      {/* Source material — available in both tabs */}
      <SourceInputPanel />

      {activeTab === 'presets' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onClick={() => handlePresetClick(preset)}
              />
            ))}
          </div>
          {pendingPreset?.scenarios && (
            <ScenarioPickerModal
              preset={pendingPreset}
              onConfirm={(scenario) => {
                setTopic(scenario);
                loadPreset(pendingPreset);
                setStep('flight-plan');
                setPendingPreset(null);
              }}
              onCancel={() => setPendingPreset(null)}
            />
          )}
        </div>
      ) : (
        <>
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-2">
              What&apos;s today&apos;s topic?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={sourceMaterial ? sourceMaterial.title : "e.g., What will the world be like in 50 years?"}
              className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-lg focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
            />
            <p className="text-xs text-lc-text3 mt-1">
              {sourceMaterial ? 'Topic auto-filled from source — edit if needed.' : 'Be specific! Good topics lead to better AI-generated content.'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    lessonDurationMinutes === d
                      ? 'bg-lc-blue text-white'
                      : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Goals — multi-select */}
          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-2">
              Lesson Goals
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.entries(GOAL_LABELS) as [GoalTag, string][]).map(([key, label]) => {
                const isActive = goals.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleGoal(key)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-lc-blue/15 text-lc-blue border border-lc-blue/40'
                        : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/30'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-lc-text3 mt-1">
              Select one or more. The first selected goal drives module suggestions.
            </p>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-2">
              Level
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    difficulty === d
                      ? 'bg-lc-blue text-white'
                      : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3.5 bg-lc-blue text-white rounded-xl font-semibold text-lg hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate Flight Plan
          </button>
        </>
      )}
    </div>
  );
}
