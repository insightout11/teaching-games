'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Drama, HelpCircle, Lightbulb, BookOpen, Users } from 'lucide-react';
import type { ActivityProps, ImposterContent, ImposterRound } from '../types';
import { useFocusBus } from '@/stores/focus-bus-store';
import { accusedFrom, clueOrder, pickImposters, tallyVotes, type ImposterVote } from './logic';

type Phase = 'idle' | 'briefing' | 'clues' | 'voting' | 'redemption' | 'reveal' | 'done';
/** What the crew shares: a secret word, a secret question, or one of today's topic words. */
export type ImposterSecret = 'word' | 'question' | 'vocab';

export type ImposterAssignment =
  | { role: 'insider'; secret: ImposterSecret; word?: string; definition?: string; question?: string }
  | { role: 'imposter'; secret: ImposterSecret; hint?: string; question?: string; partners?: number };

const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.14em]';
const PRIMARY = 'rounded-xl bg-amber-400 px-6 py-3 font-semibold text-lc-bg hover:bg-amber-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed';
const GHOST = 'rounded-xl border border-lc-border px-4 py-3 text-sm text-lc-text2 hover:border-lc-text3 hover:text-lc-text';

const SECRETS: { key: ImposterSecret; label: string; blurb: string; icon: React.ElementType }[] = [
  { key: 'word', label: 'Secret word', blurb: 'Crew know the word. Give one clue each.', icon: Drama },
  { key: 'question', label: 'Secret question', blurb: 'The imposter gets a different question. Everyone answers out loud.', icon: HelpCircle },
  { key: 'vocab', label: "Today's words", blurb: 'The secret word comes from today’s topic words.', icon: BookOpen },
];

