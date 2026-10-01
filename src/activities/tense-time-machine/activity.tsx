'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, Eye, Mic, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import type { ActivityProps, TenseTimeMachineContent, TenseTimeMachineStop } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';

// Tense Time Machine (tenses family): the plane's time dial swings to the past, present or
// future, and the class retells the same scene in that tense, one spoken sentence each.
// Fewest-turns-first rotation; phones show the scene, the tense, starters and a verb bank.
// Teacher: Good! / Try again / Skip / Show a model (records a struggle).

type Phase = 'idle' | 'stop' | 'done';

const ERA_ANGLE: Record<TenseTimeMachineStop['era'], number> = { past: -60, present: 0, future: 60 };
const ERA_TONE: Record<TenseTimeMachineStop['era'], string> = { past: 'text-amber-300', present: 'text-emerald-300', future: 'text-cyan-300' };

function TimeDial({ era, label }: { era: TenseTimeMachineStop['era']; label: string }) {
  return (
    <div className="relative mx-auto h-40 w-72">
      <svg viewBox="0 0 300 160" className="h-full w-full">
        <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" strokeLinecap="round" />
        {(['past', 'present', 'future'] as const).map((e) => {
          const a = ((ERA_ANGLE[e] - 90) * Math.PI) / 180;
          const x = 150 + Math.cos(a) * 120;
          const y = 150 + Math.sin(a) * 120;
          return <circle key={e} cx={x} cy={y} r={e === era ? 9 : 5} fill={e === era ? '#fcd34d' : 'rgba(255,255,255,0.35)'} />;
        })}
        <text x="22" y="132" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="monospace">PAST</text>
        <text x="128" y="16" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="monospace">NOW</text>
        <text x="232" y="132" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="monospace">FUTURE</text>
      </svg>
      <motion.div className="absolute bottom-[10px] left-1/2 h-[112px] w-1.5 origin-bottom -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]" animate={{ rotate: ERA_ANGLE[era] }} transition={{ type: 'spring', stiffness: 70, damping: 9 }} />
      <div className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-200" />
      <p className="absolute -bottom-14 left-0 right-0 text-center font-display text-3xl">{label}</p>
    </div>
  );
}

