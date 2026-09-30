'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, MessageCircleQuestion, Sparkles, Users, X } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type StudentEntry, type VoteRecord } from './types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { CrewAvatar } from '@/components/ui/crew-avatar';

const QUESTION_SECONDS = 60;
const POINTS_FEATURED = 5;
const POINTS_PER_FOOLED = 2;
const POINTS_RIGHT = 10;
const POINTS_TRIED = 3;

/** New phones send JSON { statements, lie }; old free text is split into lines. */
function parseEntry(raw: string): { statements: [string, string, string]; lie: number | null } | null {
  try {
    const j = JSON.parse(raw) as { statements?: unknown; lie?: unknown };
    if (Array.isArray(j.statements) && j.statements.length === 3 && j.statements.every((x) => typeof x === 'string' && x.trim())) {
      const lie = typeof j.lie === 'number' && j.lie >= 0 && j.lie <= 2 ? j.lie : null;
      return { statements: j.statements.map((x: string) => x.trim()) as [string, string, string], lie };
    }
  } catch { /* plain text */ }
  const lines = raw.split('\n').map((l) => l.replace(/^[\d]+[.)]\s*/, '').trim()).filter(Boolean);
  if (lines.length >= 3) return { statements: [lines[0], lines[1], lines[2]], lie: null };
  const sentences = raw.split(/\.\s+/).map((s) => s.replace(/\.$/, '').trim()).filter(Boolean);
  if (sentences.length >= 3) return { statements: [sentences[0], sentences[1], sentences[2]], lie: null };
  return null;
}

type Entry = StudentEntry & { secretLie: number | null };

