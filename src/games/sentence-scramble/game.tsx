'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from '../types';
import { SENTENCES } from './sentences';
import type { Difficulty } from '@/stores/session-store';

// eslint-disable-next-line @typescript-eslint/no-unused-vars

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function tokenize(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

// Map difficulty to sentence difficulty
function difficultyToSentence(difficulty: Difficulty): 'easy' | 'medium' | 'hard' {
  switch (difficulty) {
    case 'Beginner':
    case 'Easy':
      return 'easy';
    case 'Intermediate':
      return 'medium';
    case 'Advanced':
    case 'Expert':
      return 'hard';
    default:
      return 'medium';
  }
}

export function SentenceScrambleGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec }: GameProps) {
  const sentenceDifficulty = difficultyToSentence(sessionSettings.difficulty);
  const sentences = SENTENCES[sentenceDifficulty] ?? SENTENCES.medium;

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealed, setRevealed] = useState(false);

  const original = sentences[sentenceIndex % sentences.length];
  const words = useMemo(() => tokenize(original), [original]);

  const [availableWords, setAvailableWords] = useState<{ word: string; originalIndex: number }[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ word: string; originalIndex: number }[]>([]);

  useEffect(() => {
    const indexed = words.map((word, idx) => ({ word, originalIndex: idx }));
    let shuffled = shuffleArray(indexed);
    while (shuffled.map(w => w.word).join(' ') === words.join(' ') && words.length > 1) {
      shuffled = shuffleArray(indexed);
    }
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setSubmitted(false);
    setRevealed(false);
    setFeedback(null);
  }, [sentenceIndex, words]);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Register input spec for student controller
  useEffect(() => {
    if (!submitted && availableWords.length > 0) {
      onSetInputSpec?.({
        type: 'sequence',
        gameKey: 'sentence-scramble',
        prompt: 'Tap words to build the sentence in correct order',
        options: availableWords.map(w => w.word),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [submitted, availableWords, onSetInputSpec]);

  const handleSelectWord = (wordItem: { word: string; originalIndex: number }) => {
    if (submitted) return;
    setAvailableWords(prev => prev.filter(w => w.originalIndex !== wordItem.originalIndex));
    setSelectedWords(prev => [...prev, wordItem]);
  };

  const handleDeselectWord = (wordItem: { word: string; originalIndex: number }) => {
    if (submitted) return;
    setSelectedWords(prev => prev.filter(w => w.originalIndex !== wordItem.originalIndex));
    setAvailableWords(prev => [...prev, wordItem]);
  };

  const handleReset = () => {
    if (submitted) return;
    const indexed = words.map((word, idx) => ({ word, originalIndex: idx }));
    let shuffled = shuffleArray(indexed);
    while (shuffled.map(w => w.word).join(' ') === words.join(' ') && words.length > 1) {
      shuffled = shuffleArray(indexed);
    }
    setAvailableWords(shuffled);
    setSelectedWords([]);
  };

  const handleSubmit = useCallback(() => {
    if (!currentStudentId) return;
    const answer = selectedWords.map(w => w.word).join(' ');
    const expected = words.join(' ');
    const isCorrect = answer === expected;

    setSubmitted(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    try {
      const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    onScore(currentStudentId, {
      isCorrect,
      points: isCorrect ? 10 : 0,
      responseData: { answer, expected },
    });
  }, [currentStudentId, selectedWords, words, onScore]);

  const handleNext = () => {
    setSentenceIndex((i) => i + 1);
  };

  const handleReveal = () => setRevealed(true);

  const allWordsSelected = availableWords.length === 0;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <p className="opacity-70 text-sm">Tap words to build the sentence in correct order</p>
        {currentStudent && (
          <p className="text-lg font-semibold text-cyan-400 mt-1">
            {currentStudent.name}&apos;s turn
          </p>
        )}
      </div>

      {/* Answer area - selected words */}
      <div className={`min-h-[60px] p-4 rounded-xl glass ${
        submitted
          ? feedback === 'correct'
            ? 'border-2 border-green-500/50'
            : 'border-2 border-red-500/50'
          : 'border border-white/10'
      }`}>
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {selectedWords.length === 0 ? (
              <p className="opacity-40 text-sm">Tap words below to build your answer...</p>
            ) : (
              selectedWords.map((wordItem) => (
                <motion.button
                  key={`selected-${wordItem.originalIndex}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleDeselectWord(wordItem)}
                  disabled={submitted}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    submitted
                      ? feedback === 'correct'
                        ? 'bg-green-500/30 text-green-300'
                        : 'bg-red-500/30 text-red-300'
                      : 'bg-cyan-500 text-white hover:bg-cyan-600'
                  }`}
                >
                  {wordItem.word}
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[60px] p-4">
        <AnimatePresence mode="popLayout">
          {availableWords.map((wordItem) => (
            <motion.button
              key={`available-${wordItem.originalIndex}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleSelectWord(wordItem)}
              disabled={submitted}
              className="px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/10 transition-colors"
            >
              {wordItem.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {feedback === 'correct' ? (
            <p className="text-green-400 font-game text-lg">CORRECT! +10 points</p>
          ) : (
            <div>
              <p className="text-red-400 font-game text-lg">NOT QUITE!</p>
              {revealed && (
                <p className="opacity-70 text-sm mt-1">Answer: {original}</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!currentStudentId && (
          <button
            onClick={onPickStudent}
            className="px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white"
          >
            PICK STUDENT
          </button>
        )}
        {currentStudentId && !submitted && (
          <>
            <button
              onClick={handleReset}
              disabled={selectedWords.length === 0}
              className="px-6 py-3 glass rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30"
            >
              RESET
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allWordsSelected}
              className="px-8 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30 disabled:hover:scale-100"
            >
              CHECK
            </button>
          </>
        )}
        {submitted && !revealed && feedback === 'wrong' && (
          <button
            onClick={handleReveal}
            className="px-6 py-3 glass rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
          >
            REVEAL
          </button>
        )}
        {submitted && (
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            NEXT
          </button>
        )}
      </div>
    </div>
  );
}
