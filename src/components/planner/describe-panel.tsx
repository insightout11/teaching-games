'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { Sparkles, Wand2 } from 'lucide-react';
import type { LessonIntent } from '@/app/api/lesson-plan/intent/route';

const EXAMPLES = [
  'A fun 30-min speaking warm-up about travel for B1 teens',
  'Grammar lesson on the past simple, intermediate, end with a debate',
  'Vocabulary builder on climate change for advanced adults',
  '45-min functional English for ordering food at a restaurant, beginners',
];

export function DescribePanel() {
  const {
    sourceMaterial,
    setTopic,
    setGoals,
    setDifficulty,
    setDuration,
    initModules,
    setStep,
  } = usePlannerStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setError('Describe your lesson in a few words first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lesson-plan/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, hasSource: !!sourceMaterial }),
      });
      const data = (await res.json()) as LessonIntent & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not read that description. Try rephrasing.');
        return;
      }

      // Populate the same store fields the Build tab uses, then compose + advance.
      setGoals([data.goal, ...data.secondaryGoals]);
      setDifficulty(data.difficulty);
      setDuration(data.durationMinutes);
      if (!sourceMaterial) setTopic(data.topic); // keep source-derived topic when a source is attached
      initModules();
      setStep('flight-plan');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="describe-input" className="flex items-center gap-2 text-sm font-medium text-lc-text2 mb-2">
          <Wand2 className="h-4 w-4 text-lc-blue" />
          Describe your lesson
        </label>
        <textarea
          id="describe-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          disabled={loading}
          rows={4}
          placeholder="e.g. A 45-minute B1 lesson about social media, lots of speaking, ending with a debate."
          className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-base leading-relaxed focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue resize-y disabled:opacity-60"
        />
        <p className="text-xs text-lc-text3 mt-1">
          Say as much or as little as you like — level, length, goals, and topic are all optional.
          {sourceMaterial && ' Your attached source will ground the lesson.'}
        </p>
      </div>

      {/* Example starters */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setText(ex);
              setError(null);
            }}
            disabled={loading}
            className="text-left text-xs px-3 py-1.5 rounded-full bg-lc-surface border border-lc-border text-lc-text3 hover:text-lc-text hover:border-lc-blue/40 transition-all disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={build}
        disabled={loading || text.trim().length < 3}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-lc-blue text-white rounded-xl font-semibold text-lg hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Building your lesson…
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Build Lesson
          </>
        )}
      </button>
    </div>
  );
}
