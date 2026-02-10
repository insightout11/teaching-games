'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import { ActivityStatus, type Vote, type WouldYouRatherContent, type WouldYouRatherDilemma } from './types';

export function WouldYouRatherActivity({
  students,
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: ActivityProps) {
  const content = generatedContent as WouldYouRatherContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [currentDilemmaIndex, setCurrentDilemmaIndex] = useState(0);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);

  const currentDilemma: WouldYouRatherDilemma | undefined = content.dilemmas[currentDilemmaIndex];

  // Register input spec for student controller
  useEffect(() => {
    if (status === ActivityStatus.VOTING && currentDilemma) {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'would-you-rather',
        prompt: 'Would you rather...',
        options: [currentDilemma.optionA, currentDilemma.optionB],
        optionLabels: ['A', 'B'],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentDilemma, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      // Only process votes during voting phase
      if (status !== ActivityStatus.VOTING) return;

      // Add the vote (choice is "A" or "B")
      setVotes((prev) => {
        // Remove existing vote from this client
        const filtered = prev.filter((v) => v.studentId !== vote.clientId);
        return [...filtered, {
          studentId: vote.clientId,
          studentName: vote.displayName,
          choice: vote.choice as 'A' | 'B',
        }];
      });
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, onRegisterRemoteVoteHandler]);

  // Calculate vote stats
  const voteStats = useMemo(() => {
    const aVotes = votes.filter((v) => v.choice === 'A');
    const bVotes = votes.filter((v) => v.choice === 'B');
    const total = votes.length;
    return {
      aCount: aVotes.length,
      bCount: bVotes.length,
      aPercent: total > 0 ? Math.round((aVotes.length / total) * 100) : 0,
      bPercent: total > 0 ? Math.round((bVotes.length / total) * 100) : 0,
      aVoters: aVotes.map((v) => v.studentName),
      bVoters: bVotes.map((v) => v.studentName),
      majority: aVotes.length > bVotes.length ? 'A' : bVotes.length > aVotes.length ? 'B' : 'tie',
    };
  }, [votes]);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.PRESENTING);
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const startVoting = useCallback(() => {
    setStatus(ActivityStatus.VOTING);
    setVotes([]);
    onPhaseChange?.('voting');
  }, [onPhaseChange]);

  const recordVote = useCallback((studentId: string, choice: 'A' | 'B') => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setVotes((prev) => {
      // Remove existing vote from this student
      const filtered = prev.filter((v) => v.studentId !== studentId);
      return [...filtered, { studentId, studentName: student.name, choice }];
    });
  }, [students]);

  const endVoting = useCallback(() => {
    setStatus(ActivityStatus.DISCUSSING);
    onPhaseChange?.('discussing');
  }, [onPhaseChange]);

  const requestFollowUp = useCallback(async () => {
    if (!currentDilemma) return;

    setIsLoadingFollowUp(true);
    setStatus(ActivityStatus.FOLLOW_UP);
    onPhaseChange?.('follow-up');

    try {
      // Check for pre-generated follow-ups first
      const preGenerated = content.potentialFollowUps[currentDilemma.id];
      if (preGenerated && preGenerated.length > 0) {
        // Use a pre-generated follow-up based on majority
        const index = voteStats.majority === 'A' ? 0 : voteStats.majority === 'B' ? 1 : 2;
        setFollowUpQuestion(preGenerated[index % preGenerated.length]);
      } else {
        // Call API for dynamic follow-up
        const response = await onContinue({
          sessionId: '',
          activityKey: 'would-you-rather',
          topicContext: content.topicContext,
          previousExchanges: [
            { role: 'system', content: `Dilemma: ${currentDilemma.optionA} vs ${currentDilemma.optionB}`, timestamp: Date.now() },
            { role: 'student', content: `Votes: ${voteStats.aCount} chose A, ${voteStats.bCount} chose B`, timestamp: Date.now() },
          ],
          studentResponse: `Majority chose ${voteStats.majority === 'A' ? currentDilemma.optionA : currentDilemma.optionB}`,
          requestType: 'follow-up',
        });

        setFollowUpQuestion(response.nextQuestion || 'What made you choose your answer?');
      }
    } catch (error) {
      console.error('Failed to get follow-up:', error);
      setFollowUpQuestion('What made you choose your answer?');
    } finally {
      setIsLoadingFollowUp(false);
    }
  }, [currentDilemma, content, voteStats, onContinue, onPhaseChange]);

  const nextDilemma = useCallback(() => {
    if (currentDilemmaIndex < content.dilemmas.length - 1) {
      setCurrentDilemmaIndex((prev) => prev + 1);
      setVotes([]);
      setFollowUpQuestion(null);
      setStatus(ActivityStatus.PRESENTING);
      onPhaseChange?.('presenting');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [currentDilemmaIndex, content.dilemmas.length, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setCurrentDilemmaIndex(0);
    setVotes([]);
    setFollowUpQuestion(null);
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-cyan-400">Would You Rather?</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="text-sm opacity-60">
          {currentDilemmaIndex + 1} / {content.dilemmas.length}
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-6 opacity-90">
            Get students talking with fun dilemmas!
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START
          </button>
        </motion.div>
      )}

      {/* PRESENTING State */}
      {status === ActivityStatus.PRESENTING && currentDilemma && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-4">Would you rather...</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-2 border-purple-500/30 text-center">
              <span className="text-purple-400 text-sm font-bold">Option A</span>
              <p className="text-xl font-semibold mt-2">{currentDilemma.optionA}</p>
            </div>
            <div className="glass p-6 rounded-2xl border-2 border-pink-500/30 text-center">
              <span className="text-pink-400 text-sm font-bold">Option B</span>
              <p className="text-xl font-semibold mt-2">{currentDilemma.optionB}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startVoting}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START VOTING
            </button>
          </div>
        </motion.div>
      )}

      {/* VOTING State */}
      {status === ActivityStatus.VOTING && currentDilemma && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-2 border-purple-500/50">
              <span className="text-purple-400 text-sm font-bold block mb-2">Option A</span>
              <p className="text-lg font-semibold mb-4">{currentDilemma.optionA}</p>
              <div className="text-4xl font-game text-purple-400 mb-2">{voteStats.aCount}</div>
              <p className="text-xs opacity-60">{voteStats.aVoters.join(', ') || 'No votes yet'}</p>
            </div>
            <div className="glass p-6 rounded-2xl border-2 border-pink-500/50">
              <span className="text-pink-400 text-sm font-bold block mb-2">Option B</span>
              <p className="text-lg font-semibold mb-4">{currentDilemma.optionB}</p>
              <div className="text-4xl font-game text-pink-400 mb-2">{voteStats.bCount}</div>
              <p className="text-xs opacity-60">{voteStats.bVoters.join(', ') || 'No votes yet'}</p>
            </div>
          </div>

          {/* Student voting buttons */}
          <div className="glass p-4 rounded-2xl">
            <p className="text-sm font-bold mb-3 opacity-70">Click to record votes:</p>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => {
                const existingVote = votes.find((v) => v.studentId === student.id);
                return (
                  <div key={student.id} className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">{student.name}:</span>
                    <button
                      onClick={() => recordVote(student.id, 'A')}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        existingVote?.choice === 'A'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 hover:bg-purple-500/30'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => recordVote(student.id, 'B')}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        existingVote?.choice === 'B'
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 hover:bg-pink-500/30'
                      }`}
                    >
                      B
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={endVoting}
              disabled={votes.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              END VOTING
            </button>
          </div>
        </motion.div>
      )}

      {/* DISCUSSING State */}
      {status === ActivityStatus.DISCUSSING && currentDilemma && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Results visualization */}
          <div className="glass p-6 rounded-2xl">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-4 text-center">Results</p>

            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-l-full transition-all"
                style={{ width: `${voteStats.aPercent}%`, minWidth: voteStats.aCount > 0 ? '40px' : '0' }}
              >
                {voteStats.aCount > 0 && (
                  <span className="flex items-center justify-center h-full text-sm font-bold">
                    {voteStats.aPercent}%
                  </span>
                )}
              </div>
              <div
                className="h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-r-full transition-all"
                style={{ width: `${voteStats.bPercent}%`, minWidth: voteStats.bCount > 0 ? '40px' : '0' }}
              >
                {voteStats.bCount > 0 && (
                  <span className="flex items-center justify-center h-full text-sm font-bold">
                    {voteStats.bPercent}%
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-400 font-bold">A: </span>
                {voteStats.aVoters.join(', ') || 'None'}
              </div>
              <div>
                <span className="text-pink-400 font-bold">B: </span>
                {voteStats.bVoters.join(', ') || 'None'}
              </div>
            </div>
          </div>

          {/* Discussion prompt */}
          <div className="glass p-6 rounded-2xl border-2 border-cyan-500/30">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Discussion Prompt</p>
            <p className="text-lg font-semibold">{currentDilemma.discussionPrompt}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={requestFollowUp}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-cyan-500/30"
            >
              GET FOLLOW-UP
            </button>
            <button
              onClick={nextDilemma}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentDilemmaIndex < content.dilemmas.length - 1 ? 'NEXT DILEMMA' : 'FINISH'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FOLLOW_UP State */}
      {status === ActivityStatus.FOLLOW_UP && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {isLoadingFollowUp ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
                <p className="font-game text-lg text-cyan-400 animate-pulse">
                  Generating follow-up...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl border-2 border-yellow-500/30"
              >
                <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Follow-up Question</p>
                <p className="text-xl font-semibold">{followUpQuestion}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isLoadingFollowUp && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={requestFollowUp}
                className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-cyan-500/30"
              >
                ANOTHER FOLLOW-UP
              </button>
              <button
                onClick={nextDilemma}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                {currentDilemmaIndex < content.dilemmas.length - 1 ? 'NEXT DILEMMA' : 'FINISH'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-cyan-400 mb-4">Activity Complete!</p>
          <p className="opacity-70 mb-8">
            You discussed {content.dilemmas.length} dilemmas
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            RESTART ACTIVITY
          </button>
        </motion.div>
      )}
    </div>
  );
}
