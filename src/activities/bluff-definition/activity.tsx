'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Drama, Mic, PenLine, Trophy } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { BluffDefinitionContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

type Phase = 'idle' | 'submitting' | 'voting' | 'reveal' | 'done';

interface Option {
  text: string;
  isReal: boolean;
  /** Everyone who wrote this (identical fakes are merged). */
  authors: Array<{ clientId: string; studentId: string | null; name: string }>;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BluffDefinitionActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as BluffDefinitionContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, { text: string; displayName: string; studentId: string | null }>>({});
  const [options, setOptions] = useState<Option[]>([]);
  const [knewIt, setKnewIt] = useState<Array<{ name: string }>>([]);
  const [votes, setVotes] = useState<Record<string, number>>({}); // clientId → option index
  const [readAloud, setReadAloud] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const scoredSubmittersRef = useRef<Set<string>>(new Set());
  const participantInfoRef = useRef<Record<string, { displayName: string; studentId: string | null }>>({});

  const currentRound = content.rounds?.[roundIdx] ?? content.rounds?.[0];
  const hasNextRound = roundIdx + 1 < (content.rounds?.length ?? 0);
  const enoughStudents = students.length >= 2;

  // ─── Phones ───
  useEffect(() => {
    if (phase === 'submitting' && currentRound) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'bluff-definition',
        prompt: `Write a convincing fake definition for "${currentRound.word}". Make it sound like a real dictionary!`,
        placeholder: 'e.g. (noun) a small tool used for…',
        maxLength: 150,
      });
    } else if (phase === 'voting' && options.length > 0) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'bluff-definition',
        prompt: 'Which one is the REAL definition? (Not your own!)',
        options: options.map((o) => o.text),
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, options]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      participantInfoRef.current[vote.clientId] = { displayName: vote.displayName, studentId: vote.studentId ?? null };
      const text = vote.choice.trim();
      if (!text) return;
      if (phaseRef.current === 'submitting') {
        setSubmissions((prev) => ({ ...prev, [vote.clientId]: { text, displayName: vote.displayName, studentId: vote.studentId ?? null } }));
        if (!scoredSubmittersRef.current.has(vote.clientId)) {
          scoredSubmittersRef.current.add(vote.clientId);
          void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: roundIdx * 3 + 1, points: 1, isCorrect: null });
        }
      } else if (phaseRef.current === 'voting') {
        const i = optionsRef.current.findIndex((o) => o.text === text);
        if (i < 0) return;
        // You can't vote for your own bluff.
        if (optionsRef.current[i].authors.some((a) => a.clientId === vote.clientId)) return;
        setVotes((prev) => ({ ...prev, [vote.clientId]: i }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, roundIdx]);

  // ─── Flow ───
  const handleStartRound = useCallback(() => {
    setSubmissions({});
    setOptions([]);
    setVotes({});
    setKnewIt([]);
    setReadAloud(false);
    scoredSubmittersRef.current = new Set();
    setPhase('submitting');
    onPhaseChange?.('submitting');
  }, [onPhaseChange]);

  const handleGoToVoting = useCallback(() => {
    if (!currentRound) return;
    const real = norm(currentRound.correctDefinition);
    const merged = new Map<string, Option>();
    const knew: Array<{ name: string }> = [];
    Object.entries(submissions).forEach(([clientId, sub]) => {
      const key = norm(sub.text);
      if (!key) return;
      // Wrote the real meaning: they knew it! (+2, and it doesn't become a fake.)
      if (key === real) {
        knew.push({ name: sub.displayName });
        void onScore?.({ studentId: sub.studentId, clientId, displayName: sub.displayName, promptIndex: roundIdx * 3 + 2, points: 2, isCorrect: true });
        return;
      }
      const author = { clientId, studentId: sub.studentId, name: sub.displayName };
      const existing = merged.get(key);
      if (existing) existing.authors.push(author);
      else merged.set(key, { text: sub.text, isReal: false, authors: [author] });
    });
    setKnewIt(knew);
    setOptions(shuffle([...Array.from(merged.values()), { text: currentRound.correctDefinition, isReal: true, authors: [] }]));
    setVotes({});
    setPhase('voting');
    onPhaseChange?.('voting');
  }, [currentRound, submissions, roundIdx, onScore, onPhaseChange]);

  const tally = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);

  const handleReveal = useCallback(async () => {
    for (const [clientId, i] of Object.entries(votes)) {
      if (!options[i]?.isReal) continue;
      const info = participantInfoRef.current[clientId];
      await onScore?.({ studentId: info?.studentId ?? null, clientId, displayName: info?.displayName ?? 'Student', promptIndex: roundIdx * 3 + 2, points: 1, isCorrect: true });
    }
    for (let i = 0; i < options.length; i++) {
      const o = options[i];
      const fooled = tally[i];
      if (o.isReal || !fooled) continue;
      for (const a of o.authors) {
        await onScore?.({ studentId: a.studentId, clientId: a.clientId, displayName: a.name, promptIndex: roundIdx * 3 + 3, points: fooled * 2, isCorrect: null });
      }
    }
    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [votes, options, tally, roundIdx, onScore, onPhaseChange]);

  const handleNextRound = useCallback(() => {
    setRoundIdx((i) => i + 1);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const submittedCount = Object.keys(submissions).length;
  const voteCount = Object.keys(votes).length;
  const wordCard = currentRound && (
    <div className="rounded-[1.75rem] border border-violet-300/35 bg-slate-950/45 px-6 py-6 text-center">
      <KitLabel tone="violet">The word</KitLabel>
      <p className="mt-2 font-display text-6xl text-violet-100">{currentRound.word}</p>
    </div>
  );
  const header = (
    <div className="flex items-center justify-between">
      <KitLabel tone="violet">Bluff Definition</KitLabel>
      {(content.rounds?.length ?? 0) > 1 && <KitReadout>Word {roundIdx + 1} of {content.rounds.length}</KitReadout>}
    </div>
  );

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-white">
        {header}
        <div className="text-center">
          <Drama className="mx-auto h-10 w-10 text-violet-300" />
          <p className="mt-2 font-display text-5xl">Can you bluff?</p>
          <p className="mx-auto mt-2 max-w-xl text-lg text-white/70">A strange word appears. Everyone writes a fake definition that sounds real. Then find the real one among the bluffs. Fool your classmates to score!</p>
        </div>
        {!enoughStudents && <p className="text-center text-sm text-amber-200">Needs at least 2 students ({students.length} joined).</p>}
        <div className="flex justify-center">
          <KitButton tone="violet" solid disabled={!currentRound || !enoughStudents} onClick={handleStartRound} className="!px-8 !py-3 !text-base" icon={<Drama className="h-4 w-4" />}>Reveal the word</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    const canAdvance = submittedCount >= 2;
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-white">
        {header}
        {wordCard}
        <p className="text-center text-lg text-white/70">Write a fake definition on your phone. Tip: start like a dictionary: &ldquo;(noun) a kind of…&rdquo;</p>
        <div className="flex flex-wrap justify-center gap-2">
          {students.map((st) => {
            const done = Object.values(submissions).some((sub) => sub.displayName === st.name);
            return <span key={st.id} className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${done ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100' : 'border-white/10 text-white/40'}`}>{done && <Check className="h-3.5 w-3.5" />}{st.name}</span>;
          })}
        </div>
        <div className="flex items-center justify-between">
          <KitReadout>{submittedCount} / {students.length} written</KitReadout>
          <KitButton tone="violet" solid disabled={!canAdvance} onClick={handleGoToVoting} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{canAdvance ? 'Find the real one' : 'Need 2+ bluffs…'}</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'voting') {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        {header}
        <p className="text-center font-display text-3xl">Which is the real meaning of <span className="text-violet-200">{currentRound?.word}</span>?</p>
        <div className="space-y-2">
          {options.map((o, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-4 rounded-2xl border border-white/12 bg-slate-950/45 px-5 py-3">
              <span className="font-display text-2xl text-violet-300">{OPTION_LABELS[i]}</span>
              <p className="pt-0.5 text-xl leading-snug">{o.text}</p>
            </motion.div>
          ))}
        </div>
        {knewIt.length > 0 && <p className="text-center text-emerald-200">{knewIt.map((k) => k.name).join(', ')} already knew the real meaning (+2)!</p>}
        <div className="flex items-center justify-between">
          <p className="font-display text-3xl">{voteCount}<span className="text-lg text-white/50"> voted</span></p>
          <KitButton tone="violet" solid onClick={() => void handleReveal()} className="!px-6 !py-2.5 !text-sm">Reveal</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'reveal') {
    const fakes = options.map((o, i) => ({ o, n: tally[i] })).filter((x) => !x.o.isReal);
    const best = fakes.filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0] ?? null;
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        {header}
        {wordCard}
        <div className="space-y-2">
          {options.map((o, i) => (
            <motion.div key={i} initial={{ opacity: 0.4 }} animate={{ opacity: 1, scale: o.isReal ? 1.02 : 1 }} transition={{ delay: 0.15 + i * 0.1 }} className={`rounded-2xl border-2 px-5 py-3 ${o.isReal ? 'border-emerald-300/70 bg-emerald-400/10' : best && o === best.o ? 'border-amber-300/50 bg-amber-300/[0.07]' : 'border-white/10 bg-slate-950/40'}`}>
              <div className="flex items-start gap-4">
                <span className={`font-display text-2xl ${o.isReal ? 'text-emerald-300' : 'text-violet-300'}`}>{OPTION_LABELS[i]}</span>
                <div className="flex-1">
                  <p className="text-xl leading-snug">{o.text}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em]">
                    {o.isReal ? <span className="flex items-center gap-1 text-emerald-300"><Check className="h-3.5 w-3.5" />The real definition</span> : <span className="text-white/55">by {o.authors.map((a) => a.name).join(' & ')}</span>}
                    {tally[i] > 0 && <span className="text-white/45">{tally[i]} vote{tally[i] === 1 ? '' : 's'}</span>}
                    {!o.isReal && tally[i] > 0 && <span className="text-amber-200">fooled {tally[i]} · +{tally[i] * 2}</span>}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {best && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
            <p className="flex items-center justify-center gap-2 font-display text-3xl"><Trophy className="h-6 w-6 text-amber-300" />Best bluffer: {best.o.authors.map((a) => a.name).join(' & ')}</p>
            {readAloud
              ? <p className="mt-2 flex items-center justify-center gap-2 text-lg text-amber-100"><Mic className="h-5 w-5" />Read it aloud, then tell us: what made it sound real?</p>
              : <KitButton tone="amber" className="mx-auto mt-2" onClick={() => setReadAloud(true)} icon={<Mic className="h-3.5 w-3.5" />}>Read it aloud</KitButton>}
          </div>
        )}
        <div className="flex justify-end gap-2">
          {hasNextRound && <KitButton tone="violet" solid onClick={handleNextRound} className="!px-6 !py-2.5 !text-sm" icon={<PenLine className="h-4 w-4" />}>Next word</KitButton>}
          <KitButton onClick={() => { setPhase('done'); onPhaseChange?.('finished'); }}>End activity</KitButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 py-10 text-center text-white">
      <Drama className="mx-auto h-10 w-10 text-violet-300" />
      <p className="font-display text-5xl">What a bunch of bluffers!</p>
      <p className="text-white/65">Thanks for playing Bluff Definition.</p>
    </div>
  );
}
