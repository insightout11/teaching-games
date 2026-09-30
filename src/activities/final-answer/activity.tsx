'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, Mic, PenLine, Star } from 'lucide-react';
import type { ActivityProps } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { FinalAnswerContent } from '../types';
import { scoreAllHeuristic, FINAL_ANSWER_WEIGHTS } from '@/lib/landing-scorer';
import type { LandingScore } from '@/lib/landing-scorer';

type Phase = 'idle' | 'collecting' | 'scoring' | 'highlights';

interface Submission {
  text: string;
  displayName: string;
  studentId?: string | null;
}

const LABEL_CANDIDATES = ['Best Idea', 'Best Vocabulary', 'Clear Answer'];

const BONUS_POINTS: Record<string, number> = {
  'Best Idea': 2,
  'Best Vocabulary': 2,
  'Clear Answer': 2,
};

export function FinalAnswerActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onLandingAnswer,
  studentMissions,
}: ActivityProps) {
  const content = generatedContent as FinalAnswerContent;
  const timerSeconds = sessionSettings.timerSeconds ?? 60;
  const hasMissions = studentMissions && Object.keys(studentMissions).length > 0;

  const [phase, setPhase] = useState<Phase>('idle');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [scores, setScores] = useState<LandingScore[]>([]);
  const [scoreSource, setScoreSource] = useState<'ai' | 'heuristic'>('heuristic');
  const [timeLeft, setTimeLeft] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [peek, setPeek] = useState(false);
  const [readIdx, setReadIdx] = useState<number | null>(null);

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
      prompt: hasMissions ? 'Answer your mission question below.' : content.prompt,
      placeholder: hasMissions ? 'Write your answer...' : (content.sentenceStarter ?? 'Write your answer in one sentence...'),
      maxLength: 200,
      keywords: content.targetKeywords,
    });
  }, [phase, content.prompt, content.sentenceStarter, onSetInputSpec, hasMissions]);

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
          activityKey: 'final-answer',
          prompt: content.prompt,
          targetKeywords: content.targetKeywords,
          labelCandidates: effectiveLabels,
          responses,
          weights: FINAL_ANSWER_WEIGHTS,
          ...(hasMissions && { studentMissions }),
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

    // Single onScore call per student: 1 participation + bonus if labeled
    await Promise.all(
      finalScores.map((score) => {
        const sub = subs[score.clientId];
        if (!sub) return;
        onLandingAnswer?.(score.clientId, sub.text);
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
  const standouts = scores.filter((sc) => sc.suggestedLabel && submissions[sc.clientId]);
  // One submission: it's the spotlight. Otherwise the labelled standouts.
  const spotlight = scores.length === 1 ? scores : standouts;
  const rest = scores.filter((sc) => !spotlight.includes(sc) && submissions[sc.clientId]);
  const title = hasMissions ? 'Mission Debrief' : 'Final Answer';

  const promptCard = (
    <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-7 text-center">
      <p className="font-display text-4xl leading-snug text-white" style={{ textWrap: 'balance' }}>{hasMissions ? 'Answer your mission question' : content.prompt}</p>
      {!hasMissions && content.sentenceStarter && <p className="mt-3 text-lg text-white/70">Start with: <span className="text-teal-200">{content.sentenceStarter}</span></p>}
      {content.targetKeywords.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {content.targetKeywords.map((kw) => <span key={kw} className="rounded-full border border-teal-300/40 bg-teal-400/10 px-3 py-1 text-base text-teal-100">{kw}</span>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="emerald">{title}</KitLabel>
        {phase === 'collecting' && <KitReadout>{submissionCount} submitted</KitReadout>}
      </div>

      {phase === 'idle' && (
        <div className="space-y-5">
          {hasMissions && <p className="text-center text-lg text-white/70">{Object.keys(studentMissions!).length} students answer their personal mission question.</p>}
          {promptCard}
          <div className="flex items-center justify-center gap-3">
            {!hasMissions && content.exampleAnswer && (
              // Teacher-only: the class can see this screen, so the model answer is hold-to-peek.
              <button type="button" onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)} className="flex max-w-md items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/60 hover:text-white">
                {peek ? <><Eye className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{content.exampleAnswer}</span></> : <><EyeOff className="h-3.5 w-3.5" />Hold to peek at a model answer</>}
              </button>
            )}
            <KitButton tone="emerald" solid onClick={handleStart} className="!px-8 !py-3 !text-base" icon={<PenLine className="h-4 w-4" />}>Everyone writes</KitButton>
          </div>
        </div>
      )}

      {phase === 'collecting' && (
        <div className="space-y-5">
          {promptCard}
          <div className="flex items-center gap-4">
            <span className={`font-mono text-3xl ${timeLeft <= 10 ? 'text-rose-300' : ''}`}>{timeLeft}s</span>
            <KitButton onClick={() => setTimeLeft((prev) => prev + 30)}>+30s</KitButton>
            <p className="font-display text-3xl">{submissionCount}<span className="text-lg text-white/50"> written</span></p>
            <span className="flex-1" />
            <KitButton tone="emerald" solid onClick={() => void handleLock()} className="!px-6 !py-2.5 !text-sm" icon={<Check className="h-4 w-4" />}>Done writing</KitButton>
          </div>
        </div>
      )}

      {phase === 'scoring' && (
        <div className="space-y-4 py-16 text-center">
          {scoring && <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />}
          <p className="text-lg text-white/70">Finding the standout answers…</p>
        </div>
      )}

      {phase === 'highlights' && (
        <div className="space-y-5">
          {spotlight.length > 0 ? (
            <div className="space-y-3">
              <KitLabel tone="amber">{spotlight.length === 1 && scores.length === 1 ? 'Spotlight' : 'Standout answers'}</KitLabel>
              {spotlight.map((sc, i) => {
                const sub = submissions[sc.clientId];
                if (!sub) return null;
                const reading = readIdx === i;
                const mission = studentMissions?.[sc.clientId];
                return (
                  <motion.div key={sc.clientId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, scale: reading ? 1.02 : 1 }} transition={{ delay: i * 0.12 }} className={`rounded-2xl border-2 p-5 ${reading ? 'border-amber-300 bg-amber-300/10' : 'border-teal-300/40 bg-teal-400/[0.06]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 font-display text-2xl">{sub.displayName}</p>
                      {sc.suggestedLabel && <span className="flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-sm text-amber-100"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />{sc.suggestedLabel}</span>}
                    </div>
                    {mission && <p className="mt-1 text-sm italic text-teal-200">Mission: &ldquo;{mission}&rdquo;</p>}
                    <p className="mt-2 text-2xl leading-snug">{sub.text}</p>
                    {reading && <p className="mt-3 flex items-center gap-2 text-lg text-amber-100"><Mic className="h-5 w-5" />{sub.displayName}, read yours aloud!</p>}
                  </motion.div>
                );
              })}
              <div className="flex justify-center">
                <KitButton tone="amber" onClick={() => setReadIdx((i) => (i === null ? 0 : i + 1 < spotlight.length ? i + 1 : null))} icon={<Mic className="h-3.5 w-3.5" />}>
                  {readIdx === null ? 'Read them aloud' : readIdx + 1 < spotlight.length ? 'Next reader' : 'Done reading'}
                </KitButton>
              </div>
            </div>
          ) : scores.length > 0 ? (
            <p className="text-center text-white/60">Everyone wrote an answer. Pick a few to read aloud!</p>
          ) : null}

          {rest.length > 0 && (
            <div className="space-y-2">
              <KitLabel>Everyone&apos;s answers</KitLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {rest.map((sc) => (
                  <p key={sc.clientId} className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-lg leading-snug">{submissions[sc.clientId]?.text}</p>
                ))}
              </div>
            </div>
          )}

          {scores.length === 0 && <p className="py-8 text-center text-white/50">No answers this time.</p>}
          <p className="text-center font-mono text-[11px] text-white/35">{scores.length} answer{scores.length !== 1 ? 's' : ''} · standouts picked by {scoreSource === 'ai' ? 'smart scoring' : 'quick scoring'}</p>

          <div className="flex justify-end">
            <KitButton tone="emerald" solid onClick={handleDone}>Done</KitButton>
          </div>
        </div>
      )}
    </div>
  );
}
