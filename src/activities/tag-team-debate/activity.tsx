'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scale, Shuffle, Pause, Play, SkipForward, Repeat2, Hand } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import type { SpeakingFrameCard } from '../shared/speaking-turns';
import { motionFor, validMotion } from '@/lib/debate-motion';

// Tag-team Debate (Debate v2 main event; replaces the 90s speeches): everyone argues, nobody
// alone. Teams split; 2-minute tap-to-claim prep (no typing); then short alternating turns with a
// visible countdown: openings (one point each), answers (every turn answers the last speaker),
// closing (each team's best reason), and Switch Sides (argue the other side, quickly).

type Side = 'for' | 'against';
type Round = 'openings' | 'answers' | 'closing' | 'switch';
type Phase = 'idle' | 'prep' | 'turns' | 'between' | 'done';
interface Turn { student: Student; side: Side }

const ROUNDS: Round[] = ['openings', 'answers', 'closing', 'switch'];
const SECONDS: Record<Round, number> = { openings: 25, answers: 25, closing: 30, switch: 15 };
const PREP_SECONDS = 120;
const GRACE_MS = 1500;
const ROUND_INFO: Record<Round, { title: string; goal: string; frames: string[] }> = {
  openings: { title: 'Round 1: Openings', goal: 'One point each: say the point you claimed.', frames: ['I think… because…', 'One reason is…', 'For example,…'] },
  answers: { title: 'Round 2: Answers', goal: 'Answer the last speaker first, then add your point.', frames: ['That’s true, but…', 'I see your point, however…', 'I disagree, because…'] },
  closing: { title: 'Round 3: Closing', goal: 'Each team’s best reason, said by someone new.', frames: ['Our best reason is…', 'In the end,…', 'That’s why we believe…'] },
  switch: { title: 'Switch Sides!', goal: 'Now argue the OTHER side. Quick and fun.', frames: ['Now I’ll argue the other side:…', 'Actually, they have a point:…'] },
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Alternate sides, rotating within each team; `count` turns (everyone once by default). */
export function alternateTurns(forTeam: Student[], againstTeam: Student[], count: number, startSide: Side, offset = 0): Turn[] {
  const out: Turn[] = [];
  let f = offset;
  let a = offset;
  let side = startSide;
  for (let i = 0; i < count; i++) {
    const team = side === 'for' ? forTeam : againstTeam;
    if (team.length) {
      out.push({ student: team[(side === 'for' ? f++ : a++) % team.length], side });
    }
    side = side === 'for' ? 'against' : 'for';
  }
  return out;
}

export function TagTeamDebateActivity({ students, generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { topicContext?: string } | null;
  const stored = useSessionStore((s) => s.lessonThread.debateMotion);
  const strongest = useSessionStore((s) => s.lessonThread.debateStrongest);
  const recordFeature = useSessionStore((s) => s.recordFeature);
  const motion = useMemo(() => stored ?? validMotion(raw) ?? motionFor(raw?.topicContext ?? ''), [stored, raw]);

  const [teams, setTeams] = useState<{ for: Student[]; against: Student[] }>({ for: [], against: [] });
  const split = useCallback(() => {
    const s = shuffled(students);
    const mid = Math.ceil(s.length / 2);
    setTeams({ for: s.slice(0, mid), against: s.slice(mid) });
  }, [students]);
  useEffect(() => { if (!teams.for.length && !teams.against.length && students.length) split(); }, [students.length, teams, split]);
  const sideOf = useCallback((id: string): Side | null => (teams.for.some((s) => s.id === id) ? 'for' : teams.against.some((s) => s.id === id) ? 'against' : null), [teams]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIdx, setRoundIdx] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [left, setLeft] = useState(PREP_SECONDS);
  const [paused, setPaused] = useState(false);
  const [claims, setClaims] = useState<Record<string, string>>({}); // studentId → claimed point
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const round = ROUNDS[roundIdx];
  const total = teams.for.length + teams.against.length;

  const turns = useMemo<Turn[]>(() => {
    if (!total) return [];
    if (round === 'closing') return alternateTurns(teams.for, teams.against, 2, 'against', 1);
    if (round === 'switch') {
      // Sides swap: the FOR team argues AGAINST, and vice versa.
      return alternateTurns(teams.against, teams.for, Math.min(total, 6), 'for');
    }
    return alternateTurns(teams.for, teams.against, total, round === 'answers' ? 'against' : 'for');
  }, [round, teams, total]);
  const turn = turns[turnIdx] ?? null;
  const nextTurn = turns[turnIdx + 1] ?? null;
  const seconds = phase === 'prep' ? PREP_SECONDS : SECONDS[round];
  const pointsFor = (side: Side) => (side === 'for' ? motion.forPoints : motion.againstPoints);
  const evidenceFor = (side: Side) => motion.evidence.filter((e) => e.side === side).map((e) => e.fact);

  // Phones. Prep: your side's points + evidence, tap to claim. Turns: your turn / next / listening.
  useEffect(() => {
    if (phase === 'prep') {
      const per: Record<string, unknown> = {};
      students.forEach((s) => {
        const side = sideOf(s.id);
        if (!side) return;
        const card = { side, sideLabel: side === 'for' ? 'FOR' : 'AGAINST', motion: motion.motion, options: [...pointsFor(side), ...evidenceFor(side)] };
        per[s.id] = card;
        per[s.name] = card;
      });
      onSetInputSpec?.({ type: 'confirm', gameKey: 'tag-team-debate', prompt: motion.motion, perStudentData: { __claim: true, ...per }, stableInput: true });
      return;
    }
    if (phase !== 'turns') { onSetInputSpec?.(null); return; }
    const info = ROUND_INFO[round];
    const per: Record<string, unknown> = { __room: true };
    students.forEach((s) => {
      const mine = s.id === turn?.student.id;
      const speakSide = mine ? turn!.side : null;
      const sideWord = (x: Side) => (x === 'for' ? 'FOR' : 'AGAINST');
      const arguing: Side | null = round === 'switch' ? (sideOf(s.id) === 'for' ? 'against' : sideOf(s.id) === 'against' ? 'for' : null) : sideOf(s.id);
      const card: SpeakingFrameCard = {
        role: 'speaking-frame',
        title: mine ? `Your turn! ${sideWord(speakSide!)} · ${SECONDS[round]}s` : s.id === nextTurn?.student.id ? 'You’re next: get ready' : info.title,
        prompt: mine && round === 'openings' && claims[s.id] ? `Your point: ${claims[s.id]}` : motion.motion,
        helpers: [{ label: 'Start with', items: info.frames }, ...(arguing ? [{ label: arguing === 'for' ? 'FOR points' : 'AGAINST points', items: pointsFor(arguing) }] : [])],
        yourTurn: mine,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'tag-team-debate', prompt: info.title, perStudentData: per, stableInput: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pointsFor/evidenceFor read the memoised motion
  }, [phase, round, turn, nextTurn, students, sideOf, motion, claims, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'prep' || !vote.choice) return;
      const id = vote.studentId ?? vote.clientId;
      setClaims((prev) => ({ ...prev, [id]: vote.choice }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p === 'done' ? 'finished' : p === 'turns' ? `round-${roundIdx + 1}` : p); };

  const advance = useCallback(() => {
    if (phaseRef.current === 'prep') { setRoundIdx(0); setTurnIdx(0); setLeft(SECONDS.openings); setPhase('turns'); onPhaseChange?.('round-1'); return; }
    if (turn) {
      recordFeature(turn.student.id);
      void onScore?.({ studentId: turn.student.id, clientId: null, displayName: turn.student.name, promptIndex: roundIdx * 100 + turnIdx + 1, points: 1, isCorrect: null });
    }
    if (turnIdx + 1 < turns.length) { setTurnIdx((i) => i + 1); setLeft(SECONDS[round]); return; }
    if (roundIdx + 1 < ROUNDS.length) { setPhase('between'); return; }
    setPhase('done');
    onPhaseChange?.('finished');
  }, [turn, turnIdx, turns.length, round, roundIdx, recordFeature, onScore, onPhaseChange]);

  const advanceRef = useRef(advance); advanceRef.current = advance;
  useEffect(() => {
    if ((phase !== 'turns' && phase !== 'prep') || paused) return;
    if (left <= 0) {
      if (phase === 'prep') return; // prep ends when the teacher starts the debate
      const id = window.setTimeout(() => advanceRef.current(), GRACE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, paused, left]);

  const startRound = (r: number) => { setRoundIdx(r); setTurnIdx(0); setLeft(SECONDS[ROUNDS[r]]); setPaused(false); setPhase('turns'); onPhaseChange?.(`round-${r + 1}`); };

  const TeamList = ({ side }: { side: Side }) => (
    <div className={`rounded-2xl border p-4 ${side === 'for' ? 'border-sky-400/30 bg-sky-500/[0.06]' : 'border-orange-400/30 bg-orange-500/[0.06]'}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${side === 'for' ? 'text-sky-300' : 'text-orange-300'}`}>{side === 'for' ? 'For' : 'Against'}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{teams[side].map((s) => <span key={s.id} className="rounded-full bg-white/10 px-2.5 py-1 text-sm text-white">{s.name}</span>)}</div>
    </div>
  );

  if (phase === 'idle') {
    return (
      <div className="space-y-5 py-2">
        <div className="text-center">
          <Scale className="mx-auto h-12 w-12 text-amber-300" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">Tag-team debate</p>
          <h3 className="mt-1 text-3xl font-game text-white">{motion.motion}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">Short turns, everyone speaks, the floor passes between teams. Openings, answers, closing, then Switch Sides.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2"><TeamList side="for" /><TeamList side="against" /></div>
        <div className="flex justify-center gap-2">
          <button onClick={split} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80"><Shuffle className="h-4 w-4" />Shuffle teams</button>
          <button onClick={() => { setLeft(PREP_SECONDS); go('prep'); }} className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-8 py-3 font-game text-base text-white shadow-xl">START PREP</button>
        </div>
      </div>
    );
  }

  if (phase === 'prep') {
    const claimed = (side: Side) => Object.keys(claims).filter((id) => sideOf(id) === side || teams[side].some((s) => s.id === id)).map((id) => claims[id]);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80"><Hand className="h-4 w-4" />Prep · tap the point you’ll make</p>
          <span className="font-game text-2xl text-amber-200">{Math.floor(Math.max(0, left) / 60)}:{String(Math.max(0, left) % 60).padStart(2, '0')}</span>
        </div>
        <p className="text-center text-xl font-game text-white">{motion.motion}</p>
        {strongest && <p className="text-center text-sm text-slate-300">Strongest card: “{strongest.fact}”</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {(['for', 'against'] as Side[]).map((side) => (
            <div key={side} className={`rounded-2xl border p-4 ${side === 'for' ? 'border-sky-400/30 bg-sky-500/[0.06]' : 'border-orange-400/30 bg-orange-500/[0.06]'}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.2em] ${side === 'for' ? 'text-sky-300' : 'text-orange-300'}`}>{side === 'for' ? 'For' : 'Against'} · {claimed(side).length} claimed</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">{claimed(side).map((c, i) => <li key={`${c}-${i}`}>· {c}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={advance} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm text-white">START THE DEBATE</button>
        </div>
      </div>
    );
  }

  if (phase === 'between') {
    const nextRound = ROUNDS[roundIdx + 1];
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        {nextRound === 'switch' ? <Repeat2 className="h-12 w-12 text-fuchsia-300" /> : <Scale className="h-12 w-12 text-amber-300" />}
        <h3 className="text-3xl font-game text-white">{ROUND_INFO[nextRound].title}</h3>
        <p className="max-w-md text-sm text-slate-300">{ROUND_INFO[nextRound].goal}</p>
        <div className="flex flex-wrap justify-center gap-2">{ROUND_INFO[nextRound].frames.map((f) => <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-200">{f}</span>)}</div>
        <button onClick={() => startRound(roundIdx + 1)} className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-8 py-3 font-game text-base text-white shadow-xl">GO</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <Scale className="h-12 w-12 text-amber-300" />
        <h3 className="text-2xl font-game text-white">Everyone argued</h3>
        <p className="max-w-md text-sm text-slate-300">Openings, answers, closing, and both sides of the argument.</p>
      </div>
    );
  }

  const info = ROUND_INFO[round];
  const pct = Math.max(0, left) / seconds;
  const sideColor = turn?.side === 'for' ? 'text-sky-300' : 'text-orange-300';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">{info.title} · {seconds}s turns</p>
        <span className="text-sm text-slate-400">turn {Math.min(turnIdx + 1, turns.length)} of {turns.length}</span>
      </div>
      <p className="text-center text-lg text-slate-300">{motion.motion}</p>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
        <p className={`text-sm font-bold uppercase tracking-[0.2em] ${sideColor}`}>{turn ? (turn.side === 'for' ? 'For' : 'Against') : ''}{round === 'switch' ? ' (switched!)' : ''}</p>
        <p className="text-5xl font-game text-white">{turn?.student.name ?? 'Next speaker'}</p>
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 5 ? 'bg-rose-400' : 'bg-amber-300'}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <p className={`font-game text-3xl ${left <= 0 ? 'text-rose-300' : 'text-amber-200'}`}>{left <= 0 ? 'Time!' : left}</p>
        <p className="text-sm text-slate-300">{info.goal}</p>
        <div className="flex flex-wrap justify-center gap-2">{info.frames.map((f) => <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">{f}</span>)}</div>
        {nextTurn && <p className="text-sm text-slate-400">Next: <span className="text-slate-200">{nextTurn.student.name}</span></p>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setPaused((p) => !p)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-game text-sm text-slate-200">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? 'RESUME' : 'PAUSE'}</button>
        <button onClick={advance} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm text-white"><SkipForward className="h-4 w-4" />{turnIdx + 1 >= turns.length ? (roundIdx + 1 >= ROUNDS.length ? 'FINISH' : 'END ROUND') : 'NEXT'}</button>
      </div>
    </div>
  );
}
