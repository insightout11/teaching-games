'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { GrammarProofContent } from '../types';
import { scoreAllHeuristic } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';
import { useSessionStore } from '@/stores/session-store';
import { WingsCheck } from './wings-check';

type Phase = 'idle' | 'wings' | 'writing' | 'scoring' | 'results';

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
  const [peek, setPeek] = useState(false);
  const grammarBefore = useSessionStore((st) => st.lessonThread.grammarCheck);
  const hasWings = (content.wingsSentences?.length ?? 0) === 3;
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [scores, setScores] = useState<LandingScore[]>([]);
  const scoredResultsRef = useRef<Set<string>>(new Set());

  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const startWriting = useCallback(() => {
    setSubmissions({});
    setScores([]);
    scoredResultsRef.current = new Set();
    setPhase('writing');
    onPhaseChange?.('writing');
  }, [onPhaseChange]);

  // With a Wings check (the matched "after" for the Check-in) it comes first, then the writing.
  const handleStart = useCallback(() => {
    if (hasWings) { setPhase('wings'); onPhaseChange?.('wings'); }
    else startWriting();
  }, [hasWings, onPhaseChange, startWriting]);

  // Set input spec
  useEffect(() => {
    if (phase === 'wings') return;
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
    if (phase === 'wings') return;
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'writing') return;
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
  }, [onRegisterRemoteVoteHandler, onScore, phase]);

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
      if (scoredResultsRef.current.has(score.clientId)) continue;
      scoredResultsRef.current.add(score.clientId);
      const usedGrammar = score.targetLanguage >= 0.4 || score.reasonTags?.includes('used_target_vocab');
      onScore?.({
        studentId: sub.studentId ?? null,
        clientId: score.clientId,
        displayName: sub.displayName,
        promptIndex: 2,
        points: usedGrammar ? 3 : 1,
        isCorrect: usedGrammar,
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
  const sortedScores = [...scores].sort((a, b) => b.finalScore - a.finalScore);

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
          {hasWings && <p className="text-sm opacity-60">First a quick Wings check (3 sentences, like the Check-in), then students write their own.</p>}
          {content.exampleSentences?.length > 0 && (
            <div className="text-left">
              <button
                type="button"
                onPointerDown={() => setPeek(true)}
                onPointerUp={() => setPeek(false)}
                onPointerLeave={() => setPeek(false)}
                className="mx-auto block rounded-full border border-white/15 px-4 py-1.5 text-xs opacity-60 hover:opacity-90"
              >
                Hold to peek at model answers
              </button>
              {peek && (
                <div className="glass mt-2 space-y-2 rounded-xl p-4">
                  {content.exampleSentences.map((ex, i) => (
                    <p key={i} className="text-sm italic opacity-70">&ldquo;{ex}&rdquo;</p>
                  ))}
                </div>
              )}
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

      {/* WINGS CHECK */}
      {phase === 'wings' && content.wingsSentences && (
        <WingsCheck
          sentences={content.wingsSentences}
          target={grammarTarget}
          before={grammarBefore}
          onDone={startWriting}
          onSetInputSpec={onSetInputSpec}
          onRegisterRemoteVoteHandler={onRegisterRemoteVoteHandler}
          onScore={onScore}
          onPhaseChange={onPhaseChange}
        />
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

      {/* RESULTS: positive and anonymous on the shared screen */}
      {phase === 'results' && (
        <div className="space-y-4">
          <p className="text-center text-2xl">
            <strong className="text-emerald-300">{scores.filter((sc) => sc.targetLanguage >= 0.4 || sc.reasonTags?.includes('used_target_vocab')).length}</strong> of {submissionCount} used <strong>{grammarTarget}</strong>
          </p>
          <div className="space-y-3">
            {sortedScores.filter((sc) => sc.suggestedLabel || sc.finalScore >= 70).slice(0, 3).map((score) => {
              const sub = submissions[score.clientId];
              if (!sub) return null;
              return (
                <div key={score.clientId} className="glass space-y-1 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{sub.displayName}</span>
                    {score.suggestedLabel && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">{score.suggestedLabel}</span>}
                  </div>
                  <p className="text-lg italic opacity-90">&ldquo;{sub.text}&rdquo;</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleEnd}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              END ACTIVITY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
