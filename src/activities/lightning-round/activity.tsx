'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { LightningRoundContent } from '../types';
import { scoreAllHeuristic, LIGHTNING_ROUND_WEIGHTS } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'collecting' | 'revealing' | 'summary';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const TAG_LABELS: Record<string, string> = {
  used_target_vocab: 'Target vocab',
  clear_complete_answer: 'Complete',
  detailed_response: 'Detailed',
  on_topic: 'On topic',
  creative_language: 'Creative',
};

function ReasonTag({ tag }: { tag: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}

export function LightningRoundActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as LightningRoundContent;
  const prompts = content.prompts;
  const timerSeconds = sessionSettings.timerSeconds ?? 30;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  // [promptIdx][clientId] = Submission
  const [allSubmissions, setAllSubmissions] = useState<Record<number, Record<string, Submission>>>({});
  // [promptIdx] → sorted scores
  const [promptScores, setPromptScores] = useState<Record<number, LandingScore[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [locking, setLocking] = useState(false);

  // Dedup participation scoring per prompt
  const scoredClientIds = useRef<Record<number, Set<string>>>({});

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const allSubmissionsRef = useRef(allSubmissions);
  allSubmissionsRef.current = allSubmissions;

  // Timer
  useEffect(() => {
    if (phase !== 'collecting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Auto-lock on timer expiry
  useEffect(() => {
    if (phase === 'collecting' && timeLeft === 0) {
      handleLock(currentIndexRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Input spec
  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    const prompt = prompts[currentIndex];
    if (!prompt) return;
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'lightning-round',
      prompt: prompt.text,
      placeholder: 'Write your answer quickly...',
      maxLength: 150,
    });
  }, [phase, currentIndex, prompts, onSetInputSpec]);

  // Vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'collecting') return;
      const idx = currentIndexRef.current;
      setAllSubmissions((prev) => ({
        ...prev,
        [idx]: {
          ...(prev[idx] ?? {}),
          [vote.clientId]: {
            text: vote.choice,
            displayName: vote.displayName,
            studentId: vote.studentId ?? null,
          },
        },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const handleStart = useCallback(() => {
    setAllSubmissions({});
    setPromptScores({});
    scoredClientIds.current = {};
    setCurrentIndex(0);
    setTimeLeft(timerSeconds);
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [timerSeconds, onPhaseChange]);

  const handleLock = useCallback(async (idx: number) => {
    if (phaseRef.current !== 'collecting' || locking) return;
    setLocking(true);
    onSetInputSpec?.(null);

    const subs = allSubmissionsRef.current[idx] ?? {};
    const clientIds = Object.keys(subs);

    // Award participation scores — deduplicate
    if (!scoredClientIds.current[idx]) scoredClientIds.current[idx] = new Set();
    const newClientIds = clientIds.filter((id) => !scoredClientIds.current[idx].has(id));

    await Promise.all(
      newClientIds.map((clientId) => {
        scoredClientIds.current[idx].add(clientId);
        return onScore?.({
          studentId: subs[clientId].studentId ?? null,
          clientId,
          displayName: subs[clientId].displayName,
          promptIndex: idx + 1,
          points: 1,
          isCorrect: null,
        });
      })
    );

    const responses = clientIds.map((clientId) => ({ clientId, text: subs[clientId].text }));
    const prompt = prompts[idx];

    let sorted: LandingScore[] = [];

    if (responses.length > 0 && prompt) {
      try {
        const res = await fetch('/api/landing/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityKey: 'lightning-round',
            prompt: prompt.text,
            targetKeywords: prompt.targetKeywords,
            labelCandidates: [],
            responses,
            weights: LIGHTNING_ROUND_WEIGHTS,
          }),
        });
        if (!res.ok) throw new Error('Score fetch failed');
        const data = await res.json() as { scores: LandingScore[] };
        sorted = [...data.scores].sort((a, b) => b.finalScore - a.finalScore);
      } catch {
        sorted = scoreAllHeuristic(responses, {
          prompt: prompt.text,
          targetKeywords: prompt.targetKeywords,
          labelCandidates: [],
          weights: LIGHTNING_ROUND_WEIGHTS,
        }).sort((a, b) => b.finalScore - a.finalScore);
      }
    }

    setPromptScores((prev) => ({ ...prev, [idx]: sorted }));
    setLocking(false);
    setPhase('revealing');
    onPhaseChange?.('revealing');
  }, [locking, prompts, onPhaseChange, onSetInputSpec, onScore]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= prompts.length) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('collecting');
      onPhaseChange?.('collecting');
    }
  }, [currentIndex, prompts.length, timerSeconds, onPhaseChange]);

  const handleDone = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  // For summary: best response per student across all prompts
  const bestPerStudent = (() => {
    const best: Record<string, { score: LandingScore; promptIdx: number; sub: Submission }> = {};
    for (const [idxStr, scores] of Object.entries(promptScores)) {
      const idx = Number(idxStr);
      for (const score of scores) {
        const sub = allSubmissions[idx]?.[score.clientId];
        if (!sub) continue;
        if (!best[score.clientId] || score.finalScore > best[score.clientId].score.finalScore) {
          best[score.clientId] = { score, promptIdx: idx, sub };
        }
      }
    }
    return Object.values(best).sort((a, b) => b.score.finalScore - a.score.finalScore);
  })();

  const currentPrompt = prompts[currentIndex];
  const currentSubmissionCount = Object.keys(allSubmissions[currentIndex] ?? {}).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-400">Lightning Round</h3>
        {phase !== 'idle' && phase !== 'summary' && (
          <span className="text-sm opacity-60">Prompt {currentIndex + 1} of {prompts.length}</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <p className="text-lg opacity-80">{prompts.length} rapid-fire prompts — respond fast.</p>
          <div className="space-y-2">
            {prompts.map((p, i) => (
              <div key={i} className="glass px-4 py-2 rounded-xl text-sm opacity-70">
                <span className="font-semibold text-orange-400 mr-2">{i + 1}.</span>{p.text}
              </div>
            ))}
          </div>
          <div className="text-center pt-4">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && currentPrompt && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border-2 border-orange-500/30">
            <p className="text-xl font-semibold">{currentPrompt.text}</p>
            {currentPrompt.targetKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentPrompt.targetKeywords.map((kw) => (
                  <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">{kw}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 5 ? 'text-red-400' : 'text-orange-400'}`}>
                {timeLeft}s
              </div>
              <div className="text-sm opacity-50">{currentSubmissionCount} submitted</div>
            </div>
            <button
              onClick={() => handleLock(currentIndex)}
              disabled={locking}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50"
            >
              LOCK
            </button>
          </div>
        </div>
      )}

      {/* REVEALING */}
      {phase === 'revealing' && currentPrompt && (
        <div className="space-y-5">
          <div className="glass p-4 rounded-xl border border-orange-500/20">
            <p className="text-sm opacity-60 mb-1">Prompt {currentIndex + 1}</p>
            <p className="font-semibold">{currentPrompt.text}</p>
          </div>

          <div className="space-y-2">
            {(promptScores[currentIndex] ?? []).slice(0, 5).map((score) => {
              const sub = allSubmissions[currentIndex]?.[score.clientId];
              if (!sub) return null;
              return (
                <div key={score.clientId} className="glass p-3 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs opacity-60 mb-0.5">{sub.displayName}</p>
                      <p className="text-sm leading-snug">{sub.text}</p>
                    </div>
                    <div className="text-lg font-game text-orange-400 shrink-0">{score.finalScore}</div>
                  </div>
                  {score.reasonTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {score.reasonTags.map((tag) => <ReasonTag key={tag} tag={tag} />)}
                    </div>
                  )}
                </div>
              );
            })}
            {(promptScores[currentIndex] ?? []).length === 0 && (
              <p className="text-center opacity-50 py-4 text-sm">No responses for this prompt.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex < prompts.length - 1 ? 'NEXT PROMPT' : 'VIEW SUMMARY'}
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-5">
          {/* Top response per prompt */}
          <div className="space-y-3">
            <p className="text-sm opacity-50 uppercase tracking-widest">Top answer per prompt</p>
            {prompts.map((prompt, idx) => {
              const top = (promptScores[idx] ?? [])[0];
              const sub = top ? allSubmissions[idx]?.[top.clientId] : undefined;
              return (
                <div key={idx} className="glass p-4 rounded-xl border border-white/10 space-y-1">
                  <p className="text-xs opacity-60">{idx + 1}. {prompt.text}</p>
                  {sub ? (
                    <>
                      <p className="text-sm font-semibold">{sub.displayName}</p>
                      <p className="text-sm opacity-80">{sub.text}</p>
                    </>
                  ) : (
                    <p className="text-sm opacity-40 italic">No responses</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Best per student */}
          {bestPerStudent.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm opacity-50 uppercase tracking-widest">Best per student</p>
              {bestPerStudent.map(({ score, promptIdx, sub }) => (
                <div key={score.clientId} className="glass p-3 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs opacity-60 mb-0.5">{sub.displayName} · Prompt {promptIdx + 1}</p>
                      <p className="text-sm">{sub.text}</p>
                    </div>
                    <div className="text-lg font-game text-orange-400 shrink-0">{score.finalScore}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
