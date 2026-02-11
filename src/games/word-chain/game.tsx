'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus } from './types';
import type { ExtendedChainLink, ValidationResult } from './types';

export function WordChainGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [startingWord, setStartingWord] = useState('');
  const [hint, setHint] = useState('');
  const [chain, setChain] = useState<ExtendedChainLink[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);
  const currentWord = chain.length > 0 ? chain[chain.length - 1].word : startingWord;

  // Keep refs for the submission handler
  const currentWordRef = useRef<string>(currentWord);
  currentWordRef.current = currentWord;
  const chainRef = useRef<ExtendedChainLink[]>(chain);
  chainRef.current = chain;
  const startingWordRef = useRef<string>(startingWord);
  startingWordRef.current = startingWord;

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.PLAYING && currentWord) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'word-chain',
        prompt: `Connect to: "${currentWord}"`,
        placeholder: 'Type a connected word...',
        maxLength: 50,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentWord, onSetInputSpec]);

  // Register submission handler to evaluate remote submissions
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      handleSubmission: async (content: string) => {
        const prevWord = currentWordRef.current;
        if (!prevWord) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        try {
          const response = await fetch('/api/word-chain/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              previousWord: prevWord,
              newWord: content.trim().toLowerCase(),
              chainHistory: [startingWordRef.current, ...chainRef.current.map((c) => c.word)],
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: ValidationResult = await response.json();

          setCurrentInput(content.trim());
          if (result.isValid) {
            setChain((prev) => [
              ...prev,
              {
                word: content.trim().toLowerCase(),
                connectionStrength: result.connectionStrength,
                score: result.score,
                studentId: '',
                studentName: 'Remote',
              },
            ]);
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

  const handleGenerate = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setChain([]);
    setCurrentInput('');
    setLastFeedback(null);

    try {
      const response = await fetch('/api/word-chain/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setStartingWord(data.startingWord);
      setHint(data.hint);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to start game. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSubmitWord = async () => {
    if (!currentInput.trim() || isEvaluating || status !== GameStatus.PLAYING) return;

    const newWord = currentInput.trim().toLowerCase();

    // Check for repeats locally
    const allWords = [startingWord.toLowerCase(), ...chain.map(c => c.word.toLowerCase())];
    if (allWords.includes(newWord)) {
      setLastFeedback('Already used! Try a different word.');
      setCurrentInput('');
      return;
    }

    setIsEvaluating(true);
    setCurrentInput('');

    try {
      const response = await fetch('/api/word-chain/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousWord: currentWord,
          newWord,
          chainHistory: [startingWord, ...chain.map(c => c.word)],
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: ValidationResult = await response.json();
      setLastFeedback(result.feedback);

      if (result.isValid) {
        // Score this student immediately
        if (currentStudentId) {
          onScore(currentStudentId, {
            isCorrect: true,
            points: result.score,
            responseData: {
              word: newWord,
              connectionStrength: result.connectionStrength,
              chainPosition: chain.length + 1
            }
          });
        }

        // Add to chain with student info
        setChain(prev => [...prev, {
          word: newWord,
          connectionStrength: result.connectionStrength,
          score: result.score,
          studentId: currentStudentId || '',
          studentName: currentStudent?.name || 'Unknown'
        }]);

        // Prompt for next student
        onPickStudent();
      } else {
        // Chain broken - no score for this student
        setStatus(GameStatus.CHAIN_BROKEN);
      }
    } catch (err) {
      console.error(err);
      setLastFeedback('Error evaluating. Try again!');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEndChain = () => {
    setStatus(GameStatus.FINISHED);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitWord();
    }
  };

  const handleSameChallenge = () => {
    // Keep starting word, reset chain and per-turn state
    setChain([]);
    setCurrentInput('');
    setLastFeedback(null);
    setStatus(GameStatus.PLAYING);
    onPickStudent();
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'creative': return 'from-lc-blue to-blue-500';
      case 'strong': return 'from-emerald-400 to-emerald-500';
      case 'moderate': return 'from-cyan-400 to-cyan-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {currentStudent && (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          )}
          {!currentStudentId && (
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
              Build a chain of connected words! Each word must relate to the previous one. How long can you go?
            </p>
          </div>

          {!currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START CHAIN
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
          <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-teal-400 uppercase tracking-widest animate-pulse">
            Finding Starting Word...
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
      {status === GameStatus.PLAYING && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Chain Length */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-xl text-sm font-bold">
              Chain: {chain.length} links
            </div>
          </div>

          {/* Current Word */}
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">Connect to:</p>
              <button
                onClick={handleGenerate}
                disabled={isEvaluating}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">{currentWord}</h2>
            {chain.length === 0 && hint && (
              <p className="text-xs text-slate-500">{hint}</p>
            )}
          </div>

          {/* Chain Display */}
          {chain.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                {startingWord}
              </span>
              {chain.map((link, i) => (
                <motion.div key={i} className="flex items-center gap-2" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <span className="text-slate-500">→</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getStrengthColor(link.connectionStrength)}`}>
                    {link.word}
                    <span className="ml-1 text-xs opacity-70">({link.studentName})</span>
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a connected word..."
              disabled={isEvaluating}
              autoFocus
              className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-teal-500 outline-none text-lg disabled:opacity-50"
            />
            <button
              onClick={handleSubmitWord}
              disabled={!currentInput.trim() || isEvaluating}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-bold text-white disabled:opacity-30"
            >
              {isEvaluating ? '...' : 'LINK'}
            </button>
          </div>

          {/* Feedback */}
          {lastFeedback && (
            <motion.p
              key={lastFeedback}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-slate-300"
            >
              {lastFeedback}
            </motion.p>
          )}

          {/* End Chain Button */}
          {chain.length >= 3 && (
            <button
              onClick={handleEndChain}
              className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10"
            >
              END CHAIN ({chain.length} links)
            </button>
          )}
        </motion.div>
      )}

      {/* CHAIN_BROKEN / FINISHED State */}
      {(status === GameStatus.CHAIN_BROKEN || status === GameStatus.FINISHED) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              {status === GameStatus.CHAIN_BROKEN ? 'Chain Broken!' : 'Chain Complete!'}
            </h3>
            <p className="text-5xl font-black text-teal-400 mb-2">{chain.length}</p>
            <p className="text-slate-400 mb-4">links in the chain</p>

            {/* Full Chain with Student Names */}
            <div className="flex flex-wrap justify-center items-center gap-2 p-4 bg-black/20 rounded-xl">
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                {startingWord}
              </span>
              {chain.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500">→</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getStrengthColor(link.connectionStrength)}`}>
                    {link.word}
                    <span className="ml-1 text-xs opacity-70">({link.studentName})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW CHAIN
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME WORD, NEW CHAIN
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
