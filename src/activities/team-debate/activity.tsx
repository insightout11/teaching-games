'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Scale, Clock, Users, Megaphone, RotateCcw, Shuffle, ChevronRight, Quote } from 'lucide-react';
import type { ActivityProps, TeamDebateContent } from '../types';
import type { Student } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isMockMode } from '@/lib/mock/auth';

type Side = 'for' | 'against';
type Phase = 'idle' | 'prep' | 'debate' | 'done';

interface Turn {
  stageId: string;
  stageLabel: string;
  side: Side;
  speaker: Student | null;
}

interface DebatePoint {
  id: string;
  client_id: string;
  display_name: string;
  side: string;
  content: string;
  created_at: string;
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
  sessionId,
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
  const [boardPoints, setBoardPoints] = useState<DebatePoint[]>([]);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

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

  // Lazy-load the browser Supabase client for the live teacher board.
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => setSupabase(createClient()));
  }, []);

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

  // ── Live teacher board — both sides, realtime ─────────────────────────────
  useEffect(() => {
    if (phase !== 'prep' || isMockMode() || !sessionId || !supabase) return;
    const sid = sessionId;
    const load = async () => {
      const { data } = await supabase
        .from('debate_points')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });
      if (data) setBoardPoints(data as DebatePoint[]);
    };
    load();
    const channel = supabase
      .channel(`debate-points-${sid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_points', filter: `session_id=eq.${sid}` },
        (payload: { new: DebatePoint }) => setBoardPoints((prev) => [...prev, payload.new]))
      .subscribe();
    const poll = setInterval(load, 4000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [phase, sessionId, supabase]);

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
    onSetInputSpec?.(null); // close the student prep boards
    setPhase('debate');
    onPhaseChange?.('debate');
    setCurrentTurn(0);
    startTurnTimer();
  }, [onPhaseChange, onSetInputSpec, startTurnTimer]);

  const nextSpeaker = useCallback(() => {
    scoreTurn(currentTurn);
    if (currentTurn >= turns.length - 1) {
      stopTimer();
      setPhase('done');
      onPhaseChange?.('finished');
      return;
    }
    setCurrentTurn((i) => i + 1);
    startTurnTimer();
  }, [currentTurn, turns.length, scoreTurn, stopTimer, onPhaseChange, startTurnTimer]);

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

  // ── Render: IDLE ──────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const tooFew = students.length < 2;
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <Scale className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-game text-lc-text">Team Debate</h2>
          <p className="text-sm font-semibold text-indigo-300 leading-snug px-4">&ldquo;{content.motion}&rdquo;</p>
          <p className="text-lc-text2 text-sm">{content.context}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-lc-text3">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {students.length} students · two teams</span>
          <span>·</span>
          <span>Opening → Rebuttal → Closing</span>
        </div>
        {tooFew ? (
          <p className="text-amber-400 text-sm">At least 2 students must be connected to run a debate.</p>
        ) : (
          <button
            onClick={startPrep}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Split Teams &amp; Start Prep
          </button>
        )}
      </div>
    );
  }

  // ── Render: PREP ──────────────────────────────────────────────────────────
  if (phase === 'prep') {
    return (
      <div className="space-y-4">
        {/* Motion + prep timer */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">The Motion</span>
            <span className={`flex items-center gap-1 font-mono text-sm ${prepLeft <= 30 ? 'text-red-400 font-bold' : 'text-lc-text2'}`}>
              <Clock className="w-3.5 h-3.5" /> {formatTime(prepLeft)} prep
            </span>
          </div>
          <p className="text-base font-semibold text-lc-text leading-snug">&ldquo;{content.motion}&rdquo;</p>
          <p className="text-xs text-lc-text3">{content.context}</p>
        </div>

        {/* Two team prep cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['for', 'against'] as Side[]).map((side) => {
            const team = side === 'for' ? forTeam : againstTeam;
            const label = side === 'for' ? forLabel : againstLabel;
            const prompts = side === 'for' ? content.forPrompts : content.againstPrompts;
            const st = SIDE_STYLE[side];
            return (
              <div key={side} className={`rounded-xl border p-3 space-y-2.5 ${st.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${st.text}`}>{side === 'for' ? 'FOR' : 'AGAINST'} · {label}</span>
                  <span className="text-[10px] text-lc-text3">{team.length} speaker{team.length !== 1 ? 's' : ''}</span>
                </div>
                {/* Members */}
                <div className="flex flex-wrap gap-1.5">
                  {team.length === 0 && <span className="text-xs text-lc-text3 italic">No students on this side</span>}
                  {team.map((s) => (
                    <span key={s.id} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-lc-text2">{s.name}</span>
                  ))}
                </div>
                {/* Prep angles */}
                {prompts && prompts.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {prompts.map((p, i) => (
                      <li key={i} className="text-xs text-lc-text2 flex gap-1.5">
                        <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Live board — points students added on their devices */}
                {(() => {
                  const sidePoints = boardPoints.filter((p) => p.side === side);
                  return (
                    <div className="pt-1 border-t border-white/10 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-lc-text3">
                        Board · {sidePoints.length} point{sidePoints.length !== 1 ? 's' : ''}
                      </p>
                      {sidePoints.length === 0 ? (
                        <p className="text-[11px] italic text-lc-text3">Students&rsquo; points appear here as they type.</p>
                      ) : (
                        sidePoints.map((p) => (
                          <div key={p.id} className="rounded-md bg-white/5 px-2 py-1">
                            <p className="text-xs text-lc-text leading-snug">{p.content}</p>
                            <p className="text-[10px] text-lc-text3">{p.display_name}</p>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
                {/* Speaking order for this side */}
                <div className="pt-1 border-t border-white/10 space-y-0.5">
                  {teamPlan[side].map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-lc-text3">
                      <span>{t.label}</span>
                      <span className="text-lc-text2 font-medium">{t.speaker}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Useful phrases */}
        {content.usefulPhrases && content.usefulPhrases.length > 0 && (
          <div className="rounded-xl border border-lc-border bg-lc-surface p-3">
            <p className="text-[10px] uppercase tracking-widest text-lc-text3 mb-1.5 flex items-center gap-1"><Quote className="w-3 h-3" /> Useful phrases</p>
            <div className="flex flex-wrap gap-1.5">
              {content.usefulPhrases.map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-lc-text2">{p}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={reshuffleTeams}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-lc-surface border border-lc-border text-lc-text2 rounded-xl hover:bg-lc-card transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" /> Reshuffle teams
          </button>
          <button
            onClick={startDebate}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Megaphone className="w-4 h-4" /> Start Debate
          </button>
        </div>
      </div>
    );
  }

  // ── Render: DEBATE ────────────────────────────────────────────────────────
  if (phase === 'debate') {
    const turn = turns[currentTurn];
    const st = turn ? SIDE_STYLE[turn.side] : SIDE_STYLE.for;
    const sideLabel = turn?.side === 'for' ? forLabel : againstLabel;
    const isLast = currentTurn >= turns.length - 1;
    return (
      <div className="space-y-4">
        {/* Motion reminder */}
        <p className="text-center text-xs text-lc-text3 italic">&ldquo;{content.motion}&rdquo;</p>

        {/* Current speaker spotlight */}
        <div className={`rounded-2xl border p-5 text-center space-y-2 ${st.bg}`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${st.text}`}>
            {turn?.side === 'for' ? 'FOR' : 'AGAINST'} · {sideLabel}
          </span>
          <p className="text-sm text-lc-text2">{turn?.stageLabel}</p>
          <p className="text-3xl font-game text-lc-text">{turn?.speaker?.name ?? 'Open floor'}</p>
          <div className={`inline-flex items-center gap-1.5 font-mono text-lg ${turnLeft <= 15 ? 'text-red-400 font-bold' : 'text-lc-text2'}`}>
            <Clock className="w-4 h-4" /> {formatTime(turnLeft)}
          </div>
        </div>

        {/* Running order */}
        <div className="space-y-1">
          {turns.map((t, i) => {
            const tst = SIDE_STYLE[t.side];
            const done = i < currentTurn;
            const active = i === currentTurn;
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs border transition-all ${
                  active ? `${tst.bg} ring-1 ${tst.ring}` : done ? 'bg-lc-surface border-lc-border opacity-50' : 'bg-lc-surface border-lc-border'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${tst.dot}`} />
                  <span className={tst.text}>{t.side === 'for' ? forLabel : againstLabel}</span>
                  <span className="text-lc-text3">·</span>
                  <span className="text-lc-text2">{t.stageLabel}</span>
                </span>
                <span className="text-lc-text2 font-medium">{t.speaker?.name ?? '—'}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={nextSpeaker}
          className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          {isLast ? 'Finish Debate' : <>Next Speaker <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    );
  }

  // ── Render: DONE ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-center">
      <div className="py-4 space-y-2">
        <Scale className="w-10 h-10 text-indigo-400 mx-auto" />
        <h2 className="text-2xl font-game text-lc-text">Debate complete</h2>
        <p className="text-lc-text2 text-sm max-w-sm mx-auto">
          Both sides made their case. There&rsquo;s no winner&rsquo;s vote — head to the reflection to see whose mind actually moved.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {(['for', 'against'] as Side[]).map((side) => {
          const team = side === 'for' ? forTeam : againstTeam;
          const st = SIDE_STYLE[side];
          return (
            <div key={side} className={`rounded-xl border p-3 ${st.bg}`}>
              <p className={`text-xs font-bold ${st.text} mb-1.5`}>{side === 'for' ? 'FOR' : 'AGAINST'} · {side === 'for' ? forLabel : againstLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {team.map((s) => (
                  <span key={s.id} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-lc-text2">{s.name}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-lc-surface border border-lc-border text-lc-text rounded-xl font-bold hover:bg-lc-card transition-all"
      >
        <RotateCcw className="w-4 h-4" /> Run Again
      </button>
    </div>
  );
}
