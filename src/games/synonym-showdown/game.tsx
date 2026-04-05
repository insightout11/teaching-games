'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus } from './types';
import type { Challenge, SynonymValidation } from './types';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';

const EMPTY_SEEN: string[] = [];

interface RemoteSynonym {
  displayName: string;
  word: string;
  score: number;
  quality: string;
  isValid: boolean;
}

export function SynonymShowdownGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [submittedSynonyms, setSubmittedSynonyms] = useState<string[]>([]);
  const [validSynonyms, setValidSynonyms] = useState<Array<{ word: string; score: number; quality: string }>>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(sessionSettings.timerSeconds);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remote player submissions (simultaneous mode)
  const isSimultaneous = students.length >= 3;
  const [remoteSynonyms, setRemoteSynonyms] = useState<RemoteSynonym[]>([]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Repetition tracking — read from store but keep refs to avoid stale closures in callbacks
  const addSeenItems = useSessionStore((s) => s.addSeenItems);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const storeSeenItems = useSessionStore((s) => s.seenItemsByGame['synonym-showdown']) ?? EMPTY_SEEN;
  const storeSeenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const seenItemsRef = useRef<string[]>([]);
  const seenCacheIdsRef = useRef<string[]>([]);
  const accumulatedValidSynonymsRef = useRef<string[]>([]);
  useEffect(() => { seenItemsRef.current = storeSeenItems; }, [storeSeenItems]);
  useEffect(() => { seenCacheIdsRef.current = storeSeenCacheIds; }, [storeSeenCacheIds]);

  // Keep refs for handlers
  const challengeRef = useRef<Challenge | null>(null);
  challengeRef.current = challenge;
  const submittedSynonymsRef = useRef<string[]>([]);
  submittedSynonymsRef.current = submittedSynonyms;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.PLAYING && challenge) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'synonym-showdown',
        prompt: `Find synonyms for: "${challenge.targetWord}"`,
        placeholder: 'Type a synonym...',
        maxLength: 50,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, challenge, onSetInputSpec]);

  // Register remote vote handler for direct real-time submissions
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
      if (statusRef.current !== GameStatus.PLAYING) return;

      const ch = challengeRef.current;
      if (!ch) return;

      const synonym = vote.choice?.trim().toLowerCase();
      if (!synonym) return;

      // Check duplicates
      if (submittedSynonymsRef.current.includes(synonym)) return;

      const studentId = vote.studentId || vote.clientId;
      if (!studentId) return;

      // Add to submitted list
      setSubmittedSynonyms(prev => [...prev, synonym]);

      // Evaluate asynchronously
      fetch('/api/synonym-showdown/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: ch.targetWord,
          contextSentence: ch.contextSentence,
          synonym,
          difficulty: sessionSettings.difficulty,
        }),
      })
        .then(res => res.json())
        .then((result: SynonymValidation) => {
          if (result.isValid) {
            setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
            setTotalScore(prev => prev + result.score);
          }

          // Score the remote student
          onScore(studentId, {
            isCorrect: result.isValid,
            points: result.score,
            responseData: { synonym, quality: result.quality },
          });

          // Track remote submission for display
          setRemoteSynonyms(prev => [...prev, {
            displayName: vote.displayName,
            word: synonym,
            score: result.score,
            quality: result.quality,
            isValid: result.isValid,
          }]);
        })
        .catch(() => {});
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterRemoteVoteHandler, onScore]);

  // Register submission handler (fallback for approval-based flow)
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      handleSubmission: async (content: string) => {
        const ch = challengeRef.current;
        if (!ch) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        const synonym = content.trim().toLowerCase();
        if (submittedSynonymsRef.current.includes(synonym)) {
          return { isCorrect: false, points: 0, feedback: 'Already submitted!' };
        }

        try {
          const response = await fetch('/api/synonym-showdown/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetWord: ch.targetWord,
              contextSentence: ch.contextSentence,
              synonym,
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: SynonymValidation = await response.json();

          setSubmittedSynonyms(prev => [...prev, synonym]);
          if (result.isValid) {
            setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
          }

          return {
            isCorrect: result.isValid,
            points: result.score,
            feedback: result.feedback,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterSubmissionHandler]);

  const finishGame = useCallback(() => {
    if (!isSimultaneous && !currentStudentId) return;

    setStatus(GameStatus.FINISHED);

    // Only score the current student in turn-based mode
    if (!isSimultaneous && currentStudentId) {
      const avgScore = validSynonyms.length > 0
        ? Math.round(validSynonyms.reduce((sum, s) => sum + s.score, 0) / validSynonyms.length)
        : 0;

      onScore(currentStudentId, {
        isCorrect: validSynonyms.length >= 3,
        points: Math.min(10, Math.round(totalScore / 10)),
        responseData: {
          targetWord: challenge?.targetWord,
          validSynonyms: validSynonyms.map(s => s.word),
          totalSynonyms: validSynonyms.length,
          averageQuality: avgScore,
          totalScore
        }
      });
    }
  }, [isSimultaneous, currentStudentId, validSynonyms, totalScore, challenge, onScore]);

  // Timer effect
  useEffect(() => {
    if (status !== GameStatus.PLAYING || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeRemaining, finishGame]);

  const handleGenerate = async () => {
    if (!isSimultaneous && !currentStudentId) {
      onPickStudent();
      return;
    }

    // Accumulate valid synonyms from this round before resetting, so the next word avoids this cluster
    if (validSynonyms.length > 0) {
      accumulatedValidSynonymsRef.current = [
        ...accumulatedValidSynonymsRef.current,
        ...validSynonyms.map(v => v.word),
      ];
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setSubmittedSynonyms([]);
    setValidSynonyms([]);
    setCurrentStreak(0);
    setTotalScore(0);
    setTimeRemaining(sessionSettings.timerSeconds);
    setLastFeedback(null);
    setCurrentInput('');
    setRemoteSynonyms([]);

    try {
      const response = await fetch('/api/synonym-showdown/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          seenItems: seenItemsRef.current,
          excludeCacheIds: seenCacheIdsRef.current,
          seenSynonyms: accumulatedValidSynonymsRef.current,
        }),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();

      // Track what we've seen to avoid repetition
      if (data.targetWord) addSeenItems('synonym-showdown', [data.targetWord]);
      if (data.cacheId) addSeenCacheId(data.cacheId);

      setChallenge(data);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSubmitSynonym = async () => {
    if (!currentInput.trim() || !challenge || isEvaluating || status !== GameStatus.PLAYING) return;

    const synonym = currentInput.trim().toLowerCase();

    if (submittedSynonyms.includes(synonym)) {
      setLastFeedback('Already submitted!');
      setCurrentInput('');
      return;
    }

    setIsEvaluating(true);
    setSubmittedSynonyms(prev => [...prev, synonym]);
    setCurrentInput('');

    try {
      const response = await fetch('/api/synonym-showdown/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: challenge.targetWord,
          contextSentence: challenge.contextSentence,
          synonym,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: SynonymValidation = await response.json();
      setLastFeedback(result.feedback);

      if (result.isValid) {
        setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
        setCurrentStreak(prev => prev + 1);
        setTotalScore(prev => prev + result.score);
      } else {
        setCurrentStreak(0);
      }
    } catch (err) {
      console.error(err);
      setLastFeedback('Error evaluating. Try again!');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitSynonym();
    }
  };

  const handleSameChallenge = () => {
    setSubmittedSynonyms([]);
    setValidSynonyms([]);
    setCurrentStreak(0);
    setTotalScore(0);
    setTimeRemaining(sessionSettings.timerSeconds);
    setLastFeedback(null);
    setCurrentInput('');
    setRemoteSynonyms([]);
    setStatus(GameStatus.PLAYING);
    if (!isSimultaneous) onPickStudent();
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'from-yellow-400 to-amber-500';
      case 'good': return 'from-emerald-400 to-emerald-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {isSimultaneous ? (
            <p className="text-lg font-semibold text-cyan-400">
              Everyone plays! ({students.length} students)
            </p>
          ) : currentStudent ? (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          ) : (
            <p className="opacity-70 text-sm">Pick a student to start</p>
          )}
        </div>
        <div className="text-xs opacity-40">
          {sessionSettings.difficulty} / {sessionSettings.topic}
        </div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">How to Play</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {isSimultaneous
                ? 'All students type synonyms on their devices before time runs out! Each valid synonym earns points.'
                : 'List as many synonyms as you can before time runs out! Build streaks for bonus points.'
              }
            </p>
          </div>

          {!isSimultaneous && !currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START GAME
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-12"
        >
          <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-orange-400 uppercase tracking-widest animate-pulse">
            Loading Challenge...
          </p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* PLAYING State */}
      {status === GameStatus.PLAYING && challenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Timer & Score Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl font-game text-2xl ${timeRemaining <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                {timeRemaining}s
              </div>
              {!isSimultaneous && currentStreak > 1 && (
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">
                  {currentStreak}x Streak!
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase">
                {isSimultaneous ? 'Submissions' : 'Score'}
              </p>
              <p className="text-2xl font-bold text-white">
                {isSimultaneous ? remoteSynonyms.length : totalScore}
              </p>
            </div>
          </div>

          {/* Challenge Card */}
          <div className="glass p-6 rounded-2xl border-2 border-orange-500/30">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Find synonyms for:</p>
              <button
                onClick={handleGenerate}
                disabled={isEvaluating}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <h2 className="text-4xl font-black text-white mb-4">{challenge.targetWord}</h2>
            <p className="text-slate-400 italic mb-2">&quot;{challenge.contextSentence}&quot;</p>
            <p className="text-xs text-slate-500">Hint: {challenge.hint}</p>
          </div>

          {/* Teacher input (still available for teacher to type on behalf of in-person students) */}
          {!isSimultaneous && (
            <div className="flex gap-3">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a synonym..."
                disabled={isEvaluating}
                autoFocus
                className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-lg disabled:opacity-50"
              />
              <button
                onClick={handleSubmitSynonym}
                disabled={!currentInput.trim() || isEvaluating}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white disabled:opacity-30"
              >
                {isEvaluating ? '...' : 'GO'}
              </button>
            </div>
          )}

          {/* Feedback (turn-based) */}
          {!isSimultaneous && lastFeedback && (
            <motion.p
              key={lastFeedback}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-slate-300"
            >
              {lastFeedback}
            </motion.p>
          )}

          {/* Remote submissions feed — sealed during play to prevent copying */}
          {isSimultaneous && remoteSynonyms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {remoteSynonyms.length} of {students.length} submitted
              </p>
              <AnimatePresence>
                {Array.from(new Map(remoteSynonyms.map(s => [s.displayName, s])).values()).map((syn, i) => (
                  <motion.div
                    key={`${syn.displayName}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{syn.displayName}</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {isSimultaneous && remoteSynonyms.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">Waiting for students to submit synonyms on their devices...</p>
            </div>
          )}

          {/* Valid Synonyms (turn-based) */}
          {!isSimultaneous && validSynonyms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {validSynonyms.map((syn, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                >
                  {syn.word} +{syn.score}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === GameStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Time&apos;s Up!</h3>
            {isSimultaneous ? (
              <>
                <p className="text-4xl font-black text-emerald-400 mb-4">{remoteSynonyms.filter(s => s.isValid).length}</p>
                <p className="text-slate-400">
                  valid synonyms found by the class
                </p>
              </>
            ) : (
              <>
                <p className="text-6xl font-black text-emerald-400 mb-4">{totalScore}</p>
                <p className="text-slate-400">
                  {validSynonyms.length} valid synonym{validSynonyms.length !== 1 ? 's' : ''} found
                </p>
              </>
            )}

            {/* Show all valid synonyms */}
            {(isSimultaneous ? remoteSynonyms.filter(s => s.isValid) : validSynonyms).length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {isSimultaneous
                  ? remoteSynonyms.filter(s => s.isValid).map((syn, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                      >
                        {syn.word} ({syn.displayName}) +{syn.score}
                      </span>
                    ))
                  : validSynonyms.map((syn, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                      >
                        {syn.word} +{syn.score}
                      </span>
                    ))
                }
              </div>
            )}
            {(isSimultaneous ? remoteSynonyms.filter(s => s.isValid) : validSynonyms).length > 0 && (
              <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" /> excellent</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" /> good</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-slate-400 to-slate-500" /> basic</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW WORD
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              {isSimultaneous ? 'SAME WORD, AGAIN' : 'SAME WORD, NEW STUDENT'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
