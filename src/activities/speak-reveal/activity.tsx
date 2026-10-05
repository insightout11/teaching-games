'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, TrendingUp, Mic } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { fallbackSpeakSituation, summariseSpeak, type SpeakAnswer } from '@/lib/speak-check';

// Speak v2 landing: Try 3. The same situation as takeoff with NEW reply options (so it isn't
// memory), the same confidence + can-do questions, then the Better answers reveal (class counts
// only), then everyone says their reply aloud, one sentence each, with the lesson's phrases.

type Phase = 'idle' | 'check' | 'reveal' | 'say' | 'done';

export function SpeakRevealActivity({ students, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const check = useSessionStore((s) => s.lessonThread.speakCheck);
  const recordSpeakAnswer = useSessionStore((s) => s.recordSpeakAnswer);
  const recordFeature = useSessionStore((s) => s.recordFeature);
  // Select the stable store value; `?? []` inside a selector makes a new array every read (render loop).
  const kitPhrases = useSessionStore((s) => s.lessonKit?.phrases);
  const phrases = useMemo(() => kitPhrases ?? [], [kitPhrases]);
  const customTopic = useSessionStore((s) => s.settings.customTopic);
  const situation = check?.situation ?? fallbackSpeakSituation(customTopic);
  const [phase, setPhase] = useState<Phase>('idle');
  const [turn, setTurn] = useState(0);
  const phaseRef = useRef(phase); phaseRef.current = phase;

  const before = summariseSpeak(check?.before ?? {}, situation.before);
  const after = summariseSpeak(check?.after ?? {}, situation.after);

  // Closing turns: least-featured first, snapshotted on the roster ids.
  const rosterKey = students.map((s) => s.id).join(',');
  const rosterRef = useRef(students); rosterRef.current = students;
  const order = useMemo(() => {
    const counts = useSessionStore.getState().callCounts;
    return [...rosterRef.current].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-snapshot only when the roster ids change
  }, [rosterKey]);
  const speaker = order[turn] ?? null;

  useEffect(() => {
    if (phase === 'check') {
      onSetInputSpec?.({ type: 'confirm', gameKey: 'speak-reveal', prompt: 'Situation check: Try 3', perStudentData: { __speakcheck: { situation: situation.situation, replies: situation.after.replies, canDo: situation.canDo } }, stableInput: true });
      return;
    }
    if (phase === 'say') {
      onSetInputSpec?.({ type: 'confirm', gameKey: 'speak-reveal', prompt: `Say what you'd really say: ${situation.situation}`, buttonLabel: 'Ready', keywordGroups: phrases.length ? [{ label: 'Lesson phrases', phrases: phrases.slice(0, 6) }] : undefined });
      return;
    }
    onSetInputSpec?.(null);
  }, [phase, situation, phrases, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'check') return;
      try {
        const a = JSON.parse(vote.choice) as SpeakAnswer;
        if (typeof a.reply === 'number') recordSpeakAnswer('after', vote.clientId, a);
      } catch { /* not a check answer */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, recordSpeakAnswer]);

  const nextSpeaker = useCallback(async () => {
    if (speaker) {
      recordFeature(speaker.id);
      await onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: turn + 1, points: 2, isCorrect: null });
    }
    if (turn + 1 >= order.length) { setPhase('done'); onPhaseChange?.('finished'); return; }
    setTurn((t) => t + 1);
  }, [speaker, turn, order.length, recordFeature, onScore, onPhaseChange]);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <MessageCircle className="h-16 w-16 text-emerald-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300/80">Speak · Try 3</p>
          <h3 className="mt-2 text-3xl font-game text-white">Back to the situation</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{situation.situation}</p>
        </div>
        <button onClick={() => go('check')} className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">START</button>
      </div>
    );
  }

  if (phase === 'check') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300/80">Speak · Situation check, Try 3</p>
          <span className="text-sm text-slate-400">{after.n} answered</span>
        </div>
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.08] p-6 text-center">
          <p className="text-2xl font-game text-white">{situation.situation}</p>
          <p className="mt-3 text-sm text-slate-300">New replies on your phone this time. Which would you use now?</p>
        </div>
        <div className="flex justify-end">
          <button onClick={() => go('reveal')} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">REVEAL</button>
        </div>
      </div>
    );
  }

  if (phase === 'reveal') {
    const rows = [
      { label: 'Picked the natural reply', was: before.natural, now: after.natural },
      { label: 'Feel confident saying it', was: before.confident, now: after.confident },
      { label: `Could ${situation.canDo.charAt(0).toLowerCase() + situation.canDo.slice(1)}`, was: before.canDo, now: after.canDo },
    ];
    return (
      <div className="space-y-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300/80"><TrendingUp className="h-4 w-4" aria-hidden />Better answers</p>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] p-4">
          <p className="text-sm text-slate-300">The natural reply this time:</p>
          <p className="mt-1 text-xl font-game text-white">“{situation.after.replies[situation.after.natural]}”</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-xs text-slate-400">{r.label}</p>
              <p className="mt-2 font-game text-3xl text-white">
                {before.n > 0 && <span className="text-slate-400">{r.was}</span>}
                {before.n > 0 && <span className="mx-2 text-slate-500">→</span>}
                <span className="text-emerald-200">{r.now}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{before.n > 0 ? `of ${before.n} → of ${after.n}` : `of ${after.n}`}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={() => go('say')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]"><Mic className="h-4 w-4" aria-hidden />NOW SAY IT</button>
        </div>
      </div>
    );
  }

  if (phase === 'say') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-emerald-400/30 bg-emerald-500/[0.08] p-6 text-center">
          <p className="text-sm text-slate-300">{situation.situation}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">{speaker ? `Your turn ${turn + 1} of ${order.length}` : 'The class'}</p>
          <p className="mt-1 text-4xl font-game text-white">{speaker ? speaker.name : 'Everyone'}</p>
          <p className="mt-2 text-sm text-slate-300">Say what you’d really say, in your own words.</p>
          {phrases.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {phrases.slice(0, 6).map((p) => <span key={p} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">{p}</span>)}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={() => void nextSpeaker()} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
            {turn + 1 >= order.length ? 'FINISH · +2' : 'NEXT · +2'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
      <TrendingUp className="h-12 w-12 text-emerald-300" />
      <h3 className="text-2xl font-game text-white">From Try 1 to Try 3</h3>
      <p className="max-w-md text-sm text-slate-300">Natural replies: {before.n > 0 ? `${before.natural} → ` : ''}{after.natural} of {after.n}.</p>
    </div>
  );
}
