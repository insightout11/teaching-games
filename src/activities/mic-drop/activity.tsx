'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { MicDropContent } from '../types';
import { scoreAllHeuristic, MIC_DROP_WEIGHTS, getImprovementTip, getDimensionBreakdown, getDisplayScore } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'collecting' | 'scoring' | 'highlights';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const LABEL_CANDIDATES = ['Best Mic Drop', 'Best Vocabulary', 'Most Powerful Line'];

const BONUS_POINTS: Record<string, number> = {
  'Best Mic Drop': 3,
  'Best Vocabulary': 2,
  'Most Powerful Line': 2,
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
    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}

function ScoreBreakdown({ score }: { score: LandingScore }) {
  const breakdown = getDimensionBreakdown(score);
  const tip = getImprovementTip(score);
  const display = getDisplayScore(score);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-game text-violet-400">{display}</span>
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

export function MicDropActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as MicDropContent;
  const timerSeconds = sessionSettings.timerSeconds ?? 60;

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [scores, setScores] = useState<LandingScore[]>([]);
  const [scoreSource, setScoreSource] = useState<'ai' | 'heuristic'>('heuristic');
  const [timeLeft, setTimeLeft] = useState(0);
  const [scoring, setScoring] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;

  // Timer
  useEffect(() => {
    if (phase !== 'collecting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Auto-lock on timer expiry
  useEffect(() => {
    if (phase === 'collecting' && timeLeft === 0) {
      handleLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Input spec
  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'mic-drop',
      prompt: content.prompt,
      placeholder: 'Write your most powerful line about this topic...',
      maxLength: 180,
    });
  }, [phase, content.prompt, onSetInputSpec]);

  // Vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'collecting') return;
      setSubmissions((prev) => ({
        ...prev,
        [vote.clientId]: {
          text: vote.choice,
          displayName: vote.displayName,
          studentId: vote.studentId ?? null,
        },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const handleStart = useCallback(() => {
    setSubmissions({});
    setScores([]);
    setTimeLeft(timerSeconds);
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [timerSeconds, onPhaseChange]);

  const handleLock = useCallback(async () => {
    if (phaseRef.current !== 'collecting') return;
    setPhase('scoring');
    setScoring(true);
    onPhaseChange?.('scoring');
    onSetInputSpec?.(null);

    const subs = submissionsRef.current;
    const clientIds = Object.keys(subs);
    const responses = clientIds.map((clientId) => ({ clientId, text: subs[clientId].text }));

    const count = responses.length;
    const effectiveLabels = count < 2 ? [] : count <= 3 ? LABEL_CANDIDATES.slice(0, 1) : LABEL_CANDIDATES;

    let finalScores: LandingScore[] = [];
    let source: 'ai' | 'heuristic' = 'heuristic';

    try {
      const res = await fetch('/api/landing/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'mic-drop',
          prompt: content.prompt,
          targetKeywords: content.targetKeywords,
          labelCandidates: effectiveLabels,
          responses,
          weights: MIC_DROP_WEIGHTS,
        }),
      });
      if (!res.ok) throw new Error('Score fetch failed');
      const data = await res.json() as { scores: LandingScore[]; source: 'ai' | 'heuristic' };
      finalScores = data.scores;
      source = data.source;
    } catch {
      finalScores = scoreAllHeuristic(responses, {
        prompt: content.prompt,
        targetKeywords: content.targetKeywords,
        labelCandidates: [],
        weights: MIC_DROP_WEIGHTS,
      });
    }

    finalScores.sort((a, b) => b.finalScore - a.finalScore);

    // Single onScore call per student: 1 participation + bonus if labeled
    await Promise.all(
      finalScores.map((score) => {
        const sub = subs[score.clientId];
        if (!sub) return;
        const bonus = BONUS_POINTS[score.suggestedLabel ?? ''] ?? 0;
        return onScore?.({
          studentId: sub.studentId ?? null,
          clientId: score.clientId,
          displayName: sub.displayName,
          promptIndex: 1,
          points: 1 + bonus,
          isCorrect: null,
        });
      })
    );

    setScores(finalScores);
    setScoreSource(source);
    setScoring(false);
    setPhase('highlights');
    onPhaseChange?.('highlights');
  }, [content.prompt, content.targetKeywords, onPhaseChange, onSetInputSpec, onScore]);

  const handleDone = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const submissionCount = Object.keys(submissions).length;
  const isSpotlight = scores.length === 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-violet-400">Mic Drop</h3>
        {phase === 'collecting' && (
          <span className="text-sm opacity-60">{submissionCount} submitted</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-xl font-semibold">{content.prompt}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {content.targetKeywords.map((kw) => (
                <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{kw}</span>
              ))}
            </div>
          </div>
          {content.exampleLine && (
            <div className="glass p-4 rounded-xl border border-violet-500/20 space-y-1">
              <p className="text-xs opacity-50 uppercase tracking-widest">Strong example (teacher only)</p>
              <p className="text-sm opacity-80 italic">{content.exampleLine}</p>
            </div>
          )}
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

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border-2 border-violet-500/30">
            <p className="text-xl font-semibold">{content.prompt}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 10 ? 'text-red-400' : 'text-violet-400'}`}>
                {timeLeft}s
              </div>
              <button onClick={() => setTimeLeft(prev => prev + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10">+30s</button>
              <div className="text-sm opacity-50">{submissionCount} submitted</div>
            </div>
            <button
              onClick={handleLock}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              LOCK &amp; SCORE
            </button>
          </div>
        </div>
      )}

      {/* SCORING */}
      {phase === 'scoring' && (
        <div className="text-center py-16 space-y-4">
          {scoring && <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />}
          <p className="text-lg opacity-70">Scoring responses…</p>
        </div>
      )}

      {/* HIGHLIGHTS */}
      {phase === 'highlights' && (
        <div className="space-y-5">
          <p className="text-sm opacity-50">
            {scores.length} response{scores.length !== 1 ? 's' : ''} · scored by {scoreSource === 'ai' ? 'smart scoring' : 'heuristic'}
          </p>

          {/* Spotlight Mode — single submission */}
          {isSpotlight && scores[0] && (() => {
            const score = scores[0];
            const sub = submissions[score.clientId];
            if (!sub) return null;
            return (
              <div className="glass p-6 rounded-2xl border-2 border-violet-400 shadow-lg shadow-violet-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">⭐ Spotlight Response</span>
                </div>
                <p className="font-semibold text-sm opacity-70">{sub.displayName}</p>
                <p className="text-lg leading-snug">{sub.text}</p>
                <ScoreBreakdown score={score} />
                {score.reasonTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {score.reasonTags.map((tag) => <ReasonTag key={tag} tag={tag} />)}
                  </div>
                )}
                <div className="mt-3 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-xs text-violet-300">Read this response aloud to close the lesson.</p>
                </div>
              </div>
            );
          })()}

          {/* Normal card list */}
          {!isSpotlight && (
            <div className="space-y-3">
              {scores.map((score) => {
                const sub = submissions[score.clientId];
                if (!sub) return null;
                return (
                  <div
                    key={score.clientId}
                    className="w-full text-left glass p-4 rounded-2xl border-2 border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm opacity-70 mb-1">{sub.displayName}</p>
                        <p className="text-base leading-snug">{sub.text}</p>
                      </div>
                    </div>
                    <ScoreBreakdown score={score} />
                    {(score.reasonTags.length > 0 || score.suggestedLabel) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
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
            </div>
          )}

          {scores.length === 0 && (
            <p className="text-center opacity-50 py-8">No submissions to display.</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
