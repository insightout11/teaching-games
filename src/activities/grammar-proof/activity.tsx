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
      // Award participation point immediately on submission
      onScore?.({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: 1,
        points: 1,
        isCorrect: null,
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

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

  // Award bonus points and record landing answers when results are shown
  useEffect(() => {
    if (phase !== 'results') return;
    for (const score of scores) {
      const sub = submissionsRef.current[score.clientId];
      if (!sub) continue;
      // Bonus points based on score quality (participation point already awarded on submission)
      const bonus = score.finalScore >= 70 ? 4 : score.finalScore >= 50 ? 2 : score.finalScore >= 30 ? 1 : 0;
      const labelBonus = score.suggestedLabel ? 2 : 0;
      const totalBonus = bonus + labelBonus;
      if (totalBonus > 0) {
        onScore?.({
          studentId: sub.studentId ?? null,
          clientId: score.clientId,
          displayName: sub.displayName,
          promptIndex: 1,
          points: totalBonus,
          isCorrect: null,
        });
      }
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
  const sortedScores = [...scores].sort((a, b) => b.finalScore - a.finalScore);
  const submittedClientIds = new Set(Object.keys(submissions));
  const nonSubmitters = students.filter((s) => !Array.from(submittedClientIds).some(
    (cid) => submissions[cid]?.displayName === s.name || submissions[cid]?.studentId === s.id
  ));

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
        <div className="space-y-4">
          <p className="text-xs opacity-50 uppercase tracking-widest">{submissionCount} response{submissionCount !== 1 ? 's' : ''} evaluated</p>

          {/* Scored submissions */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {sortedScores.map((score) => {
              const sub = submissions[score.clientId];
              if (!sub) return null;
              const usedGrammar = score.targetLanguage >= 0.4 || score.reasonTags?.includes('used_target_vocab');
              const pct = score.finalScore;
              const scoreColor = pct >= 70 ? 'text-emerald-400' : pct >= 45 ? 'text-yellow-400' : 'text-rose-400';
              const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-rose-500';
              return (
                <div key={score.clientId} className="glass p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{sub.displayName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {usedGrammar ? (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Grammar ✓</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">Grammar?</span>
                      )}
                      {score.suggestedLabel && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">{score.suggestedLabel}</span>
                      )}
                      <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{pct}/100</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm opacity-80 italic">&ldquo;{sub.text}&rdquo;</p>
                </div>
              );
            })}

            {/* Submissions with no AI score (fallback display) */}
            {Object.entries(submissions)
              .filter(([cid]) => !scores.find((s) => s.clientId === cid))
              .map(([cid, sub]) => (
                <div key={cid} className="glass p-4 rounded-xl space-y-2 opacity-70">
                  <span className="font-semibold text-sm">{sub.displayName}</span>
                  <p className="text-sm italic">&ldquo;{sub.text}&rdquo;</p>
                </div>
              ))}
          </div>

          {/* Did not submit */}
          {nonSubmitters.length > 0 && (
            <div className="glass p-3 rounded-xl">
              <p className="text-xs opacity-40 uppercase tracking-widest mb-2">Did not submit</p>
              <div className="flex flex-wrap gap-2">
                {nonSubmitters.map((s) => (
                  <span key={s.id} className="text-xs px-2 py-1 bg-white/5 rounded-full opacity-50">{s.name}</span>
                ))}
              </div>
            </div>
          )}

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
