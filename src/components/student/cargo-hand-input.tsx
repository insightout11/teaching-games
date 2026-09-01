'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Luggage, RefreshCw, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InputSpec } from '@/lib/input-spec';
import type { CargoCard, CargoPerStudentPayload } from '@/activities/cargo-hold/types';

interface CargoHandInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  clientId?: string;
}

function actionId(prefix: string, spec: InputSpec, clientId: string, extra = '') {
  // Stable per (student, round, intent) so a retry after a dropped response is the
  // same action rather than a second one.
  return `${prefix}:${spec.activityInstanceId ?? 'x'}:${spec.roundId ?? 'x'}:${clientId}${extra ? `:${extra}` : ''}`;
}

/**
 * Durable responses are unique per (session, client, gameKey, roundId), so each
 * distinct action inside a round needs its own suffixed round ID â€” otherwise a
 * Repack would consume the student's one accepted response and their Play would come
 * back as a silent duplicate. The prefix still identifies the live round.
 */
function actionRoundId(spec: InputSpec, action: string) {
  return `${spec.roundId ?? ''}::${action}`;
}

export function CargoHandInput({
  spec,
  onSubmit,
  isSubmitting,
  submitStatus,
  clientId,
}: CargoHandInputProps) {
  const payload = (clientId ? spec.perStudentData?.[clientId] : undefined) as
    | CargoPerStudentPayload
    | undefined;

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [repackSelection, setRepackSelection] = useState<string[]>([]);
  const [repackOpen, setRepackOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const hand = useMemo(() => payload?.hand ?? [], [payload]);
  const submittedCardId = payload?.submittedCardId ?? null;
  const submitted = Boolean(submittedCardId);

  const submit = useCallback(
    async (value: unknown) => {
      await onSubmit(JSON.stringify(value));
    },
    [onSubmit],
  );

  const handlePlay = useCallback(async () => {
    if (!selectedCardId || !clientId) return;
    await submit({
      type: 'play',
      actionId: actionId('play', spec, clientId),
      activityInstanceId: spec.activityInstanceId,
      roundId: actionRoundId(spec, 'play'),
      cardId: selectedCardId,
    });
  }, [selectedCardId, clientId, spec, submit]);

  const handleRepack = useCallback(async () => {
    if (repackSelection.length === 0 || !clientId) return;
    await submit({
      type: 'repack',
      actionId: actionId('repack', spec, clientId),
      activityInstanceId: spec.activityInstanceId,
      roundId: actionRoundId(spec, 'repack'),
      cardIds: repackSelection,
    });
    setRepackOpen(false);
    setRepackSelection([]);
  }, [repackSelection, clientId, spec, submit]);

  const handleBoard = useCallback(async () => {
    if (!clientId) return;
    await submit({
      type: 'board',
      actionId: actionId('board', spec, clientId),
      activityInstanceId: spec.activityInstanceId,
      roundId: actionRoundId(spec, 'board'),
    });
  }, [clientId, spec, submit]);

  const handleReadDone = useCallback(
    async (submissionId: string) => {
      if (!clientId) return;
      await submit({
        type: 'read-complete',
        actionId: actionId('read', spec, clientId, submissionId),
        activityInstanceId: spec.activityInstanceId,
        // Per-submission, so a reader with two announcements can confirm both.
        roundId: actionRoundId(spec, `read:${submissionId}`),
        submissionId,
      });
    },
    [clientId, spec, submit],
  );

  // â”€â”€ Boarding: the tap that tells the teacher screen this device is here â”€â”€â”€â”€â”€â”€
  if (spec.cargoStep === 'board') {
    const boarded = submitStatus === 'success' || Boolean(payload);
    return (
      <div className="space-y-4 text-center">
        <Luggage className="mx-auto h-10 w-10 text-cyan-300" aria-hidden />
        <p className="text-sm text-slate-300">{spec.prompt ?? 'Collect your hand to join the game.'}</p>
        {boarded ? (
          <p className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
            You are on board â€” waiting for the first prompt.
          </p>
        ) : (
          <Button onClick={handleBoard} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Boardingâ€¦' : 'Collect my cards'}
          </Button>
        )}
      </div>
    );
  }

  // â”€â”€ Reading: only the sentences this student was assigned â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (spec.cargoStep === 'read') {
    const assignments = payload?.readingAssignments ?? [];
    if (assignments.length === 0) {
      return (
        <p className="rounded-md border border-slate-600/40 bg-slate-800/40 px-3 py-4 text-center text-sm text-slate-300">
          Listen to the cabin announcements.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200">
          <Megaphone className="h-4 w-4" aria-hidden /> Your cabin announcement
        </p>
        {assignments.map((assignment) => (
          <div
            key={assignment.submissionId}
            className="rounded-lg border border-amber-300/30 bg-amber-400/[0.07] p-3"
          >
            <p className="text-base leading-relaxed text-slate-100">{assignment.sentence}</p>
            {assignment.done ? (
              <p className="mt-2 text-xs font-semibold text-emerald-300">Read â€” thank you!</p>
            ) : (
              <Button
                onClick={() => handleReadDone(assignment.submissionId)}
                disabled={isSubmitting}
                className="mt-3 w-full"
              >
                Read aloud â€” done
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // â”€â”€ Choosing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (hand.length === 0) {
    return (
      <p className="rounded-md border border-slate-600/40 bg-slate-800/40 px-3 py-4 text-center text-sm text-slate-300">
        Waiting for your cardsâ€¦
      </p>
    );
  }

  const toggleRepack = (cardId: string) => {
    setRepackSelection((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 2) return prev;
      return [...prev, cardId];
    });
  };

  const renderCard = (card: CargoCard) => {
    const isSelected = repackOpen ? repackSelection.includes(card.id) : selectedCardId === card.id;
    const isPlayed = submittedCardId === card.id;
    const expanded = expandedCardId === card.id;

    return (
      <li key={card.id}>
        <button
          type="button"
          onClick={() => {
            if (submitted) return;
            if (repackOpen) toggleRepack(card.id);
            else setSelectedCardId(card.id === selectedCardId ? null : card.id);
          }}
          aria-pressed={isSelected}
          disabled={submitted && !isPlayed}
          className={`w-full rounded-lg border p-3 text-left transition-colors disabled:opacity-45 ${
            isPlayed
              ? 'border-emerald-400/50 bg-emerald-400/10'
              : isSelected
                ? 'border-cyan-300/70 bg-cyan-400/12'
                : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-400/60'
          }`}
        >
          <span className="flex items-start gap-2">
            {card.emoji ? (
              <span aria-hidden className="text-lg leading-none">{card.emoji}</span>
            ) : null}
            <span className="flex-1">
              <span className="block text-[15px] leading-snug text-slate-100">{card.text}</span>
              <span className="mt-1 block text-xs text-cyan-200/90">{card.targetForm}</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpandedCardId(expanded ? null : card.id)}
          className="mt-1 px-1 text-[11px] text-slate-400 underline underline-offset-2"
          aria-expanded={expanded}
        >
          {expanded ? 'Hide meaning' : 'What does it mean?'}
        </button>
        {expanded ? (
          <p className="px-1 pb-1 text-[11px] leading-relaxed text-slate-300">
            <span className="font-semibold text-slate-200">{card.targetTerm}</span> â€” {card.meaning}
          </p>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      {payload?.customsRefreshed ? (
        <p className="rounded-md border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
          Customs refreshed your hand for this prompt.
        </p>
      ) : null}

      {spec.cargoPromptBefore ? (
        <p className="rounded-md border border-slate-600/40 bg-slate-900/60 px-3 py-2 text-sm leading-relaxed text-slate-200">
          {spec.cargoPromptBefore}
          <span className="mx-1 inline-block min-w-[42px] border-b-2 border-dashed border-cyan-300/70 align-middle" />
          {spec.cargoPromptAfter}
        </p>
      ) : null}
      {spec.cargoAccepts ? (
        <p className="text-center text-[11px] uppercase tracking-wider text-slate-400">
          This prompt takes {spec.cargoAccepts}
        </p>
      ) : null}

      <ul className="space-y-2">{hand.map(renderCard)}</ul>

      {submitted ? (
        <p className="flex items-center justify-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
          <Check className="h-4 w-4" aria-hidden /> Cargo loaded
        </p>
      ) : repackOpen ? (
        <div className="space-y-2">
          <p className="text-center text-xs text-slate-300">
            Choose up to 2 cards to send back ({repackSelection.length}/2)
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleRepack}
              disabled={isSubmitting || repackSelection.length === 0}
              className="flex-1"
            >
              Repack
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setRepackOpen(false); setRepackSelection([]); }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={handlePlay} disabled={isSubmitting || !selectedCardId} className="w-full">
            {isSubmitting ? 'Loadingâ€¦' : selectedCardId ? 'Load this card' : 'Pick a card'}
          </Button>
          {!payload?.repackUsed ? (
            <Button
              variant="secondary"
              onClick={() => { setRepackOpen(true); setSelectedCardId(null); }}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden /> Repack (once per game)
            </Button>
          ) : null}
        </div>
      )}

      {submitStatus === 'error' ? (
        <p className="text-center text-xs text-red-300">That did not send. Try again.</p>
      ) : null}
    </div>
  );
}