export function ImposterActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ImposterContent;
  const reduce = useReducedMotion();
  const topicWords = useFocusBus((s) => s.vocab);

  const [phase, setPhase] = useState<Phase>('idle');
  const [secret, setSecret] = useState<ImposterSecret>('word');
  const [easyHint, setEasyHint] = useState(false);
  const [twoImposters, setTwoImposters] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [imposters, setImposters] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, ImposterAssignment>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [clueDone, setClueDone] = useState<Set<number>>(new Set());
  const [confirmedClientIds, setConfirmedClientIds] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<ImposterVote[]>([]);
  const [accused, setAccused] = useState<string[]>([]);
  const [guessResult, setGuessResult] = useState<'correct' | 'incorrect' | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const votesRef = useRef(votes);
  votesRef.current = votes;
  const confirmedRef = useRef(confirmedClientIds);
  confirmedRef.current = confirmedClientIds;
  const usedImpostersRef = useRef<string[]>([]);
  const lastOrderRef = useRef<string[] | null>(null);

  const names = useMemo(() => students.map((s) => s.name), [students]);
  const canTwo = students.length >= 6;
  const imposterCount = twoImposters && canTwo ? 2 : 1;
  const enoughStudents = students.length >= 3;

  // Rounds for the chosen secret type.
  const rounds: ImposterRound[] = useMemo(() => {
    if (secret === 'vocab') {
      return topicWords
        .filter((w) => w.word.trim())
        .slice(0, 6)
        .map((w) => ({ word: w.word, description: w.definition }));
    }
    const base = content.rounds ?? [];
    return secret === 'question' ? base.filter((r) => r.crewQuestion && r.imposterQuestion) : base;
  }, [secret, topicWords, content.rounds]);
  const questionReady = (content.rounds ?? []).some((r) => r.crewQuestion && r.imposterQuestion);
  const vocabReady = topicWords.length >= 3;
  const currentRound = rounds[roundIndex] ?? rounds[0];
  const hasNextRound = roundIndex + 1 < rounds.length;

  // ─── What phones see ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'briefing' || phase === 'clues') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'imposter',
        prompt: phase === 'briefing' ? 'Hold to peek at your secret card.' : secret === 'question' ? 'Answer your question out loud when it’s your turn.' : 'Give one clue when it’s your turn.',
        buttonLabel: phase === 'briefing' ? 'Got it' : 'Ready',
        perStudentData: assignments as Record<string, unknown>,
      });
    } else if (phase === 'voting') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'imposter',
        prompt: imposterCount > 1 ? 'Who is an imposter?' : 'Who is the imposter?',
        options: names,
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Phone replies ────────────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'briefing' || phaseRef.current === 'clues') {
        if (confirmedRef.current.has(vote.clientId)) return;
        setConfirmedClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));
      } else if (phaseRef.current === 'voting' && vote.choice) {
        // Latest vote per phone counts (students can change their mind before the reveal).
        const next = votesRef.current.filter((v) => v.clientId !== vote.clientId);
        next.push({ clientId: vote.clientId, choice: vote.choice, studentId: vote.studentId ?? null, displayName: vote.displayName });
        setVotes(next);
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);

  // Scores save in the background: a failed save must never stall the round.
  const score = useCallback((args: Parameters<NonNullable<typeof onScore>>[0]) => {
    try {
      void Promise.resolve(onScore?.(args)).catch(() => {});
    } catch {
      // ignore — the game goes on
    }
  }, [onScore]);

  // ─── Round flow ───────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    if (!currentRound) return;
    const picked = pickImposters(names, usedImpostersRef.current, imposterCount);
    usedImpostersRef.current = [...usedImpostersRef.current, ...picked];
    const next: Record<string, ImposterAssignment> = {};
    for (const n of names) {
      next[n] = picked.includes(n)
        ? {
            role: 'imposter',
            secret,
            ...(secret === 'question' ? { question: currentRound.imposterQuestion } : {}),
            ...(easyHint && secret !== 'question' && currentRound.hint ? { hint: currentRound.hint } : {}),
            ...(picked.length > 1 ? { partners: picked.length } : {}),
          }
        : secret === 'question'
          ? { role: 'insider', secret, question: currentRound.crewQuestion }
          : { role: 'insider', secret, word: currentRound.word, definition: currentRound.description };
    }
    // The order must change every round (see logic.ts).
    const nextOrder = clueOrder(names, picked, lastOrderRef.current);
    lastOrderRef.current = nextOrder;
    setImposters(picked);
    setAssignments(next);
    setOrder(nextOrder);
    setCurrentIdx(0);
    setClueDone(new Set());
    setConfirmedClientIds(new Set());
    setVotes([]);
    setAccused([]);
    setGuessResult(null);
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [currentRound, names, imposterCount, secret, easyHint, onPhaseChange]);

  const startClues = useCallback(() => {
    setCurrentIdx(0);
    setPhase('clues');
    onPhaseChange?.('clues');
  }, [onPhaseChange]);

  const advance = useCallback((scored: boolean) => {
    const name = order[currentIdx];
    const student = students.find((s) => s.name === name);
    if (scored && student && !clueDone.has(currentIdx)) {
      setClueDone((prev) => new Set(Array.from(prev).concat([currentIdx])));
      score({ studentId: student.id ?? null, clientId: student.id ?? null, displayName: student.name, promptIndex: currentIdx + 1, points: 1, isCorrect: null });
    }
    if (currentIdx + 1 >= order.length) {
      setPhase('voting');
      onPhaseChange?.('voting');
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  }, [order, currentIdx, students, clueDone, score, onPhaseChange]);

  const revealVote = useCallback(() => {
    const who = accusedFrom(votes, imposterCount);
    setAccused(who);
    // Crew who voted for an imposter earn 2.
    for (const v of votes) {
      if (!imposters.includes(v.choice)) continue;
      score({ studentId: v.studentId ?? null, clientId: v.clientId, displayName: v.displayName ?? '', promptIndex: students.length + 1, points: 2, isCorrect: true });
    }
    // Imposters who escaped earn 3.
    for (const name of imposters) {
      if (who.includes(name)) continue;
      const s = students.find((x) => x.name === name);
      if (s) score({ studentId: s.id ?? null, clientId: s.id ?? null, displayName: s.name, promptIndex: students.length + 2, points: 3, isCorrect: null });
    }
    setPhase('redemption');
    onPhaseChange?.('redemption');
  }, [votes, imposterCount, imposters, students, score, onPhaseChange]);

  const judgeGuess = useCallback((result: 'correct' | 'incorrect') => {
    setGuessResult(result);
    if (result === 'correct') {
      for (const name of imposters) {
        const s = students.find((x) => x.name === name);
        if (s) score({ studentId: s.id ?? null, clientId: s.id ?? null, displayName: s.name, promptIndex: students.length + 3, points: 3, isCorrect: null });
      }
    }
    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [imposters, students, score, onPhaseChange]);

  const nextRound = useCallback(() => {
    setRoundIndex((i) => i + 1);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const end = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const tally = tallyVotes(votes);
  const caughtAll = imposters.length > 0 && imposters.every((n) => accused.includes(n));
  const caughtSome = imposters.some((n) => accused.includes(n));
  const imposterLabel = imposters.join(' and ');
  const secretText = secret === 'question' ? currentRound?.crewQuestion : currentRound?.word;

  // ─── Setup ────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-lc-text">
        <div className="text-center">
          <p className={`${MONO} text-xs text-rose-300`}>Imposter · round {roundIndex + 1}{rounds.length ? ` of ${rounds.length}` : ''}</p>
          <p className="mt-1 font-display text-4xl">Who&apos;s the imposter?</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SECRETS.map((m) => {
            const disabled = (m.key === 'question' && !questionReady) || (m.key === 'vocab' && !vocabReady);
            const active = secret === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                disabled={disabled || roundIndex > 0}
                onClick={() => { setSecret(m.key); setRoundIndex(0); }}
                className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-40 ${active ? 'border-amber-400 bg-amber-400/10' : 'border-lc-border bg-lc-card hover:border-lc-text3'}`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-amber-300' : 'text-lc-text3'}`} />
                <p className="mt-2 font-display text-xl">{m.label}</p>
                <p className="mt-1 text-sm text-lc-text2">{disabled ? (m.key === 'vocab' ? 'Set a topic first so the class has words.' : 'Not ready for this topic yet.') : m.blurb}</p>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {secret !== 'question' && (
            <button type="button" onClick={() => setEasyHint((v) => !v)} aria-pressed={easyHint} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${easyHint ? 'border-amber-400 text-amber-200' : 'border-lc-border text-lc-text2'}`}>
              <Lightbulb className="h-4 w-4" /> Easy: imposter gets a hint
            </button>
          )}
          <button type="button" disabled={!canTwo} onClick={() => setTwoImposters((v) => !v)} aria-pressed={twoImposters && canTwo} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm disabled:opacity-40 ${twoImposters && canTwo ? 'border-rose-400 text-rose-200' : 'border-lc-border text-lc-text2'}`}>
            <Users className="h-4 w-4" /> Two imposters{canTwo ? '' : ' (6+ players)'}
          </button>
        </div>
        {!enoughStudents && (
          <p className="text-center text-sm text-amber-300">Imposter needs at least 3 players ({students.length} aboard).</p>
        )}
        <div className="flex justify-center">
          <button type="button" onClick={deal} disabled={!enoughStudents || !currentRound} className={`${PRIMARY} px-10 py-4 font-display text-xl`}>
            Deal the secret cards
          </button>
        </div>
      </div>
    );
  }

  // ─── Briefing ─────────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-lc-text">
        <p className={`${MONO} text-xs text-amber-300`}>Secret cards dealt</p>
        <p className="font-display text-4xl">Hold your phone close and peek</p>
        <p className="text-lc-text2">{imposterCount > 1 ? 'Two of you' : 'One of you'} didn&apos;t get the {secret === 'question' ? 'same question' : 'word'}.</p>
        <p className={`${MONO} text-sm text-emerald-300`}>{confirmedClientIds.size} / {students.length} ready</p>
        <button type="button" onClick={startClues} className={PRIMARY}>
          {secret === 'question' ? 'Start answering' : 'Start the clues'}
        </button>
      </div>
    );
  }

  // ─── Clues / answers (order shuffled every round) ─────────────────────────
  if (phase === 'clues') {
    const speaker = order[currentIdx];
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-lc-text">
        <div className="flex items-center justify-between">
          <p className={`${MONO} text-xs text-amber-300`}>{secret === 'question' ? 'Answers' : 'Clue round'} · {currentIdx + 1} of {order.length}</p>
          <p className={`${MONO} text-xs text-lc-text3`}>New order every round</p>
        </div>
        <motion.div
          key={speaker}
          initial={reduce ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-3xl border-2 border-amber-400/50 bg-lc-card p-8 text-center"
        >
          <p className={`${MONO} text-xs text-lc-text3`}>{secret === 'question' ? 'Answer your question' : 'One clue, don’t say it'}</p>
          <p className="mt-2 font-display text-5xl">{speaker}</p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          {order.map((n, i) => (
            <span
              key={n}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                clueDone.has(i) ? 'border-emerald-400/60 text-emerald-300'
                  : i === currentIdx ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                    : 'border-lc-border text-lc-text3'
              }`}
            >
              <span className={`${MONO} mr-1.5 text-[10px] opacity-70`}>{i + 1}</span>{n}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => advance(false)} className={GHOST}>Skip</button>
          <button type="button" onClick={() => advance(true)} className={`${PRIMARY} flex-1`}>
            {currentIdx + 1 >= order.length ? 'Everyone vote' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Voting ───────────────────────────────────────────────────────────────
  if (phase === 'voting') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-lc-text">
        <p className={`${MONO} text-xs text-rose-300`}>Vote on your phones</p>
        <p className="font-display text-4xl">{imposterCount > 1 ? 'Who are the imposters?' : 'Who is the imposter?'}</p>
        <p className={`${MONO} text-sm text-lc-text2`}>{votes.length} / {students.length} voted</p>
        <p className="text-sm text-lc-text3">Votes stay hidden until the reveal.</p>
        <button type="button" onClick={revealVote} className={PRIMARY}>Reveal the vote</button>
      </div>
    );
  }

  // ─── Vote reveal + last chance ────────────────────────────────────────────
  if (phase === 'redemption') {
    const max = Math.max(1, ...Object.values(tally));
    const bars = names.filter((n) => tally[n]).sort((a, b) => (tally[b] ?? 0) - (tally[a] ?? 0)).slice(0, 6);
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-lc-text">
        <div className="flex items-end justify-center gap-4">
          {bars.map((n, i) => {
            const isImp = imposters.includes(n);
            const isAccused = accused.includes(n);
            return (
              <div key={n} className="relative flex flex-col items-center">
                {isAccused && (
                  <motion.span
                    initial={reduce ? false : { scale: 2, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 300, damping: 14 }}
                    className={`${MONO} absolute -top-8 z-10 rounded-md border-2 bg-lc-bg px-2 py-0.5 text-xs ${isImp ? 'border-red-400 text-red-300' : 'border-lc-text3 text-lc-text2'}`}
                  >
                    {isImp ? 'Caught' : 'Crew!'}
                  </motion.span>
                )}
                <motion.div
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: 24 + ((tally[n] ?? 0) / max) * 120 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 160, damping: 20 }}
                  className={`w-16 rounded-t-lg ${isAccused ? 'bg-rose-400' : 'bg-lc-border'}`}
                />
                <p className="mt-2 text-sm">{n}</p>
                <p className={`${MONO} text-xs text-lc-text3`}>{tally[n]} vote{tally[n] === 1 ? '' : 's'}</p>
              </div>
            );
          })}
          {bars.length === 0 && <p className="text-lc-text2">No votes came in.</p>}
        </div>
        <div className="text-center">
          <p className="font-display text-4xl">{caughtAll ? 'Imposter caught!' : caughtSome ? 'One imposter caught!' : 'The imposter escaped!'}</p>
          <p className="mt-1 text-lc-text2">It was <span className="text-rose-300">{imposterLabel}</span>.</p>
        </div>
        <div className="rounded-2xl border border-amber-400/40 bg-lc-card p-5 text-center">
          <p className={`${MONO} text-xs text-amber-300`}>{caughtAll ? 'Last chance to steal the win' : 'Bonus'}</p>
          <p className="mt-1 font-display text-2xl">{imposterLabel}, {secret === 'question' ? 'what was the crew’s question?' : 'what was the secret word?'}</p>
          <p className="text-sm text-lc-text3">They say it out loud, you judge.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => judgeGuess('incorrect')} className={GHOST}>Wrong</button>
            <button type="button" onClick={() => judgeGuess('correct')} className={PRIMARY}>Got it right</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Final reveal ─────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const imposterWins = !caughtAll || guessResult === 'correct';
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-lc-text">
        <p className={`font-display text-5xl ${imposterWins ? 'text-rose-300' : 'text-emerald-300'}`}>
          {guessResult === 'correct' ? 'The imposter stole the win!' : imposterWins ? 'The imposter wins!' : 'The crew wins!'}
        </p>
        <div className="mx-auto max-w-xl rounded-2xl p-6" style={{ background: '#f4efe3', color: '#1b2233' }}>
          <p className={`${MONO} text-xs`} style={{ color: '#7a6f5a' }}>{secret === 'question' ? 'The crew’s question was' : 'The secret word was'}</p>
          <p className="mt-1 font-display text-4xl">{secretText}</p>
          {secret === 'question' ? (
            <p className="mt-2 text-sm" style={{ color: '#5b5446' }}>The imposter&apos;s question: &ldquo;{currentRound?.imposterQuestion}&rdquo;</p>
          ) : currentRound?.description ? (
            <p className="mt-2 text-sm" style={{ color: '#5b5446' }}>{currentRound.description}</p>
          ) : null}
        </div>
        <div className="flex justify-center gap-3">
          {hasNextRound && <button type="button" onClick={nextRound} className={PRIMARY}>Next round</button>}
          <button type="button" onClick={end} className={GHOST}>End Imposter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 text-center text-lc-text">
      <p className="font-display text-4xl">Thanks for playing Imposter</p>
    </div>
  );
}
