'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameProps } from '../types';
import { GrammarTarget, FeedbackTone, GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';

export function GrammarBossGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [selectedTarget, setSelectedTarget] = useState<GrammarTarget>(GrammarTarget.Tense);
  const [selectedTone, setSelectedTone] = useState<FeedbackTone>(FeedbackTone.Coach);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [studentSentence, setStudentSentence] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.CHALLENGE_READY && currentChallenge) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'grammar-boss',
        prompt: currentChallenge.task,
        placeholder: 'Type your sentence...',
        maxLength: 500,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentChallenge, onSetInputSpec]);

  const handleGenerate = async () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setEvaluation(null);
    setShowExample(false);
    setStudentSentence('');

    try {
      const response = await fetch('/api/grammar-boss/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammarTarget: selectedTarget,
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      setCurrentChallenge({
        target: selectedTarget,
        task: data.task,
        exampleSentence: data.exampleSentence
      });
      setStatus(GameStatus.CHALLENGE_READY);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleEvaluate = async () => {
    if (!studentSentence.trim() || !currentChallenge || !currentStudentId) return;
    setStatus(GameStatus.EVALUATING);
    setError(null);

    try {
      const response = await fetch('/api/grammar-boss/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: studentSentence,
          grammarTarget: currentChallenge.target,
          task: currentChallenge.task,
          difficulty: sessionSettings.difficulty,
          tone: selectedTone
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate sentence');

      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      // Calculate score and report to parent
      const averageScore = Math.round((result.grammarScore + result.fluencyScore) / 2);
      const isCorrect = averageScore >= 5;

      onScore(currentStudentId, {
        isCorrect,
        points: averageScore,
        responseData: {
          sentence: studentSentence,
          grammarScore: result.grammarScore,
          fluencyScore: result.fluencyScore,
          correctedSentence: result.correctedSentence,
          feedback: result.feedback,
          grammarTarget: currentChallenge.target
        }
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch (err) {
      setError('Failed to evaluate sentence. Please try again.');
      console.error(err);
      setStatus(GameStatus.CHALLENGE_READY);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleNextRound = () => {
    setCurrentChallenge(null);
    setStudentSentence('');
    setEvaluation(null);
    setShowExample(false);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const handleSameChallenge = () => {
    // Keep challenge, reset per-turn state only
    setStudentSentence('');
    setEvaluation(null);
    setShowExample(false);
    setStatus(GameStatus.CHALLENGE_READY);
    onPickStudent();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with student info */}
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

      {/* IDLE State - Configuration */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Challenge Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Grammar Target
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value as GrammarTarget)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                >
                  {Object.values(GrammarTarget).map((target) => (
                    <option key={target} value={target}>
                      {target.charAt(0).toUpperCase() + target.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Evaluator Tone
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as FeedbackTone)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                >
                  {Object.values(FeedbackTone).map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>
            </div>
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
              className="w-full px-12 py-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              GENERATE CHALLENGE
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
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-indigo-400 uppercase tracking-widest animate-pulse">
            Crafting Challenge...
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* CHALLENGE_READY State */}
      {(status === GameStatus.CHALLENGE_READY || status === GameStatus.EVALUATING) && currentChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Challenge Card */}
          <div className="glass p-6 md:p-8 rounded-2xl border-2 border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Active Task</span>
              </div>
              <button
                onClick={() => setShowExample(!showExample)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                  showExample ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                }`}
              >
                {showExample ? 'Hide Example' : 'Show Example'}
              </button>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
              {currentChallenge.task}
            </h3>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase">
                Must use: {currentChallenge.target}
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-400 rounded-full text-xs font-bold uppercase">
                {sessionSettings.difficulty} Level
              </span>
            </div>

            {showExample && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
              >
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Model Structure</p>
                <p className="text-yellow-200 font-medium italic text-lg">
                  &quot;{currentChallenge.exampleSentence}&quot;
                </p>
              </motion.div>
            )}
          </div>

          {/* Input Section */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={status === GameStatus.EVALUATING}
              className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            >
              Skip Question
            </button>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Teacher Input: Student&apos;s Sentence
            </label>
            <div className="relative">
              <textarea
                value={studentSentence}
                onChange={(e) => setStudentSentence(e.target.value)}
                placeholder="Type the exact sentence spoken by the student..."
                rows={3}
                disabled={status === GameStatus.EVALUATING}
                className="w-full bg-black/40 border-2 border-white/10 text-white rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none text-xl placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
            <p className="text-sm text-slate-500">
              Evaluating as: <span className="text-indigo-400 font-bold">{selectedTone}</span>
            </p>
            <button
              onClick={handleEvaluate}
              disabled={!studentSentence.trim() || status === GameStatus.EVALUATING}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-game text-xl hover:scale-[1.01] active:scale-95 transition-all text-white shadow-lg disabled:opacity-30 disabled:hover:scale-100"
            >
              {status === GameStatus.EVALUATING ? 'EVALUATING...' : 'EVALUATE SENTENCE'}
            </button>
          </div>
        </motion.div>
      )}

      {/* SHOWING_RESULT State */}
      {status === GameStatus.SHOWING_RESULT && evaluation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Scores */}
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">AI Evaluation Report</h3>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Grammar</p>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.grammarScore)} flex items-center justify-center text-2xl font-black text-white`}>
                    {evaluation.grammarScore}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fluency</p>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.fluencyScore)} flex items-center justify-center text-2xl font-black text-white`}>
                    {evaluation.fluencyScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Corrected Sentence */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Corrected Version</p>
              <div className="p-4 bg-slate-900/50 text-slate-100 rounded-xl text-lg font-medium italic border-l-4 border-emerald-500">
                &quot;{evaluation.correctedSentence}&quot;
              </div>
            </div>

            {/* Feedback */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Coach&apos;s Feedback</p>
              <p className="text-lg text-slate-300 leading-relaxed">
                {evaluation.feedback}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW TASK
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME TASK, NEW STUDENT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
