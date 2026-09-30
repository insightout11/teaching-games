'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, MessageCircleQuestion, Plus, Send, Users } from 'lucide-react';
import type { ActivityProps } from '../types';
import { KitButton, KitInput, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { QuickPulseContent, QuickPulsePrompt } from '../types';
import { useSessionStore } from '@/stores/session-store';

type Phase = 'idle' | 'prompting' | 'revealing' | 'summary';

// votes[promptIndex][clientId] = choice
type VoteMap = Record<number, Record<string, string>>;

interface QuickPulseRuntimeState {
  phase: Phase;
  currentIndex: number;
  prompts: QuickPulsePrompt[];
  votes: VoteMap;
  timeLeft: number;
  activityInstance: { id: string; startedAt: number } | null;
}

function recoverQuickPulseRuntime(
  value: unknown,
  fallbackPrompts: QuickPulsePrompt[],
): QuickPulseRuntimeState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<QuickPulseRuntimeState>;
  const prompts = Array.isArray(candidate.prompts) && candidate.prompts.length > 0
    ? candidate.prompts
    : fallbackPrompts;
  if (!['prompting', 'revealing', 'summary'].includes(candidate.phase ?? '')) return null;
  if (!Number.isInteger(candidate.currentIndex) || (candidate.currentIndex ?? -1) < 0 || (candidate.currentIndex ?? 0) >= prompts.length) return null;
  if (!candidate.votes || typeof candidate.votes !== 'object') return null;
  if (typeof candidate.timeLeft !== 'number' || candidate.timeLeft < 0) return null;
  const instance = candidate.activityInstance;
  if (!instance || typeof instance.id !== 'string' || typeof instance.startedAt !== 'number') return null;
  return { ...candidate, prompts } as QuickPulseRuntimeState;
}

const LIKERT_COLORS = ['bg-rose-400', 'bg-orange-400', 'bg-amber-300', 'bg-lime-400', 'bg-emerald-400'];
const LIKERT_WORDS = ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'];

function LikertChart({ votes, big }: { votes: Record<string, string>; big?: boolean }) {
  const values = Object.values(votes).map(Number).filter((n) => n >= 1 && n <= 5);
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length);
  const max = Math.max(1, ...counts);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return (
    <div className="space-y-3">
      <div className={`flex items-end gap-3 ${big ? 'h-44' : 'h-24'}`}>
        {counts.map((c, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="font-mono text-sm text-white/80">{c}</span>
            <motion.div className={`w-full rounded-t-lg ${LIKERT_COLORS[i]}`} initial={{ height: 0 }} animate={{ height: `${(c / max) * 100}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.06 }} style={{ minHeight: c ? 6 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">{LIKERT_WORDS.map((w, i) => <span key={w} className="flex-1 text-center text-[11px] leading-tight text-white/55">{i + 1}<br />{big ? w : ''}</span>)}</div>
      {mean !== null && (
        <div className="relative mt-1 h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400">
          <motion.span className="absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded bg-white shadow" initial={{ left: '50%' }} animate={{ left: `${((mean - 1) / 4) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.3 }} />
        </div>
      )}
      <p className="text-center font-mono text-xs text-white/55">{values.length} response{values.length !== 1 ? 's' : ''}{mean !== null ? ` · class average ${mean.toFixed(1)}` : ''}</p>
    </div>
  );
}

function YesNoChart({ votes, big }: { votes: Record<string, string>; big?: boolean }) {
  const yes = Object.values(votes).filter((v) => v === 'Yes').length;
  const no = Object.values(votes).filter((v) => v === 'No').length;
  const pct = yes + no ? (yes / (yes + no)) * 100 : 50;
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-display text-3xl">
        <span className="text-emerald-300">Yes {yes}</span>
        <span className="text-rose-300">{no} No</span>
      </div>
      <div className={`relative flex overflow-hidden rounded-full bg-white/10 ${big ? 'h-6' : 'h-3'}`}>
        <motion.div className="h-full bg-emerald-400" initial={{ width: '50%' }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} />
        <div className="h-full flex-1 bg-rose-400" />
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/80" aria-hidden />
      </div>
      <p className="text-center font-mono text-xs text-white/55">{yes + no} response{yes + no !== 1 ? 's' : ''}</p>
    </div>
  );
}

