'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Gavel, MessageCircleQuestion, Search, Sparkles, X } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type FactDetectiveContent, type FactDetectiveClaim } from './types';
import { VocabPill } from '@/components/ui/vocab-pill';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// Two ways to play: one claim at a time (true/false), or "Spot the fib" —
// three claims on screen, one of them fake (the former Spot the Fib activity).
type Mode = 'truefalse' | 'fib';
type Round = { claims: FactDetectiveClaim[]; fibIndex: number | null };
type Ballot = { clientId: string; studentId: string | null; name: string; pick: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fib rounds: one false claim + two true ones, shuffled; as many as the content allows. */
function buildFibRounds(claims: FactDetectiveClaim[]): Round[] {
  const falses = claims.filter((c) => !c.isTrue);
  const trues = shuffle(claims.filter((c) => c.isTrue));
  const rounds: Round[] = [];
  for (const f of falses) {
    if (trues.length < 2) break;
    const set = shuffle([f, trues.pop()!, trues.pop()!]);
    rounds.push({ claims: set, fibIndex: set.indexOf(f) });
  }
  return rounds;
}

export function FactDetectiveActivity({
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  isMicroEvent,
}: ActivityProps) {
  const content = generatedContent as FactDetectiveContent;
  const claims = useMemo(() => content.claims ?? [], [content.claims]);
  const fibRoundsAvailable = useMemo(() => buildFibRounds(claims).length, [claims]);

  const [mode, setMode] = useState<Mode>('truefalse');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [idx, setIdx] = useState(0);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [voices, setVoices] = useState<Array<{ name: string; pick: number }> | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const scoredRef = useRef<Set<string>>(new Set());

  const round = rounds[idx];
  const fib = mode === 'fib';
  // True/false: pick 0 = TRUE, 1 = FALSE.
  const isRight = useCallback((r: Round, pick: number) => (fib ? pick === r.fibIndex : (pick === 0) === r.claims[0].isTrue), [fib]);

  // ─── Phones ───
  useEffect(() => {
    if (status === ActivityStatus.VOTING && round) {
      if (fib) {
        onSetInputSpec?.({ type: 'choice', gameKey: 'fact-detective', prompt: 'Which one is the FIB (the fake)?', options: round.claims.map((c) => c.statement) });
      } else {
        onSetInputSpec?.({ type: 'binary', gameKey: 'fact-detective', prompt: `True or false? "${round.claims[0].statement}"`, optionLabels: ['TRUE', 'FALSE'] });
      }
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, round, fib, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (status !== ActivityStatus.VOTING || !round) return;
      const pick = fib ? round.claims.findIndex((c) => c.statement === vote.choice) : vote.choice === 'TRUE' ? 0 : 1;
      if (pick < 0) return;
      setBallots((prev) => [...prev.filter((b) => b.clientId !== vote.clientId), { clientId: vote.clientId, studentId: vote.studentId ?? null, name: vote.displayName, pick }]);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, round, fib, onRegisterRemoteVoteHandler]);

  // ─── Flow ───
  const start = useCallback(() => {
    scoredRef.current = new Set();
    const rs = fib ? buildFibRounds(claims) : claims.map((c) => ({ claims: [c], fibIndex: null }));
    setRounds(isMicroEvent ? rs.slice(0, 1) : rs);
    setIdx(0);
    setBallots([]);
    setVoices(null);
    setScore({ correct: 0, total: 0 });
    setStatus(ActivityStatus.CLAIM);
    onPhaseChange?.('claim');
  }, [fib, claims, isMicroEvent, onPhaseChange]);

  const startVoting = () => { setBallots([]); setVoices(null); setStatus(ActivityStatus.VOTING); onPhaseChange?.('voting'); };

  // "Hear both sides": two students who voted differently make their case before the reveal.
  const hearBothSides = () => {
    const picks = Array.from(new Set(ballots.map((b) => b.pick)));
    if (picks.length === 0) return;
    const pickOne = (p: number) => { const pool = ballots.filter((b) => b.pick === p); return pool[Math.floor(Math.random() * pool.length)]; };
    const chosen = shuffle(picks).slice(0, 2).map(pickOne).filter(Boolean);
    setVoices(chosen.map((b) => ({ name: b.name, pick: b.pick })));
  };

  const reveal = () => {
    if (!round) return;
    const right = ballots.filter((b) => isRight(round, b.pick));
    setScore((s) => ({ correct: s.correct + right.length, total: s.total + ballots.length }));
    ballots.forEach((b) => {
      const key = `${idx}:${b.clientId}`;
      if (scoredRef.current.has(key)) return;
      scoredRef.current.add(key);
      const ok = isRight(round, b.pick);
      void onScore?.({ studentId: b.studentId, clientId: b.clientId, displayName: b.name, promptIndex: idx + 1, points: ok ? 3 : 1, isCorrect: ok });
    });
    setStatus(ActivityStatus.REVEAL);
    onPhaseChange?.('reveal');
  };

  const next = () => {
    if (idx < rounds.length - 1) {
      setIdx((i) => i + 1);
      setBallots([]);
      setVoices(null);
      setStatus(ActivityStatus.CLAIM);
      onPhaseChange?.('claim');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  };

  if (claims.length === 0) {
    return <p className="py-12 text-center text-rose-300">No claims available. Please regenerate content.</p>;
  }

  const pickLabel = (p: number) => (fib ? `#${p + 1}` : p === 0 ? 'TRUE' : 'FALSE');
  const header = (
    <div className="flex items-center justify-between">
      <KitLabel tone="cyan">Fact Detective{customTopic && customTopic !== 'General' ? ` · ${customTopic}` : ''}{fib ? ' · spot the fib' : ''}</KitLabel>
      {rounds.length > 1 && status !== ActivityStatus.IDLE && status !== ActivityStatus.FINISHED && <KitReadout>Case {idx + 1} of {rounds.length}</KitReadout>}
    </div>
  );

  // ─── IDLE ───
  if (status === ActivityStatus.IDLE) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-white">
        <div className="text-center">
          <Search className="mx-auto h-9 w-9 text-cyan-300" />
          <p className="mt-2 font-display text-5xl">Fact or fiction?</p>
          <p className="mt-2 text-lg text-white/70">Claims about {customTopic && customTopic !== 'General' ? customTopic : 'the topic'}: some true, some myths. Vote, argue your case, then the truth.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { key: 'truefalse', title: 'True or false', blurb: `One claim at a time. ${claims.length} cases.` },
            { key: 'fib', title: 'Spot the fib', blurb: fibRoundsAvailable ? `Three claims, one is fake. ${fibRoundsAvailable} round${fibRoundsAvailable === 1 ? '' : 's'}.` : 'Needs more true and false claims in this set.' },
          ] as const).map((m) => {
            const on = mode === m.key;
            const disabled = m.key === 'fib' && fibRoundsAvailable === 0;
            return (
              <button key={m.key} type="button" disabled={disabled} onClick={() => setMode(m.key)} className={`rounded-2xl border p-4 text-left disabled:opacity-40 ${on ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                <p className="font-display text-2xl">{m.title}</p>
                <p className="mt-1 text-sm text-white/65">{m.blurb}</p>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <KitButton tone="cyan" solid onClick={start} className="!px-8 !py-3 !text-base" icon={<Search className="h-4 w-4" />}>Open the first case</KitButton>
        </div>
      </div>
    );
  }

  // ─── CLAIM + VOTING ───
  if ((status === ActivityStatus.CLAIM || status === ActivityStatus.VOTING) && round) {
    const voting = status === ActivityStatus.VOTING;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        {header}
        {fib ? (
          <div className="space-y-2.5">
            <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-white/55">Two are true. One is a fib.</p>
            {round.claims.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="flex items-start gap-4 rounded-2xl border border-white/12 bg-slate-950/45 px-5 py-4">
                <span className="font-display text-3xl text-cyan-300">{i + 1}</span>
                <p className="pt-1 text-2xl leading-snug">{c.statement}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/55">True or false?</p>
            <p className="mt-3 font-display text-4xl leading-snug" style={{ textWrap: 'balance' }}>&ldquo;{round.claims[0].statement}&rdquo;</p>
          </motion.div>
        )}

        {voices && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 sm:grid-cols-2">
            {voices.map((v) => (
              <div key={v.name} className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
                <p className="font-display text-3xl">{v.name}</p>
                <p className="mt-1 text-lg text-amber-100">{fib ? `thinks #${v.pick + 1} is the fib.` : `says ${pickLabel(v.pick)}.`} Why?</p>
              </div>
            ))}
            {voices.length === 1 && <p className="self-center text-center text-white/60">Everyone agrees so far. Can anyone argue the other side?</p>}
          </motion.div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {voting ? (
            <>
              <div className="flex items-center gap-3">
                <p className="font-display text-3xl">{ballots.length}<span className="text-lg text-white/50"> voted</span></p>
                <KitButton tone="amber" disabled={ballots.length === 0} onClick={hearBothSides} icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>{voices ? 'Hear two others' : 'Hear both sides'}</KitButton>
              </div>
              <KitButton tone="cyan" solid disabled={ballots.length === 0} onClick={reveal} className="!px-6 !py-2.5 !text-sm" icon={<Gavel className="h-4 w-4" />}>Reveal the truth</KitButton>
            </>
          ) : (
            <>
              <p className="text-white/60">Read it together. What do you think, and why?</p>
              <KitButton tone="cyan" solid onClick={startVoting} className="!px-6 !py-2.5 !text-sm">Vote on your phones</KitButton>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── REVEAL ───
  if (status === ActivityStatus.REVEAL && round) {
    const right = ballots.filter((b) => isRight(round, b.pick)).length;
    const vocab = round.claims.flatMap((c) => c.vocabulary ?? []);
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        {header}
        {fib ? (
          <div className="space-y-2.5">
            {round.claims.map((c, i) => {
              const isFib = i === round.fibIndex;
              const n = ballots.filter((b) => b.pick === i).length;
              return (
                <motion.div key={c.id} initial={{ opacity: 0.4 }} animate={{ opacity: 1, scale: isFib ? 1.02 : 1 }} transition={{ delay: 0.2 + i * 0.2 }} className={`rounded-2xl border-2 px-5 py-4 ${isFib ? 'border-rose-300/70 bg-rose-400/10' : 'border-emerald-300/40 bg-emerald-400/[0.06]'}`}>
                  <div className="flex items-start gap-3">
                    {isFib ? <X className="mt-1 h-6 w-6 shrink-0 text-rose-300" /> : <Check className="mt-1 h-6 w-6 shrink-0 text-emerald-300" />}
                    <div className="flex-1">
                      <p className={`text-2xl leading-snug ${isFib ? 'line-through decoration-rose-300/70' : ''}`}>{c.statement}</p>
                      <p className={`mt-1 font-mono text-xs uppercase tracking-[0.14em] ${isFib ? 'text-rose-300' : 'text-emerald-300'}`}>{isFib ? 'The fib' : 'True'} · {n} vote{n === 1 ? '' : 's'}</p>
                      <p className={`mt-1 ${isFib ? 'text-lg text-white/85' : 'text-sm text-white/60'}`}>{c.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className={`rounded-[1.75rem] border-2 px-6 py-6 text-center ${round.claims[0].isTrue ? 'border-emerald-300/60 bg-emerald-400/10' : 'border-rose-300/60 bg-rose-400/10'}`}>
              <p className={`font-display text-6xl ${round.claims[0].isTrue ? 'text-emerald-300' : 'text-rose-300'}`}>{round.claims[0].isTrue ? 'True!' : 'False!'}</p>
              <p className="mt-2 text-xl text-white/85">&ldquo;{round.claims[0].statement}&rdquo;</p>
            </motion.div>
            <p className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-4 text-xl leading-relaxed">{round.claims[0].explanation}</p>
            {(() => {
              const t = ballots.filter((b) => b.pick === 0).length;
              const f = ballots.length - t;
              const pct = ballots.length ? (t / ballots.length) * 100 : 50;
              return (
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs uppercase tracking-[0.14em]"><span className="text-emerald-300">True · {t}</span><span className="text-rose-300">{f} · False</span></div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-emerald-400" initial={{ width: '50%' }} animate={{ width: `${pct}%` }} /><div className="h-full flex-1 bg-rose-400" /></div>
                </div>
              );
            })()}
          </>
        )}
        <p className="text-center text-lg">{ballots.length ? <><span className="font-display text-3xl text-emerald-300">{right}</span> of {ballots.length} detectives cracked it</> : 'No votes this time'}</p>
        {vocab.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <KitLabel tone="amber">Key words</KitLabel>
            {vocab.map((w, i) => <VocabPill key={i} word={w} className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-base text-amber-100" />)}
          </div>
        )}
        <div className="flex justify-center">
          <KitButton tone="cyan" solid onClick={next} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx < rounds.length - 1 ? 'Next case' : 'Finish'}</KitButton>
        </div>
      </div>
    );
  }

  // ─── FINISHED ───
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-10 text-center text-white">
      <Sparkles className="mx-auto h-10 w-10 text-cyan-300" />
      <p className="font-display text-5xl">Case closed!</p>
      <p className="text-xl text-white/75"><span className="font-display text-4xl text-white">{score.correct}</span> / {score.total} correct votes across {rounds.length} case{rounds.length === 1 ? '' : 's'}</p>
      <KitButton className="mx-auto" onClick={() => { setStatus(ActivityStatus.IDLE); onPhaseChange?.('idle'); }}>Investigate again</KitButton>
    </div>
  );
}
