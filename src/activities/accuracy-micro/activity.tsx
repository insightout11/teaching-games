'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { AccuracyMicroContent, AccuracyMicroVote } from './types';

type Phase = 'idle' | 'presenting' | 'voting' | 'reveal';

export function AccuracyMicroActivity({
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as AccuracyMicroContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [votes, setVotes] = useState<AccuracyMicroVote[]>([]);
  const [scored, setScored] = useState(false);

  // Option A = sentence with error, Option B = corrected sentence (always correct)
  useEffect(() => {
    if (phase === 'voting') {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'accuracy-micro',
        prompt: 'Which sentence is correct?',
        options: [content.sentence, content.correctedSentence],
        optionLabels: ['A', 'B'],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, content, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'voting') return;
      setVotes((prev) => {
        const filtered = prev.filter((v) => v.clientId !== vote.clientId);
        return [...filtered, {
          clientId: vote.clientId,
          studentId: vote.studentId ?? null,
          displayName: vote.displayName,
          choice: vote.choice as 'A' | 'B',
        }];
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, onRegisterRemoteVoteHandler]);

  const stats = useMemo(() => {
    const aVotes = votes.filter((v) => v.choice === 'A');
    const bVotes = votes.filter((v) => v.choice === 'B');
    const total = votes.length;
    return {
      aCount: aVotes.length,
      bCount: bVotes.length,
      aPercent: total > 0 ? Math.round((aVotes.length / total) * 100) : 50,
      bPercent: total > 0 ? Math.round((bVotes.length / total) * 100) : 50,
    };
  }, [votes]);

  const start = useCallback(() => {
    setPhase('presenting');
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const startVoting = useCallback(() => {
    setVotes([]);
    setPhase('voting');
    onPhaseChange?.('voting');
  }, [onPhaseChange]);

  const endVoting = useCallback(() => {
    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [onPhaseChange]);

  const scoreVoters = useCallback(async () => {
    if (scored || !onScore) return;
    setScored(true);

    const scorePromises = votes.map((vote) => {
      const isCorrect = vote.choice === 'B';
      return onScore({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: 1,
        points: isCorrect ? 10 : 0,
        isCorrect,
      });
    });

    await Promise.allSettled(scorePromises);
  }, [scored, votes, onScore]);

  const done = useCallback(async () => {
    await scoreVoters();
    onSetInputSpec?.(null);
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [scoreVoters, onSetInputSpec, onPhaseChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-400">Accuracy Check</h3>
        <span className="text-xs opacity-40 uppercase tracking-widest">Quick check</span>
      </div>

      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-xs uppercase tracking-widest opacity-50">Spot the error</p>
            <p className="text-base font-semibold leading-relaxed opacity-80">{content.sentence}</p>
            <p className="text-xs opacity-40 italic">Students will choose between two versions of this sentence.</p>
          </div>
          <div className="text-center">
            <button
              onClick={start}
              className="px-12 py-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'presenting' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <p className="text-center text-sm uppercase tracking-widest opacity-50">Which sentence is correct?</p>
          <div className="space-y-3">
            <div className="glass p-5 rounded-2xl border-2 border-red-400/20">
              <p className="text-red-400 text-sm font-bold mb-2">Option A</p>
              <p className="text-base font-semibold">{content.sentence}</p>
            </div>
            <div className="glass p-5 rounded-2xl border-2 border-emerald-400/20">
              <p className="text-emerald-400 text-sm font-bold mb-2">Option B</p>
              <p className="text-base font-semibold">{content.correctedSentence}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={startVoting}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START VOTING
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'voting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Projected screen: keep A/B neutral while voting — no per-option counts,
              no voter names, no red/green tell (B is always the correct sentence). */}
          <div className="space-y-3">
            <div className="glass p-5 rounded-2xl border-2 border-white/10">
              <p className="text-slate-300 text-sm font-bold mb-1">A</p>
              <p className="text-sm font-semibold">{content.sentence}</p>
            </div>
            <div className="glass p-5 rounded-2xl border-2 border-white/10">
              <p className="text-slate-300 text-sm font-bold mb-1">B</p>
              <p className="text-sm font-semibold">{content.correctedSentence}</p>
            </div>
          </div>
          <p className="text-center text-sm opacity-60">
            {votes.length} {votes.length === 1 ? 'student has' : 'students have'} voted
          </p>
          <div className="flex justify-center">
            <button
              onClick={endVoting}
              disabled={votes.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              REVEAL ANSWER
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div className="space-y-3">
            <div className="glass p-5 rounded-2xl border-2 border-red-400/30 flex gap-3 items-start">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-400 text-sm font-bold mb-1">A — Incorrect ({stats.aCount} voted)</p>
                <p className="text-sm font-semibold opacity-70 line-through">{content.sentence}</p>
              </div>
            </div>
            <div className="glass p-5 rounded-2xl border-2 border-emerald-400/50 flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-emerald-400 text-sm font-bold mb-1">B — Correct ✓ ({stats.bCount} voted)</p>
                <p className="text-sm font-semibold">{content.correctedSentence}</p>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-amber-400/30 space-y-1">
            <p className="text-xs uppercase tracking-widest opacity-50">Error: {content.errorType}</p>
            <p className="text-sm">{content.explanation}</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={done}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
