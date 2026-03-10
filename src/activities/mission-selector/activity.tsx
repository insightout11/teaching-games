'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { MissionSelectorContent } from '../types';
import { useSessionStore } from '@/stores/session-store';

type Phase = 'idle' | 'presenting' | 'done';

// picks[clientId] = questionText
type PickMap = Record<string, { question: string; displayName: string; studentId?: string | null }>;

export function MissionSelectorActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as MissionSelectorContent;
  const questions = useMemo(() => content.questions ?? [], [content.questions]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<PickMap>({});

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const picksRef = useRef(picks);
  picksRef.current = picks;

  const { sessionId, addStudentMission } = useSessionStore();

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
    const allowWriteIn = sessionSettings.difficulty !== 'Beginner';
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'mission-selector',
      prompt: 'Choose your mission for this lesson:',
      options: questions,
      allowWriteIn,
    });
  }, [phase, questions, onSetInputSpec, sessionSettings.difficulty]);

  const handleStart = useCallback(() => {
    setPicks({});
    setPhase('presenting');
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  // Auto-start: no teacher interaction needed as a Flight Plan step
  useEffect(() => {
    handleStart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('done');
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange]);

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
