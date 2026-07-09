'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Eye, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { GameProps } from '../types';
import { GenerationLoader } from '@/components/ui/generation-loader';

type BrainTeaserStatus = 'idle' | 'loading' | 'showing' | 'revealed';

interface BrainTeaserContent {
  riddle: string;
  answers: string[];
  explanation: string;
  category: string;
  cacheId: string | null;
}

function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function BrainTeasersGame({
  students,
  sessionSettings,
  onSetInputSpec,
  onRegisterSubmissionHandler,
}: GameProps) {
  const [status, setStatus] = useState<BrainTeaserStatus>('idle');
  const [riddle, setRiddle] = useState<BrainTeaserContent | null>(null);
  const [answerCount, setAnswerCount] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const riddleRef = useRef<BrainTeaserContent | null>(null);
  riddleRef.current = riddle;

  const statusRef = useRef<BrainTeaserStatus>('idle');
  statusRef.current = status;

  const seenCacheIds = useRef<string[]>([]);

  // ── Fetch next riddle ───────────────────────────────────────────────────────
  const fetchRiddle = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setAnswerCount({ correct: 0, total: 0 });

    try {
      const res = await fetch('/api/brain-teasers/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: sessionSettings.difficulty,
          excludeIds: seenCacheIds.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Could not load a riddle. Check the content bank.');
        setStatus('idle');
        return;
      }

      const data: BrainTeaserContent = await res.json();
      if (data.cacheId) {
        seenCacheIds.current = [...seenCacheIds.current, data.cacheId];
      }
      setRiddle(data);
      setStatus('showing');
    } catch {
      setError('Network error — could not load riddle.');
      setStatus('idle');
    }
  }, [sessionSettings.difficulty]);

  // ── Register submission handler whenever we enter 'showing' ────────────────
  useEffect(() => {
    if (status !== 'showing' || !riddle) {
      onRegisterSubmissionHandler?.(null);
      return;
    }

    onSetInputSpec?.({
      type: 'text',
      gameKey: 'brain-teasers',
      prompt: 'What is your answer?',
      placeholder: 'Type your answer…',
      maxLength: 150,
    });

    onRegisterSubmissionHandler?.({
      autoApprove: true,
      handleSubmission: async (content: string) => {
        const current = riddleRef.current;
        if (!current || statusRef.current !== 'showing') {
          return { isCorrect: false, points: 0 };
        }

        const normalized = normalizeAnswer(content);
        const isCorrect = current.answers.some((a) => a === normalized);

        setAnswerCount((prev) => ({
          correct: prev.correct + (isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));

        return { isCorrect, points: isCorrect ? 3 : 0 };
      },
    });

    return () => {
      onRegisterSubmissionHandler?.(null);
    };
  }, [status, riddle, onSetInputSpec, onRegisterSubmissionHandler]);

  // ── Reveal ──────────────────────────────────────────────────────────────────
  const handleReveal = useCallback(() => {
    setStatus('revealed');
    onSetInputSpec?.(null);
    onRegisterSubmissionHandler?.(null);
  }, [onSetInputSpec, onRegisterSubmissionHandler]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      onSetInputSpec?.(null);
      onRegisterSubmissionHandler?.(null);
    };
  }, [onSetInputSpec, onRegisterSubmissionHandler]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Brain className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Brain Teasers</h2>
          <p className="text-lc-text2 max-w-sm">
            Students read the riddle and type their answer. Reveal when ready — no timers, no multiple choice.
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <button
          onClick={fetchRiddle}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
        >
          Start Brain Teasers
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <GenerationLoader label="riddle" />
      </div>
    );
  }

  if (!riddle) return null;

  // ── SHOWING ─────────────────────────────────────────────────────────────────
  if (status === 'showing') {
    const answeredCount = answerCount.total;
    const totalStudents = students.length;

    return (
      <div className="flex flex-col h-full gap-4 p-4">
        {/* Riddle */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-2xl bg-lc-surface border border-lc-border rounded-2xl p-8 text-center">
            <p className="text-2xl font-semibold leading-relaxed">{riddle.riddle}</p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-lc-text2">
            <span className="font-semibold text-white">{answeredCount}</span>
            <span>/</span>
            <span>{totalStudents}</span>
            <span>answered</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSetInputSpec?.(null);
                onRegisterSubmissionHandler?.(null);
                setStatus('idle');
                setRiddle(null);
              }}
              className="px-4 py-2 text-sm text-lc-text2 hover:text-white rounded-lg transition-colors"
            >
              End Game
            </button>
            <button
              onClick={handleReveal}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
              Reveal Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── REVEALED ────────────────────────────────────────────────────────────────
  const correctCount = answerCount.correct;
  const totalAnswered = answerCount.total;
  const incorrectCount = totalAnswered - correctCount;

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Riddle (compact) */}
      <div className="bg-lc-surface border border-lc-border rounded-xl px-5 py-3">
        <p className="text-sm text-lc-text2 italic">{riddle.riddle}</p>
      </div>

      {/* Answer reveal */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-xl bg-amber-500/15 border border-amber-500/30 rounded-2xl p-6 text-center">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">The Answer</p>
          <p className="text-3xl font-bold text-amber-300 mb-3">{riddle.answers[0]}</p>
          <p className="text-sm text-lc-text2">{riddle.explanation}</p>
        </div>

        {/* Score summary */}
        {totalAnswered > 0 && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-lg">{correctCount}</span>
              <span className="text-sm text-lc-text2">correct</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-bold text-lg">{incorrectCount}</span>
              <span className="text-sm text-lc-text2">incorrect</span>
            </div>
          </div>
        )}
        {totalAnswered === 0 && (
          <p className="text-sm text-lc-text2">No students submitted an answer.</p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => {
            setStatus('idle');
            setRiddle(null);
          }}
          className="px-4 py-2 text-sm text-lc-text2 hover:text-white rounded-lg transition-colors"
        >
          End Game
        </button>
        <button
          onClick={fetchRiddle}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          Next Riddle
        </button>
      </div>
    </div>
  );
}
