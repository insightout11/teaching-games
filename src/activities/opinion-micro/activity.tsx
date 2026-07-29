'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import type { OpinionMicroContent, OpinionMicroVote } from './types';

type Phase = 'idle' | 'presenting' | 'voting' | 'result';

export function OpinionMicroActivity({
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: ActivityProps) {
  const content = generatedContent as OpinionMicroContent;
  const { dilemma } = content;

  const [phase, setPhase] = useState<Phase>('idle');
  const [votes, setVotes] = useState<OpinionMicroVote[]>([]);

  useEffect(() => {
    if (phase === 'voting') {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'opinion-micro',
        prompt: 'Would you rather...',
        options: [dilemma.optionA, dilemma.optionB],
        optionLabels: ['A', 'B'],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, dilemma, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'voting') return;
      setVotes((prev) => {
        const filtered = prev.filter((v) => v.clientId !== vote.clientId);
        return [...filtered, {
          clientId: vote.clientId,
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
      aVoters: aVotes.map((v) => v.displayName),
      bVoters: bVotes.map((v) => v.displayName),
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
    setPhase('result');
    onPhaseChange?.('result');
  }, [onPhaseChange]);

  const done = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-lc-blue">Opinion Pulse</h3>
        <span className="text-xs opacity-40 uppercase tracking-widest">Micro-event</span>
      </div>

      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-xs uppercase tracking-widest opacity-50">Would you rather...</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass p-4 rounded-xl border border-lc-blue/20 text-center">
                <p className="text-sm font-bold text-lc-blue mb-1">A</p>
                <p className="text-sm font-semibold">{dilemma.optionA}</p>
              </div>
              <div className="glass p-4 rounded-xl border border-sky-400/20 text-center">
                <p className="text-sm font-bold text-sky-400 mb-1">B</p>
                <p className="text-sm font-semibold">{dilemma.optionB}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={start}
              className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
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
          <p className="text-center text-sm uppercase tracking-widest opacity-50">Would you rather...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-2 border-lc-blue/25 text-center">
              <p className="text-lc-blue text-sm font-bold mb-2">Option A</p>
              <p className="text-xl font-semibold">{dilemma.optionA}</p>
            </div>
            <div className="glass p-6 rounded-2xl border-2 border-sky-400/30 text-center">
              <p className="text-sky-400 text-sm font-bold mb-2">Option B</p>
              <p className="text-xl font-semibold">{dilemma.optionB}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={startVoting}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
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
          {/* Options only — the split and voter names are held back until END VOTING so the
              projected screen can't nudge the class or expose who picked what. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-2 border-lc-blue/25">
              <p className="text-lc-blue text-sm font-bold mb-2">Option A</p>
              <p className="text-base font-semibold">{dilemma.optionA}</p>
            </div>
            <div className="glass p-6 rounded-2xl border-2 border-sky-400/30">
              <p className="text-sky-400 text-sm font-bold mb-2">Option B</p>
              <p className="text-base font-semibold">{dilemma.optionB}</p>
            </div>
          </div>
          <p className="text-center text-sm opacity-50">
            {votes.length === 0
              ? 'Waiting for votes…'
              : `${votes.length} vote${votes.length !== 1 ? 's' : ''} in`}
          </p>
          <div className="flex justify-center">
            <button
              onClick={endVoting}
              disabled={votes.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              END VOTING
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl space-y-4">
            <p className="text-xs uppercase tracking-widest opacity-50 text-center">Results</p>
            <div className="flex h-8 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-lc-blue to-blue-500 flex items-center justify-center text-sm font-bold transition-all"
                style={{ width: `${stats.aPercent}%` }}
              >
                {stats.aCount > 0 && `${stats.aPercent}%`}
              </div>
              <div
                className="bg-gradient-to-r from-sky-400 to-sky-500 flex items-center justify-center text-sm font-bold transition-all"
                style={{ width: `${stats.bPercent}%` }}
              >
                {stats.bCount > 0 && `${stats.bPercent}%`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-lc-blue font-bold">A: </span>
                {stats.aVoters.join(', ') || 'None'}
              </div>
              <div>
                <span className="text-sky-400 font-bold">B: </span>
                {stats.bVoters.join(', ') || 'None'}
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-cyan-500/30">
            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Discussion Prompt</p>
            <p className="text-base font-semibold">{dilemma.discussionPrompt}</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={done}
              className="px-10 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
