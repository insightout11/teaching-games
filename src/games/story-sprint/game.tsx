'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus } from './types';
import type { StorySentence, AIScoreResponse } from './types';

export function StorySprintGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [story, setStory] = useState<StorySentence[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastResult, setLastResult] = useState<StorySentence | null>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story]);

  const handleSubmitSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status === GameStatus.ANALYZING || !currentStudentId || !currentStudent) return;

    const trimmedInput = inputValue.trim();
    setStatus(GameStatus.ANALYZING);

    try {
      const storySoFar = story.map(s => s.text).join(' ');
      const response = await fetch('/api/story-sprint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: trimmedInput,
          context: storySoFar,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to analyze sentence');

      const analysis: AIScoreResponse = await response.json();
      const totalScore = Math.round((analysis.grammarScore + analysis.creativityScore + analysis.flowScore) / 3);

      const newSentence: StorySentence = {
        id: Date.now().toString(),
        studentId: currentStudentId,
        studentName: currentStudent.name,
        text: trimmedInput,
        scores: {
          grammar: analysis.grammarScore,
          creativity: analysis.creativityScore,
          flow: analysis.flowScore,
        },
        totalScore,
        feedback: analysis.feedback,
        timestamp: Date.now(),
      };

      // Calculate points (convert 100-scale to 10-scale)
      const points = Math.round(totalScore / 10);
      const isCorrect = points >= 5;

      onScore(currentStudentId, {
        isCorrect,
        points,
        responseData: {
          sentence: trimmedInput,
          grammar: analysis.grammarScore,
          creativity: analysis.creativityScore,
          flow: analysis.flowScore,
          feedback: analysis.feedback
        }
      });

      setStory(prev => [...prev, newSentence]);
      setLastResult(newSentence);
      setInputValue('');
      setStatus(GameStatus.SHOWING_RESULT);

    } catch (error) {
      console.error('Failed to analyze sentence:', error);
      setStatus(GameStatus.WRITING);
    }
  };

  const handleCloseModal = () => {
    setLastResult(null);
    setStatus(GameStatus.IDLE);
    onPickStudent();
  };

  const handleReset = () => {
    if (confirm('Reset the story and start fresh?')) {
      setStory([]);
      setInputValue('');
      setLastResult(null);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleStartWriting = () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }
    setStatus(GameStatus.WRITING);
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
            <p className="opacity-70 text-sm">Pick a student to continue the story</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-40">
            {story.length} sentence{story.length !== 1 ? 's' : ''} written
          </span>
          {story.length > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              New Story
            </button>
          )}
        </div>
      </div>

      {/* Story Display */}
      <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 min-h-[200px] max-h-[400px] overflow-y-auto">
        {story.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="text-xl font-bold text-slate-400">Once upon a time...</h3>
            <p className="text-slate-500 mt-2 max-w-xs">
              The story is waiting to be written.{' '}
              {currentStudent ? `${currentStudent.name}, start the adventure!` : 'Pick a student to begin!'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {story.map((s, idx) => (
                <motion.span
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx === story.length - 1 ? 0.2 : 0 }}
                  title={`${s.studentName}: ${s.totalScore}%`}
                  className={`text-xl md:text-2xl leading-relaxed cursor-help hover:scale-105 transition-transform inline ${
                    idx === story.length - 1
                      ? 'font-semibold text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {s.text}
                </motion.span>
              ))}
            </div>
            <div ref={storyEndRef} />
          </div>
        )}
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          {!currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleStartWriting}
              className="px-12 py-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              {story.length === 0 ? 'START STORY' : 'ADD SENTENCE'}
            </button>
          )}
        </motion.div>
      )}

      {/* WRITING State */}
      {(status === GameStatus.WRITING || status === GameStatus.ANALYZING) && currentStudent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentStudent.name}&apos;s turn</span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
              Write exactly one sentence
            </span>
          </div>

          <form onSubmit={handleSubmitSentence} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={status === GameStatus.ANALYZING ? 'AI is analyzing...' : 'Continue the story with one sentence...'}
              disabled={status === GameStatus.ANALYZING}
              autoFocus
              className={`w-full py-5 px-6 pr-24 rounded-2xl border-2 transition-all outline-none text-lg ${
                status === GameStatus.ANALYZING
                  ? 'bg-slate-800 border-slate-700 text-slate-400 italic'
                  : 'bg-black/40 border-white/10 focus:border-indigo-500 text-white'
              }`}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || status === GameStatus.ANALYZING}
              className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${
                !inputValue.trim() || status === GameStatus.ANALYZING
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
              }`}
            >
              {status === GameStatus.ANALYZING ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Go</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Score Modal */}
      <AnimatePresence>
        {status === GameStatus.SHOWING_RESULT && lastResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />

              <div className="text-center mb-6">
                <div className="inline-block p-4 rounded-full bg-indigo-500/20 text-indigo-400 text-4xl mb-4">
                  ⭐
                </div>
                <h2 className="text-2xl font-bold text-white">Great Work!</h2>
                <p className="text-slate-400 mt-1 italic text-sm">&quot;{lastResult.text}&quot;</p>
              </div>

              {/* Score Bars */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Grammar</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lastResult.scores.grammar}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-emerald-400"
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{lastResult.scores.grammar}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Creativity</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lastResult.scores.creativity}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-purple-400"
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{lastResult.scores.creativity}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Flow</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lastResult.scores.flow}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-sky-400"
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{lastResult.scores.flow}</span>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30 mb-6 text-center">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Feedback</div>
                <p className="text-amber-200 font-medium italic">&quot;{lastResult.feedback}&quot;</p>
                <div className="mt-3 flex items-center justify-center text-amber-400 text-xl font-bold">
                  +{Math.round(lastResult.totalScore / 10)} Points!
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-full py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors"
              >
                Keep Storytelling
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
