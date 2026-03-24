'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { GrammarProofContent } from '../types';
import { scoreAllHeuristic } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'writing' | 'scoring' | 'results';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

export function GrammarProofActivity({
  students,
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onLandingAnswer,
}: ActivityProps) {
  const content = generatedContent as GrammarProofContent;
  const grammarTarget = (sessionSettings as { grammarTarget?: string }).grammarTarget ?? content.grammarTarget ?? 'grammar';

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [scores, setScores] = useState<LandingScore[]>([]);

  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;

  const handleStart = useCallback(() => {
    setSubmissions({});
    setScores([]);
    setPhase('writing');
    onPhaseChange?.('writing');
  }, [onPhaseChange]);

  // Set input spec
  useEffect(() => {
    if (phase !== 'writing') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'grammar-proof',
      prompt: `${content.prompt}\n\n(Use: ${grammarTarget})`,
      placeholder: 'Write your 2 sentences here…',
      maxLength: 300,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Collect textarea submissions via remote vote handler (vote.choice carries the text)
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (!vote.choice) return;
      if (submissionsRef.current[vote.clientId]) return;
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

  const handleScore = useCallback(async () => {
    setPhase('scoring');
    onPhaseChange?.('scoring');

    const responses = Object.entries(submissionsRef.current).map(([clientId, sub]) => ({
      clientId,
      text: sub.text,
    }));

    try {
      const res = await fetch('/api/landing/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityKey: 'grammar-proof',
          prompt: `${content.prompt} (target: ${grammarTarget})`,
          targetKeywords: [grammarTarget],
          labelCandidates: ['Best Use of Grammar', 'Clear & Correct', 'Most Improved'],
          responses,
          weights: { grammar: 0.6, vocabulary: 0.2, relevance: 0.1, effort: 0.1 },
        }),
      });
      if (res.ok) {
        const data = await res.json() as { scores: LandingScore[] };
        setScores(data.scores ?? []);
      } else {
        throw new Error('Score API failed');
      }
    } catch {
      // Fallback to heuristic scoring
      const fallback = scoreAllHeuristic(responses, {
        prompt: `${content.prompt} (target: ${grammarTarget})`,
        targetKeywords: [grammarTarget],
        labelCandidates: ['Best Use of Grammar', 'Clear & Correct', 'Most Improved'],
      });
      setScores(fallback);
    }

    setPhase('results');
    onPhaseChange?.('results');
  }, [content.prompt, grammarTarget, onPhaseChange]);

  // Award points when results are shown
  useEffect(() => {
    if (phase !== 'results' || scores.length === 0) return;
    for (const score of scores) {
      const sub = submissionsRef.current[score.clientId];
      if (!sub) continue;
      const points = 1 + (score.suggestedLabel ? 2 : 0);
      onScore?.({
        studentId: sub.studentId ?? null,
        clientId: score.clientId,
        displayName: sub.displayName,
        promptIndex: 1,
        points,
        isCorrect: null,
      });
      onLandingAnswer?.(score.clientId, sub.text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scores]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  const submissionCount = Object.keys(submissions).length;
  const topScores = [...scores].sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-400">Grammar Proof</h3>
        {grammarTarget && (
          <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            {grammarTarget}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="text-center py-12 space-y-4">
          <p className="text-xl opacity-90">Time to prove it.</p>
          <p className="text-sm opacity-50">Students write 2 sentences using {grammarTarget}.</p>
          {content.exampleSentences?.length > 0 && (
            <div className="glass p-4 rounded-xl text-left space-y-2">
              <p className="text-xs opacity-50 uppercase tracking-widest">Model answers (teacher only)</p>
              {content.exampleSentences.map((ex, i) => (
                <p key={i} className="text-sm opacity-70 italic">&ldquo;{ex}&rdquo;</p>
              ))}
            </div>
          )}
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </div>
      )}

      {/* WRITING */}
      {phase === 'writing' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border-2 border-emerald-500/30 space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">Task</p>
            <p className="text-lg font-medium">{content.prompt}</p>
            <p className="text-sm text-emerald-400">Structure to use: <strong>{grammarTarget}</strong></p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-50">{submissionCount} / {students.length} submitted</span>
            <button
              onClick={handleScore}
              disabled={submissionCount === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              SCORE RESPONSES
            </button>
          </div>
        </div>
      )}

      {/* SCORING */}
      {phase === 'scoring' && (
        <div className="text-center py-12 space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm opacity-50">Evaluating grammar…</p>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <div className="space-y-6">
          {topScores.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-400">Standout responses</p>
              {topScores.map((score) => {
                const sub = submissions[score.clientId];
                if (!sub) return null;
                return (
                  <div key={score.clientId} className="glass p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{sub.displayName}</span>
                      {score.suggestedLabel && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                          {score.suggestedLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-80">&ldquo;{sub.text}&rdquo;</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="glass p-4 rounded-xl space-y-2">
            <p className="text-xs opacity-50 uppercase tracking-widest">All submissions</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(submissions).map(([clientId, sub]) => (
                <div key={clientId} className="flex items-start gap-3 text-sm">
                  <span className="opacity-50 shrink-0">{sub.displayName}</span>
                  <span className="opacity-80">&ldquo;{sub.text}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END MODULE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
