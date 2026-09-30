'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Scale, Clock, Users, Megaphone, RotateCcw, Shuffle, ChevronRight, Quote, Ear, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { ActivityProps, TeamDebateContent } from '../types';
import type { Student } from '@/lib/supabase/types';

type Side = 'for' | 'against';
type Phase = 'idle' | 'prep' | 'debate' | 'done';

interface Turn {
  stageId: string;
  stageLabel: string;
  side: Side;
  speaker: Student | null;
}

const PREP_SECONDS = 5 * 60;   // team prep time (teacher can start early)
const TURN_SECONDS = 90;       // per-speaker turn length

// Fixed debate skeleton — 3 rounds, both sides speak each round.
// The lead side alternates so the floor passes back and forth naturally.
const ROUND_PLAN: { stageId: string; label: string; lead: Side }[] = [
  { stageId: 'opening', label: 'Opening Statement', lead: 'for' },
  { stageId: 'rebuttal', label: 'Rebuttal', lead: 'against' },
  { stageId: 'closing', label: 'Closing Argument', lead: 'for' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the full speaking order, rotating speakers within each team so everyone
// gets a turn before anyone repeats.
function buildTurns(forTeam: Student[], againstTeam: Student[]): Turn[] {
  const turns: Turn[] = [];
  let forIdx = 0;
  let againstIdx = 0;
  for (const round of ROUND_PLAN) {
    const order: Side[] = round.lead === 'for' ? ['for', 'against'] : ['against', 'for'];
    for (const side of order) {
      const team = side === 'for' ? forTeam : againstTeam;
      let speaker: Student | null = null;
      if (team.length > 0) {
        if (side === 'for') { speaker = team[forIdx % team.length]; forIdx++; }
        else { speaker = team[againstIdx % team.length]; againstIdx++; }
      }
      turns.push({ stageId: round.stageId, stageLabel: round.label, side, speaker });
    }
  }
  return turns;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Side colour identity — For = blue, Against = orange (mirrors team-battle palette).
const SIDE_STYLE: Record<Side, { text: string; bg: string; ring: string; dot: string }> = {
  for: { text: 'text-sky-300', bg: 'bg-sky-500/15 border-sky-500/30', ring: 'ring-sky-400', dot: 'bg-sky-500' },
  against: { text: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/30', ring: 'ring-orange-400', dot: 'bg-orange-500' },
};

export function TeamDebateActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onScore,
}: ActivityProps) {
  const content = generatedContent as TeamDebateContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [forTeam, setForTeam] = useState<Student[]>([]);
  const [againstTeam, setAgainstTeam] = useState<Student[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [turnLeft, setTurnLeft] = useState(TURN_SECONDS);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number>(0);
  const scoredTurnsRef = useRef<Set<number>>(new Set());
  const promptIndexRef = useRef(1);

  const forLabel = content.forLabel?.trim() || 'For';
  const againstLabel = content.againstLabel?.trim() || 'Against';

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // Clear any leftover student input spec on mount.
  useEffect(() => { onSetInputSpec?.(null); }, [onSetInputSpec]);

  // ── Broadcast the prep board to student devices ───────────────────────────
  // Each student looks up their own roster studentId to learn their side.
  const broadcastPrepSpec = useCallback((f: Student[], a: Student[]) => {
    const sideByStudentId: Record<string, Side> = {};
    f.forEach((s) => { sideByStudentId[s.id] = 'for'; });
    a.forEach((s) => { sideByStudentId[s.id] = 'against'; });
    onSetInputSpec?.({
      type: 'debate-prep',
      gameKey: 'team-debate',
      prompt: content.motion,
      debateSideByStudentId: sideByStudentId,
      debateForLabel: forLabel,
      debateAgainstLabel: againstLabel,
      debateForPrompts: content.forPrompts,
      debateAgainstPrompts: content.againstPrompts,
      keywords: content.usefulPhrases,
    });
  }, [onSetInputSpec, content.motion, content.forPrompts, content.againstPrompts, content.usefulPhrases, forLabel, againstLabel]);

  // ── Team assignment ───────────────────────────────────────────────────────
  const splitTeams = useCallback(() => {
    const shuffled = shuffle(students);
    const mid = Math.ceil(shuffled.length / 2);
    const f = shuffled.slice(0, mid);
    const a = shuffled.slice(mid);
    setForTeam(f);
    setAgainstTeam(a);
    setTurns(buildTurns(f, a));
    broadcastPrepSpec(f, a);
  }, [students, broadcastPrepSpec]);

  const startPrep = useCallback(() => {
    splitTeams();
    setCurrentTurn(0);
    scoredTurnsRef.current = new Set();
    promptIndexRef.current = 1;
    setPrepLeft(PREP_SECONDS);
    setPhase('prep');
    onPhaseChange?.('prep');
    // Prep countdown (informational — teacher controls when the debate starts)
    stopTimer();
    deadlineRef.current = Date.now() + PREP_SECONDS * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setPrepLeft(remaining);
      if (remaining <= 0) stopTimer();
    }, 500);
  }, [splitTeams, onPhaseChange, stopTimer]);

  const reshuffleTeams = useCallback(() => {
    splitTeams();
  }, [splitTeams]);

  // ── Debate turn timer ─────────────────────────────────────────────────────
  const startTurnTimer = useCallback(() => {
    stopTimer();
    setTurnLeft(TURN_SECONDS);
    deadlineRef.current = Date.now() + TURN_SECONDS * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setTurnLeft(remaining);
      if (remaining <= 0) stopTimer();
    }, 500);
  }, [stopTimer]);

  // Score the speaker of a turn once (participation — a genuine contribution).
  const scoreTurn = useCallback((turnIndex: number) => {
    if (scoredTurnsRef.current.has(turnIndex)) return;
    scoredTurnsRef.current.add(turnIndex);
    const speaker = turns[turnIndex]?.speaker;
    if (!speaker) return;
    onScore?.({
      studentId: speaker.id,
      clientId: null,
      displayName: speaker.name,
      promptIndex: promptIndexRef.current++,
      points: 5,
      isCorrect: null,
      outcome: 'genuine',
    });
  }, [turns, onScore]);

  const startDebate = useCallback(() => {
    // Prep boards stay open: teams keep noting rebuttal points while they listen.
    setPhase('debate');
    onPhaseChange?.('debate');
    setCurrentTurn(0);
    startTurnTimer();
  }, [onPhaseChange, startTurnTimer]);

  const nextSpeaker = useCallback(() => {
    scoreTurn(currentTurn);
    if (currentTurn >= turns.length - 1) {
      stopTimer();
      onSetInputSpec?.(null);
      setPhase('done');
      onPhaseChange?.('finished');
      return;
    }
    setCurrentTurn((i) => i + 1);
    startTurnTimer();
  }, [currentTurn, turns.length, scoreTurn, stopTimer, onPhaseChange, onSetInputSpec, startTurnTimer]);

  const addTurnTime = () => { deadlineRef.current += 30_000; setTurnLeft((t) => t + 30); if (!timerRef.current) { timerRef.current = setInterval(() => { const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)); setTurnLeft(remaining); if (remaining <= 0) stopTimer(); }, 500); } };

  const reset = useCallback(() => {
    stopTimer();
    setPhase('idle');
    onPhaseChange?.('idle');
    onSetInputSpec?.(null);
  }, [stopTimer, onPhaseChange, onSetInputSpec]);

  // Per-team turn map for the prep view ("who speaks when").
  const teamPlan = useMemo(() => {
    const map: Record<Side, { label: string; speaker: string }[]> = { for: [], against: [] };
    for (const t of turns) {
      map[t.side].push({ label: t.stageLabel, speaker: t.speaker?.name ?? '—' });
    }
    return map;
  }, [turns]);

  const Motion = ({ small }: { small?: boolean }) => (
    <p className={`text-center font-display leading-snug text-white ${small ? 'text-2xl' : 'text-4xl'}`} style={{ textWrap: 'balance' }}>&ldquo;{content.motion}&rdquo;</p>
  );
  const sideName = (side: Side) => (side === 'for' ? forLabel : againstLabel);

  // ── Render: IDLE ──────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const tooFew = students.length < 2;
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4 text-center text-white">
        <Scale className="mx-auto h-10 w-10 text-indigo-300" />
        <KitLabel tone="violet">Team Debate · the motion</KitLabel>
        <Motion />
        {content.context && <p className="mx-auto max-w-xl text-lg text-white/70">{content.context}</p>}
        <p className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-white/50"><Users className="h-3.5 w-3.5" />{students.length} students · two teams · opening, rebuttal, closing</p>
        {tooFew ? <p className="text-amber-200">At least 2 students must be connected to run a debate.</p> : (
          <div className="flex justify-center">
            <KitButton tone="violet" solid onClick={startPrep} className="!px-8 !py-3 !text-base" icon={<Users className="h-4 w-4" />}>Split teams &amp; start prep</KitButton>
          </div>
        )}
      </div>
    );
  }

  // ── Render: PREP ──────────────────────────────────────────────────────────
  if (phase === 'prep') {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="violet">Prep time</KitLabel>
          <span className={`flex items-center gap-1.5 font-mono text-2xl ${prepLeft <= 30 ? 'text-rose-300' : ''}`}><Clock className="h-5 w-5 opacity-60" />{formatTime(prepLeft)}</span>
        </div>
        <Motion small />
        <p className="text-center text-lg text-white/70">Build your team&apos;s arguments on your phones. Your board stays open during the debate too.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['for', 'against'] as Side[]).map((side) => {
            const team = side === 'for' ? forTeam : againstTeam;
            const st = SIDE_STYLE[side];
            return (
              <div key={side} className={`space-y-2.5 rounded-2xl border p-4 ${st.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-display text-2xl ${st.text}`}>{side === 'for' ? 'For' : 'Against'} · {sideName(side)}</span>
                  <KitReadout>{team.length}</KitReadout>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {team.length === 0 && <span className="text-sm italic text-white/50">No students on this side</span>}
                  {team.map((st2) => <span key={st2.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">{st2.name}</span>)}
                </div>
                <div className="space-y-0.5 border-t border-white/10 pt-2">
                  {teamPlan[side].map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm text-white/70"><span>{t.label}</span><span className="font-medium text-white">{t.speaker}</span></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {content.usefulPhrases && content.usefulPhrases.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
            <KitLabel><Quote className="mr-1 inline h-3 w-3" />Useful phrases</KitLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">{content.usefulPhrases.map((p2, i) => <span key={i} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-base">{p2}</span>)}</div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <KitButton onClick={reshuffleTeams} icon={<Shuffle className="h-3.5 w-3.5" />}>Reshuffle teams</KitButton>
          <KitButton tone="violet" solid onClick={startDebate} className="!px-6 !py-2.5 !text-sm" icon={<Megaphone className="h-4 w-4" />}>Start the debate</KitButton>
        </div>
      </div>
    );
  }

  // ── Render: DEBATE ────────────────────────────────────────────────────────
  if (phase === 'debate') {
    const turn = turns[currentTurn];
    const st = turn ? SIDE_STYLE[turn.side] : SIDE_STYLE.for;
    const isLast = currentTurn >= turns.length - 1;
    const stageIdx = ROUND_PLAN.findIndex((r) => r.stageId === turn?.stageId);
    const next = turns[currentTurn + 1];
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <Motion small />
        {/* Stage track */}
        <div className="flex items-center justify-center gap-2">
          {ROUND_PLAN.map((r, i) => (
            <span key={r.stageId} className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] ${i === stageIdx ? 'border-violet-300 bg-violet-400/15 text-white' : i < stageIdx ? 'border-white/10 text-white/40 line-through' : 'border-white/10 text-white/50'}`}>{r.label}</span>
          ))}
        </div>
        <motion.div key={currentTurn} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[1.75rem] border-2 px-6 py-6 text-center ${st.bg}`}>
          <KitLabel tone={turn?.side === 'for' ? 'cyan' : 'amber'}>{turn?.side === 'for' ? 'For' : 'Against'} · {turn ? sideName(turn.side) : ''} · {turn?.stageLabel}</KitLabel>
          <p className="mt-1 flex items-center justify-center gap-3 font-display text-6xl"><Mic className="h-10 w-10 opacity-80" />{turn?.speaker?.name ?? 'Open floor'}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`flex items-center gap-1.5 font-mono text-3xl ${turnLeft <= 15 ? 'text-rose-300' : ''}`}><Clock className="h-6 w-6 opacity-60" />{formatTime(turnLeft)}</span>
            <KitButton onClick={addTurnTime}>+30s</KitButton>
          </div>
        </motion.div>
        <p className="flex items-center justify-center gap-2 text-white/65"><Ear className="h-4 w-4" />The other team: note points to answer on your phones.</p>
        {next && <p className="text-center text-sm text-white/45">Up next: {next.speaker?.name ?? 'open floor'} ({sideName(next.side)}, {next.stageLabel})</p>}
        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={nextSpeaker} className="!px-7 !py-2.5 !text-sm" icon={<ChevronRight className="h-4 w-4" />}>{isLast ? 'Finish the debate' : 'Next speaker'}</KitButton>
        </div>
      </div>
    );
  }

  // ── Render: DONE ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-5 text-center text-white">
      <Scale className="mx-auto h-10 w-10 text-indigo-300" />
      <p className="font-display text-5xl">Debate complete!</p>
      <Motion small />
      {/* Listening check: name the OTHER side's best point */}
      <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-5">
        <KitLabel tone="amber">Listening check</KitLabel>
        <p className="mt-1 font-display text-2xl">Each team: what was the other side&apos;s strongest point?</p>
        <p className="mt-1 text-white/70">Then head to the reflection to see whose mind actually moved.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {(['for', 'against'] as Side[]).map((side) => {
          const team = side === 'for' ? forTeam : againstTeam;
          const st = SIDE_STYLE[side];
          return (
            <div key={side} className={`rounded-2xl border p-3 ${st.bg}`}>
              <p className={`mb-1.5 font-mono text-xs uppercase tracking-[0.14em] ${st.text}`}>{side === 'for' ? 'For' : 'Against'} · {sideName(side)}</p>
              <div className="flex flex-wrap gap-1.5">{team.map((st2) => <span key={st2.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">{st2.name}</span>)}</div>
            </div>
          );
        })}
      </div>
      <KitButton className="mx-auto" onClick={reset} icon={<RotateCcw className="h-3.5 w-3.5" />}>Run again</KitButton>
    </div>
  );
}
