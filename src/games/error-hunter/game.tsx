'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus } from './types';
import type { Challenge, EvaluationResult, UserCorrection } from './types';

interface WordData {
  word: string;
  index: number;
  isSelected: boolean;
  correction: string;
}

export function ErrorHunterGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [words, setWords] = useState<WordData[]>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  const handleGenerate = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setEvaluation(null);
    setWords([]);
    setSelectedWordIndex(null);
    setCorrectionInput('');

    try {
      const response = await fetch('/api/error-hunter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();

      // Parse paragraph into words
      const wordList = data.paragraph.split(/\s+/).map((word: string, index: number) => ({
        word,
        index,
        isSelected: false,
        correction: ''
      }));

      setChallenge({
        paragraph: data.paragraph,
        errorCount: data.errorCount,
        difficulty: sessionSettings.difficulty
      });
      setWords(wordList);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleWordClick = (index: number) => {
    if (status !== GameStatus.PLAYING) return;

    const word = words[index];
    if (word.isSelected) {
      // Deselect and clear correction
      setWords(prev => prev.map((w, i) =>
        i === index ? { ...w, isSelected: false, correction: '' } : w
      ));
      if (selectedWordIndex === index) {
        setSelectedWordIndex(null);
        setCorrectionInput('');
      }
    } else {
      // Select for correction
      setSelectedWordIndex(index);
      setCorrectionInput('');
    }
  };

  const handleCorrection = () => {
    if (selectedWordIndex === null || !correctionInput.trim()) return;

    setWords(prev => prev.map((w, i) =>
      i === selectedWordIndex
        ? { ...w, isSelected: true, correction: correctionInput.trim() }
        : w
    ));
    setSelectedWordIndex(null);
    setCorrectionInput('');
  };

  const handleSubmit = async () => {
    if (!challenge || !currentStudentId) return;

    setStatus(GameStatus.EVALUATING);

    const corrections: UserCorrection[] = words
      .filter(w => w.isSelected && w.correction)
      .map(w => ({
        position: w.index,
        original: w.word.replace(/[.,!?;:'"]/g, ''),
        correction: w.correction
      }));

    try {
      const response = await fetch('/api/error-hunter/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: challenge.paragraph,
          corrections,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      onScore(currentStudentId, {
        isCorrect: result.score >= 5,
        points: result.score,
        responseData: {
          totalErrors: result.totalErrors,
          found: result.found,
          correctFixes: result.correctFixes,
          falsePositives: result.falsePositives,
          feedback: result.feedback
        }
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch (err) {
      setError('Failed to evaluate. Please try again.');
      console.error(err);
      setStatus(GameStatus.PLAYING);
    }
  };

  const _handleNextRound = () => {
    setChallenge(null);
    setWords([]);
    setEvaluation(null);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const handleSameChallenge = () => {
    if (!challenge) return;
    // Keep challenge, reset word selections and per-turn state
    const resetWords = challenge.paragraph.split(/\s+/).map((word: string, index: number) => ({
      word,
      index,
      isSelected: false,
      correction: ''
    }));
    setWords(resetWords);
    setSelectedWordIndex(null);
    setCorrectionInput('');
    setEvaluation(null);
    setStatus(GameStatus.PLAYING);
    onPickStudent();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const selectedCount = words.filter(w => w.isSelected).length;

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
              Find the grammar and spelling errors hidden in the paragraph. Click words to mark them as errors and provide corrections!
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
              className="w-full px-12 py-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START HUNTING
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
          <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-red-400 uppercase tracking-widest animate-pulse">
            Hiding Errors...
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
      {(status === GameStatus.PLAYING || status === GameStatus.EVALUATING) && challenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Info Bar */}
          <div className="flex items-center justify-between">
            <div className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold">
              {challenge.errorCount} errors hidden
            </div>
            <div className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl text-sm">
              {selectedCount} marked
            </div>
          </div>

          {/* Paragraph with clickable words */}
          <div className="glass p-6 rounded-2xl border-2 border-red-500/30">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Click words to mark errors</p>
              <button
                onClick={handleGenerate}
                disabled={status === GameStatus.EVALUATING}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-lg leading-relaxed">
              {words.map((wordData, index) => (
                <motion.span
                  key={index}
                  onClick={() => handleWordClick(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    wordData.isSelected
                      ? 'bg-red-500 text-white'
                      : selectedWordIndex === index
                      ? 'bg-yellow-500/30 text-yellow-200'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {wordData.isSelected && wordData.correction ? (
                    <span className="line-through opacity-60">{wordData.word}</span>
                  ) : (
                    wordData.word
                  )}
                  {wordData.isSelected && wordData.correction && (
                    <span className="ml-1 text-emerald-400 no-underline">{wordData.correction}</span>
                  )}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Correction Input */}
          {selectedWordIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">
                  Correct &quot;<span className="text-yellow-400">{words[selectedWordIndex]?.word}</span>&quot; to:
                </p>
                <input
                  type="text"
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCorrection()}
                  placeholder="Type correction..."
                  autoFocus
                  className="w-full bg-black/40 border-2 border-yellow-500/50 text-white rounded-xl px-4 py-2 focus:border-yellow-500 outline-none"
                />
              </div>
              <button
                onClick={handleCorrection}
                disabled={!correctionInput.trim()}
                className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold self-end disabled:opacity-30"
              >
                Mark
              </button>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={status === GameStatus.EVALUATING}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-game text-xl hover:scale-[1.01] active:scale-95 transition-all text-white shadow-lg disabled:opacity-50"
          >
            {status === GameStatus.EVALUATING ? 'CHECKING...' : 'SUBMIT CORRECTIONS'}
          </button>
        </motion.div>
      )}

      {/* SHOWING_RESULT State */}
      {status === GameStatus.SHOWING_RESULT && evaluation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Results</h3>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.score)} flex items-center justify-center text-3xl font-black text-white`}>
                {evaluation.score}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                <p className="text-xl font-bold text-white">{evaluation.totalErrors}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Found</p>
                <p className="text-xl font-bold text-emerald-400">{evaluation.found}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Fixed</p>
                <p className="text-xl font-bold text-cyan-400">{evaluation.correctFixes}</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">False</p>
                <p className="text-xl font-bold text-red-400">{evaluation.falsePositives}</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
              <p className="text-slate-300">{evaluation.feedback}</p>
            </div>

            {/* Solutions */}
            {evaluation.solutions && evaluation.solutions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">All Errors</p>
                <div className="space-y-2">
                  {evaluation.solutions.map((sol, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400 line-through">{sol.word}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400">{sol.correction}</span>
                      <span className="text-slate-500 text-xs">({sol.errorType})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW PARAGRAPH
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME TEXT, NEW STUDENT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