export function TwoTruthsAndALieActivity({
  students,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, VoteRecord>>({});
  const [questionTime, setQuestionTime] = useState<number | null>(null);

  const statusRef = useRef(status);
  statusRef.current = status;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const votesRef = useRef(votes);
  votesRef.current = votes;
  const promptIndexRef = useRef(1);

  const currentEntry = queue[currentIndex] ? entries[queue[currentIndex]] : undefined;
  const avatarOf = (clientId: string) => students.find((s) => s.id === clientId)?.avatar_seed ?? null;

  // ─── Phones ───
  useEffect(() => {
    if (status === ActivityStatus.COLLECTING) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'two-truths-and-a-lie',
        prompt: 'Write two true things about you and one lie. Tap which one is your lie (it stays secret).',
        maxLength: 400,
      });
    } else if (status === ActivityStatus.SPOTLIGHTING && currentEntry) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'two-truths-and-a-lie',
        prompt: `Which of ${currentEntry.displayName}'s sentences is the LIE?`,
        options: currentEntry.statements,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentEntry, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      const s = statusRef.current;
      if (s === ActivityStatus.COLLECTING) {
        const parsed = parseEntry(vote.choice);
        if (!parsed) return;
        setEntries((prev) => ({
          ...prev,
          [vote.clientId]: { clientId: vote.clientId, displayName: vote.displayName, statements: parsed.statements, lieIndex: null, secretLie: parsed.lie },
        }));
        return;
      }
      if (s === ActivityStatus.SPOTLIGHTING) {
        const featured = queueRef.current[currentIndexRef.current];
        if (vote.clientId === featured) return;
        const entry = entriesRef.current[featured];
        if (!entry) return;
        const choiceIndex = entry.statements.indexOf(vote.choice);
        if (choiceIndex === -1) return;
        setVotes((prev) => ({ ...prev, [vote.clientId]: { clientId: vote.clientId, studentId: vote.studentId ?? null, displayName: vote.displayName, choiceIndex } }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  // Question time countdown
  useEffect(() => {
    if (questionTime === null || questionTime <= 0) return;
    const t = setTimeout(() => setQuestionTime((q) => (q === null ? null : q - 1)), 1000);
    return () => clearTimeout(t);
  }, [questionTime]);

  const startCollecting = useCallback(() => {
    setStatus(ActivityStatus.COLLECTING);
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const startSpotlight = useCallback(() => {
    const shuffled = Object.keys(entriesRef.current).sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setVotes({});
    setQuestionTime(null);
    setStatus(ActivityStatus.SPOTLIGHTING);
    onPhaseChange?.('spotlighting');
  }, [onPhaseChange]);

  const revealLie = useCallback(async (lieIdx: number) => {
    const featured = queueRef.current[currentIndexRef.current];
    const entry = entriesRef.current[featured];
    if (!entry) return;
    setEntries((prev) => ({ ...prev, [featured]: { ...prev[featured], lieIndex: lieIdx } }));
    setQuestionTime(null);
    setStatus(ActivityStatus.REVEALING);
    onPhaseChange?.('revealing');

    const promptIdx = promptIndexRef.current++;
    const all = Object.values(votesRef.current);
    const fooled = all.filter((v) => v.choiceIndex !== lieIdx).length;
    // The storyteller scores for taking part plus every classmate they fooled.
    await onScore?.({ studentId: null, clientId: featured, displayName: entry.displayName, promptIndex: promptIdx, points: POINTS_FEATURED + fooled * POINTS_PER_FOOLED, isCorrect: null, outcome: 'on-task' });
    for (const v of all) {
      const correct = v.choiceIndex === lieIdx;
      await onScore?.({ studentId: v.studentId ?? null, clientId: v.clientId, displayName: v.displayName, promptIndex: promptIdx, points: correct ? POINTS_RIGHT : POINTS_TRIED, isCorrect: correct });
    }
  }, [onScore, onPhaseChange]);

  const nextStudent = useCallback(() => {
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx >= queueRef.current.length) {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    } else {
      setCurrentIndex(nextIdx);
      setVotes({});
      setQuestionTime(null);
      setStatus(ActivityStatus.SPOTLIGHTING);
      onPhaseChange?.('spotlighting');
    }
  }, [onPhaseChange]);

  const restart = useCallback(() => {
    setEntries({});
    setQueue([]);
    setCurrentIndex(0);
    setVotes({});
    promptIndexRef.current = 1;
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const submittedCount = Object.keys(entries).length;
  const expectedCount = students.length || submittedCount;

  const Header = () => (
    <div className="flex items-center justify-between">
      <KitLabel tone="violet">Two Truths &amp; a Lie</KitLabel>
      {queue.length > 0 && status !== ActivityStatus.COLLECTING && status !== ActivityStatus.FINISHED && <KitReadout>{currentIndex + 1} of {queue.length}</KitReadout>}
    </div>
  );

  // ─── IDLE ───
  if (status === ActivityStatus.IDLE) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-6 text-center text-white">
        <p className="font-display text-5xl">Two truths and a lie.</p>
        <p className="mx-auto max-w-xl text-lg text-white/70">Everyone writes two true things about themselves and one lie on their phone. Then each person takes the spotlight: the class asks questions, votes, and the lie is revealed.</p>
        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={startCollecting} className="!px-8 !py-3 !text-base" icon={<Sparkles className="h-4 w-4" />}>Start writing</KitButton>
        </div>
      </div>
    );
  }

  // ─── COLLECTING ───
  if (status === ActivityStatus.COLLECTING) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-white">
        <Header />
        <p className="text-center font-display text-4xl">Write on your phone</p>
        <p className="text-center text-lg text-white/70">Two true sentences, one lie. Make the lie believable!</p>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-violet-400" animate={{ width: expectedCount ? `${(submittedCount / expectedCount) * 100}%` : '0%' }} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.values(entries).map((e) => (
            <motion.span key={e.clientId} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-400/10 py-1 pl-1 pr-3 text-sm">
              <CrewAvatar seed={avatarOf(e.clientId)} name={e.displayName} size={24} />{e.displayName}<Check className="h-3.5 w-3.5 text-emerald-300" />
            </motion.span>
          ))}
          {submittedCount === 0 && <p className="text-sm text-white/45">Waiting for the first one…</p>}
        </div>
        <div className="flex items-center justify-center gap-3">
          <KitReadout>{submittedCount} / {expectedCount} ready</KitReadout>
          <KitButton tone="violet" solid disabled={submittedCount === 0} onClick={startSpotlight} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>Start the spotlight</KitButton>
        </div>
      </div>
    );
  }

  // ─── SPOTLIGHTING (votes hidden until the reveal) ───
  if (status === ActivityStatus.SPOTLIGHTING && currentEntry) {
    const totalVotes = Object.keys(votes).length;
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-white">
        <Header />
        <div className="flex items-center justify-center gap-3">
          <CrewAvatar seed={avatarOf(currentEntry.clientId)} name={currentEntry.displayName} size={56} />
          <p className="font-display text-5xl">{currentEntry.displayName}</p>
        </div>
        <div className="space-y-2.5">
          {currentEntry.statements.map((stmt, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="flex items-start gap-4 rounded-2xl border border-white/12 bg-slate-950/45 px-5 py-4">
              <span className="font-display text-3xl text-violet-300">{i + 1}</span>
              <p className="pt-1 text-2xl leading-snug">{stmt}</p>
            </motion.div>
          ))}
        </div>

        {questionTime !== null && (
          <div className="rounded-2xl border border-amber-300/35 bg-amber-300/[0.07] p-4 text-center">
            <p className="flex items-center justify-center gap-2 font-display text-2xl"><MessageCircleQuestion className="h-6 w-6 text-amber-300" />Question time: ask {currentEntry.displayName} anything!</p>
            <p className="mt-1 text-white/70">&ldquo;When did you…?&rdquo; &ldquo;Where was that?&rdquo; &ldquo;Who were you with?&rdquo;</p>
            <p className={`mt-2 font-mono text-2xl ${questionTime <= 10 ? 'text-rose-300' : ''}`}><Clock className="mr-1 inline h-5 w-5 opacity-60" />{questionTime}s</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl">{totalVotes}<span className="text-lg text-white/50"> voted</span></p>
            {questionTime === null && <KitButton tone="amber" onClick={() => setQuestionTime(QUESTION_SECONDS)} icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>Question time</KitButton>}
          </div>
          {currentEntry.secretLie !== null ? (
            <KitButton tone="violet" solid onClick={() => void revealLie(currentEntry.secretLie!)} className="!px-6 !py-2.5 !text-sm" icon={<Sparkles className="h-4 w-4" />}>Reveal the lie</KitButton>
          ) : (
            // Old-style answers (no lie marked): ask the student, then tap it.
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-white/55">Ask {currentEntry.displayName}, then tap the lie:</span>
              {[0, 1, 2].map((i) => <KitButton key={i} tone="rose" onClick={() => void revealLie(i)}>{i + 1}</KitButton>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── REVEALING ───
  if (status === ActivityStatus.REVEALING && currentEntry && currentEntry.lieIndex !== null) {
    const lieIdx = currentEntry.lieIndex;
    const voteList = Object.values(votes);
    const counts = [0, 1, 2].map((i) => voteList.filter((v) => v.choiceIndex === i).length);
    const right = voteList.filter((v) => v.choiceIndex === lieIdx);
    const fooled = voteList.length - right.length;
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-white">
        <Header />
        <div className="flex items-center justify-center gap-3">
          <CrewAvatar seed={avatarOf(currentEntry.clientId)} name={currentEntry.displayName} size={48} />
          <p className="font-display text-4xl">{currentEntry.displayName}</p>
        </div>
        <div className="space-y-2.5">
          {currentEntry.statements.map((stmt, i) => {
            const isLie = i === lieIdx;
            return (
              <motion.div key={i} initial={{ opacity: 0.4, scale: 0.98 }} animate={{ opacity: 1, scale: isLie ? 1.02 : 1 }} transition={{ delay: 0.25 + i * 0.25 }} className={`flex items-start gap-4 rounded-2xl border-2 px-5 py-4 ${isLie ? 'border-rose-300/70 bg-rose-400/10' : 'border-emerald-300/40 bg-emerald-400/[0.06]'}`}>
                {isLie ? <X className="mt-1 h-7 w-7 shrink-0 text-rose-300" /> : <Check className="mt-1 h-7 w-7 shrink-0 text-emerald-300" />}
                <div className="flex-1">
                  <p className={`text-2xl leading-snug ${isLie ? 'line-through decoration-rose-300/70' : ''}`}>{stmt}</p>
                  <p className={`mt-1 font-mono text-xs uppercase tracking-[0.14em] ${isLie ? 'text-rose-300' : 'text-emerald-300'}`}>{isLie ? 'The lie' : 'True'} · {counts[i]} vote{counts[i] === 1 ? '' : 's'}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="space-y-3 text-center">
          <p className="font-display text-3xl">{fooled > 0 ? `${currentEntry.displayName} fooled ${fooled}!` : voteList.length ? 'Nobody was fooled!' : ''}</p>
          {right.length > 0 && <p className="text-white/70">Spotted it: {right.map((v) => v.displayName).join(', ')}</p>}
          <p className="text-lg text-amber-100">{currentEntry.displayName}, what&apos;s the real story?</p>
        </motion.div>
        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={nextStudent} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>
            {currentIndex + 1 < queue.length ? 'Next storyteller' : 'Finish'}
          </KitButton>
        </div>
      </div>
    );
  }

  // ─── FINISHED ───
  if (status === ActivityStatus.FINISHED) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10 text-center text-white">
        <Users className="mx-auto h-10 w-10 text-violet-300" />
        <p className="font-display text-5xl">Everyone&apos;s a storyteller!</p>
        <p className="text-white/65">{queue.length} student{queue.length !== 1 ? 's' : ''} in the spotlight</p>
        <KitButton className="mx-auto" onClick={restart}>Play again</KitButton>
      </div>
    );
  }

  return null;
}
