'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type { ComprehensionQuestion } from '@/types/source-material';
import type { ActivityProps, RemoteVote } from '../types';
import { CheckCircle2, ChevronRight, Eye, Quote, RotateCcw } from 'lucide-react';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

const LETTER_TONES = ['text-amber-300', 'text-cyan-300', 'text-violet-300', 'text-rose-300', 'text-emerald-300', 'text-sky-300'];

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
      <div className="mx-auto max-w-2xl space-y-4">
        <KitLabel tone="amber">Talk about it</KitLabel>
        <div className="rounded-2xl border border-amber-300/30 bg-slate-950/60 p-6 backdrop-blur-md">
          <p className="font-display text-3xl leading-snug text-white">{discussionPrompt}</p>
          <p className="mt-3 text-sm text-white/55">Discuss as a class or in pairs. There&apos;s no single right answer.</p>
        </div>
        <KitButton tone="amber" solid onClick={handleFinish} className="w-full justify-center !py-3 !text-base" icon={<ChevronRight className="h-4 w-4" />}>
          Finish
        </KitButton>
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <KitLabel tone="cyan">Check your understanding</KitLabel>
        <KitReadout>{index + 1} / {questions.length}</KitReadout>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/65 p-5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-[26px] leading-snug text-white">{question.question}</p>
          <span className="mt-2 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-300">
            {voteCount}/{students.length} answered
          </span>
        </div>

        <div className="space-y-2">
          {question.options.map((opt, oi) => {
            const count = Object.values(qVotes).filter((v) => v.choice === opt).length;
            const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
            const isCorrect = oi === question.correctIndex;
            const showCorrect = revealed && isCorrect;
            const faded = revealed && !isCorrect;
            return (
              <div
                key={oi}
                className={`relative overflow-hidden rounded-xl border px-4 py-3 transition-colors ${
                  showCorrect ? 'border-emerald-300/70 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]'
                } ${faded ? 'opacity-60' : ''}`}
              >
                {/* Tally bar sits behind the text, only after the reveal (no herding). */}
                {revealed && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ${showCorrect ? 'bg-emerald-400/20' : 'bg-white/[0.06]'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center gap-3">
                  <span className={`w-5 shrink-0 font-mono text-xs font-semibold ${showCorrect ? 'text-emerald-300' : LETTER_TONES[oi % LETTER_TONES.length]}`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className={`flex-1 text-base ${showCorrect ? 'font-semibold text-emerald-100' : 'text-white/90'}`}>{opt}</span>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />}
                  {revealed && <span className="shrink-0 font-mono text-xs text-white/60">{count} · {pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>

        {!revealed && pending.length > 0 && pending.length <= 8 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">
            Waiting on <span className="text-white/75">{pending.map((s) => s.name).join(', ')}</span>
          </p>
        )}

        {revealed && (question.explanation || question.evidence) && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            {question.explanation && <p className="text-base text-white/85">{question.explanation}</p>}
            {question.evidence && (
              <p className="flex items-start gap-2 text-sm italic text-white/60">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>&ldquo;{question.evidence}&rdquo;</span>
              </p>
            )}
          </div>
        )}
      </div>

      {!revealed ? (
        <KitButton
          tone="emerald"
          solid
          onClick={() => {
            scoreCurrentQuestion();
            setPhase('revealed');
          }}
          className="w-full justify-center !py-3 !text-base"
          icon={<Eye className="h-4 w-4" />}
        >
          Reveal the answer
        </KitButton>
      ) : (
        <div className="flex gap-2">
          {onRewatch && typeof question.timestamp === 'number' && question.timestamp > 0 && (
            <KitButton tone="cyan" onClick={() => onRewatch(question.timestamp!)} className="justify-center !py-3" icon={<RotateCcw className="h-4 w-4" />}>
              Rewatch from {question.timestampLabel}
            </KitButton>
          )}
          <KitButton tone="amber" solid onClick={handleNext} className="flex-1 justify-center !py-3 !text-base" icon={<ChevronRight className="h-4 w-4" />}>
            {isLast ? (discussionPrompt ? 'Next: talk about it' : 'Finish') : 'Next question'}
          </KitButton>
        </div>
      )}
    </div>
  );
}
