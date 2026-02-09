'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameProps } from '../types';
import { TargetTone, TONE_DESCRIPTIONS, GameStatus } from './types';
import type { Challenge, EvaluationResult } from './types';

export function ToneTransformerGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [rewrittenSentence, setRewrittenSentence] = useState('');
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
    setRewrittenSentence('');

    try {
      const response = await fetch('/api/tone-transformer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();
      setCurrentChallenge({
        originalSentence: data.originalSentence,
        currentTone: data.currentTone,
        targetTone: data.targetTone,
        context: data.context
      });
      setStatus(GameStatus.CHALLENGE_READY);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleEvaluate = async () => {
    if (!rewrittenSentence.trim() || !currentChallenge || !currentStudentId) return;
    setStatus(GameStatus.EVALUATING);
    setError(null);

    try {
      const response = await fetch('/api/tone-transformer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSentence: currentChallenge.originalSentence,
          rewrittenSentence: rewrittenSentence,
          targetTone: currentChallenge.targetTone,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate sentence');

      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      const isCorrect = result.score >= 5;

      onScore(currentStudentId, {
        isCorrect,
        points: result.score,
        responseData: {
          originalSentence: currentChallenge.originalSentence,
          rewrittenSentence: rewrittenSentence,
          targetTone: currentChallenge.targetTone,
          toneMatch: result.toneMatch,
          meaningPreserved: result.meaningPreserved,
          grammarScore: result.grammarScore,
          feedback: result.feedback
        }
      });

      setStatus(GameStatus.SHOWING_RESULT);
    } catch (err) {
      setError('Failed to evaluate sentence. Please try again.');
      console.error(err);
      setStatus(GameStatus.CHALLENGE_READY);
    }
  };

  const _handleNextRound = () => {
    setCurrentChallenge(null);
    setRewrittenSentence('');
    setEvaluation(null);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const handleSameChallenge = () => {
    // Keep challenge, reset per-turn state only
    setRewrittenSentence('');
    setEvaluation(null);
    setStatus(GameStatus.CHALLENGE_READY);
    onPickStudent();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getToneColor = (tone: TargetTone) => {
    switch (tone) {
      case TargetTone.Formal: return 'from-indigo-500 to-indigo-600';
      case TargetTone.Casual: return 'from-orange-500 to-orange-600';
      case TargetTone.Professional: return 'from-slate-500 to-slate-600';
      case TargetTone.Persuasive: return 'from-rose-500 to-rose-600';
      case TargetTone.Academic: return 'from-violet-500 to-violet-600';
      case TargetTone.Friendly: return 'from-teal-500 to-teal-600';
      default: return 'from-cyan-500 to-cyan-600';
    }
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
              Transform sentences to match a target tone. Keep the meaning while changing the style!
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
              className="w-full px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
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
          <div className="w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-violet-400 uppercase tracking-widest animate-pulse">
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
          <div className="glass p-6 md:p-8 rounded-2xl border-2 border-violet-500/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-violet-400 font-bold uppercase tracking-widest text-xs">Original Sentence</span>
              <span className="px-3 py-1 bg-white/10 text-slate-400 rounded-full text-xs font-bold uppercase">
                {currentChallenge.currentTone}
              </span>
            </div>

            <p className="text-2xl md:text-3xl font-medium text-white mb-4 leading-tight italic">
              &quot;{currentChallenge.originalSentence}&quot;
            </p>

            <p className="text-sm text-slate-500 mb-6">
              Context: {currentChallenge.context}
            </p>

            {/* Target Tone */}
            <div className="p-4 bg-gradient-to-r rounded-xl border border-white/10" style={{
              background: `linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))`
            }}>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Transform to:</p>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 bg-gradient-to-r ${getToneColor(currentChallenge.targetTone)} text-white rounded-full text-sm font-bold uppercase`}>
                  {currentChallenge.targetTone}
                </span>
                <span className="text-sm text-slate-400">
                  {TONE_DESCRIPTIONS[currentChallenge.targetTone]}
                </span>
              </div>
            </div>
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
              Rewrite the sentence in a {currentChallenge.targetTone} tone
            </label>
            <div className="relative">
              <textarea
                value={rewrittenSentence}
                onChange={(e) => setRewrittenSentence(e.target.value)}
                placeholder={`Type the ${currentChallenge.targetTone} version here...`}
                rows={3}
                disabled={status === GameStatus.EVALUATING}
                className="w-full bg-black/40 border-2 border-white/10 text-white rounded-2xl px-6 py-4 focus:border-violet-500 outline-none text-xl placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleEvaluate}
              disabled={!rewrittenSentence.trim() || status === GameStatus.EVALUATING}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-game text-xl hover:scale-[1.01] active:scale-95 transition-all text-white shadow-lg disabled:opacity-30 disabled:hover:scale-100"
            >
              {status === GameStatus.EVALUATING ? 'EVALUATING...' : 'SUBMIT TRANSFORMATION'}
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
              <h3 className="text-xl font-bold text-white">Evaluation Report</h3>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getScoreColor(evaluation.score)} flex items-center justify-center text-3xl font-black text-white`}>
                {evaluation.score}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tone Match</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.toneMatch)} bg-clip-text text-transparent`}>
                  {evaluation.toneMatch}
                </div>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Meaning</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.meaningPreserved)} bg-clip-text text-transparent`}>
                  {evaluation.meaningPreserved}
                </div>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Grammar</p>
                <div className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(evaluation.grammarScore)} bg-clip-text text-transparent`}>
                  {evaluation.grammarScore}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback</p>
              <p className="text-lg text-slate-300 leading-relaxed">
                {evaluation.feedback}
              </p>
            </div>

            {/* Alternatives */}
            {evaluation.alternatives && evaluation.alternatives.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Example Transformations</p>
                <div className="space-y-2">
                  {evaluation.alternatives.map((alt, i) => (
                    <div key={i} className="p-3 bg-violet-500/10 text-violet-200 rounded-xl text-sm italic border-l-4 border-violet-500">
                      &quot;{alt}&quot;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW SENTENCE
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME SENTENCE, NEW STUDENT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
