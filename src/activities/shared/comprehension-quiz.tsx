'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type { ComprehensionQuestion } from '@/types/source-material';
import type { ActivityProps, RemoteVote } from '../types';
import { CheckCircle2, ChevronRight, ListChecks, MessageCircle, Quote, RotateCcw } from 'lucide-react';

type QuizPhase = 'voting' | 'revealed' | 'discussion';

interface ComprehensionQuizProps {
  questions: ComprehensionQuestion[];
  students: Student[];
  gameKey: string;
  /** Optional open-ended speaking prompt shown after the last question. */
  discussionPrompt?: string;
  /** Added to the 1-based question number so prompt indices stay unique alongside other scoring in the same module. */
  promptIndexOffset?: number;
  /** Video only: seek the player to this many seconds and play (powers "Rewatch"). */
  onRewatch?: (seconds: number) => void;
  onSetInputSpec?: (spec: InputSpec | null) => void;
  onRegisterRemoteVoteHandler?: (handler: ((vote: RemoteVote) => void) | null) => void;
  onScore?: ActivityProps['onScore'];
  onComplete?: () => void;
}

interface VoteRecord {
  clientId: string;
  studentId: string | null;
  choice: string;
  name: string;
}

/**
 * Teacher-paced comprehension check shown on the shared/projected screen.
 * Runs the supplied multiple-choice questions one at a time: students vote on
 * their devices → teacher reveals the answer + live tally (with rationale and
 * supporting evidence) → next question → an optional closing discussion prompt →
 * the caller's onComplete. The single source of truth for scoring/voting shared
 * by the video player and the reader.
 */
export function ComprehensionQuiz({
  questions,
  students,
  gameKey,
  discussionPrompt,
  promptIndexOffset = 0,
  onRewatch,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onComplete,
}: ComprehensionQuizProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('voting');
  // votes[questionIndex][clientId] = { choice, name }
  const [votes, setVotes] = useState<Record<number, Record<string, VoteRecord>>>({});

  const indexRef = useRef(index);
  indexRef.current = index;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const scoredRef = useRef<Set<string>>(new Set());

  const question = questions[index];
  const isLast = index === questions.length - 1;

  // Push the current question to student devices while voting; clear otherwise.
  useEffect(() => {
    if (!question || phase !== 'voting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'choice',
      gameKey,
      prompt: question.question,
      options: question.options,
    });
    return () => onSetInputSpec?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase, question]);

  // Register a single vote handler; reads live index/phase via refs.
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: RemoteVote) => {
      if (phaseRef.current !== 'voting') return;
      const qIdx = indexRef.current;
      const cp = questions[qIdx];
      if (!cp) return;
      const { clientId, displayName, choice } = vote;

      setVotes((prev) => ({
        ...prev,
        [qIdx]: {
          ...(prev[qIdx] ?? {}),
          [clientId]: {
            clientId,
            studentId: vote.studentId ?? null,
            choice,
            name: displayName,
          },
        },
      }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const scoreCurrentQuestion = useCallback(() => {
    if (!question || !onScore) return;
    const qIdx = indexRef.current;
    Object.values(votes[qIdx] ?? {}).forEach((vote) => {
      const scoreKey = `${qIdx}:${vote.clientId}`;
      if (scoredRef.current.has(scoreKey)) return;
      scoredRef.current.add(scoreKey);
      const isCorrect = question.options.indexOf(vote.choice) === question.correctIndex;
      void onScore({
        studentId: vote.studentId,
        clientId: vote.clientId,
        displayName: vote.name,
        promptIndex: promptIndexOffset + qIdx + 1,
        points: isCorrect ? 3 : 1,
        isCorrect,
      });
    });
  }, [onScore, promptIndexOffset, question, votes]);

  const handleNext = useCallback(() => {
    onSetInputSpec?.(null);
    if (isLast) {
      if (discussionPrompt) {
        setPhase('discussion');
        return;
      }
      onRegisterRemoteVoteHandler?.(null);
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
    setPhase('voting');
  }, [isLast, discussionPrompt, onComplete, onSetInputSpec, onRegisterRemoteVoteHandler]);

  const handleFinish = useCallback(() => {
    onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
    onComplete?.();
  }, [onSetInputSpec, onRegisterRemoteVoteHandler, onComplete]);

  // ── DISCUSSION (closing speaking prompt) ──────────────────────────────────
  if (phase === 'discussion' && discussionPrompt) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-400">Talk About It</span>
        </div>
        <div className="glass rounded-2xl border-2 border-amber-500/30 p-6">
          <p className="text-lg font-medium leading-snug">{discussionPrompt}</p>
          <p className="text-xs opacity-50 mt-3">Discuss as a class or in pairs — no single right answer.</p>
        </div>
        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-game text-sm shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          Finish Briefing
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!question) return null;

  const qVotes = votes[index] ?? {};
  const voteCount = Object.keys(qVotes).length;
  const revealed = phase === 'revealed';
  const answeredNames = new Set(Object.values(qVotes).map((v) => v.name));
  const pending = students.filter((s) => !answeredNames.has(s.name));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <ListChecks className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-sky-400">Comprehension Check</span>
        </div>
        <span className="text-xs opacity-50">
          Question {index + 1} / {questions.length}
        </span>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-semibold leading-snug">{question.question}</p>
          <span className="text-xs opacity-50 shrink-0 mt-1.5">
            {voteCount}/{students.length} answered
          </span>
        </div>

        <div className="space-y-2.5">
          {question.options.map((opt, oi) => {
            const count = Object.values(qVotes).filter((v) => v.choice === opt).length;
            const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
            const isCorrect = oi === question.correctIndex;
            const showCorrect = revealed && isCorrect;
            return (
              <div key={oi} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 shrink-0 ${showCorrect ? 'text-emerald-400' : 'opacity-40'}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`flex items-center gap-1.5 ${showCorrect ? 'text-emerald-400 font-bold' : 'opacity-80'}`}>
                      {opt}
                      {showCorrect && <CheckCircle2 className="w-4 h-4" />}
                    </span>
                    {/* Tally is held back until reveal so the class can't herd toward the popular vote. */}
                    {revealed && <span className="opacity-50 shrink-0 ml-2">{count} ({pct}%)</span>}
                  </div>
                  {revealed && (
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${showCorrect ? 'bg-emerald-400' : 'bg-sky-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending students (while voting, small class nudge) */}
        {!revealed && pending.length > 0 && pending.length <= 8 && (
          <p className="text-xs opacity-50">
            Waiting on: <span className="opacity-90">{pending.map((s) => s.name).join(', ')}</span>
          </p>
        )}

        {/* Reveal extras: rationale + evidence */}
        {revealed && (question.explanation || question.evidence) && (
          <div className="space-y-2 pt-1 border-t border-white/10">
            {question.explanation && (
              <p className="text-sm opacity-80 pt-2">{question.explanation}</p>
            )}
            {question.evidence && (
              <p className="flex items-start gap-2 text-xs opacity-60 italic">
                <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>&ldquo;{question.evidence}&rdquo;</span>
              </p>
            )}
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => {
            scoreCurrentQuestion();
            setPhase('revealed');
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-game text-sm shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
        >
          Reveal Answer
        </button>
      ) : (
        <div className="space-y-2">
          {onRewatch && typeof question.timestamp === 'number' && question.timestamp > 0 && (
            <button
              onClick={() => onRewatch(question.timestamp!)}
              className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold opacity-80 hover:opacity-100 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Rewatch from {question.timestampLabel}
            </button>
          )}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-game text-sm shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isLast ? (discussionPrompt ? 'Next: Discussion' : 'Finish Briefing') : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
