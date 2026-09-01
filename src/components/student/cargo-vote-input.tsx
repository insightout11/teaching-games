'use client';

import { useCallback, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InputSpec } from '@/lib/input-spec';
import type { CargoPerStudentPayload } from '@/activities/cargo-hold/types';

interface CargoVoteInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  clientId?: string;
}

export function CargoVoteInput({
  spec,
  onSubmit,
  isSubmitting,
  submitStatus,
  clientId,
}: CargoVoteInputProps) {
  const payload = (clientId ? spec.perStudentData?.[clientId] : undefined) as
    | CargoPerStudentPayload
    | undefined;

  const [selected, setSelected] = useState<string | null>(null);
  const options = spec.cargoVoteOptions ?? [];
  const ownSubmissionId = payload?.ownSubmissionId ?? null;
  const votedSubmissionId = payload?.votedSubmissionId ?? null;
  const hasVoted = Boolean(votedSubmissionId) || submitStatus === 'success';

  const handleVote = useCallback(async () => {
    if (!selected || !clientId) return;
    await onSubmit(JSON.stringify({
      type: 'vote',
      // One vote per student per round â€” the same action id on a retry keeps it that way.
      actionId: `vote:${spec.activityInstanceId ?? 'x'}:${spec.roundId ?? 'x'}:${clientId}`,
      activityInstanceId: spec.activityInstanceId,
      roundId: `${spec.roundId ?? ''}::vote`,
      submissionId: selected,
    }));
  }, [selected, clientId, spec, onSubmit]);

  if (options.length === 0) {
    return (
      <p className="rounded-md border border-slate-600/40 bg-slate-800/40 px-3 py-4 text-center text-sm text-slate-300">
        Waiting for the answersâ€¦
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-300">
        {spec.prompt ?? 'Which one is the funniest?'}
      </p>

      <ul className="space-y-2">
        {options.map((option) => {
          const isOwn = option.submissionId === ownSubmissionId;
          const isSelected = selected === option.submissionId;
          const isVoted = votedSubmissionId === option.submissionId;

          return (
            <li key={option.submissionId}>
              <button
                type="button"
                disabled={isOwn || hasVoted}
                aria-pressed={isSelected}
                onClick={() => setSelected(option.submissionId)}
                className={`w-full rounded-lg border p-3 text-left text-[15px] leading-snug transition-colors disabled:cursor-not-allowed ${
                  isVoted
                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
                    : isOwn
                      ? 'border-slate-700/60 bg-slate-900/50 text-slate-500'
                      : isSelected
                        ? 'border-cyan-300/70 bg-cyan-400/12 text-slate-100'
                        : 'border-slate-600/50 bg-slate-800/50 text-slate-100 hover:border-slate-400/60'
                }`}
              >
                {option.sentence}
                {isOwn ? (
                  <span className="mt-1 block text-[11px] uppercase tracking-wide text-slate-500">
                    Your answer â€” you cannot vote for yourself
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {hasVoted ? (
        <p className="flex items-center justify-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
          <Check className="h-4 w-4" aria-hidden /> Vote counted
        </p>
      ) : (
        <Button onClick={handleVote} disabled={isSubmitting || !selected} className="w-full">
          {isSubmitting ? 'Sendingâ€¦' : 'Vote'}
        </Button>
      )}
    </div>
  );
}
