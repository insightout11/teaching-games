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
        [qIdx]: { ...(prev[qIdx] ?? {}), [clientId]: { choice, name: displayName } },
      }));

      const scoreKey = `${qIdx}:${clientId}`;
      if (!scoredRef.current.has(scoreKey)) {
        scoredRef.current.add(scoreKey);
        const isCorrect = cp.options.indexOf(choice) === cp.correctIndex;
        void onScore?.({
          studentId: null,
          clientId,
          displayName,
          promptIndex: promptIndexOffset + qIdx + 1,
          points: isCorrect ? 5 : 1,
          isCorrect: null,
        });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

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
        <div className="flex items-center gap-2 text-sm text-lc-text2">
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">Talk About It</span>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
          <p className="text-lg font-medium text-lc-text leading-snug">{discussionPrompt}</p>
          <p className="text-xs text-lc-text3 mt-3">Discuss as a class or in pairs — no single right answer.</p>
        </div>
        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-lc-blue text-white font-bold text-sm hover:bg-lc-blue/80 transition-colors flex items-center justify-center gap-1.5"
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
        <div className="flex items-center gap-2 text-sm text-lc-text2">
          <ListChecks className="w-4 h-4 text-lc-blue" />
          <span className="font-semibold">Comprehension Check</span>
        </div>
        <span className="text-xs text-lc-text3">
          Question {index + 1} / {questions.length}
        </span>
      </div>

      <div className="rounded-xl border border-lc-border bg-lc-surface p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold text-lc-text leading-snug">{question.question}</p>
          <span className="text-xs text-lc-text3 shrink-0 mt-1">
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
                <span className={`text-xs font-bold w-5 shrink-0 ${showCorrect ? 'text-lc-success' : 'text-lc-text3'}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-0.5">
                    <span className={`flex items-center gap-1.5 ${showCorrect ? 'text-lc-success font-semibold' : 'text-lc-text2'}`}>
                      {opt}
                      {showCorrect && <CheckCircle2 className="w-4 h-4" />}
                    </span>
                    <span className="text-lc-text3 shrink-0 ml-2">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-lc-bg overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${showCorrect ? 'bg-lc-success' : 'bg-lc-blue/60'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending students (while voting, small class nudge) */}
        {!revealed && pending.length > 0 && pending.length <= 8 && (
          <p className="text-xs text-lc-text3">
            Waiting on: <span className="text-lc-text2">{pending.map((s) => s.name).join(', ')}</span>
          </p>
        )}

        {/* Reveal extras: rationale + evidence */}
        {revealed && (question.explanation || question.evidence) && (
          <div className="space-y-2 pt-1 border-t border-lc-border">
            {question.explanation && (
              <p className="text-sm text-lc-text2 pt-2">{question.explanation}</p>
            )}
            {question.evidence && (
              <p className="flex items-start gap-2 text-xs text-lc-text3 italic">
                <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>&ldquo;{question.evidence}&rdquo;</span>
              </p>
            )}
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setPhase('revealed')}
          className="w-full py-3 rounded-xl bg-lc-success/20 text-lc-success font-bold text-sm hover:bg-lc-success/30 transition-colors"
        >
          Reveal Answer
        </button>
      ) : (
        <div className="space-y-2">
          {onRewatch && typeof question.timestamp === 'number' && question.timestamp > 0 && (
            <button
              onClick={() => onRewatch(question.timestamp!)}
              className="w-full py-2.5 rounded-xl border border-lc-border bg-lc-surface text-sm font-semibold text-lc-text2 hover:text-lc-text transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Rewatch from {question.timestampLabel}
            </button>
          )}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-lc-blue text-white font-bold text-sm hover:bg-lc-blue/80 transition-colors flex items-center justify-center gap-1.5"
          >
            {isLast ? (discussionPrompt ? 'Next: Discussion' : 'Finish Briefing') : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
