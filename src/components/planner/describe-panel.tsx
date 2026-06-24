'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { DIFFICULTIES } from '@/lib/difficulty';
import { Sparkles } from 'lucide-react';
import type { LessonIntent } from '@/app/api/lesson-plan/intent/route';

const DURATIONS = [30, 45, 60, 90] as const;

const EXAMPLES = [
  'A fun 30-min speaking warm-up about travel for teens',
  'Grammar lesson on the past simple, end with a debate',
  'Vocabulary builder on climate change',
  'Functional English for ordering food at a restaurant',
];

function chipClass(active: boolean): string {
  return `px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
    active
      ? 'bg-lc-blue text-white border-lc-blue'
      : 'bg-lc-surface border-lc-border text-lc-text2 hover:border-lc-blue/50'
  }`;
}

export function DescribePanel() {
  const {
    sourceMaterial,
    difficulty,
    lessonDurationMinutes,
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
    if (trimmed.length < 3 && !sourceMaterial) {
      setError('Describe your lesson in a few words first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lesson-plan/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed || (sourceMaterial?.title ?? ''),
          hasSource: !!sourceMaterial,
          // Pass the chip selections so the model only overrides them when the
          // description explicitly states a different level/length.
          currentDifficulty: difficulty,
          currentDurationMinutes: lessonDurationMinutes,
        }),
      });
      const data = (await res.json()) as LessonIntent & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not read that description. Try rephrasing.');
        return;
      }

      setGoals([data.goal, ...data.secondaryGoals]);
      setDifficulty(data.difficulty);
      setDuration(data.durationMinutes);
      // Keep the source-derived topic when a source is attached; otherwise use the
      // extracted topic, falling back to the teacher's own words so it's never empty.
      if (!sourceMaterial) setTopic(data.topic?.trim() || trimmed);
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
        <label htmlFor="describe-input" className="block text-lg font-semibold text-lc-text mb-2">
          What do you want to teach?
        </label>
        <textarea
          id="describe-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          disabled={loading}
          rows={3}
          placeholder="e.g. A B1 lesson about sea turtles, lots of speaking, ending with a debate."
          className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-base leading-relaxed focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue resize-y disabled:opacity-60"
        />
        <p className="text-xs text-lc-text3 mt-1">
          Just a topic is enough — say more if you want.
          {sourceMaterial && ' Your attached source will ground it.'}
        </p>
      </div>

      {/* Level + time chips — optional, pre-filled, adjustable here or on the plan */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-lc-text3 w-9">Level</span>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} disabled={loading} className={chipClass(difficulty === d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-lc-text3 w-9">Time</span>
          <div className="flex gap-1.5">
            {DURATIONS.map((t) => (
              <button key={t} onClick={() => setDuration(t)} disabled={loading} className={chipClass(lessonDurationMinutes === t)}>
                {t}m
              </button>
            ))}
          </div>
        </div>
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
        disabled={loading || (text.trim().length < 3 && !sourceMaterial)}
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
