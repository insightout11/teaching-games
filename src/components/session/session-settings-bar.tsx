'use client';

import { useState } from 'react';
import {
  useSessionStore,
  DIFFICULTIES,
  TOPICS,
  TONES,
  type Difficulty,
  type Topic,
  type Tone,
  type ScoringMode,
} from '@/stores/session-store';
import { GrammarTarget, GRAMMAR_TARGET_GROUPS } from '@/lib/grammar';
import { useTeacherTier } from '@/hooks/use-teacher-tier';

const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  participation: 'Participation Mode',
  accuracy: 'Accuracy Mode',
  competitive: 'Competitive Mode',
};

function persistSessionSettings(sessionId: string | null, patch: { topic?: string; difficulty?: string; customTopic?: string }) {
  if (!sessionId) return;
  void fetch('/api/session/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...patch }),
  });
}

export function SessionSettingsBar() {
  const settings = useSessionStore((s) => s.settings);
  const setSettings = useSessionStore((s) => s.setSettings);
  const setTopic = useSessionStore((s) => s.setTopic);
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);
  const sessionId = useSessionStore((s) => s.sessionId);
  const scoringMode = settings.scoringMode;
  const [showCustomTopic, setShowCustomTopic] = useState(!!settings.customTopic);
  const teacherTier = useTeacherTier();

  const handleTopicChange = (newTopic: Topic) => {
    setTopic(newTopic);
    persistSessionSettings(sessionId, { topic: newTopic, difficulty: settings.difficulty });
    // Clear custom topic when using dropdown
    if (settings.customTopic) {
      setCustomTopic('');
      setShowCustomTopic(false);
    }
  };

  const handleCustomTopicToggle = () => {
    if (showCustomTopic) {
      // Clearing custom topic
      setCustomTopic('');
      setShowCustomTopic(false);
    } else {
      setShowCustomTopic(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <div className="flex gap-4 items-center px-2">
        {/* Difficulty */}
        <select
          value={settings.difficulty}
          onChange={(e) => {
            const d = e.target.value as Difficulty;
            setSettings({ difficulty: d });
            persistSessionSettings(sessionId, { difficulty: d, topic: settings.customTopic || settings.topic });
          }}
          className="bg-transparent font-bold outline-none cursor-pointer"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <div className="h-4 w-px bg-lc-border" />

        {/* Topic Selection */}
        {!showCustomTopic ? (
          <>
            <select
              value={settings.topic}
              onChange={(e) => handleTopicChange(e.target.value as Topic)}
              className="bg-transparent font-bold outline-none cursor-pointer"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {teacherTier.isPro ? (
              <button
                onClick={handleCustomTopicToggle}
                className="text-lc-blue hover:text-lc-blue/80 transition-colors"
                title="Use custom topic"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            ) : (
              <a
                href="/settings?tab=billing"
                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                title="Custom topics require Pro"
              >
                Pro
              </a>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={settings.customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onBlur={(e) => persistSessionSettings(sessionId, { customTopic: e.target.value, difficulty: settings.difficulty })}
              placeholder="Custom topic..."
              className="bg-lc-surface border border-lc-border rounded px-2 py-0.5 text-[10px] w-32 outline-none focus:border-lc-blue text-lc-text"
              autoFocus
            />
            <button
              onClick={handleCustomTopicToggle}
              className="text-lc-text3 hover:text-lc-text transition-colors"
              title="Use dropdown topic"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="h-4 w-px bg-lc-border" />

        {/* Tone */}
        <select
          value={settings.tone}
          onChange={(e) => setSettings({ tone: e.target.value as Tone })}
          className="bg-transparent font-bold outline-none cursor-pointer"
        >
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="h-4 w-px bg-lc-border" />

        {/* Grammar Target — optional, shown as a selector */}
        <select
          value={settings.grammarTarget ?? ''}
          onChange={(e) => setGrammarTarget(e.target.value ? e.target.value as GrammarTarget : null)}
          className="bg-transparent font-bold outline-none cursor-pointer"
          title="Grammar focus (optional)"
        >
          <option value="">Grammar: Any</option>
          {Object.entries(GRAMMAR_TARGET_GROUPS).map(([group, targets]) => (
            <optgroup key={group} label={group}>
              {targets.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="h-4 w-px bg-lc-border" />

        {/* Scoring mode badge (read-only) */}
        <span className="text-sm font-medium text-lc-text2">
          {SCORING_MODE_LABELS[scoringMode]}
        </span>
      </div>

      {/* Custom Topic Indicator */}
      {settings.customTopic && (
        <div className="glass px-3 py-1 rounded-full ml-1 border border-cyan-500/30">
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">
            Custom: {settings.customTopic.slice(0, 20)}{settings.customTopic.length > 20 ? '...' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
