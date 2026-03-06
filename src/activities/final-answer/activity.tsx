'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { FinalAnswerContent } from '../types';
import { scoreAllHeuristic, FINAL_ANSWER_WEIGHTS } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'collecting' | 'scoring' | 'highlights';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const LABEL_CANDIDATES = ['Best Answer', 'Best Vocabulary', 'Most Complete', 'Most Creative'];

const TAG_LABELS: Record<string, string> = {
  used_target_vocab: 'Target vocab',
  clear_complete_answer: 'Complete',
  detailed_response: 'Detailed',
  on_topic: 'On topic',
  creative_language: 'Creative',
};

function ReasonTag({ tag }: { tag: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}

export function FinalAnswerActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as FinalAnswerContent;
  const timerSeconds = sessionSettings.timerSeconds ?? 60;

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [scores, setScores] = useState<LandingScore[]>([]);
  const [scoreSource, setScoreSource] = useState<'ai' | 'heuristic'>('heuristic');
  const [timeLeft, setTimeLeft] = useState(0);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
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
      gameKey: 'final-answer',
      prompt: content.prompt,
      placeholder: content.sentenceStarter ?? 'Write your answer in one sentence...',
      maxLength: 200,
    });
  }, [phase, content.prompt, content.sentenceStarter, onSetInputSpec]);

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
    setSpotlightId(null);
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

    // Award participation scores
    await Promise.all(
      clientIds.map((clientId) =>
        onScore?.({
          studentId: subs[clientId].studentId ?? null,
          clientId,
          displayName: subs[clientId].displayName,
          promptIndex: 1,
          points: 1,
          isCorrect: null,
        })
      )
    );

    const responses = clientIds.map((clientId) => ({ clientId, text: subs[clientId].text }));

    // Determine label candidates based on count
    const count = responses.length;
    const effectiveLabels = count < 2 ? [] : count <= 3 ? LABEL_CANDIDATES.slice(0, 1) : LABEL_CANDIDATES;

    let finalScores: LandingScore[] = [];
    let source: 'ai' | 'heuristic' = 'heuristic';

    try {
      const res = await fetch('/api/landing/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'final-answer',
          prompt: content.prompt,
          targetKeywords: content.targetKeywords,
          labelCandidates: effectiveLabels,
          responses,
          weights: FINAL_ANSWER_WEIGHTS,
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
        weights: FINAL_ANSWER_WEIGHTS,
      });
    }

    finalScores.sort((a, b) => b.finalScore - a.finalScore);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-teal-400">Final Answer</h3>
        {phase === 'collecting' && (
          <span className="text-sm opacity-60">{submissionCount} submitted</span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-xl font-semibold">{content.prompt}</p>
            {content.sentenceStarter && (
              <p className="text-sm opacity-60">Starter: <em>{content.sentenceStarter}</em></p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {content.targetKeywords.map((kw) => (
                <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">{kw}</span>
              ))}
            </div>
          </div>
          {content.exampleAnswer && (
            <div className="glass p-4 rounded-xl border border-teal-500/20 space-y-1">
              <p className="text-xs opacity-50 uppercase tracking-widest">Model answer (teacher only)</p>
              <p className="text-sm opacity-80 italic">{content.exampleAnswer}</p>
            </div>
          )}
          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border-2 border-teal-500/30">
            <p className="text-xl font-semibold">{content.prompt}</p>
            {content.sentenceStarter && (
              <p className="text-sm opacity-60 mt-2">Starter: <em>{content.sentenceStarter}</em></p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-game ${timeLeft <= 10 ? 'text-red-400' : 'text-teal-400'}`}>
                {timeLeft}s
              </div>
              <div className="text-sm opacity-50">{submissionCount} submitted</div>
            </div>
            <button
              onClick={handleLock}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              LOCK &amp; SCORE
            </button>
          </div>
        </div>
      )}

      {/* SCORING */}
      {phase === 'scoring' && (
        <div className="text-center py-16 space-y-4">
          {scoring && <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />}
          <p className="text-lg opacity-70">Scoring responses…</p>
        </div>
      )}

      {/* HIGHLIGHTS */}
      {phase === 'highlights' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-50">
              {scores.length} response{scores.length !== 1 ? 's' : ''} · scored by {scoreSource === 'ai' ? 'AI' : 'heuristic'}
            </p>
          </div>

          <div className="space-y-3">
            {scores.map((score) => {
              const sub = submissions[score.clientId];
              if (!sub) return null;
              const isSpotlit = spotlightId === score.clientId;
              return (
                <button
                  key={score.clientId}
                  onClick={() => setSpotlightId(isSpotlit ? null : score.clientId)}
                  className={`w-full text-left glass p-4 rounded-2xl border-2 transition-all ${
                    isSpotlit ? 'border-teal-400 shadow-lg shadow-teal-500/20 scale-[1.01]' : 'border-white/10 hover:border-teal-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm opacity-70 mb-1">{sub.displayName}</p>
                      <p className="text-base leading-snug">{sub.text}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-game text-teal-400">{score.finalScore}</div>
                    </div>
                  </div>
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
                </button>
              );
            })}
          </div>

          {scores.length === 0 && (
            <p className="text-center opacity-50 py-8">No submissions to display.</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
