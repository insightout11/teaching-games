'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, Flame, Gavel, Mic, Shield, Swords, Trophy } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import type { Student } from '@/lib/supabase/types';
import { getEffectiveTopic, useSessionStore } from '@/stores/session-store';
import { GenerationLoader } from '@/components/ui/generation-loader';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { DEFEND_REACTIONS, type DefendCard, type DefendReaction, type DefendRoomState } from '@/components/student/defend-it-panel';
import { type DefendItPhase, type DebateSide } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBATE_SECONDS = 90;
const POINTS_ASSIGNED = 2;
const POINTS_SPOTLIGHTED = 3;
const POINTS_PER_REACTION = 1;
const POINTS_VERDICT_WIN = 3;
const POINTS_VOTE = 1;

type Counts = Record<DefendReaction, number>;
const emptyCounts = (): Counts => ({ convincing: 0, strong: 0, funny: 0, applause: 0 });
const sum = (c: Counts) => c.convincing + c.strong + c.funny + c.applause;

const SIDE = {
  DEFEND: { label: 'Defend', text: 'text-emerald-300', border: 'border-emerald-300/45', bg: 'bg-emerald-400/10', bar: 'bg-emerald-400', icon: Shield },
  ATTACK: { label: 'Attack', text: 'text-rose-300', border: 'border-rose-300/45', bg: 'bg-rose-400/10', bar: 'bg-rose-400', icon: Swords },
} as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export function DefendItGame({
  students,
  onScore,
  config,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  isMicroEvent,
}: GameProps) {
  const roundCount = Number(config.roundCount ?? 3);
  const classMission = useSessionStore((s) => s.classMission);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const topic = classMission || getEffectiveTopic(sessionSettings);

  // ─── State ───
  const [phase, setPhase] = useState<DefendItPhase | 'verdict'>('idle');
  const [statements, setStatements] = useState<string[]>([]);
  // Statements used in earlier rounds this session — sent as an avoid-list so
  // regenerating on the same topic doesn't return the same statements again.
  const usedStatementsRef = useRef<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [sides, setSides] = useState<Record<string, DebateSide>>({});
  const [spotlight, setSpotlight] = useState<Student | null>(null);
  const [spotlightNo, setSpotlightNo] = useState(0);
  const [spoken, setSpoken] = useState<string[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, Counts>>({});
  const [verdictVotes, setVerdictVotes] = useState<Record<string, DebateSide>>({});
  const [timeLeft, setTimeLeft] = useState(DEBATE_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const verdictScored = useRef(false);

  // ─── Refs (stale-closure protection) ───
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const spotlightRef = useRef(spotlight);
  spotlightRef.current = spotlight;
  const reactedThisSpotlight = useRef<Set<string>>(new Set());
  const spotlightedThisRound = useRef<Set<string>>(new Set());

  const currentStatement = statements[currentRound - 1] ?? '';
  const team = useMemo(() => ({
    DEFEND: students.filter((s) => sides[s.id] === 'DEFEND'),
    ATTACK: students.filter((s) => sides[s.id] === 'ATTACK'),
  }), [students, sides]);
  const sideTotals = useMemo(() => ({
    DEFEND: team.DEFEND.reduce((n, s) => n + sum(reactionCounts[s.id] ?? emptyCounts()), 0),
    ATTACK: team.ATTACK.reduce((n, s) => n + sum(reactionCounts[s.id] ?? emptyCounts()), 0),
  }), [team, reactionCounts]);

  // ─── Phones ───
  const publish = useCallback((room: DefendRoomState, speaker: Student | null) => {
    const data: Record<string, unknown> = { __room: room };
    students.forEach((s) => {
      const side = sides[s.id];
      if (!side) return;
      const c: DefendCard = { side, ...(speaker && speaker.id === s.id ? { speaking: true } : {}) };
      data[s.id] = c;
      data[s.name] = c;
    });
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'defend-it',
      prompt: currentStatement,
      // Reactions and votes: many per student, so no roundId.
      allowMultiple: true,
      perStudentData: data,
    });
  }, [students, sides, currentStatement, onSetInputSpec]);

  useEffect(() => {
    if (phase === 'side_assignment') publish({ phase: 'sides' }, null);
    else if (phase === 'debating') publish({ phase: 'debate', speaker: spotlight?.name ?? null, speakerSide: spotlight ? sides[spotlight.id] : null, spotlight: spotlightNo }, spotlight);
    else if (phase === 'verdict') publish({ phase: 'verdict' }, null);
    else onSetInputSpec?.(null);
    // Republish only when the moment changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, spotlightNo, sides]);

  // ─── Debate Timer ───
  useEffect(() => {
    if (phase !== 'debating') return;
    if (timeLeft <= 0) { setPhase('verdict'); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // ─── Phone replies: reactions + verdict votes ───
  const handleRemoteVote = useCallback((vote: GameRemoteVote) => {
    const choice = vote.choice ?? '';
    const reactorKey = vote.clientId;
    if (choice.startsWith('verdict:') && phaseRef.current === 'verdict') {
      const side = choice.slice(8) as DebateSide;
      if (side !== 'DEFEND' && side !== 'ATTACK') return;
      setVerdictVotes((prev) => (prev[reactorKey] ? prev : { ...prev, [reactorKey]: side }));
      return;
    }
    if (!choice.startsWith('react:') || phaseRef.current !== 'debating') return;
    const speaker = spotlightRef.current;
    if (!speaker) return;
    if (vote.studentId === speaker.id || vote.clientId === speaker.id || vote.displayName === speaker.name) return;
    if (reactedThisSpotlight.current.has(reactorKey)) return;
    const key = choice.slice(6) as DefendReaction;
    if (!DEFEND_REACTIONS.some((r) => r.key === key)) return;
    reactedThisSpotlight.current.add(reactorKey);
    setReactionCounts((prev) => {
      const c = { ...(prev[speaker.id] ?? emptyCounts()) };
      c[key] += 1;
      return { ...prev, [speaker.id]: c };
    });
    onScore(speaker.id, { isCorrect: true, points: POINTS_PER_REACTION, responseData: { type: 'reaction', reaction: key, from: reactorKey } });
  }, [onScore]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleRemoteVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleRemoteVote]);

  // ─── Teacher Actions ───
  const handleGenerate = async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/defend-it/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty: sessionSettings.difficulty, count: roundCount, avoid: usedStatementsRef.current, ...(sourceMaterial ? { sourceMaterial } : {}) }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data: { statements: string[] } = await res.json();
      usedStatementsRef.current = [...usedStatementsRef.current, ...data.statements].slice(-24);
      setStatements(data.statements);
      setCurrentRound(1);
      setPhase('statement_reveal');
    } catch {
      setError('Could not generate statements. Please try again.');
      setPhase('idle');
    }
  };

  const handleAssignSides = () => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const newSides: Record<string, DebateSide> = {};
    shuffled.forEach((s, i) => { newSides[s.id] = i < half ? 'DEFEND' : 'ATTACK'; });
    setSides(newSides);
    setReactionCounts({});
    setVerdictVotes({});
    setSpoken([]);
    verdictScored.current = false;
    shuffled.forEach((s) => onScore(s.id, { isCorrect: true, points: POINTS_ASSIGNED, responseData: { type: 'side_assigned', side: newSides[s.id] } }));
    setPhase('side_assignment');
  };

  const handleStartDebate = () => {
    setSpotlight(null);
    setSpotlightNo((n) => n + 1);
    reactedThisSpotlight.current = new Set();
    spotlightedThisRound.current = new Set();
    setTimeLeft(DEBATE_SECONDS);
    setPhase('debating');
  };

  const handleSpotlight = (s: Student) => {
    setSpotlight(s);
    setSpotlightNo((n) => n + 1);
    setSpoken((prev) => (prev.includes(s.id) ? prev : [...prev, s.id]));
    reactedThisSpotlight.current = new Set();
    if (!spotlightedThisRound.current.has(s.id)) {
      spotlightedThisRound.current.add(s.id);
      onScore(s.id, { isCorrect: true, points: POINTS_SPOTLIGHTED, responseData: { type: 'spotlighted' } });
    }
  };

  // Fair turns: alternate sides, people who haven't spoken first.
  const nextSpeaker = useMemo(() => {
    const lastSide = spotlight ? sides[spotlight.id] : null;
    const order: DebateSide[] = lastSide === 'DEFEND' ? ['ATTACK', 'DEFEND'] : ['DEFEND', 'ATTACK'];
    for (const side of order) {
      const fresh = team[side].filter((s) => !spoken.includes(s.id));
      if (fresh.length) return fresh[0];
    }
    const other = team[order[0]].filter((s) => s.id !== spotlight?.id);
    return other[0] ?? null;
  }, [spotlight, sides, team, spoken]);

  const tally = useMemo(() => {
    const v = Object.values(verdictVotes);
    return { DEFEND: v.filter((x) => x === 'DEFEND').length, ATTACK: v.filter((x) => x === 'ATTACK').length };
  }, [verdictVotes]);

  const showRoundResults = () => {
    if (!verdictScored.current) {
      verdictScored.current = true;
      const winner: DebateSide | null = tally.DEFEND > tally.ATTACK ? 'DEFEND' : tally.ATTACK > tally.DEFEND ? 'ATTACK' : null;
      if (winner) team[winner].forEach((s) => onScore(s.id, { isCorrect: true, points: POINTS_VERDICT_WIN, responseData: { type: 'verdict_win', side: winner } }));
      Object.keys(verdictVotes).forEach((clientId) => {
        const s = students.find((x) => x.id === clientId);
        onScore(s?.id ?? clientId, { isCorrect: true, points: POINTS_VOTE, responseData: { type: 'verdict_vote', clientId } });
      });
    }
    setPhase('round_results');
  };

  const handleNextRound = () => {
    if (currentRound >= roundCount) {
      setPhase('game_over');
    } else {
      setCurrentRound((r) => r + 1);
      setSides({});
      setSpotlight(null);
      setPhase('statement_reveal');
    }
  };

  const handleRestart = () => {
    setPhase('idle');
    setStatements([]);
    setCurrentRound(1);
    setSides({});
    setSpotlight(null);
    setReactionCounts({});
    setVerdictVotes({});
  };

  // ─── Pieces ───
  const Statement = ({ small }: { small?: boolean }) => (
    <p className={`text-center font-display leading-tight text-white ${small ? 'text-2xl' : 'text-4xl'}`} style={{ textWrap: 'balance' }}>&ldquo;{currentStatement}&rdquo;</p>
  );
  const RoundLabel = () => <KitLabel tone="amber">Defend the Indefensible · round {currentRound} of {roundCount}</KitLabel>;

  const TugOfWar = ({ a, b, labelA, labelB }: { a: number; b: number; labelA: string; labelB: string }) => {
    const pct = a + b ? (a / (a + b)) * 100 : 50;
    return (
      <div className="space-y-1">
        <div className="flex justify-between font-mono text-xs uppercase tracking-[0.14em]"><span className="text-emerald-300">{labelA} · {a}</span><span className="text-rose-300">{b} · {labelB}</span></div>
        <div className="relative flex h-3.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-emerald-400" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
          <div className="h-full flex-1 bg-rose-400" />
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/80" aria-hidden />
        </div>
      </div>
    );
  };

  // ─── Render ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Flame className="mx-auto h-9 w-9 text-amber-300" />
        <p className="font-display text-5xl">Defend the Indefensible.</p>
        <p className="mx-auto max-w-xl text-lg text-white/70">A wild statement appears. Phones secretly assign each student a side: <span className="text-emerald-300">Defend</span> it or <span className="text-rose-300">Attack</span> it. Speakers take turns, the class reacts live, then votes on who argued better.</p>
        <KitReadout>{topic} · {roundCount} rounds</KitReadout>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <div className="flex justify-center">
          <KitButton tone="amber" solid disabled={students.length < 2} onClick={handleGenerate} className="!px-8 !py-3 !text-base" icon={<Flame className="h-4 w-4" />}>Reveal the first statement</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'loading') return <GenerationLoader label="statements" />;

  if (phase === 'statement_reveal') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6 text-white">
        <div className="text-center"><RoundLabel /></div>
        <Statement />
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={handleAssignSides} className="!px-8 !py-3 !text-base" icon={<Swords className="h-4 w-4" />}>Deal sides to phones</KitButton>
        </div>
      </motion.div>
    );
  }

  if (phase === 'side_assignment') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="text-center"><RoundLabel /></div>
        <Statement small />
        <p className="text-center text-lg text-white/70">Check your phone for your side and some sentence starters. Take a moment to plan one argument.</p>
        <div className="grid grid-cols-2 gap-4">
          {(['DEFEND', 'ATTACK'] as const).map((side) => {
            const st = SIDE[side];
            const Icon = st.icon;
            return (
              <div key={side} className={`rounded-2xl border p-4 ${st.border} ${st.bg}`}>
                <p className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] ${st.text}`}><Icon className="h-4 w-4" />{st.label} · {team[side].length}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{team[side].map((s) => <span key={s.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">{s.name}</span>)}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={handleStartDebate} className="!px-7 !py-2.5 !text-sm" icon={<Mic className="h-4 w-4" />}>Start the debate</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'debating') {
    const side = spotlight ? sides[spotlight.id] : null;
    const counts = spotlight ? (reactionCounts[spotlight.id] ?? emptyCounts()) : null;
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between">
          <RoundLabel />
          <span className={`flex items-center gap-2 font-mono text-2xl ${timeLeft <= 15 ? 'text-rose-300' : ''}`}><Clock className="h-5 w-5 opacity-60" />{timeLeft}s</span>
        </div>
        <Statement small />
        <TugOfWar a={sideTotals.DEFEND} b={sideTotals.ATTACK} labelA="Defend reactions" labelB="Attack reactions" />

        <div className="flex min-h-[132px] items-center justify-center rounded-[1.75rem] border border-white/12 bg-slate-950/45 p-5">
          <AnimatePresence mode="wait">
            {spotlight && side ? (
              <motion.div key={spotlight.id + spotlightNo} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3 text-center">
                <KitLabel tone={side === 'DEFEND' ? 'emerald' : 'rose'}>Speaking · {SIDE[side].label}</KitLabel>
                <p className="font-display text-5xl">{spotlight.name}</p>
                {counts && (
                  <div className="flex justify-center gap-4">
                    {DEFEND_REACTIONS.map(({ key, label, icon: Icon }) => (
                      <motion.span key={key} animate={counts[key] ? { scale: [1, 1.2, 1] } : {}} className={`flex items-center gap-1.5 text-lg ${counts[key] ? 'text-amber-200' : 'text-white/35'}`} title={label}>
                        <Icon className="h-5 w-5" />{counts[key]}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/50">Call the first speaker</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2">
          <KitButton tone="amber" solid disabled={!nextSpeaker} onClick={() => nextSpeaker && handleSpotlight(nextSpeaker)} className="!px-6 !py-2.5 !text-sm" icon={<Mic className="h-4 w-4" />}>
            {nextSpeaker ? `Next speaker: ${nextSpeaker.name}` : 'Everyone has spoken'}
          </KitButton>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">sides take turns</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(['DEFEND', 'ATTACK'] as const).map((s) => {
            const st = SIDE[s];
            return (
              <div key={s} className={`space-y-1 rounded-2xl border p-3 ${st.border} bg-slate-950/40`}>
                <p className={`font-mono text-xs uppercase tracking-[0.16em] ${st.text}`}>{st.label}</p>
                {team[s].map((p) => {
                  const total = sum(reactionCounts[p.id] ?? emptyCounts());
                  const on = spotlight?.id === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => handleSpotlight(p)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-1.5 text-left text-sm ${on ? `${st.border} ${st.bg}` : 'border-white/5 hover:bg-white/5'}`}>
                      <span className="flex items-center gap-1.5">{on && <Mic className="h-3.5 w-3.5 text-amber-300" />}{p.name}{spoken.includes(p.id) && !on && <span className="text-[10px] text-white/35">spoke</span>}</span>
                      {total > 0 && <span className="font-mono text-xs text-amber-200">+{total}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <KitButton tone="amber" onClick={() => setPhase('verdict')} icon={<Gavel className="h-3.5 w-3.5" />}>End debate · class verdict</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'verdict') {
    const voted = Object.keys(verdictVotes).length;
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-white">
        <RoundLabel />
        <p className="font-display text-5xl">Who argued better?</p>
        <p className="text-lg text-white/70">Vote on your phone: the best arguments, not the side you agree with.</p>
        <p className="font-display text-5xl">{voted}<span className="text-2xl text-white/50"> votes</span></p>
        <KitButton tone="amber" solid className="mx-auto !px-7 !py-2.5 !text-sm" onClick={showRoundResults} icon={<Gavel className="h-4 w-4" />}>Reveal the verdict</KitButton>
      </div>
    );
  }

  if (phase === 'round_results') {
    const winner: DebateSide | null = tally.DEFEND > tally.ATTACK ? 'DEFEND' : tally.ATTACK > tally.DEFEND ? 'ATTACK' : null;
    const favourite = [...students]
      .map((s) => ({ s, n: sum(reactionCounts[s.id] ?? emptyCounts()) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)[0];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl space-y-5 text-white">
        <div className="text-center"><RoundLabel /></div>
        <Statement small />
        <div className="text-center">
          <KitLabel tone={winner === 'DEFEND' ? 'emerald' : winner === 'ATTACK' ? 'rose' : 'amber'}>The verdict</KitLabel>
          <p className="mt-1 font-display text-5xl">
            {winner ? <><span className={SIDE[winner].text}>{SIDE[winner].label}</span> wins the round!</> : 'A draw!'}
          </p>
        </div>
        <TugOfWar a={tally.DEFEND} b={tally.ATTACK} labelA="Defend votes" labelB="Attack votes" />
        <TugOfWar a={sideTotals.DEFEND} b={sideTotals.ATTACK} labelA="Defend reactions" labelB="Attack reactions" />
        {favourite && (
          <div className="flex items-center justify-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-300" /> Crowd favourite: <span className="font-semibold">{favourite.s.name}</span>
            <span className="font-mono text-sm text-amber-200">{favourite.n} reactions</span>
          </div>
        )}
        <div className="flex justify-center">
          {isMicroEvent ? (
            <KitReadout>Round complete · advance the flight to continue</KitReadout>
          ) : (
            <KitButton tone="amber" solid onClick={handleNextRound} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>
              {currentRound >= roundCount ? 'Finish' : 'Next statement'}
            </KitButton>
          )}
        </div>
      </motion.div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-8 text-center text-white">
        <Flame className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">Debate complete!</p>
        <p className="text-white/65">{roundCount} wild statements, defended and attacked.</p>
        <KitButton className="mx-auto" onClick={handleRestart}>Play again</KitButton>
      </div>
    );
  }

  return null;
}
