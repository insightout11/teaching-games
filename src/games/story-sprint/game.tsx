'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from '../types';
import { GameStatus } from './types';
import { getEffectiveTopic } from '@/stores/session-store';
import type { StorySentence, AIScoreResponse, FinalStoryResult } from './types';

const MAX_SENTENCES = 10;

export function StorySprintGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, config }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [story, setStory] = useState<StorySentence[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastResult, setLastResult] = useState<StorySentence | null>(null);
  const [starter, setStarter] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<FinalStoryResult | null>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const preGenContent = config?.preGeneratedContent as { gameKey?: string; starterSentence?: string } | undefined;
  const preGenStarter = preGenContent?.gameKey === 'story-sprint' ? (preGenContent.starterSentence ?? null) : null;

  const topic = getEffectiveTopic(sessionSettings);
  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Count only student-written sentences (exclude starter)
  const studentSentenceCount = story.filter(s => !s.isStarter).length;

  // Keep refs for the submission handler
  const storyRef = useRef<StorySentence[]>(story);
  storyRef.current = story;
  const currentStudentIdRef = useRef<string | null>(currentStudentId);
  currentStudentIdRef.current = currentStudentId;
  const topicRef = useRef(topic);
  topicRef.current = topic;

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story]);

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.WRITING) {
      const prompt = topic
        ? (story.length === 0 ? `Start a story about ${topic} with one sentence` : `Continue the story about ${topic} with one sentence`)
        : (story.length === 0 ? 'Start the story with one sentence' : 'Continue the story with one sentence');

      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'story-sprint',
        prompt,
        placeholder: 'Continue the story with one sentence...',
        maxLength: 300,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, story.length, topic, onSetInputSpec]);

  // --- End Story logic ---
  const handleEndStory = useCallback(async (storySoFar: StorySentence[]) => {
    const studentSentences = storySoFar.filter(s => !s.isStarter);
    if (studentSentences.length < 2) return;

    setStatus(GameStatus.ENDING);
    try {
      const response = await fetch('/api/story-sprint/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: storySoFar.map(s => ({
            text: s.text,
            studentName: s.studentName,
            isStarter: s.isStarter,
          })),
          topic: topicRef.current || undefined,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');
      const result: FinalStoryResult = await response.json();
      setFinalResult(result);
      setStatus(GameStatus.FINAL_RESULTS);
    } catch (error) {
      console.error('Failed to evaluate story:', error);
      setStatus(GameStatus.IDLE);
    }
  }, [sessionSettings.difficulty]);

  // Ref for handleEndStory so submission handler can access it
  const handleEndStoryRef = useRef(handleEndStory);
  handleEndStoryRef.current = handleEndStory;

  // Register submission handler to evaluate remote submissions
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      autoApprove: true,
      handleSubmission: async (content: string) => {
        const currentStory = storyRef.current;
        const storySoFar = currentStory.map((s) => s.text).join(' ');
        const currentTopic = topicRef.current;

        try {
          const response = await fetch('/api/story-sprint/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: content.trim(),
              context: storySoFar,
              difficulty: sessionSettings.difficulty,
              topic: currentTopic || undefined,
            }),
          });

          if (!response.ok) throw new Error('Analysis failed');

          const analysis: AIScoreResponse = await response.json();
          const scores = [analysis.grammarScore, analysis.creativityScore, analysis.flowScore];
          if (currentTopic && analysis.topicRelevanceScore !== undefined) {
            scores.push(analysis.topicRelevanceScore);
          }
          const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const points = Math.round(totalScore / 10);

          const newSentence: StorySentence = {
            id: Date.now().toString(),
            studentId: currentStudentIdRef.current || '',
            studentName: 'Remote',
            text: content.trim(),
            scores: {
              grammar: analysis.grammarScore,
              creativity: analysis.creativityScore,
              flow: analysis.flowScore,
              topicRelevance: analysis.topicRelevanceScore,
            },
            totalScore,
            feedback: analysis.feedback,
            timestamp: Date.now(),
          };

          setInputValue(content.trim());
          const updatedStory = [...currentStory, newSentence];
          setStory(updatedStory);
          setLastResult(newSentence);
          setStatus(GameStatus.SHOWING_RESULT);

          // Check if we hit the limit
          const newStudentCount = updatedStory.filter(s => !s.isStarter).length;
          if (newStudentCount >= MAX_SENTENCES) {
            // Auto-end after showing result
            setTimeout(() => handleEndStoryRef.current(updatedStory), 2000);
          }

          return {
            isCorrect: true,
            points,
            feedback: analysis.feedback,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Analysis error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterSubmissionHandler]);

  // --- Generate Starter ---
  const handleGenerateStarter = async () => {
    if (preGenStarter) {
      setStarter(preGenStarter);
      return;
    }
    setStatus(GameStatus.GENERATING_STARTER);
    try {
      const response = await fetch('/api/story-sprint/starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty: sessionSettings.difficulty,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate starter');
      const data = await response.json();
      setStarter(data.starterSentence);
    } catch (error) {
      console.error('Failed to generate starter:', error);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleAcceptStarter = () => {
    if (!starter) return;
    const starterSentence: StorySentence = {
      id: `starter-${Date.now()}`,
      studentId: '',
      studentName: '',
      text: starter,
      scores: { grammar: 0, creativity: 0, flow: 0 },
      totalScore: 0,
      feedback: '',
      timestamp: Date.now(),
      isStarter: true,
    };
    setStory([starterSentence]);
    setStarter(null);
    setStatus(GameStatus.IDLE);
  };

  const handleSkipStarter = () => {
    setStarter(null);
    setStatus(GameStatus.IDLE);
  };

  // --- Submit Sentence ---
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
          difficulty: sessionSettings.difficulty,
          topic: topic || undefined,
        })
      });

      if (!response.ok) throw new Error('Failed to analyze sentence');

      const analysis: AIScoreResponse = await response.json();
      const scores = [analysis.grammarScore, analysis.creativityScore, analysis.flowScore];
      if (topic && analysis.topicRelevanceScore !== undefined) {
        scores.push(analysis.topicRelevanceScore);
      }
      const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      const newSentence: StorySentence = {
        id: Date.now().toString(),
        studentId: currentStudentId,
        studentName: currentStudent.name,
        text: trimmedInput,
        scores: {
          grammar: analysis.grammarScore,
          creativity: analysis.creativityScore,
          flow: analysis.flowScore,
          topicRelevance: analysis.topicRelevanceScore,
        },
        totalScore,
        feedback: analysis.feedback,
        timestamp: Date.now(),
      };

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
          topicRelevance: analysis.topicRelevanceScore,
          feedback: analysis.feedback
        }
      });

      const updatedStory = [...story, newSentence];
      setStory(updatedStory);
      setLastResult(newSentence);
      setInputValue('');
      setStatus(GameStatus.SHOWING_RESULT);

      // Check if we hit the limit
      const newStudentCount = updatedStory.filter(s => !s.isStarter).length;
      if (newStudentCount >= MAX_SENTENCES) {
        setTimeout(() => handleEndStory(updatedStory), 2000);
      }

    } catch (error) {
      console.error('Failed to analyze sentence:', error);
      setStatus(GameStatus.WRITING);
    }
  };

  const handleCloseModal = () => {
    setLastResult(null);
    // If we already transitioned to ENDING (auto-end triggered), don't override
    if (status === GameStatus.SHOWING_RESULT) {
      setStatus(GameStatus.IDLE);
      onPickStudent();
    }
  };

  const handleReset = () => {
    setStory([]);
    setInputValue('');
    setLastResult(null);
    setStarter(null);
    setFinalResult(null);
    setStatus(GameStatus.IDLE);
  };

  const handleStartWriting = () => {
    if (!currentStudentId) {
      onPickStudent();
      return;
    }
    // If no story yet and topic exists, generate a starter first
    if (story.length === 0 && topic) {
      handleGenerateStarter();
      return;
    }
    setStatus(GameStatus.WRITING);
  };

  // --- Score Bar Component ---
  const ScoreBar = ({ label, value, delay, color }: { label: string; value: number; delay: number; color: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-3 w-2/3">
        <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, delay }}
            className={`h-full ${color}`}
          />
        </div>
        <span className="text-sm font-bold w-8 text-right">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {currentStudent && status !== GameStatus.GENERATING_STARTER && status !== GameStatus.ENDING && status !== GameStatus.FINAL_RESULTS && (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          )}
          {!currentStudentId && status === GameStatus.IDLE && (
            <p className="opacity-70 text-sm">Pick a student to continue the story</p>
          )}
          {status === GameStatus.GENERATING_STARTER && (
            <p className="text-lg font-semibold text-amber-400">Generating story starter...</p>
          )}
          {status === GameStatus.ENDING && (
            <p className="text-lg font-semibold text-purple-400">AI is evaluating the story...</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {story.length > 0 && (
            <span className="text-sm font-mono font-bold text-slate-400">
              {studentSentenceCount}/{MAX_SENTENCES}
            </span>
          )}
          {studentSentenceCount >= 2 && status !== GameStatus.ENDING && status !== GameStatus.FINAL_RESULTS && (
            <button
              onClick={() => handleEndStory(story)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-bold text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              End Story
            </button>
          )}
          {story.length > 0 && status !== GameStatus.FINAL_RESULTS && (
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
                  title={s.isStarter ? 'AI Starter' : `${s.studentName}: ${s.totalScore}%`}
                  className={`text-xl md:text-2xl leading-relaxed cursor-help hover:scale-105 transition-transform inline ${
                    s.isStarter
                      ? 'italic text-slate-500'
                      : idx === story.length - 1
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

      {/* Generating Starter State */}
      {status === GameStatus.GENERATING_STARTER && !starter && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Starter Preview */}
      {status === GameStatus.GENERATING_STARTER && starter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-amber-500/30"
        >
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">AI Story Starter</div>
          <p className="text-xl italic text-slate-200 mb-6">&quot;{starter}&quot;</p>
          <div className="flex gap-3">
            <button
              onClick={handleAcceptStarter}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-white hover:scale-[1.02] active:scale-95 transition-all"
            >
              Use This Starter
            </button>
            <button
              onClick={handleGenerateStarter}
              className="px-6 py-3 bg-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-600 transition-colors"
            >
              Generate Another
            </button>
            <button
              onClick={handleSkipStarter}
              className="px-6 py-3 bg-transparent rounded-xl font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}

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
              className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              {story.length === 0 ? 'START STORY' : 'ADD SENTENCE'}
            </button>
          )}
        </motion.div>
      )}

      {/* Ending spinner */}
      {status === GameStatus.ENDING && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">The AI is reading the whole story...</p>
        </div>
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
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Per-Sentence Score Modal */}
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
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lc-blue via-blue-500 to-sky-500 rounded-t-3xl" />

              <div className="text-center mb-6">
                <div className="inline-block p-4 rounded-full bg-indigo-500/20 text-indigo-400 text-4xl mb-4">
                  ⭐
                </div>
                <h2 className="text-2xl font-bold text-white">Great Work!</h2>
                <p className="text-slate-400 mt-1 italic text-sm">&quot;{lastResult.text}&quot;</p>
              </div>

              {/* Score Bars */}
              <div className="space-y-4 mb-6">
                <ScoreBar label="Grammar" value={lastResult.scores.grammar} delay={0.2} color="bg-emerald-400" />
                <ScoreBar label="Creativity" value={lastResult.scores.creativity} delay={0.4} color="bg-lc-blue" />
                <ScoreBar label="Flow" value={lastResult.scores.flow} delay={0.6} color="bg-sky-400" />
                {lastResult.scores.topicRelevance !== undefined && (
                  <ScoreBar label="Topic" value={lastResult.scores.topicRelevance} delay={0.8} color="bg-amber-400" />
                )}
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

      {/* Final Results Screen */}
      <AnimatePresence>
        {status === GameStatus.FINAL_RESULTS && finalResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-white/20"
            >
              {/* Title Banner */}
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">📖</div>
                <h2 className="text-3xl font-bold text-white mb-1">&quot;{finalResult.title}&quot;</h2>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold">
                  Overall Score: {finalResult.overallScore}/100
                </div>
              </div>

              {/* Full Story */}
              <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-white/5 max-h-[200px] overflow-y-auto">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {story.map((s) => (
                    <span
                      key={s.id}
                      className={`text-lg leading-relaxed inline ${
                        s.isStarter ? 'italic text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {s.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Score Bars */}
              <div className="space-y-4 mb-8">
                <ScoreBar label="Coherence" value={finalResult.coherenceScore} delay={0.2} color="bg-emerald-400" />
                <ScoreBar label="Creativity" value={finalResult.creativityScore} delay={0.4} color="bg-lc-blue" />
                <ScoreBar label="Ending" value={finalResult.endingScore} delay={0.6} color="bg-sky-400" />
                {finalResult.topicRelevance !== undefined && (
                  <ScoreBar label="Topic" value={finalResult.topicRelevance} delay={0.8} color="bg-amber-400" />
                )}
              </div>

              {/* Best Line Award */}
              {finalResult.bestLine && (
                <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/30 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Best Line Award</span>
                  </div>
                  <p className="text-lg text-white italic mb-2">&quot;{finalResult.bestLine.text}&quot;</p>
                  <p className="text-sm text-amber-300">
                    <span className="font-bold">{finalResult.bestLine.studentName}</span> — {finalResult.bestLine.reason}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/30 mb-8 text-center">
                <p className="text-indigo-200 font-medium italic">&quot;{finalResult.summary}&quot;</p>
              </div>

              {/* Actions */}
              <button
                onClick={handleReset}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                New Story
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