function PromptChart({ prompt, votes, big }: { prompt: QuickPulsePrompt; votes: Record<string, string>; big?: boolean }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
      <p className={`font-display leading-snug ${big ? 'text-center text-3xl' : 'text-xl'}`}>{prompt.text}</p>
      {prompt.type === 'likert' ? <LikertChart votes={votes} big={big} /> : <YesNoChart votes={votes} big={big} />}
    </div>
  );
}

export function QuickPulseActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  initialRuntimeState,
  onRuntimeStateChange,
}: ActivityProps) {
  const content = generatedContent as QuickPulseContent;
  const recoveredRuntimeRef = useRef(recoverQuickPulseRuntime(initialRuntimeState, content.prompts));
  const recoveredRuntime = recoveredRuntimeRef.current;
  // Teachers can add their own questions on the fly, so prompts is state.
  const [prompts, setPrompts] = useState<QuickPulsePrompt[]>(recoveredRuntime?.prompts ?? content.prompts);
  const [ownText, setOwnText] = useState('');
  const [ownType, setOwnType] = useState<QuickPulsePrompt['type']>('yesno');
  const [asking, setAsking] = useState(false);
  const [voices, setVoices] = useState<Array<{ name: string; answer: string }> | null>(null);
  const namesRef = useRef<Record<string, string>>({});

  const [phase, setPhase] = useState<Phase>(recoveredRuntime?.phase ?? 'idle');
  const [currentIndex, setCurrentIndex] = useState(recoveredRuntime?.currentIndex ?? 0);
  const [votes, setVotes] = useState<VoteMap>(recoveredRuntime?.votes ?? { 0: {}, 1: {}, 2: {} });
  const [timeLeft, setTimeLeft] = useState(recoveredRuntime?.timeLeft ?? 0);
  const instanceCounterRef = useRef(0);
  const activityInstanceRef = useRef<{ id: string; startedAt: number } | null>(recoveredRuntime?.activityInstance ?? null);

  // Use a ref for currentIndex so the vote handler closure always sees the latest value
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const votesRef = useRef(votes);
  votesRef.current = votes;

  const timerSeconds = sessionSettings.timerSeconds ?? 30;

  useEffect(() => {
    if (phase === 'idle') {
      onRuntimeStateChange?.(null);
      return;
    }
    onRuntimeStateChange?.({
      phase,
      currentIndex,
      prompts,
      votes,
      timeLeft,
      activityInstance: activityInstanceRef.current,
    } satisfies QuickPulseRuntimeState);
  }, [phase, currentIndex, prompts, votes, timeLeft, onRuntimeStateChange]);

  useEffect(() => {
    if (recoveredRuntime?.phase) onPhaseChange?.(recoveredRuntime.phase);
  }, [onPhaseChange, recoveredRuntime]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'prompting' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // Auto-advance to revealing when timer hits 0
  useEffect(() => {
    if (phase === 'prompting' && timeLeft === 0) {
      handleReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'prompting') return;
      const idx = currentIndexRef.current;
      const instance = activityInstanceRef.current;
      const expectedRoundId = instance ? `${instance.id}:prompt-${idx + 1}` : null;
      if (vote.roundId && expectedRoundId && vote.roundId !== expectedRoundId) return;
      const alreadyVoted = votesRef.current[idx]?.[vote.clientId];
      namesRef.current[vote.clientId] = vote.displayName;
      if (!alreadyVoted) {
        setVotes((prev) => ({
          ...prev,
          [idx]: { ...prev[idx], [vote.clientId]: vote.choice },
        }));
        onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: idx + 1,
          points: 1,
          isCorrect: null,
        });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Set input spec when prompting
  useEffect(() => {
    if (phase !== 'prompting') {
      const instance = activityInstanceRef.current;
      onSetInputSpec?.(null, instance ? {
        id: instance.id,
        startedAt: instance.startedAt,
        sequence: currentIndex * 2 + 1,
      } : null);
      return;
    }
    const prompt = prompts[currentIndex];
    if (!prompt) return;
    const instance = activityInstanceRef.current;
    if (!instance) return;
    const instanceFields = {
      activityInstanceId: instance.id,
      activityInstanceStartedAt: instance.startedAt,
      // Even numbers are active prompts; the serialized clear after reveal uses +1.
      activitySequence: currentIndex * 2,
      roundId: `${instance.id}:prompt-${currentIndex + 1}`,
    };
    if (prompt.type === 'likert') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'quick-pulse',
        prompt: prompt.text,
        options: ['1', '2', '3', '4', '5'],
        optionLabels: ['1 – Strongly Disagree', '2', '3', '4', '5 – Strongly Agree'],
        ...instanceFields,
      });
    } else {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'quick-pulse',
        prompt: prompt.text,
        optionLabels: ['Yes', 'No'],
        ...instanceFields,
      });
    }
  }, [phase, currentIndex, prompts, onSetInputSpec]);

  const handleStart = useCallback(() => {
    const startedAt = Date.now();
    instanceCounterRef.current += 1;
    activityInstanceRef.current = {
      id: `quick-pulse:${startedAt}:${instanceCounterRef.current}`,
      startedAt,
    };
    setCurrentIndex(0);
    setVotes({ 0: {}, 1: {}, 2: {} });
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [timerSeconds, onPhaseChange]);

  const recordPulse = useSessionStore((s) => s.recordPulse);
  const handleReveal = useCallback(() => {
    setPhase('revealing');
    onPhaseChange?.('revealing');
    // Lesson Thread: keep this answer set so a later stage (Opinion Shift) can ask it again.
    const prompt = prompts[currentIndexRef.current];
    const round = votesRef.current[currentIndexRef.current] ?? {};
    if (prompt && Object.keys(round).length > 0) {
      const votes: Record<string, { name: string; choice: string }> = {};
      Object.entries(round).forEach(([cid, choice]) => { votes[cid] = { name: namesRef.current[cid] ?? 'Someone', choice: String(choice) }; });
      recordPulse({ text: prompt.text, type: prompt.type === 'likert' ? 'likert' : 'binary', votes });
    }
  }, [onPhaseChange, prompts, recordPulse]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    setVoices(null);
    if (nextIndex >= prompts.length) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(timerSeconds);
      setPhase('prompting');
      onPhaseChange?.('prompting');
    }
  }, [currentIndex, prompts.length, timerSeconds, onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('idle');
    onPhaseChange?.('finished');
    const instance = activityInstanceRef.current;
    onSetInputSpec?.(null, instance ? {
      id: instance.id,
      startedAt: instance.startedAt,
      sequence: currentIndex * 2 + 1,
    } : null);
  }, [currentIndex, onPhaseChange, onSetInputSpec]);

  // Add the teacher's own question and send it right away.
  const askOwn = () => {
    const text = ownText.trim();
    if (!text) return;
    const idx = prompts.length;
    setPrompts((prev) => [...prev, { type: ownType, text }]);
    setVotes((prev) => ({ ...prev, [idx]: {} }));
    setOwnText('');
    setAsking(false);
    setVoices(null);
    setCurrentIndex(idx);
    setTimeLeft(timerSeconds);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  };

  // "Ask both sides": one voter from each end of the result, named on screen with "why?".
  const askBothSides = () => {
    const entries = Object.entries(votes[currentIndex] ?? {});
    const pick = (pred: (v: string) => boolean) => {
      const pool = entries.filter(([, v]) => pred(v));
      const hit = pool[Math.floor(Math.random() * pool.length)];
      return hit ? { name: namesRef.current[hit[0]] ?? 'Someone', answer: hit[1] } : null;
    };
    const likert = prompts[currentIndex]?.type === 'likert';
    const a = likert ? pick((v) => Number(v) >= 4) : pick((v) => v === 'Yes');
    const b = likert ? pick((v) => Number(v) <= 2) : pick((v) => v === 'No');
    setVoices([a, b].filter((x): x is { name: string; answer: string } => !!x));
  };

  const currentPrompt = prompts[currentIndex];
  const currentVotes = votes[currentIndex] ?? {};
  const totalVotes = Object.keys(currentVotes).length;

  const ownQuestion = () => (asking ? (
    <div className="space-y-2 rounded-2xl border border-cyan-300/30 bg-slate-950/45 p-4">
      <KitLabel tone="cyan">Your own question</KitLabel>
      <KitInput autoFocus value={ownText} onChange={(e) => setOwnText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') askOwn(); }} placeholder="e.g. Have you ever been on a plane?" maxLength={140} />
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {([['yesno', 'Yes / No'], ['likert', 'Rate 1–5']] as const).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setOwnType(t)} className={`rounded-full border px-3 py-1 text-xs ${ownType === t ? 'border-cyan-300 bg-cyan-400/15 text-white' : 'border-white/15 text-white/60'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <KitButton onClick={() => setAsking(false)}>Cancel</KitButton>
          <KitButton tone="cyan" solid disabled={!ownText.trim()} onClick={askOwn} icon={<Send className="h-3.5 w-3.5" />}>Send to phones</KitButton>
        </div>
      </div>
    </div>
  ) : (
    <KitButton onClick={() => setAsking(true)} icon={<Plus className="h-3.5 w-3.5" />}>Ask your own</KitButton>
  ));

  return (
    <div className="mx-auto max-w-3xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="cyan">Quick Pulse</KitLabel>
        {phase !== 'idle' && phase !== 'summary' && <KitReadout>Question {currentIndex + 1} of {prompts.length}</KitReadout>}
      </div>

      {phase === 'idle' && (
        <div className="space-y-5 py-6 text-center">
          <p className="font-display text-5xl">Take the class&apos;s pulse.</p>
          <p className="text-lg text-white/70">{prompts.length} quick questions. Everyone answers on their phone, then the results appear, and we hear from both sides.</p>
          <div className="flex justify-center">
            <KitButton tone="cyan" solid onClick={handleStart} className="!px-8 !py-3 !text-base" icon={<Users className="h-4 w-4" />}>Start</KitButton>
          </div>
        </div>
      )}

      {phase === 'prompting' && currentPrompt && (
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-8 text-center">
            <KitReadout>{currentPrompt.type === 'likert' ? 'Rate 1–5' : 'Yes or no'}</KitReadout>
            <p className="mt-3 font-display text-4xl leading-snug" style={{ textWrap: 'balance' }}>{currentPrompt.text}</p>
          </div>
          <div className="flex items-center gap-4">
            <Clock className={`h-5 w-5 ${timeLeft <= 5 ? 'text-rose-300' : 'text-white/60'}`} />
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className={`h-full ${timeLeft <= 5 ? 'bg-rose-400' : 'bg-cyan-400'}`} animate={{ width: `${Math.min(100, (timeLeft / Math.max(1, timerSeconds)) * 100)}%` }} transition={{ ease: 'linear', duration: 1 }} />
            </div>
            <span className="w-12 text-right font-mono text-2xl">{timeLeft}s</span>
            <KitButton onClick={() => setTimeLeft((prev) => prev + 30)}>+30s</KitButton>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-display text-3xl">{totalVotes}<span className="text-lg text-white/50"> answered</span></p>
            <KitButton tone="cyan" solid onClick={handleReveal} className="!px-6 !py-2.5 !text-sm">Show results</KitButton>
          </div>
        </div>
      )}

      {phase === 'revealing' && currentPrompt && (
        <div className="space-y-4">
          <PromptChart prompt={currentPrompt} votes={currentVotes} big />
          {voices && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2">
              {voices.length === 0 && <p className="text-center text-white/55 sm:col-span-2">Not enough different answers. Ask anyone: why?</p>}
              {voices.map((v) => (
                <div key={v.name} className="rounded-2xl border border-amber-300/35 bg-amber-300/[0.07] p-4 text-center">
                  <p className="font-display text-3xl">{v.name}</p>
                  <p className="mt-1 text-lg text-amber-100">You said {currentPrompt.type === 'likert' ? v.answer : `“${v.answer}”`}. Why?</p>
                </div>
              ))}
            </motion.div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <KitButton tone="amber" disabled={totalVotes === 0} onClick={askBothSides} icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>{voices ? 'Ask two others' : 'Ask both sides'}</KitButton>
              {!asking && ownQuestion()}
            </div>
            <KitButton tone="cyan" solid onClick={handleNext} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>
              {currentIndex < prompts.length - 1 ? 'Next question' : 'See all results'}
            </KitButton>
          </div>
          {asking && ownQuestion()}
        </div>
      )}

      {phase === 'summary' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {prompts.map((prompt, i) => <PromptChart key={i} prompt={prompt} votes={votes[i] ?? {}} />)}
          </div>
          <div className="flex items-center justify-between">
            {ownQuestion()}
            <KitButton onClick={handleEnd}>End activity</KitButton>
          </div>
        </div>
      )}
    </div>
  );
}
