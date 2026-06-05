'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Users, ChevronRight } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type StudentEntry, type VoteRecord } from './types';

function parseStatements(raw: string): [string, string, string] | null {
  // Split by newlines, strip leading numbers/bullets, filter blanks
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/^[\d]+[.)]\s*/, '').trim())
    .filter(Boolean);

  if (lines.length >= 3) {
    return [lines[0], lines[1], lines[2]];
  }

  // Fallback: split by period-space
  const sentences = raw
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter(Boolean);

  if (sentences.length >= 3) {
    return [sentences[0], sentences[1], sentences[2]];
  }

  return null;
}

export function TwoTruthsAndALieActivity({
  students,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  // clientId → entry
  const [entries, setEntries] = useState<Record<string, StudentEntry>>({});
  // ordered queue of clientIds for spotlight
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // votes for current spotlight round: clientId → VoteRecord
  const [votes, setVotes] = useState<Record<string, VoteRecord>>({});

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

  // Set input spec based on phase
  useEffect(() => {
    if (status === ActivityStatus.COLLECTING) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'two-truths-and-a-lie',
        prompt: 'Write 3 sentences about yourself — 2 truths and 1 lie.\nPut each sentence on its own line.',
        maxLength: 400,
        placeholder: 'I once met a famous actor.\nI can speak 4 languages.\nI have never eaten pizza.',
      });
    } else if (status === ActivityStatus.SPOTLIGHTING && currentEntry) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'two-truths-and-a-lie',
        prompt: 'Which statement is the LIE?',
        options: currentEntry.statements,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentEntry, onSetInputSpec]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      const s = statusRef.current;

      if (s === ActivityStatus.COLLECTING) {
        const parsed = parseStatements(vote.choice);
        if (!parsed) return;
        setEntries((prev) => ({
          ...prev,
          [vote.clientId]: {
            clientId: vote.clientId,
            displayName: vote.displayName,
            statements: parsed,
            lieIndex: null,
          },
        }));
        return;
      }

      if (s === ActivityStatus.SPOTLIGHTING) {
        const q = queueRef.current;
        const idx = currentIndexRef.current;
        const featuredClientId = q[idx];
        // Featured student can't vote on their own statements
        if (vote.clientId === featuredClientId) return;

        const entry = entriesRef.current[featuredClientId];
        if (!entry) return;

        const choiceIndex = entry.statements.indexOf(vote.choice);
        if (choiceIndex === -1) return;

        setVotes((prev) => ({
          ...prev,
          [vote.clientId]: {
            clientId: vote.clientId,
            studentId: vote.studentId ?? null,
            displayName: vote.displayName,
            choiceIndex,
          },
        }));
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const startCollecting = useCallback(() => {
    setStatus(ActivityStatus.COLLECTING);
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const startSpotlight = useCallback(() => {
    const clientIds = Object.keys(entriesRef.current);
    const shuffled = [...clientIds].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setVotes({});
    setStatus(ActivityStatus.SPOTLIGHTING);
    onPhaseChange?.('spotlighting');
  }, [onPhaseChange]);

  const revealLie = useCallback(
    async (lieIdx: number) => {
      const q = queueRef.current;
      const idx = currentIndexRef.current;
      const featuredClientId = q[idx];
      const entry = entriesRef.current[featuredClientId];
      if (!entry) return;

      setEntries((prev) => ({
        ...prev,
        [featuredClientId]: { ...prev[featuredClientId], lieIndex: lieIdx },
      }));

      setStatus(ActivityStatus.REVEALING);
      onPhaseChange?.('revealing');

      const promptIdx = promptIndexRef.current;
      promptIndexRef.current += 1;

      // Score featured student (participation)
      if (onScore) {
        await onScore({
          studentId: null,
          clientId: featuredClientId,
          displayName: entry.displayName,
          promptIndex: promptIdx,
          points: 5,
          isCorrect: null,
          outcome: 'on-task',
        });
      }

      // Score voters
      const currentVotes = Object.values(votesRef.current);
      for (const v of currentVotes) {
        const correct = v.choiceIndex === lieIdx;
        if (onScore) {
          await onScore({
            studentId: v.studentId ?? null,
            clientId: v.clientId,
            displayName: v.displayName,
            promptIndex: promptIdx,
            points: correct ? 10 : 3,
            isCorrect: correct,
          });
        }
      }
    },
    [onScore, onPhaseChange],
  );

  const nextStudent = useCallback(() => {
    const q = queueRef.current;
    const nextIdx = currentIndexRef.current + 1;

    if (nextIdx >= q.length) {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    } else {
      setCurrentIndex(nextIdx);
      setVotes({});
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

  // ─── IDLE ────────────────────────────────────────────────────────────────
  if (status === ActivityStatus.IDLE) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <p className="text-xl mb-2 opacity-90">Two Truths & a Lie</p>
        <p className="opacity-60 text-sm mb-8 max-w-sm mx-auto">
          Every student writes 3 sentences — 2 true, 1 lie. The class guesses the lie, then the
          student reveals.
        </p>
        <button
          onClick={startCollecting}
          className="px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
        >
          START
        </button>
      </motion.div>
    );
  }

  // ─── COLLECTING ──────────────────────────────────────────────────────────
  if (status === ActivityStatus.COLLECTING) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-violet-400">Collecting Statements</h3>
          <span className="text-sm opacity-60">
            {submittedCount} / {expectedCount} submitted
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            animate={{ width: expectedCount > 0 ? `${(submittedCount / expectedCount) * 100}%` : '0%' }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Submitted list */}
        {submittedCount > 0 ? (
          <div className="space-y-2">
            {Object.values(entries).map((e) => (
              <motion.div
                key={e.clientId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-3 rounded-xl border border-violet-500/40 flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold shrink-0">
                  {e.displayName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold">{e.displayName}</p>
                <span className="ml-auto text-xs text-violet-400">✓ ready</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center opacity-40 text-sm py-6">
            Waiting for students to submit their statements…
          </p>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={startSpotlight}
            disabled={submittedCount === 0}
            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
          >
            START SPOTLIGHT
          </button>
        </div>
      </div>
    );
  }

  // ─── SPOTLIGHTING ────────────────────────────────────────────────────────
  if (status === ActivityStatus.SPOTLIGHTING && currentEntry) {
    const voteList = Object.values(votes);
    const voteCounts = [0, 1, 2].map(
      (i) => voteList.filter((v) => v.choiceIndex === i).length,
    );
    const totalVotes = voteList.length;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-violet-400">Spotlight</h3>
          <span className="text-sm opacity-60">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>

        {/* Featured student */}
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
            {currentEntry.displayName.charAt(0).toUpperCase()}
          </div>
          <p className="text-xl font-semibold">{currentEntry.displayName}</p>
          <p className="text-xs opacity-50 mt-1">Which statement is the lie?</p>
        </div>

        {/* Statements */}
        <div className="space-y-3">
          {currentEntry.statements.map((stmt, i) => {
            const count = voteCounts[i];
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const voters = voteList.filter((v) => v.choiceIndex === i);

            return (
              <div
                key={i}
                className="glass p-4 rounded-2xl border-2 border-white/10 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <p className="flex-1">{stmt}</p>
                </div>

                {totalVotes > 0 && (
                  <div className="ml-10">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5">
                        <motion.div
                          className="h-1.5 bg-violet-500 rounded-full"
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-violet-300 w-6 text-right">
                        {count}
                      </span>
                    </div>
                    {voters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {voters.map((v) => (
                          <span
                            key={v.clientId}
                            className="text-xs bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-full"
                          >
                            {v.displayName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reveal buttons */}
        <div className="glass p-4 rounded-xl space-y-2">
          <p className="text-xs opacity-50 uppercase tracking-widest mb-3">
            Tap the lie to reveal
          </p>
          <div className="flex gap-2">
            {currentEntry.statements.map((_, i) => (
              <button
                key={i}
                onClick={() => revealLie(i)}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-xl font-bold text-red-300 transition-all hover:scale-105 active:scale-95"
              >
                {i + 1} is the lie
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs opacity-40">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
        </div>
      </div>
    );
  }

  // ─── REVEALING ───────────────────────────────────────────────────────────
  if (status === ActivityStatus.REVEALING && currentEntry && currentEntry.lieIndex !== null) {
    const lieIdx = currentEntry.lieIndex;
    const voteList = Object.values(votes);
    const correctVoters = voteList.filter((v) => v.choiceIndex === lieIdx);
    const wrongVoters = voteList.filter((v) => v.choiceIndex !== lieIdx);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="reveal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-violet-400">Reveal</h3>
            <span className="text-sm opacity-60">
              {currentIndex + 1} / {queue.length}
            </span>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold">{currentEntry.displayName}</p>
          </div>

          <div className="space-y-3">
            {currentEntry.statements.map((stmt, i) => {
              const isLie = i === lieIdx;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`glass p-4 rounded-2xl border-2 ${
                    isLie
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-green-500 bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isLie ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    >
                      {isLie ? (
                        <XCircle className="w-4 h-4 text-white" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p>{stmt}</p>
                      <p
                        className={`text-xs font-bold mt-1 ${
                          isLie ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {isLie ? 'THE LIE' : 'TRUE'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Score summary */}
          {voteList.length > 0 && (
            <div className="glass p-4 rounded-xl space-y-2">
              {correctVoters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold text-sm">+10</span>
                  <span className="text-xs opacity-70">
                    {correctVoters.map((v) => v.displayName).join(', ')} got it right
                  </span>
                </div>
              )}
              {wrongVoters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40 font-bold text-sm">+3</span>
                  <span className="text-xs opacity-50">
                    {wrongVoters.map((v) => v.displayName).join(', ')} fooled
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-violet-400 font-bold text-sm">+5</span>
                <span className="text-xs opacity-70">{currentEntry.displayName} participated</span>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={nextStudent}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIndex + 1 < queue.length ? (
                <>
                  Next Student <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                'FINISH'
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── FINISHED ────────────────────────────────────────────────────────────
  if (status === ActivityStatus.FINISHED) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Users className="w-12 h-12 text-violet-400 mx-auto mb-4" />
        <p className="text-2xl font-game text-violet-400 mb-2">Everyone&apos;s a storyteller!</p>
        <p className="opacity-60 mb-8">
          {queue.length} student{queue.length !== 1 ? 's' : ''} in the spotlight
        </p>
        <button
          onClick={restart}
          className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
        >
          PLAY AGAIN
        </button>
      </motion.div>
    );
  }

  return null;
}
