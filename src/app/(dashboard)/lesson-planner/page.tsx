'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllActivities, getActivitiesGrouped, CATEGORY_INFO } from '@/activities/registry';
import { getAllGames } from '@/games/registry';
import { DIFFICULTIES, type Difficulty } from '@/stores/session-store';
import type {
  ActivityGeneratedContent,
  LessonPlanGenerateResponse,
  ActivityCategory,
  GameGeneratedContent,
} from '@/activities/types';

type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: ActivityCategory;
};

export default function LessonPlannerPage() {
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [selectedSlots, setSelectedSlots] = useState<(LessonSlot | null)[]>([null, null, null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, ActivityGeneratedContent> | null>(null);
  const [generatedGameContent, setGeneratedGameContent] = useState<Record<string, GameGeneratedContent> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activitiesGrouped = getActivitiesGrouped();
  const allActivities = getAllActivities();
  const allGames = getAllGames();

  const slotConfigs = [
    { label: 'Icebreaker', category: 'icebreaker' as const, type: 'activity' as const },
    { label: 'Learning Module', category: 'learning' as const, type: 'activity' as const },
    { label: 'Practice/Debate', category: 'practice' as const, type: 'activity' as const, alternateCategory: 'debate' as const },
    { label: 'Game 1', type: 'game' as const },
    { label: 'Game 2 (Optional)', type: 'game' as const, optional: true },
  ];

  const handleSlotSelect = (slotIndex: number, key: string, type: 'activity' | 'game') => {
    const item = type === 'activity'
      ? allActivities.find((a) => a.key === key)
      : allGames.find((g) => g.key === key);

    if (!item) return;

    setSelectedSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = {
        type,
        key: item.key,
        name: item.name,
        category: type === 'activity' ? (item as typeof allActivities[0]).category : undefined,
      };
      return newSlots;
    });
  };

  const clearSlot = (slotIndex: number) => {
    setSelectedSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = null;
      return newSlots;
    });
  };

  const handleGenerate = async () => {
    if (!customTopic.trim()) {
      setError('Please enter a custom topic');
      return;
    }

    // Get selected activity and game keys
    const activityKeys = selectedSlots
      .filter((slot): slot is LessonSlot => slot !== null && slot.type === 'activity')
      .map((slot) => slot.key);

    const gameKeys = selectedSlots
      .filter((slot): slot is LessonSlot => slot !== null && slot.type === 'game')
      .map((slot) => slot.key);

    if (activityKeys.length === 0 && gameKeys.length === 0) {
      setError('Please select at least one activity or game');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/lesson-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTopic: customTopic.trim(),
          difficulty,
          activities: activityKeys,
          games: gameKeys,
        }),
      });

      const data: LessonPlanGenerateResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate lesson plan');
      }

      setGeneratedContent(data.content);
      setGeneratedGameContent(data.gameContent || null);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate lesson plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const getAvailableItems = (slotConfig: typeof slotConfigs[0]) => {
    if (slotConfig.type === 'game') {
      return allGames.map((g) => ({ key: g.key, name: g.name, type: 'game' as const }));
    }

    // For activities, filter by category
    let activities = activitiesGrouped[slotConfig.category] || [];
    if (slotConfig.alternateCategory) {
      activities = [...activities, ...(activitiesGrouped[slotConfig.alternateCategory] || [])];
    }
    return activities.map((a) => ({ key: a.key, name: a.name, type: 'activity' as const }));
  };

  const selectedActivities = selectedSlots.filter((s) => s !== null && s.type === 'activity');
  const selectedGames = selectedSlots.filter((s) => s !== null && s.type === 'game');
  const selectedCount = selectedActivities.length + selectedGames.length;
  const canGenerate = customTopic.trim() && selectedCount > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Lesson Plan</h1>
        <p className="text-gray-600">
          Build a complete lesson with activities and games around a custom topic.
          All content will be AI-generated to match your theme.
        </p>
      </div>

      {/* Topic & Difficulty */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Topic
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., What will the world be like in 50 years?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific! Good topics lead to better AI-generated content.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Lesson Structure</h2>
        <p className="text-sm text-gray-600 mb-6">
          Select an activity or game for each slot. Activities use your custom topic for AI-generated content.
        </p>

        <div className="space-y-4">
          {slotConfigs.map((config, index) => {
            const selected = selectedSlots[index];
            const items = getAvailableItems(config);
            const categoryInfo = config.category ? CATEGORY_INFO[config.category] : null;

            return (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{config.label}</span>
                    {config.optional && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                    {categoryInfo && (
                      <span className="text-xs text-gray-500">
                        {categoryInfo.description}
                      </span>
                    )}
                  </div>

                  {selected ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
                        {selected.name}
                      </span>
                      <button
                        onClick={() => clearSlot(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const [type, key] = e.target.value.split(':');
                          handleSlotSelect(index, key, type as 'activity' | 'game');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select {config.type}...</option>
                      {items.map((item) => (
                        <option key={item.key} value={`${item.type}:${item.key}`}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{selectedActivities.length} activit{selectedActivities.length === 1 ? 'y' : 'ies'}</span>
          {selectedGames.length > 0 && (
            <span className="text-gray-400"> + {selectedGames.length} game{selectedGames.length === 1 ? '' : 's'}</span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Content...
            </span>
          ) : (
            `Generate ${selectedCount} Item${selectedCount === 1 ? '' : 's'}`
          )}
        </button>
      </div>

      {/* Generated Content Preview */}
      <AnimatePresence>
        {(generatedContent || generatedGameContent) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800">Content Generated!</h3>
            </div>

            <p className="text-green-700 mb-4">
              Your lesson content is ready. Generated content for{' '}
              {Object.keys(generatedContent || {}).length + Object.keys(generatedGameContent || {}).length} item
              {Object.keys(generatedContent || {}).length + Object.keys(generatedGameContent || {}).length === 1 ? '' : 's'}.
            </p>

            {/* Quick preview of generated content */}
            <div className="space-y-3">
              {/* Activity content */}
              {generatedContent && Object.entries(generatedContent).map(([key, content]) => (
                <div key={key} className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">Activity</span>
                    <h4 className="font-medium text-green-800 capitalize">
                      {key.replace(/-/g, ' ')}
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 opacity-80">
                    Topic context: {content.topicContext}
                  </p>
                  {/* Activity-specific preview */}
                  {key === 'would-you-rather' && 'dilemmas' in content && (
                    <p className="text-sm text-green-600 mt-1">
                      {(content as unknown as { dilemmas: unknown[] }).dilemmas.length} dilemmas generated
                    </p>
                  )}
                  {key === 'hot-take-arena' && 'statement' in content && (
                    <p className="text-sm text-green-600 mt-1 italic">
                      &quot;{(content as unknown as { statement: string }).statement.slice(0, 100)}...&quot;
                    </p>
                  )}
                </div>
              ))}
              {/* Game content */}
              {generatedGameContent && Object.entries(generatedGameContent).map(([key, content]) => (
                <div key={key} className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Game</span>
                    <h4 className="font-medium text-green-800 capitalize">
                      {key.replace(/-/g, ' ')}
                    </h4>
                  </div>
                  {/* Game-specific preview */}
                  {'sentences' in content && (
                    <p className="text-sm text-green-600">
                      {(content as { sentences: unknown[] }).sentences.length} sentences pre-loaded
                    </p>
                  )}
                  {'task' in content && (
                    <p className="text-sm text-green-600 italic">
                      Task: {(content as { task: string }).task.slice(0, 80)}...
                    </p>
                  )}
                  {'startingWord' in content && (
                    <p className="text-sm text-green-600">
                      Starting word: <span className="font-bold">{(content as { startingWord: string }).startingWord}</span>
                    </p>
                  )}
                  {'targetWord' in content && (
                    <p className="text-sm text-green-600">
                      Target word: <span className="font-bold">{(content as { targetWord: string }).targetWord}</span>
                    </p>
                  )}
                  {'paragraph' in content && (
                    <p className="text-sm text-green-600">
                      {(content as { errorCount: number }).errorCount} errors to find
                    </p>
                  )}
                  {'word1' in content && (
                    <p className="text-sm text-green-600">
                      Words: <span className="font-bold">{(content as { word1: string; word2: string }).word1}</span> + <span className="font-bold">{(content as { word1: string; word2: string }).word2}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-green-200">
              <p className="text-sm text-green-700 mb-3">
                Ready to use this lesson in a session:
              </p>
              <button
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                onClick={() => {
                  // Store generated content in sessionStorage for use in session
                  sessionStorage.setItem('lessonPlanContent', JSON.stringify({
                    customTopic,
                    difficulty,
                    slots: selectedSlots.filter(Boolean),
                    generatedContent,
                    generatedGameContent,
                  }));
                  // Navigate to class selection or session
                  window.location.href = '/classes';
                }}
              >
                Continue to Class Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
