'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Ear, Eye, EyeOff, Lightbulb, MessagesSquare, RefreshCw, Shuffle, Zap } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { ConversationRoundsContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { ConversationRoleCard } from '@/components/student/conversation-rounds-panel';

type Phase = 'idle' | 'briefing' | 'conversing' | 'complication' | 'debrief' | 'complete';

const TONE = [
  { border: 'border-teal-300/45', bg: 'bg-teal-400/10', text: 'text-teal-300', chip: 'border-teal-300/30 bg-teal-400/[0.07] text-teal-100', lit: 'border-teal-300 bg-teal-400/30 text-white' },
  { border: 'border-violet-300/45', bg: 'bg-violet-400/10', text: 'text-violet-300', chip: 'border-violet-300/30 bg-violet-400/[0.07] text-violet-100', lit: 'border-violet-300 bg-violet-400/30 text-white' },
];
const SPOT_BONUS_CAP = 5;

export function ConversationRoundsActivity({
  students,
  generatedContent,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onContinue,
  onPhaseChange,
}: ActivityProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [content, setContent] = useState<ConversationRoundsContent>(generatedContent as ConversationRoundsContent);
  const [roleAIdx, setRoleAIdx] = useState(0);
  const [roleBIdx, setRoleBIdx] = useState(Math.min(1, Math.max(0, students.length - 1)));
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [complicationIdx, setComplicationIdx] = useState(0);
  const [activeComplication, setActiveComplication] = useState<string | null>(null);
  const [shownLifelinesA, setShownLifelinesA] = useState(0);
  const [shownLifelinesB, setShownLifelinesB] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [goalsShown, setGoalsShown] = useState(false);
  // Audience phrase-spotting: phrase → who heard it (by display name).
  const [spots, setSpots] = useState<Map<string, Set<string>>>(new Map());
  const [lastRound, setLastRound] = useState<{ a: string; b: string; bonusA: number; bonusB: number; spotters: number } | null>(null);
  const promptIndexRef = useRef(1);

  const roleA = content.roles?.[0];
  const roleB = content.roles?.[1];
  const studentA = students[roleAIdx];
  const studentB = students[roleBIdx];
  const remaining = students.filter((s) => !completedIds.includes(s.id));
  const complicationsLeft = (content.complications?.length ?? 0) - complicationIdx;
  const taskChecklist = content.taskChecklist ?? [];
  const live = phase === 'briefing' || phase === 'conversing' || phase === 'complication';

  // ─── Phones: speakers get a secret role card, everyone else spots phrases ──
  const perStudentData = useMemo(() => {
    const data: Record<string, ConversationRoleCard> = {};
    if (studentA && roleA) data[studentA.name] = { side: 0, title: roleA.title, goal: roleA.goal, situation: roleA.situation, phrases: roleA.phrases };
    if (studentB && roleB) data[studentB.name] = { side: 1, title: roleB.title, goal: roleB.goal, situation: roleB.situation, phrases: roleB.phrases };
    return data;
  }, [studentA, studentB, roleA, roleB]);

  useEffect(() => {
    if (live) {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'conversation-rounds',
        prompt: content.context,
        // Many taps per student: no roundId (the server keeps only the first response per round).
        allowMultiple: true,
        perStudentData,
        keywordGroups: [
          { label: roleA?.title ?? 'Role A', phrases: roleA?.phrases ?? [] },
          { label: roleB?.title ?? 'Role B', phrases: roleB?.phrases ?? [] },
        ],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [live, content.context, perStudentData, roleA?.title, roleB?.title, roleA?.phrases, roleB?.phrases, onSetInputSpec]);

  useEffect(() => {
    if (!live) return;
    const speakers = new Set([studentA?.name, studentB?.name]);
    onRegisterRemoteVoteHandler?.((vote) => {
      const m = /^spot:(\d):(.+)$/.exec(vote.choice ?? '');
      if (!m || speakers.has(vote.displayName)) return;
      const phrase = m[2];
      setSpots((prev) => {
        const next = new Map(prev);
        const who = new Set(next.get(phrase) ?? []);
        who.add(vote.displayName);
        next.set(phrase, who);
        return next;
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [live, studentA?.name, studentB?.name, onRegisterRemoteVoteHandler]);

  // ─── Flow ─────────────────────────────────────────────────────────────────
  const startRound = useCallback(() => {
    setShownLifelinesA(0);
    setShownLifelinesB(0);
    setActiveComplication(null);
    setGoalsShown(false);
    setSpots(new Map());
    setCheckedTasks(new Set());
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [onPhaseChange]);

  const startConversation = useCallback(() => {
    setPhase('conversing');
    onPhaseChange?.('conversing');
  }, [onPhaseChange]);

  const triggerComplication = useCallback(() => {
    if (!content.complications?.length || complicationIdx >= content.complications.length) return;
    setActiveComplication(content.complications[complicationIdx]);
    setComplicationIdx((i) => i + 1);
    setPhase('complication');
  }, [complicationIdx, content.complications]);

  const randomPair = useCallback(() => {
    const pool = remaining.length >= 2 ? remaining : students;
    if (pool.length < 2) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setRoleAIdx(students.indexOf(shuffled[0]));
    setRoleBIdx(students.indexOf(shuffled[1]));
  }, [remaining, students]);

  const endRound = useCallback(async () => {
    if (!studentA || !studentB || !roleA || !roleB) return;
    const idx = promptIndexRef.current++;
    const spottedOf = (phrases: string[]) => phrases.filter((p) => (spots.get(p)?.size ?? 0) > 0).length;
    const bonusA = Math.min(SPOT_BONUS_CAP, spottedOf(roleA.phrases));
    const bonusB = Math.min(SPOT_BONUS_CAP, spottedOf(roleB.phrases));
    await onScore?.({ studentId: studentA.id, clientId: null, displayName: studentA.name, promptIndex: idx, points: 3 + bonusA, isCorrect: null });
    await onScore?.({ studentId: studentB.id, clientId: null, displayName: studentB.name, promptIndex: idx, points: 3 + bonusB, isCorrect: null });
    // Good listeners: 1 point each for spotting.
    const spotters = new Set<string>();
    spots.forEach((who) => who.forEach((n) => spotters.add(n)));
    spotters.forEach((name) => {
      const s = students.find((x) => x.name === name);
      void onScore?.({ studentId: s?.id ?? null, clientId: null, displayName: name, promptIndex: idx, points: 1, isCorrect: null });
    });
    setLastRound({ a: studentA.name, b: studentB.name, bonusA, bonusB, spotters: spotters.size });

    const newCompleted = Array.from(new Set([...completedIds, studentA.id, studentB.id]));
    setCompletedIds(newCompleted);
    setRoundCount((r) => r + 1);
    setActiveComplication(null);
    setGoalsShown(true);
    setPhase('debrief');
  }, [studentA, studentB, roleA, roleB, spots, completedIds, students, onScore]);

  const nextRound = useCallback(() => {
    const left = students.filter((s) => !completedIds.includes(s.id));
    if (left.length === 0) { setPhase('complete'); onPhaseChange?.('complete'); return; }
    const nextA = students.indexOf(left[0]);
    const nextB = left.length > 1 ? students.indexOf(left[1]) : students.findIndex((s) => s.id !== left[0].id);
    setRoleAIdx(nextA >= 0 ? nextA : 0);
    setRoleBIdx(nextB >= 0 ? nextB : 0);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [students, completedIds, onPhaseChange]);

  const handleNewScenario = useCallback(async () => {
    setRegenerating(true);
    try {
      const res = await onContinue({
        sessionId: '',
        activityKey: 'conversation-rounds',
        topicContext: content.topicContext,
        previousExchanges: [],
        studentResponse: JSON.stringify({ topic: content.topicContext, difficulty: sessionSettings.difficulty }),
        requestType: 'generate-round',
      });
      if (res.regeneratedContent) {
        setContent(res.regeneratedContent as ConversationRoundsContent);
        setComplicationIdx(0);
        setActiveComplication(null);
        setPhase('idle');
        onPhaseChange?.('idle');
      }
    } finally {
      setRegenerating(false);
    }
  }, [content.topicContext, sessionSettings.difficulty, onContinue, onPhaseChange]);

  if (!roleA || !roleB) {
    return <p className="py-12 text-center text-rose-300">Content unavailable. Please regenerate.</p>;
  }

  const roles = [roleA, roleB] as const;
  const speakers = [studentA, studentB];
  const totalSpots = Array.from(spots.values()).reduce((n, s) => n + s.size, 0);

  const RoleCard = ({ i, compact }: { i: 0 | 1; compact?: boolean }) => {
    const role = roles[i];
    const t = TONE[i];
    const shown = i === 0 ? shownLifelinesA : shownLifelinesB;
    const setShown = i === 0 ? setShownLifelinesA : setShownLifelinesB;
    return (
      <div className={`space-y-3 rounded-2xl border-2 p-4 ${t.border} bg-slate-950/45`}>
        <div>
          <p className={`font-mono text-xs uppercase tracking-[0.16em] ${t.text}`}>{role.title}</p>
          <p className="font-display text-3xl leading-tight">{speakers[i]?.name ?? '—'}</p>
        </div>
        {!compact && <p className="text-base text-white/75">{role.situation}</p>}
        {goalsShown ? (
          <p className="text-base"><span className="mr-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">Goal</span>{role.goal}</p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-white/45"><EyeOff className="h-3.5 w-3.5" /> Goal is secret (on their phone)</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {role.phrases.map((p) => {
            const n = spots.get(p)?.size ?? 0;
            return (
              <motion.span key={p} animate={n ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.35 }} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${n ? t.lit : t.chip}`}>
                {n > 0 && <Ear className="h-3.5 w-3.5" />}{p}{n > 0 && <span className="font-mono text-[11px] opacity-80">{n}</span>}
              </motion.span>
            );
          })}
        </div>
        {(phase === 'conversing' || phase === 'complication') && (
          <>
            {role.lifelines.slice(0, shown).map((l, j) => (
              <p key={j} className="border-l-2 border-emerald-400/50 pl-2 text-sm italic text-emerald-200">&ldquo;{l}&rdquo;</p>
            ))}
            {shown < role.lifelines.length && (
              <KitButton tone="emerald" onClick={() => setShown((n) => n + 1)} icon={<Lightbulb className="h-3.5 w-3.5" />}>Line for {speakers[i]?.name ?? role.title}</KitButton>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <KitLabel tone="cyan">Conversation Rounds · {content.scenario}{phase !== 'complete' ? ` · round ${roundCount + (phase === 'debrief' ? 0 : 1)}` : ''}</KitLabel>
        {(phase === 'idle' || phase === 'complete') && (
          <KitButton disabled={regenerating} onClick={handleNewScenario} icon={<RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />}>{regenerating ? 'Writing…' : 'New scenario'}</KitButton>
        )}
      </div>

      {/* Task checklist (Travel) */}
      {taskChecklist.length > 0 && live && (
        <div className="rounded-2xl border border-cyan-300/30 bg-slate-950/40 p-4">
          <KitLabel tone="cyan">Task · accomplish these</KitLabel>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {taskChecklist.map((task, i) => {
              const done = checkedTasks.has(i);
              return (
                <button key={i} type="button" onClick={() => setCheckedTasks((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm ${done ? 'border-emerald-300/50 bg-emerald-400/10 text-emerald-100' : 'border-white/10 text-white/80 hover:border-white/25'}`}>
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${done ? 'border-emerald-300 bg-emerald-400/30' : 'border-white/30'}`}>{done && <Check className="h-3 w-3" />}</span>
                  <span className={done ? 'line-through opacity-80' : ''}>{task}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── IDLE: pick the pair ─── */}
      {phase === 'idle' && (
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-6 text-center">
            <KitLabel>The scene</KitLabel>
            <p className="mt-2 font-display text-3xl leading-snug" style={{ textWrap: 'balance' }}>{content.context}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {([0, 1] as const).map((i) => {
              const idx = i === 0 ? roleAIdx : roleBIdx;
              const setIdx = i === 0 ? setRoleAIdx : setRoleBIdx;
              return (
                <div key={i} className={`space-y-2 rounded-2xl border p-4 ${TONE[i].border} ${TONE[i].bg}`}>
                  <p className={`font-mono text-xs uppercase tracking-[0.16em] ${TONE[i].text}`}>{roles[i].title}</p>
                  <select value={idx} onChange={(e) => setIdx(Number(e.target.value))} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 font-display text-2xl text-white outline-none focus:border-cyan-300">
                    {students.map((s, si) => <option key={s.id} value={si}>{s.name}{completedIds.includes(s.id) ? ' ✓' : ''}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          {students.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <KitReadout>Still to speak</KitReadout>
              {students.map((s) => {
                const done = completedIds.includes(s.id);
                return <span key={s.id} className={`rounded-full border px-2.5 py-0.5 text-sm ${done ? 'border-white/10 text-white/30 line-through' : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'}`}>{s.name}</span>;
              })}
            </div>
          )}

          <div className="flex justify-center gap-2">
            <KitButton disabled={students.length < 2} onClick={randomPair} icon={<Shuffle className="h-3.5 w-3.5" />}>Random pair</KitButton>
            <KitButton tone="cyan" solid disabled={roleAIdx === roleBIdx} onClick={startRound} className="!px-7 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>Send role cards</KitButton>
          </div>
        </div>
      )}

      {/* ─── BRIEFING ─── */}
      {phase === 'briefing' && (
        <div className="space-y-5">
          <p className="text-center text-lg text-white/75">
            {studentA?.name} and {studentB?.name}: read your <span className="text-amber-200">secret goal</span> on your phone. Everyone else: listen and tap the phrases you hear.
          </p>
          <div className="grid grid-cols-2 gap-4"><RoleCard i={0} /><RoleCard i={1} /></div>
          <div className="flex justify-center">
            <KitButton tone="cyan" solid onClick={startConversation} className="!px-7 !py-2.5 !text-sm" icon={<MessagesSquare className="h-4 w-4" />}>Start the conversation</KitButton>
          </div>
        </div>
      )}

      {/* ─── CONVERSING / COMPLICATION ─── */}
      {(phase === 'conversing' || phase === 'complication') && (
        <div className="space-y-4">
          <AnimatePresence>
            {phase === 'complication' && activeComplication && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-5 text-center">
                <KitLabel tone="amber">Plot twist</KitLabel>
                <p className="mt-1 font-display text-3xl leading-snug">{activeComplication}</p>
                <KitButton tone="amber" className="mx-auto mt-3" onClick={() => setPhase('conversing')}>Keep talking</KitButton>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4"><RoleCard i={0} compact /><RoleCard i={1} compact /></div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KitButton tone="amber" disabled={complicationsLeft <= 0 || phase === 'complication'} onClick={triggerComplication} icon={<Zap className="h-3.5 w-3.5" />}>Plot twist{complicationsLeft > 0 ? ` · ${complicationsLeft}` : ''}</KitButton>
              <KitButton onClick={() => setGoalsShown((v) => !v)} icon={goalsShown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}>{goalsShown ? 'Hide goals' : 'Show goals'}</KitButton>
              <KitReadout><Ear className="mr-1 inline h-3.5 w-3.5" />{totalSpots} spotted</KitReadout>
            </div>
            <KitButton tone="cyan" solid disabled={phase === 'complication'} onClick={() => void endRound()} className="!px-6 !py-2.5 !text-sm" icon={<Check className="h-4 w-4" />}>End round</KitButton>
          </div>
        </div>
      )}

      {/* ─── DEBRIEF ─── */}
      {phase === 'debrief' && (
        <div className="space-y-5">
          <div className="text-center">
            <KitLabel tone="emerald">Round {roundCount} done</KitLabel>
            <p className="mt-1 font-display text-4xl">Did they reach their goals?</p>
          </div>
          <div className="grid grid-cols-2 gap-4"><RoleCard i={0} compact /><RoleCard i={1} compact /></div>
          {lastRound && (
            <div className="flex flex-wrap justify-center gap-2">
              <KitReadout>{lastRound.a} +{3 + lastRound.bonusA}</KitReadout>
              <KitReadout>{lastRound.b} +{3 + lastRound.bonusB}</KitReadout>
              {lastRound.spotters > 0 && <KitReadout>{lastRound.spotters} good listener{lastRound.spotters === 1 ? '' : 's'} +1</KitReadout>}
            </div>
          )}
          <div className="flex justify-center gap-2">
            <KitButton onClick={() => { setPhase('complete'); onPhaseChange?.('complete'); }}>Finish</KitButton>
            <KitButton tone="cyan" solid onClick={nextRound} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>
              {remaining.length > 0 ? `Next pair · ${remaining.length} to go` : 'Everyone has spoken'}
            </KitButton>
          </div>
        </div>
      )}

      {/* ─── COMPLETE ─── */}
      {phase === 'complete' && (
        <div className="space-y-6 py-10 text-center">
          <p className="font-display text-5xl">Great conversations!</p>
          <div className="flex justify-center gap-10">
            <div><p className="font-display text-5xl">{roundCount}</p><KitLabel>rounds</KitLabel></div>
            <div><p className="font-display text-5xl">{completedIds.length}</p><KitLabel>speakers</KitLabel></div>
          </div>
          <KitButton className="mx-auto" onClick={() => { setCompletedIds([]); setPhase('idle'); onPhaseChange?.('idle'); }}>Play again</KitButton>
        </div>
      )}
    </div>
  );
}
