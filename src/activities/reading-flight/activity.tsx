'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { caughtChapter, type ReadingPack } from '@/lib/reading-pack';
import { saveFlightResult } from '@/lib/flight-result';

// Reading flight takeoff (Predict) and landing (What really happened). Both read the lesson's
// reading pack. Before: a prediction + "how well are you following the story?". After: the 3-
// question check + confidence again, the predictions vs what happened, then everyone adds one line
// to a class retelling. Class counts only; saved to the logbook.

export interface ReadingLessonContent {
  activityKey: 'story-predict' | 'story-recap';
  topicContext: string;
  bookTitle: string;
  lessonTitle: string;
  pack: ReadingPack;
}

const CONFIDENCE = ['I’m lost', 'Mostly', 'I get it'];
const CONFIDENCE_Q = 'How well do you understand the story?';

function useMission(key: string, questions: Array<{ q: string; options: string[] }>, active: boolean, onAnswer: (cid: string, i: number, a: number) => void, p: Pick<ActivityProps, 'onSetInputSpec' | 'onRegisterRemoteVoteHandler'>) {
  const { onSetInputSpec, onRegisterRemoteVoteHandler } = p;
  const answerRef = useRef(onAnswer); answerRef.current = onAnswer;
  const activeRef = useRef(active); activeRef.current = active;
  useEffect(() => {
    if (!active) { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({ type: 'confirm', gameKey: key, prompt: 'Answer on your phone', perStudentData: { __mission: questions }, stableInput: true });
  }, [active, key, questions, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (!activeRef.current) return;
      try {
        const { i, a } = JSON.parse(vote.choice) as { i: number; a: number };
        if (typeof i === 'number' && typeof a === 'number') answerRef.current(vote.clientId, i, a);
      } catch { /* not a mission answer */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);
}

export function StoryPredictActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onPhaseChange }: ActivityProps) {
  const c = generatedContent as unknown as ReadingLessonContent;
  const record = useSessionStore((s) => s.recordReadingAnswer);
  const before = useSessionStore((s) => s.lessonThread.readingCheck?.before);
  const [phase, setPhase] = useState<'idle' | 'predict' | 'done'>('idle');
  const questions = useMemo(() => [
    ...(c?.pack?.predict ? [{ q: c.pack.predict.q, options: c.pack.predict.options }] : []),
    { q: CONFIDENCE_Q, options: CONFIDENCE },
  ], [c]);
  useMission('story-predict', questions, phase === 'predict', (cid, i, a) => record('before', cid, i, a), { onSetInputSpec, onRegisterRemoteVoteHandler });
  const go = (p: 'idle' | 'predict' | 'done') => { setPhase(p); onPhaseChange?.(p === 'done' ? 'finished' : p); };
  const cast = c?.pack?.cast ?? [];

  if (!c?.pack) return <p className="py-12 text-center text-slate-300">Pick a book lesson for this Reading flight.</p>;

  return (
    <div className="space-y-5 text-white">
      <div className="text-center">
        <BookOpen className="mx-auto h-12 w-12 text-emerald-300" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-emerald-300/80">{c.bookTitle}</p>
        <h3 className="mt-1 text-4xl font-game">{c.lessonTitle}</h3>
      </div>
      {cast.length > 0 && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/50"><Users className="h-3.5 w-3.5" />Who’s who</p>
          <div className="flex flex-wrap gap-2">{cast.map((p) => <span key={p.name} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm"><b>{p.name}</b>{p.who ? `: ${p.who}` : ''}</span>)}</div>
        </div>
      )}
      {phase === 'idle' && (
        <div className="text-center">
          <p className="mx-auto max-w-xl text-sm text-white/70">Before we read: what do you think will happen? Answer on your phone. We’ll find out at the end.</p>
          <button onClick={() => go('predict')} className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-10 py-4 font-game text-lg shadow-xl">PREDICT</button>
        </div>
      )}
      {phase === 'predict' && (
        <div className="space-y-3 text-center">
          {c.pack.predict && <p className="text-2xl font-game">{c.pack.predict.q}</p>}
          <p className="text-sm text-white/60">{Object.keys(before ?? {}).length} answering</p>
          <button onClick={() => go('done')} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">LET’S READ</button>
        </div>
      )}
      {phase === 'done' && <p className="text-center text-white/70">Predictions are in. Time to read.</p>}
    </div>
  );
}

export function StoryRecapActivity({ students, generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const c = generatedContent as unknown as ReadingLessonContent;
  const record = useSessionStore((s) => s.recordReadingAnswer);
  const recordFeature = useSessionStore((s) => s.recordFeature);
  const sessionId = useSessionStore((s) => s.sessionId);
  const rc = useSessionStore((s) => s.lessonThread.readingCheck);
  const [phase, setPhase] = useState<'idle' | 'check' | 'reveal' | 'retell' | 'done'>('idle');
  const [turn, setTurn] = useState(0);
  const check = useMemo(() => c?.pack?.check ?? [], [c]);
  const questions = useMemo(() => [...check.map((q) => ({ q: q.q, options: q.options })), { q: CONFIDENCE_Q, options: CONFIDENCE }], [check]);
  useMission('story-recap', questions, phase === 'check', (cid, i, a) => record('after', cid, i, a), { onSetInputSpec, onRegisterRemoteVoteHandler });

  const hasPredict = !!c?.pack?.predict;
  const before = rc?.before ?? {};
  const after = rc?.after ?? {};
  const confIdxBefore = hasPredict ? 1 : 0;
  const confident = (ans: Record<string, Record<number, number>>, i: number) => Object.keys(ans).filter((k) => ans[k][i] === 2).length;
  const predictedRight = hasPredict ? Object.keys(before).filter((k) => before[k][0] === c.pack.predict!.outcomeIndex).length : 0;
  const caught = caughtChapter(after, check, 0);
  const order = useMemo(() => {
    const counts = useSessionStore.getState().callCounts;
    return [...students].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot per roster
  }, [students.map((s) => s.id).join(',')]);
  const speaker = order[turn] ?? null;

  const go = (p: typeof phase) => { setPhase(p); onPhaseChange?.(p === 'done' ? 'finished' : p); };
  const reveal = () => {
    go('reveal');
    const nBefore = Object.keys(before).length;
    const nAfter = Object.keys(after).length;
    if (nAfter > 0) {
      saveFlightResult(sessionId, {
        preset: 'reading-60', flight: 'Reading', topic: c.bookTitle, focus: c.lessonTitle,
        measures: [
          ...(check.length ? [{ label: 'Caught the chapter', before: null, after: { count: caught.caught, of: caught.of } }] : []),
          { label: 'Understand the story', before: nBefore ? { count: confident(before, confIdxBefore), of: nBefore } : null, after: { count: confident(after, check.length), of: nAfter } },
          ...(hasPredict && nBefore ? [{ label: 'Predicted right', before: null, after: { count: predictedRight, of: nBefore } }] : []),
        ],
        phrases: (c.pack.words ?? []).map((w) => w.word).slice(0, 4),
      });
    }
  };
  const nextLine = () => {
    if (speaker) {
      recordFeature(speaker.id);
      void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: turn + 1, points: 1, isCorrect: null });
    }
    if (turn + 1 >= order.length) go('done'); else setTurn((t) => t + 1);
  };

  if (!c?.pack) return <p className="py-12 text-center text-slate-300">Pick a book lesson for this Reading flight.</p>;

  return (
    <div className="space-y-5 text-white">
      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-emerald-300/80">{c.bookTitle} · {c.lessonTitle}</p>
      {phase === 'idle' && (
        <div className="text-center">
          <h3 className="text-4xl font-game">What really happened?</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">{check.length ? `${check.length} quick questions on your phone, then we check your predictions.` : 'Let’s check your predictions.'}</p>
          <button onClick={() => go(check.length ? 'check' : 'reveal')} className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-10 py-4 font-game text-lg shadow-xl">START</button>
        </div>
      )}
      {phase === 'check' && (
        <div className="space-y-3">
          <ol className="space-y-2">{check.map((q, i) => <li key={q.q} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-lg">{i + 1}. {q.q}</li>)}</ol>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">{Object.keys(after).length} answering</span>
            <button onClick={reveal} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm"><TrendingUp className="h-4 w-4" />REVEAL</button>
          </div>
        </div>
      )}
      {phase === 'reveal' && (
        <div className="space-y-4">
          {hasPredict && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] p-4 text-center">
              <p className="text-sm text-white/60">{c.pack.predict!.q}</p>
              <p className="mt-1 text-2xl font-game text-emerald-100">{c.pack.predict!.options[c.pack.predict!.outcomeIndex]}</p>
              <p className="text-sm text-white/60">{predictedRight} of {Object.keys(before).length} predicted it</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {check.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-xs uppercase tracking-[0.15em] text-white/50">Caught the chapter</p><p className="font-display text-5xl text-emerald-200">{caught.caught}<span className="text-2xl"> of {caught.of}</span></p></div>}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-xs uppercase tracking-[0.15em] text-white/50">Understand the story</p><p className="font-display text-5xl text-emerald-200">{Object.keys(before).length > 0 && <span className="text-white/50">{confident(before, confIdxBefore)} → </span>}{confident(after, check.length)}</p></div>
          </div>
          {check.length > 0 && <div className="space-y-1 text-sm text-white/70">{check.map((q) => <p key={q.q}>{q.q} <span className="text-emerald-200">{q.options[q.correctIndex]}</span></p>)}</div>}
          <div className="flex justify-end"><button onClick={() => go('retell')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">THE STORY SO FAR<ChevronRight className="h-4 w-4" /></button></div>
        </div>
      )}
      {phase === 'retell' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-white/60">One line each: tell the story of this chapter, in order.</p>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">{speaker ? `Line ${turn + 1} of ${order.length}` : ''}</p>
          <p className="text-5xl font-game">{speaker?.name ?? 'The class'}</p>
          {(c.pack.words ?? []).length > 0 && <div className="flex flex-wrap justify-center gap-2">{c.pack.words.map((w) => <span key={w.word} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm">{w.word}</span>)}</div>}
          <div className="flex justify-end"><button onClick={nextLine} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">{turn + 1 >= order.length ? 'FINISH' : 'NEXT LINE'}</button></div>
        </div>
      )}
      {phase === 'done' && <p className="py-10 text-center text-xl font-game text-emerald-100">Chapter done. Same time next lesson for the next part!</p>}
    </div>
  );
}
