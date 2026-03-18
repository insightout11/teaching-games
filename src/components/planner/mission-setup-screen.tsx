'use client';

import { usePlannerStore } from '@/stores/planner-store';
import { DIFFICULTIES } from '@/lib/difficulty';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { PresetCard } from './preset-card';

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
  } = usePlannerStore();

  const canGenerate = topic.trim().length > 0;

  const handleGenerate = () => {
    initModules();
    setStep('flight-plan');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-lc-bg border border-lc-border rounded-xl p-1">
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
      </div>

      {activeTab === 'presets' ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-2">
              What&apos;s today&apos;s topic?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., What will the world be like in 50 years?"
              className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-lg focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
            />
            <p className="text-xs text-lc-text3 mt-1">
              Be specific! Good topics lead to better AI-generated content.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FLIGHT_PLAN_PRESETS.map((preset) => (
              <PresetCard key={preset.id} preset={preset} disabled={!topic.trim()} />
            ))}
          </div>
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
              placeholder="e.g., What will the world be like in 50 years?"
              className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-lg focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
            />
            <p className="text-xs text-lc-text3 mt-1">
              Be specific! Good topics lead to better AI-generated content.
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
