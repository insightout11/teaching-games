'use client';

// Vocab Micro ("Comms Check") — one quick "which word fits?" gap. Single-round flight-plan
// micro-event: students vote a word, teacher reveals the answer + meaning, then it ends.

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Radio } from 'lucide-react';
import type { ActivityProps, VocabMicroContent } from '../types';

type Phase = 'idle' | 'voting' | 'reveal';
type VocabVote = { clientId: string; studentId: string | null; displayName: string; choice: string };

export function VocabMicroActivity({
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as VocabMicroContent;
  const options = useMemo(() => content?.options ?? [], [content]);
  const correct = options[content?.correctIndex ?? 0];

  const [phase, setPhase] = useState<Phase>('idle');
  const [votes, setVotes] = useState<VocabVote[]>([]);
  const [scored, setScored] = useState(false);

  useEffect(() => {
    if (phase === 'voting') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'vocab-micro',
        prompt: content.sentence,
        options,
        optionLabels: options,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, content, onSetInputSpec, options]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'voting') return;
      setVotes((prev) => {
        const filtered = prev.filter((v) => v.clientId !== vote.clientId);
        return [...filtered, {
          clientId: vote.clientId,
          studentId: vote.studentId ?? null,
          displayName: vote.displayName,
          choice: vote.choice,
        }];
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, onRegisterRemoteVoteHandler]);

  const countFor = useCallback((opt: string) => votes.filter((v) => v.choice === opt).length, [votes]);

  const startVoting = useCallback(() => { setVotes([]); setPhase('voting'); onPhaseChange?.('voting'); }, [onPhaseChange]);
  const endVoting = useCallback(() => { setPhase('reveal'); onPhaseChange?.('reveal'); }, [onPhaseChange]);

  const done = useCallback(async () => {
    if (!scored && onScore) {
      setScored(true);
      await Promise.allSettled(votes.map((vote) => onScore({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: 1,
        points: vote.choice === correct ? 10 : 0,
        isCorrect: vote.choice === correct,
      })));
    }
    onSetInputSpec?.(null);
    setPhase('idle');
    onPhaseChange?.('finished');
  }, [scored, votes, onScore, correct, onSetInputSpec, onPhaseChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-sky-400">
          <Radio className="h-5 w-5" aria-hidden /> Comms Check
        </h3>
        <span className="text-xs uppercase tracking-widest opacity-40">Micro-event · Which word fits?</span>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="mb-2 text-xs uppercase tracking-widest opacity-50">Fill the gap</p>
        <p className="text-lg font-semibold leading-relaxed">{content?.sentence}</p>
      </div>

      {phase === 'idle' && (
        <div className="text-center">
          <button
            onClick={startVoting}
            className="rounded-full border-4 border-white/20 bg-gradient-to-br from-sky-500 to-cyan-600 px-12 py-6 font-game text-2xl text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            START
          </button>
        </div>
      )}

      {(phase === 'voting' || phase === 'reveal') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {options.map((opt) => {
            const isCorrect = opt === correct;
            const revealed = phase === 'reveal';
            return (
              <div
                key={opt}
                className={`glass flex items-center justify-between rounded-2xl border-2 p-4 ${revealed && isCorrect ? 'border-emerald-400/60' : 'border-white/10'}`}
              >
                <span className="flex items-center gap-2 text-base font-semibold">
                  {revealed && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-400" aria-hidden />}
                  {opt}
                </span>
                <span className="text-xs opacity-50">{countFor(opt)} {countFor(opt) === 1 ? 'vote' : 'votes'}</span>
              </div>
            );
          })}
          <div className="flex justify-center pt-2">
            {phase === 'voting' ? (
              <button
                onClick={endVoting}
                disabled={votes.length === 0}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-8 py-4 font-game text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              >
                REVEAL ANSWER
              </button>
            ) : (
              <button
                onClick={done}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-10 py-4 font-game text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                DONE
              </button>
            )}
          </div>
        </motion.div>
      )}

      {phase === 'reveal' && (content?.explanation || content?.example) && (
        <div className="glass space-y-1 rounded-2xl border border-amber-400/30 p-5">
          <p className="text-xs uppercase tracking-widest opacity-50">{content.word}</p>
          {content.explanation && <p className="text-sm">{content.explanation}</p>}
          {content.example && <p className="text-sm italic opacity-70">{content.example}</p>}
        </div>
      )}
    </div>
  );
}
