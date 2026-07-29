'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import { ActivityStatus, type Vote, type FactDetectiveContent, type FactDetectiveClaim } from './types';
import { VocabPill } from '@/components/ui/vocab-pill';

export function FactDetectiveActivity({
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  isMicroEvent,
}: ActivityProps) {
  const content = generatedContent as FactDetectiveContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [currentClaimIndex, setCurrentClaimIndex] = useState(0);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const scoredVotesRef = useRef<Set<string>>(new Set());

  const currentClaim: FactDetectiveClaim | undefined = content.claims?.[currentClaimIndex];

  // Register input spec for student controller
  useEffect(() => {
    if (status === ActivityStatus.VOTING && currentClaim) {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'fact-detective',
        prompt: `Is this TRUE or FALSE? "${currentClaim.statement}"`,
        optionLabels: ['TRUE', 'FALSE'],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentClaim, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (status !== ActivityStatus.VOTING) return;

      const believesTrue = vote.choice === 'TRUE';
      setVotes((prev) => {
        const filtered = prev.filter((v) => v.clientId !== vote.clientId);
        return [...filtered, {
          clientId: vote.clientId,
          studentId: vote.studentId ?? null,
          studentName: vote.displayName,
          believesTrue,
        }];
      });
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, onRegisterRemoteVoteHandler]);

  const startActivity = useCallback(() => {
    scoredVotesRef.current = new Set();
    setStatus(ActivityStatus.CLAIM);
    onPhaseChange?.('claim');
  }, [onPhaseChange]);

  const startVoting = useCallback(() => {
    setStatus(ActivityStatus.VOTING);
    setVotes([]);
    onPhaseChange?.('voting');
  }, [onPhaseChange]);

  const revealTruth = useCallback(() => {
    if (!currentClaim) return;

    // Calculate how many got it right
    const correctVotes = votes.filter((v) => v.believesTrue === currentClaim.isTrue);
    setScore((prev) => ({
      correct: prev.correct + correctVotes.length,
      total: prev.total + votes.length,
    }));
    votes.forEach((vote) => {
      const scoreKey = `${currentClaimIndex}:${vote.clientId}`;
      if (scoredVotesRef.current.has(scoreKey)) return;
      scoredVotesRef.current.add(scoreKey);
      const isCorrect = vote.believesTrue === currentClaim.isTrue;
      void onScore?.({
        studentId: vote.studentId,
        clientId: vote.clientId,
        displayName: vote.studentName,
        promptIndex: currentClaimIndex + 1,
        points: isCorrect ? 3 : 1,
        isCorrect,
      });
    });

    setStatus(ActivityStatus.REVEAL);
    onPhaseChange?.('reveal');
  }, [currentClaim, currentClaimIndex, votes, onScore, onPhaseChange]);

  const showVocab = useCallback(() => {
    setShowVocabulary(true);
    setStatus(ActivityStatus.VOCABULARY);
    onPhaseChange?.('vocabulary');
  }, [onPhaseChange]);

  const nextClaim = useCallback(() => {
    if (!isMicroEvent && currentClaimIndex < (content.claims?.length || 0) - 1) {
      setCurrentClaimIndex((prev) => prev + 1);
      setVotes([]);
      setShowVocabulary(false);
      setStatus(ActivityStatus.CLAIM);
      onPhaseChange?.('claim');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [isMicroEvent, currentClaimIndex, content.claims?.length, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setCurrentClaimIndex(0);
    setVotes([]);
    setShowVocabulary(false);
    setScore({ correct: 0, total: 0 });
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-white bg-white/10';
    }
  };

  if (!content.claims || content.claims.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No claims available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-blue-400">Fact Detective</h3>
          {customTopic && customTopic !== 'General' && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isMicroEvent && (
            <span className="text-sm opacity-60">
              Claim {currentClaimIndex + 1} / {content.claims.length}
            </span>
          )}
          {currentClaim && (
            <span className={`text-xs uppercase px-2 py-0.5 rounded ${getDifficultyColor(currentClaim.difficulty)}`}>
              {currentClaim.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Fact or Fiction?</p>
          <p className="opacity-60 text-sm mb-8">
            topic-generated claims mixing facts with myths. Can you spot the truth?
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START INVESTIGATING
          </button>
        </motion.div>
      )}

      {/* CLAIM State */}
      {status === ActivityStatus.CLAIM && currentClaim && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Is this TRUE or FALSE?
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-2xl border-2 border-blue-500/30"
          >
            <p className="text-2xl font-semibold text-center leading-relaxed">
              &ldquo;{currentClaim.statement}&rdquo;
            </p>
          </motion.div>

          <div className="flex justify-center pt-4">
            <button
              onClick={startVoting}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              VOTE NOW
            </button>
          </div>
        </motion.div>
      )}

      {/* VOTING State */}
      {status === ActivityStatus.VOTING && currentClaim && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-lg">&ldquo;{currentClaim.statement}&rdquo;</p>
          </div>

          {/* Options only — the split and voter names are held back until reveal so the
              projected screen can't nudge the class toward the popular answer. */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-2 border-green-500/30 text-center">
              <p className="text-green-400 font-bold">TRUE</p>
            </div>
            <div className="glass p-6 rounded-2xl border-2 border-red-500/30 text-center">
              <p className="text-red-400 font-bold">FALSE</p>
            </div>
          </div>
          <p className="text-center text-sm opacity-60">
            {votes.length === 0
              ? 'Waiting for votes…'
              : `${votes.length} vote${votes.length !== 1 ? 's' : ''} in`}
          </p>

          <div className="flex justify-center">
            <button
              onClick={revealTruth}
              disabled={votes.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              REVEAL TRUTH
            </button>
          </div>
        </motion.div>
      )}

      {/* REVEAL State */}
      {(status === ActivityStatus.REVEAL || status === ActivityStatus.VOCABULARY) && currentClaim && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`glass p-8 rounded-2xl border-4 text-center ${
              currentClaim.isTrue
                ? 'border-green-500 bg-green-500/10'
                : 'border-red-500 bg-red-500/10'
            }`}
          >
            <p className="text-4xl font-game mb-4">
              {currentClaim.isTrue ? (
                <span className="text-green-400">TRUE!</span>
              ) : (
                <span className="text-red-400">FALSE!</span>
              )}
            </p>
            <p className="text-lg opacity-90">&ldquo;{currentClaim.statement}&rdquo;</p>
          </motion.div>

          <div className="glass p-6 rounded-2xl">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">The Explanation</p>
            <p className="text-lg">{currentClaim.explanation}</p>
          </div>

          {/* Vote results */}
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-game text-green-400">
                  {votes.filter((v) => v.believesTrue === currentClaim.isTrue).length}
                </p>
                <p className="text-xs opacity-60">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-game text-red-400">
                  {votes.filter((v) => v.believesTrue !== currentClaim.isTrue).length}
                </p>
                <p className="text-xs opacity-60">Wrong</p>
              </div>
            </div>
          </div>

          {/* Vocabulary Section */}
          <AnimatePresence>
            {showVocabulary && currentClaim.vocabulary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border-2 border-yellow-500/30"
              >
                <p className="text-sm uppercase tracking-widest opacity-50 mb-3">Key Vocabulary</p>
                <div className="flex flex-wrap gap-2">
                  {currentClaim.vocabulary.map((word, i) => (
                    <VocabPill key={i} word={word} className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg font-medium" />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 justify-center">
            {!showVocabulary && currentClaim.vocabulary.length > 0 && (
              <button
                onClick={showVocab}
                className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-yellow-500/30 text-yellow-400"
              >
                SHOW VOCABULARY
              </button>
            )}
            <button
              onClick={nextClaim}
              className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentClaimIndex < content.claims.length - 1 ? 'NEXT CLAIM' : 'FINISH'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-blue-400 mb-4">Investigation Complete!</p>
          <p className="text-4xl font-game mb-2">
            {score.correct} / {score.total}
            <span className="text-lg opacity-50 ml-2">correct votes</span>
          </p>
          <p className="opacity-70 mb-8">
            across {content.claims.length} claims
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            INVESTIGATE AGAIN
          </button>
        </motion.div>
      )}
    </div>
  );
}