export function TenseTimeMachineActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as TenseTimeMachineContent;
  const stops = content.stops ?? [];
  const recordStruggle = useSessionStore((s) => s.recordStruggle);

  const perStop = Math.max(3, Math.min(isMicroEvent ? 3 : 5, students.length || 3));
  const [phase, setPhase] = useState<Phase>('idle');
  const [stopIdx, setStopIdx] = useState(0);
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [said, setSaid] = useState<number[]>([0, 0, 0]);
  const [models, setModels] = useState(0);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(false);

  const stop = stops[stopIdx];
  const speaker = students.find((s) => s.id === speakerId) ?? null;

  const nextSpeaker = (exclude?: string | null, t: Record<string, number> = turns) => {
    setRetry(false);
    if (!students.length) { setSpeakerId(null); return; }
    const pool = students.filter((s) => s.id !== exclude);
    const list = pool.length ? pool : students;
    const min = Math.min(...list.map((s) => t[s.id] ?? 0));
    const cands = list.filter((s) => (t[s.id] ?? 0) === min);
    setSpeakerId(cands[Math.floor(Math.random() * cands.length)].id);
  };

  // ─── Phones: scene + this stop's tense + starters + verb bank; "your turn" for the speaker ───
  useEffect(() => {
    if (phase !== 'stop' || !stop) { onSetInputSpec?.(null); return; }
    const per: Record<string, unknown> = { __room: true };
    students.forEach((s) => {
      const card = {
        role: 'traveller',
        sceneTitle: content.sceneTitle,
        scene: content.scene,
        stop: { era: stop.era, tense: stop.tense, timeLabel: stop.timeLabel, timeWords: stop.timeWords, starters: stop.starters },
        verbs: content.verbs ?? [],
        yourTurn: s.id === speakerId,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'tense-time-machine', prompt: `${stop.timeLabel}: ${content.sceneTitle}`, perStudentData: per, stableInput: true });
  }, [phase, stop, speakerId, students, content.scene, content.sceneTitle, content.verbs, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const goTo = (i: number) => {
    setStopIdx(i);
    setModels(0);
    setPhase('stop');
    onPhaseChange?.(`stop-${stops[i]?.era ?? i}`);
    nextSpeaker(speakerId);
  };

  const good = () => {
    if (!speaker) return;
    void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: stopIdx + 1, points: 2, isCorrect: true });
    const t = { ...turns, [speaker.id]: (turns[speaker.id] ?? 0) + 1 };
    setTurns(t);
    setSaid((arr) => arr.map((n, i) => (i === stopIdx ? n + 1 : n)));
    setTotal((n) => n + 1);
    nextSpeaker(speaker.id, t);
  };
  const skip = () => {
    if (!speaker) return;
    const t = { ...turns, [speaker.id]: (turns[speaker.id] ?? 0) + 1 };
    setTurns(t);
    nextSpeaker(speaker.id, t);
  };
  const showModel = () => {
    if (!stop) return;
    if (models === 0) recordStruggle({ stage: 'tense-time-machine', text: `${stop.tense}: ${content.sceneTitle}`, fix: stop.models[0] });
    setModels((m) => Math.min(stop.models.length, m + 1));
  };

  const nextStop = useMemo(() => (stopIdx + 1 < stops.length ? stopIdx + 1 : null), [stopIdx, stops.length]);

  if (stops.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Clock className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Tense Time Machine</p>
        <p className="text-white/60">No scene came through. Try launching it again.</p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Clock className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Tense Time Machine{content.grammarTarget ? ` · ${content.grammarTarget}` : ''}</KitLabel>
          <p className="mt-2 font-display text-5xl">Fasten your seatbelts. We&apos;re travelling in time!</p>
        </div>
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-4 text-left">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Our scene</p>
          <p className="font-display text-2xl">{content.sceneTitle}</p>
          <p className="text-lg text-white/70">{content.scene}</p>
        </div>
        <p className="text-lg text-white/70">The time machine takes us to the past, the present and the future. Tell the scene in the right tense, one sentence each. Your phone has starters and verbs to help!</p>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={() => goTo(0)} className="!px-8 !py-3 !text-base" icon={<Clock className="h-4 w-4" />}>Start the time machine</KitButton></div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-8 text-center text-white">
        <Sparkles className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">The class travelled through time!</p>
        <p className="text-2xl text-white/75">{total} sentence{total === 1 ? '' : 's'} about &ldquo;{content.sceneTitle}&rdquo;</p>
        <div className="flex justify-center gap-6">
          {stops.map((s, i) => <div key={s.era}><p className={`font-mono text-xs uppercase tracking-[0.15em] ${ERA_TONE[s.era]}`}>{s.era}</p><p className="font-display text-4xl">{said[i]}</p><p className="text-sm text-white/50">{s.tense}</p></div>)}
        </div>
      </div>
    );
  }

  if (!stop) return null;
  const done = said[stopIdx] >= perStop;
  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="amber">Tense Time Machine · {content.sceneTitle}</KitLabel>
        <KitReadout>{said[stopIdx]} / {perStop} sentences</KitReadout>
      </div>

      <div className="grid gap-5 md:grid-cols-[18rem_1fr]">
        <div className="space-y-16 pt-2">
          <TimeDial era={stop.era} label={stop.timeLabel} />
          <div className="flex justify-center gap-1.5">
            {stops.map((s, i) => (
              <button key={s.era} type="button" onClick={() => goTo(i)} className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] ${i === stopIdx ? 'border-amber-300 bg-amber-300/15 text-amber-100' : 'border-white/15 text-white/55'}`}>{s.era}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className={`font-mono text-sm uppercase tracking-[0.2em] ${ERA_TONE[stop.era]}`}>{stop.tense}</p>
          <p className="text-xl text-white/75">{content.scene}</p>
          <div className="flex flex-wrap gap-2">{stop.timeWords.map((w) => <span key={w} className="rounded-full border border-white/15 px-3 py-1 text-lg">{w}</span>)}</div>
          <div className="flex flex-wrap gap-2">{stop.starters.map((w) => <span key={w} className="rounded-full bg-white/[0.06] px-3 py-1 text-lg text-white/80">{w}</span>)}</div>
          {models > 0 && (
            <div className="space-y-1.5 rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.07] px-4 py-3">
              {stop.models.slice(0, models).map((m) => <p key={m} className="text-xl text-emerald-50">&ldquo;{m}&rdquo;</p>)}
            </div>
          )}
        </div>
      </div>

      {!done && speaker && (
        <motion.div key={speaker.id + said[stopIdx]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-4">
          <p className="flex items-center gap-2 text-2xl"><Mic className="h-6 w-6 text-amber-300" /><span><span className="font-display text-4xl">{speaker.name}</span>, {retry ? 'have another go!' : 'your sentence!'}</span></p>
          <div className="flex flex-wrap gap-2">
            <KitButton tone="emerald" solid onClick={good} icon={<Check className="h-4 w-4" />}>Good!</KitButton>
            <KitButton tone="plain" onClick={() => setRetry(true)} icon={<RotateCcw className="h-4 w-4" />}>Try again</KitButton>
            <KitButton tone="plain" onClick={skip} icon={<SkipForward className="h-4 w-4" />}>Skip</KitButton>
          </div>
        </motion.div>
      )}
      {done && <p className="text-center text-2xl text-emerald-200">Great travelling! {nextStop != null ? `Next stop: the ${stops[nextStop].era}.` : 'That was the last stop.'}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitButton tone="plain" disabled={models >= stop.models.length} onClick={showModel} icon={<Eye className="h-3.5 w-3.5" />}>Show a model</KitButton>
        {nextStop != null
          ? <KitButton tone="amber" solid={done} onClick={() => goTo(nextStop)} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>Travel to the {stops[nextStop].era}</KitButton>
          : <KitButton tone="amber" solid={done} onClick={() => { setPhase('done'); onPhaseChange?.('done'); }} className="!px-5 !py-2 !text-sm" icon={<Sparkles className="h-4 w-4" />}>Land the time machine</KitButton>}
      </div>
    </div>
  );
}
