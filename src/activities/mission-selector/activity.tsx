'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { MissionSelectorContent } from '../types';
import { useSessionStore } from '@/stores/session-store';
import { getFlightPlanItem } from '@/lib/flight-plan-config';
import type { ActivityGeneratedContent } from '../types';

type Phase = 'idle' | 'presenting' | 'done';

// picks[clientId] = questionText
type PickMap = Record<string, { question: string; displayName: string; studentId?: string | null }>;

export function MissionSelectorActivity({
  sessionSettings,
  generatedContent,
  customTopic,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as MissionSelectorContent;
  const questions = content.questions ?? [];

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<PickMap>({});
  const [bannerState, setBannerState] = useState<null | 'updating' | 'done' | 'error'>(null);
  const [bannerActivity, setBannerActivity] = useState('');

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const picksRef = useRef(picks);
  picksRef.current = picks;

  const { sessionId, addStudentMission, updateGeneratedContent } = useSessionStore();

  // Vote handler — receives student mission choices
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'presenting') return;
      const already = picksRef.current[vote.clientId];
      if (already) return; // deduplicate
      const questionText = vote.choice;
      setPicks((prev) => ({
        ...prev,
        [vote.clientId]: { question: questionText, displayName: vote.displayName, studentId: vote.studentId ?? null },
      }));
      addStudentMission(vote.clientId, questionText);
      onScore?.({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: 1,
        points: 1,
        isCorrect: null,
      });
      // Write to DB (fire-and-forget)
      if (sessionId) {
        void fetch('/api/session/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, clientId: vote.clientId, missionText: questionText }),
        });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, addStudentMission, sessionId]);

  // Input spec during presenting
  useEffect(() => {
    if (phase !== 'presenting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'mission-selector',
      prompt: 'Choose your mission for this lesson:',
      options: questions,
    });
  }, [phase, questions, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setPicks({});
    setPhase('presenting');
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const handleFinish = useCallback(async () => {
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('done');

    // Find the lesson plan's production slot to check for missionAware
    let productionActivityKey: string | null = null;
    try {
      const stored = sessionStorage.getItem('lessonPlanContent');
      if (stored) {
        const plan = JSON.parse(stored) as {
          slots: Array<{ type: string; key: string }>;
        };
        for (const slot of plan.slots ?? []) {
          if (slot.type === 'activity') {
            const item = getFlightPlanItem(slot.key);
            if (item?.missionAware) {
              productionActivityKey = slot.key;
              break;
            }
          }
        }
      }
    } catch {
      // sessionStorage not available or parse error — skip
    }

    if (!productionActivityKey) {
      onPhaseChange?.('finished');
      return;
    }

    // Compute missionContext: deduplicate, take top 5 unique
    const allMissions = Object.values(picksRef.current).map((p) => p.question);
    const uniqueMissions = Array.from(new Set(allMissions)).slice(0, 5);

    const activityName = productionActivityKey
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    setBannerActivity(activityName);
    setBannerState('updating');

    try {
      const res = await fetch('/api/lesson-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTopic: customTopic ?? content.topicContext,
          difficulty: sessionSettings.difficulty,
          activities: [productionActivityKey],
          missionContext: uniqueMissions,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json() as { success: boolean; content: Record<string, ActivityGeneratedContent> };
      if (!data.success || !data.content[productionActivityKey]) throw new Error('No content returned');
      updateGeneratedContent(productionActivityKey, data.content[productionActivityKey]);
      setBannerState('done');
      setTimeout(() => {
        setBannerState(null);
        onPhaseChange?.('finished');
      }, 3000);
    } catch {
      setBannerState('error');
      onPhaseChange?.('finished');
    }
  }, [onSetInputSpec, onPhaseChange, customTopic, content.topicContext, sessionSettings.difficulty, updateGeneratedContent]);

  const pickCount = Object.keys(picks).length;

  // Distribution: how many students chose each question
  const distribution = questions.map((q) => ({
    question: q,
    count: Object.values(picks).filter((p) => p.question === q).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-violet-400">Mission Selector</h3>
        {phase === 'presenting' && (
          <span className="text-sm opacity-60">{pickCount} selected</span>
        )}
      </div>

      {/* Banner */}
      {bannerState && (
        <div className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${
          bannerState === 'updating' ? 'bg-violet-500/20 text-violet-300' :
          bannerState === 'done' ? 'bg-emerald-500/20 text-emerald-300' :
          'bg-amber-500/20 text-amber-300'
        }`}>
          {bannerState === 'updating' && (
            <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          )}
          {bannerState === 'updating' && `Updating ${bannerActivity} with class missions…`}
          {bannerState === 'done' && `Updated ${bannerActivity} ✓`}
          {bannerState === 'error' && `Could not update ${bannerActivity} — using original content`}
        </div>
      )}

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-5">
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-sm opacity-60 uppercase tracking-widest">Mission questions</p>
            <div className="grid gap-2">
              {questions.map((q, i) => (
                <div key={i} className="px-4 py-2 rounded-xl bg-white/5 text-sm">
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* PRESENTING */}
      {phase === 'presenting' && (
        <div className="space-y-5">
          <div className="space-y-2">
            {distribution.map(({ question, count }) => (
              <div key={question} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80 flex-1 min-w-0 pr-3 leading-snug">{question}</span>
                  <span className="font-semibold text-violet-400 shrink-0">{count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              FINISH
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="glass p-6 rounded-2xl space-y-3 text-center">
          <p className="text-lg font-semibold text-violet-300">Missions chosen!</p>
          <p className="text-sm opacity-60">{pickCount} student{pickCount !== 1 ? 's' : ''} selected a mission.</p>
          <p className="text-sm opacity-50">Students will answer their mission at the end of the lesson.</p>
        </div>
      )}
    </div>
  );
}
