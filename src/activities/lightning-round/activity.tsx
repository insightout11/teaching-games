'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { LightningRoundContent } from '../types';
import { scoreAllHeuristic, LIGHTNING_ROUND_WEIGHTS, getImprovementTip, getDimensionBreakdown, getDisplayScore } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'collecting' | 'revealing' | 'summary';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const LR_LABEL_CANDIDATES = ['Best Reason', 'Best Vocabulary', 'Fast Clear Answer'];

const LR_BONUS_POINTS: Record<string, number> = {
  'Best Reason': 2,
  'Best Vocabulary': 2,
  'Fast Clear Answer': 1,
};

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

function ScoreBreakdown({ score }: { score: LandingScore }) {
  const breakdown = getDimensionBreakdown(score);
  const tip = getImprovementTip(score);
  const display = getDisplayScore(score);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-game text-orange-400">{display}</span>
        <span className="text-xs opacity-50">/ 40</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {breakdown.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-xs opacity-70">
            <span>{d.label}</span>
            <span className="font-semibold">{d.value}<span className="opacity-50">/10</span></span>
          </div>
        ))}
      </div>
      <p className="text-xs opacity-60 italic">&ldquo;{tip}&rdquo;</p>
    </div>
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
      placeholder: 'Answer quickly with a word, phrase, or short sentence.',
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
    const responses = clientIds.map((clientId) => ({ clientId, text: subs[clientId].text }));
    const prompt = prompts[idx];

    const count = responses.length;
    const effectiveLabels = count < 2 ? [] : count <= 3 ? LR_LABEL_CANDIDATES.slice(0, 1) : LR_LABEL_CANDIDATES;

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
            labelCandidates: effectiveLabels,
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
          effortMaxWords: 8,
        }).sort((a, b) => b.finalScore - a.finalScore);
      }
    }

    // Single onScore call per student: 1 participation + bonus if labeled
    await Promise.all(
      sorted.map((score) => {
        const sub = subs[score.clientId];
        if (!sub) return;
        const bonus = LR_BONUS_POINTS[score.suggestedLabel ?? ''] ?? 0;
        return onScore?.({
          studentId: sub.studentId ?? null,
          clientId: score.clientId,
          displayName: sub.displayName,
          promptIndex: idx + 1,
          points: 1 + bonus,
          isCorrect: null,
        });
      })
    );

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

  // Most Memorable Thought for summary
  const mostMemorable = (() => {
    if (bestPerStudent.length === 0) return null;
    const labeled = bestPerStudent.filter((b) => b.score.suggestedLabel);
    return labeled.length > 0
      ? labeled.reduce((a, b) => b.score.finalScore > a.score.finalScore ? b : a)
      : bestPerStudent[0];
  })();

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
              <button onClick={() => setTimeLeft(prev => prev + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10">+30s</button>
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

          <div className="space-y-3">
            {(promptScores[currentIndex] ?? []).slice(0, 5).map((score) => {
              const sub = allSubmissions[currentIndex]?.[score.clientId];
              if (!sub) return null;
              return (
                <div key={score.clientId} className="glass p-4 rounded-xl border border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs opacity-60 mb-0.5">{sub.displayName}</p>
                    <p className="text-sm leading-snug">{sub.text}</p>
                  </div>
                  <ScoreBreakdown score={score} />
                  {(score.reasonTags.length > 0 || score.suggestedLabel) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {score.reasonTags.map((tag) => <ReasonTag key={tag} tag={tag} />)}
                      {score.suggestedLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                          ⭐ {score.suggestedLabel}
                        </span>
                      )}
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
        <div className="space-y-6">
          {/* Section 1: Best response per prompt */}
          <div className="space-y-3">
            <p className="text-sm opacity-50 uppercase tracking-widest">Best answer per prompt</p>
            {prompts.map((prompt, idx) => {
              const top = (promptScores[idx] ?? [])[0];
              const sub = top ? allSubmissions[idx]?.[top.clientId] : undefined;
              return (
                <div key={idx} className="glass p-4 rounded-xl border border-white/10 space-y-2">
                  <p className="text-xs opacity-60">{idx + 1}. {prompt.text}</p>
                  {sub && top ? (
                    <>
                      <p className="text-sm font-semibold">{sub.displayName}</p>
                      <p className="text-sm opacity-80">{sub.text}</p>
                      <ScoreBreakdown score={top} />
                    </>
                  ) : (
                    <p className="text-sm opacity-40 italic">No responses</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section 2: Most Memorable Thought */}
          {mostMemorable && (
            <div className="space-y-2">
              <p className="text-sm opacity-50 uppercase tracking-widest">Most Memorable Thought</p>
              <div className="glass p-5 rounded-2xl border-2 border-amber-500/30 space-y-3">
                <p className="text-base leading-snug italic">&ldquo;{mostMemorable.sub.text}&rdquo;</p>
                <p className="text-xs opacity-60">— {mostMemorable.sub.displayName} · Prompt {mostMemorable.promptIdx + 1}</p>
                <ScoreBreakdown score={mostMemorable.score} />
                {mostMemorable.score.suggestedLabel && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    ⭐ {mostMemorable.score.suggestedLabel}
                  </span>
                )}
              </div>
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
