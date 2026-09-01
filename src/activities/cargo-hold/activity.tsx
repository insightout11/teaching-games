'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Luggage,
  Megaphone,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityProps, CargoHoldContent } from '../types';
import type { CargoCard, CargoPerStudentPayload, CargoPrompt } from './types';
import { dealHand, drawReplacement, repairHandForPrompt } from './deal';
import { assignReaders, reassignReader } from './reader-assignment';
import { favoriteSubmissionIds, parseStudentAction, scoreKey, scoreRound } from './scoring';
import { buildFallbackDeck } from './fallback-deck';
import { validateDeck } from './content-validation';
import {
  applyStudentAction,
  confirmScore,
  emptyCargoState,
  hasUnsavedScores,
  hydrateCargoState,
  roundIdFor,
  type CargoRuntimeState,
  type PendingCargoScore,
} from './state';

const MIN_PLAYERS = 3;
const DEFAULT_ROUNDS = 5;

function acceptsLabel(prompt: CargoPrompt): string {
  const names: Record<string, string> = {
    thing: 'a thing',
    action: 'an action',
    description: 'a description',
    reason: 'a reason',
    wildcard: 'a wildcard',
  };
  const labels = prompt.acceptedFamilies.map((family) => names[family] ?? family);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}

export function CargoHoldActivity({
  sessionId,
  students,
  generatedContent,
  sessionSettings,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  isMicroEvent,
}: ActivityProps) {
  const content = generatedContent as CargoHoldContent;

  const { cards: deck, prompts } = useMemo(() => {
    const checked = validateDeck(content?.cards, content?.prompts);
    if (checked.valid) return { cards: checked.cards, prompts: checked.prompts };
    return buildFallbackDeck(content?.topicContext ?? sessionSettings?.topic ?? '');
  }, [content, sessionSettings?.topic]);

  const totalRounds = isMicroEvent ? 1 : Math.min(DEFAULT_ROUNDS, prompts.length);

  // The ref is authoritative and updated synchronously; React state only mirrors it
  // for rendering. See state.ts for why the handler must never read React state.
  const stateRef = useRef<CargoRuntimeState>(emptyCargoState());
  const [view, setView] = useState<CargoRuntimeState>(stateRef.current);
  const [restoring, setRestoring] = useState(true);

  const deckRef = useRef(deck);
  deckRef.current = deck;
  const promptsRef = useRef(prompts);
  promptsRef.current = prompts;
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<CargoRuntimeState | null>(null);

  // â”€â”€ Persistence â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Monotonic save counter â€” the server rejects an older sequence, so two saves
   *  landing out of order cannot roll state backwards. */
  const saveSequenceRef = useRef(0);

  const sendState = useCallback(
    (state: CargoRuntimeState, { keepalive = false } = {}) => {
      if (!sessionId) return;
      saveSequenceRef.current += 1;
      const body = JSON.stringify({ sessionId, state, sequence: saveSequenceRef.current });
      void fetch('/api/session/cargo-hold-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        // keepalive lets the final save survive the page teardown that a refresh causes.
        keepalive,
      }).catch(() => {
        // A failed save costs refresh recovery, never the live round.
      });
    },
    [sessionId],
  );

  /** Coalesced save, for the burst a reconnect replay produces. */
  const persist = useCallback(() => {
    if (!sessionId) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    pendingSaveRef.current = stateRef.current;
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      pendingSaveRef.current = null;
      sendState(stateRef.current);
    }, 250);
  }, [sessionId, sendState]);

  /** Writes immediately, cancelling any coalesced save it supersedes. */
  const persistNow = useCallback(
    (state: CargoRuntimeState, options?: { keepalive?: boolean }) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      pendingSaveRef.current = null;
      sendState(state, options);
    },
    [sendState],
  );

  /** The single write path: mutate the authoritative ref, mirror it, persist it. */
  const commit = useCallback(
    (next: CargoRuntimeState, { save = true } = {}) => {
      stateRef.current = next;
      setView(next);
      if (save) persist();
    },
    [persist],
  );

  // â”€â”€ Spec building â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const buildChoosePayload = useCallback((state: CargoRuntimeState): Record<string, unknown> => {
    const data: Record<string, unknown> = {};
    Object.entries(state.hands).forEach(([clientId, hand]) => {
      const submitted = state.submissions.find((s) => s.clientId === clientId);
      const payload: CargoPerStudentPayload = {
        hand,
        repackUsed: state.players[clientId]?.repackUsed ?? false,
        ...(submitted ? { submittedCardId: submitted.cardId } : {}),
        ...(state.refreshed.includes(clientId) ? { customsRefreshed: true } : {}),
      };
      data[clientId] = payload;
    });
    return data;
  }, []);

  const buildReadPayload = useCallback((state: CargoRuntimeState): Record<string, unknown> => {
    const data: Record<string, unknown> = {};
    Object.keys(state.players).forEach((clientId) => {
      const mine = state.submissions
        .filter((s) => state.readerAssignment[s.submissionId] === clientId)
        .map((s) => ({
          submissionId: s.submissionId,
          sentence: s.composedSentence,
          done: state.readDone.includes(s.submissionId),
        }));
      data[clientId] = { hand: [], repackUsed: false, readingAssignments: mine } as CargoPerStudentPayload;
    });
    return data;
  }, []);

  const buildVotePayload = useCallback((state: CargoRuntimeState): Record<string, unknown> => {
    const data: Record<string, unknown> = {};
    Object.keys(state.players).forEach((clientId) => {
      const own = state.submissions.find((s) => s.clientId === clientId);
      const payload: CargoPerStudentPayload = {
        hand: [],
        repackUsed: false,
        ...(own ? { ownSubmissionId: own.submissionId } : {}),
        ...(state.votedClientIds.includes(clientId) ? { votedSubmissionId: 'recorded' } : {}),
      };
      data[clientId] = payload;
    });
    return data;
  }, []);

  /** Rebroadcasts the spec that matches the state's current phase. */
  const broadcastFor = useCallback(
    (state: CargoRuntimeState) => {
      const identity = {
        id: state.instanceId,
        startedAt: state.instanceStartedAt,
        sequence: state.sequence,
      };
      const common = {
        gameKey: 'cargo-hold' as const,
        activityInstanceId: state.instanceId,
        activityInstanceStartedAt: state.instanceStartedAt,
        activitySequence: state.sequence,
      };

      if (state.phase === 'dealing') {
        onSetInputSpec?.(
          {
            ...common,
            type: 'cargo-hand',
            cargoStep: 'board',
            prompt: 'Tap to collect your hand of cards.',
            roundId: roundIdFor(state.instanceId, 'board', 0),
          },
          identity,
        );
        return;
      }

      if (state.phase === 'choosing') {
        const prompt = promptsRef.current[state.roundIndex];
        onSetInputSpec?.(
          {
            ...common,
            type: 'cargo-hand',
            cargoStep: 'choose',
            roundId: roundIdFor(state.instanceId, 'choose', state.roundIndex),
            ...(prompt
              ? {
                  cargoPromptBefore: prompt.textBefore,
                  cargoPromptAfter: prompt.textAfter ?? '',
                  cargoAccepts: acceptsLabel(prompt),
                }
              : {}),
            perStudentData: buildChoosePayload(state),
          },
          identity,
        );
        return;
      }

      if (state.phase === 'reading') {
        onSetInputSpec?.(
          {
            ...common,
            type: 'cargo-hand',
            cargoStep: 'read',
            prompt: 'Read your announcement when the captain calls it.',
            roundId: roundIdFor(state.instanceId, 'read', state.roundIndex),
            perStudentData: buildReadPayload(state),
          },
          identity,
        );
        return;
      }

      if (state.phase === 'voting') {
        const options = state.submissions
          .filter((s) => s.teacherValidity)
          .map((s) => ({ submissionId: s.submissionId, sentence: s.composedSentence }));
        onSetInputSpec?.(
          {
            ...common,
            type: 'cargo-vote',
            cargoStep: 'vote',
            prompt: 'Vote for the funniest one â€” you cannot vote for your own.',
            roundId: roundIdFor(state.instanceId, 'vote', state.roundIndex),
            cargoVoteOptions: options,
            perStudentData: buildVotePayload(state),
          },
          identity,
        );
        return;
      }

      onSetInputSpec?.(null, identity);
    },
    [buildChoosePayload, buildReadPayload, buildVotePayload, onSetInputSpec],
  );

  /** Advance the sequence and publish. Every transition goes through here. */
  const commitAndBroadcast = useCallback(
    (next: CargoRuntimeState) => {
      const bumped = { ...next, sequence: next.sequence + 1 };
      // Transitions are saved synchronously rather than coalesced: a refresh moments
      // after one must not restore the previous phase.
      commit(bumped, { save: false });
      persistNow(bumped);
      broadcastFor(bumped);
      onPhaseChange?.(bumped.phase);
    },
    [broadcastFor, commit, onPhaseChange, persistNow],
  );

  // â”€â”€ Score writes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [scoreSaveFailed, setScoreSaveFailed] = useState(false);
  const flushingRef = useRef(false);
  const flushScoresRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Writes every unconfirmed score, one at a time, removing each from the pending list
   * only once the server confirms it is stored. Safe to call repeatedly: the writes
   * carry an idempotency key, so a retry after a partial failure cannot double-score.
   */
  const flushScores = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setScoreSaveFailed(false);
    try {
      let failed = false;
      // Re-read the ref each pass: a student action may have committed meanwhile.
      while (stateRef.current.pendingScores.length > 0) {
        const entry = stateRef.current.pendingScores[0];
        let stored = false;
        try {
          stored = await onScore?.({
            studentId: entry.studentId,
            clientId: entry.clientId,
            displayName: entry.displayName,
            promptIndex: entry.promptIndex,
            points: entry.points,
            // Cargo's approved awards are 0/1/3, which the outcome ladder (0/1/3/5)
            // cannot express for a favourite. Persist the real number.
            exactPoints: entry.points,
            isCorrect: entry.isCorrect,
            outcome: entry.outcome,
            idempotencyKey: entry.key,
          }) ?? false;
        } catch {
          // A transport failure must take the same visible, retryable path as an
          // HTTP/database rejection. Leaving the rejection uncaught strands the UI
          // on "Saving scoresâ€¦" with no Retry button.
          stored = false;
        }
        if (!stored) { failed = true; break; }
        const next = confirmScore(stateRef.current, entry.key);
        commit(next, { save: false });
        persistNow(next);
      }
      setScoreSaveFailed(failed);
    } finally {
      flushingRef.current = false;
    }
  }, [commit, onScore, persistNow]);

  flushScoresRef.current = flushScores;

  // â”€â”€ Restore after a teacher refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setRestoring(false);
      return () => { cancelled = true; };
    }

    void (async () => {
      try {
        const res = await fetch(`/api/session/cargo-hold-state?sessionId=${sessionId}`);
        if (!res.ok) return;
        const { state, sequence } = (await res.json()) as { state: unknown; sequence?: number };
        const restored = hydrateCargoState(state);
        if (cancelled || !restored) return;
        if (restored.phase === 'idle' || restored.phase === 'finished') return;

        // Re-publish the spec so student devices rejoin the round they were in
        // instead of holding an abandoned one.
        // Continue the stored save counter. Starting from zero would make every
        // post-refresh save look older than what is already stored, and the
        // compare-and-set would reject them all until the counter caught up.
        saveSequenceRef.current = typeof sequence === 'number' ? sequence : 0;

        const resumed = { ...restored, sequence: restored.sequence + 1 };
        stateRef.current = resumed;
        setView(resumed);
        broadcastFor(resumed);
        onPhaseChange?.(resumed.phase);
        // Finish any score the previous mount did not get confirmation for.
        if (hasUnsavedScores(resumed)) void flushScoresRef.current?.();
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => { cancelled = true; };
    // Restore runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // â”€â”€ Student actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      const action = parseStudentAction(vote.choice ?? '');
      if (!action) return;

      const result = applyStudentAction(
        stateRef.current,
        action,
        {
          clientId: vote.clientId,
          studentId: vote.studentId ?? null,
          displayName: vote.displayName,
        },
        { deck: deckRef.current, prompts: promptsRef.current },
      );
      if (result.state === stateRef.current) return;

      // Synchronous: the next replayed action in this same burst sees this one.
      if (result.changed === 'none') {
        commit(result.state);
        return;
      }

      const bumped = { ...result.state, sequence: result.state.sequence + 1 };
      commit(bumped);
      // Hands, submission confirmations, readings and votes all change what at least
      // one device must render, so the spec is rewritten with the new per-student data.
      broadcastFor(bumped);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, broadcastFor, commit]);

  // â”€â”€ Teacher transitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const startGame = useCallback(() => {
    const fresh: CargoRuntimeState = {
      ...emptyCargoState(),
      instanceId: `cargo-${Date.now().toString(36)}`,
      instanceStartedAt: Date.now(),
      phase: 'dealing',
    };
    commitAndBroadcast(fresh);
  }, [commitAndBroadcast]);

  const dealAndStartRound = useCallback(() => {
    const state = stateRef.current;
    const prompt = promptsRef.current[0];
    if (!prompt) return;
    const hands: Record<string, CargoCard[]> = {};
    Object.keys(state.players).forEach((clientId) => {
      hands[clientId] = dealHand(deckRef.current, prompt);
    });
    commitAndBroadcast({ ...state, hands, refreshed: [], roundIndex: 0, phase: 'choosing' });
  }, [commitAndBroadcast]);

  const closeChoosing = useCallback(() => {
    commitAndBroadcast({ ...stateRef.current, phase: 'validating' });
  }, [commitAndBroadcast]);

  const toggleValidity = useCallback(
    (submissionId: string) => {
      const state = stateRef.current;
      commit({
        ...state,
        submissions: state.submissions.map((s) =>
          s.submissionId === submissionId ? { ...s, teacherValidity: !s.teacherValidity } : s,
        ),
      });
    },
    [commit],
  );

  const startReading = useCallback(() => {
    const state = stateRef.current;
    const readerAssignment = assignReaders({
      submissions: state.submissions,
      readerClientIds: Object.keys(state.players),
      roundId: roundIdFor(state.instanceId, 'read', state.roundIndex),
    });
    commitAndBroadcast({
      ...state,
      readerAssignment,
      readDone: [],
      readingIndex: 0,
      phase: 'reading',
    });
  }, [commitAndBroadcast]);

  const handleReassignReader = useCallback(
    (submissionId: string) => {
      const state = stateRef.current;
      const submission = state.submissions.find((s) => s.submissionId === submissionId);
      if (!submission) return;
      commitAndBroadcast({
        ...state,
        readerAssignment: reassignReader(
          state.readerAssignment,
          submission,
          Object.keys(state.players),
        ),
      });
    },
    [commitAndBroadcast],
  );

  const advanceReading = useCallback(() => {
    const state = stateRef.current;
    commit({ ...state, readingIndex: state.readingIndex + 1 });
  }, [commit]);

  const startVoting = useCallback(() => {
    commitAndBroadcast({ ...stateRef.current, votedClientIds: [], phase: 'voting' });
  }, [commitAndBroadcast]);

  const closeVoting = useCallback(() => {
    const state = stateRef.current;
    const scores = scoreRound(state.submissions);
    const roundKey = roundIdFor(state.instanceId, 'vote', state.roundIndex);

    const players = { ...state.players };
    const pendingScores: PendingCargoScore[] = [];

    scores.forEach((score) => {
      const key = scoreKey(state.instanceId, roundKey, score.clientId);
      if (state.scoredKeys.includes(key)) return;
      if (state.pendingScores.some((entry) => entry.key === key)) return;

      const player = players[score.clientId];
      if (player) {
        players[score.clientId] = {
          ...player,
          grammarPoints: player.grammarPoints + score.grammarPoints,
          favoritePoints: player.favoritePoints + score.favoriteBonus,
        };
      }

      pendingScores.push({
        key,
        studentId: score.studentId,
        clientId: score.clientId,
        displayName: score.displayName,
        promptIndex: state.roundIndex + 1,
        points: score.points,
        outcome: score.outcome,
        isCorrect: score.grammarPoints > 0,
      });
    });

    // Pending writes are part of the persisted state, so a refresh mid-write resumes
    // them and advancing the round cannot discard what they need.
    commitAndBroadcast({
      ...state,
      players,
      pendingScores: [...state.pendingScores, ...pendingScores],
      phase: 'result',
    });
    void flushScores();
  }, [commitAndBroadcast, flushScores]);

  const nextRound = useCallback(() => {
    const state = stateRef.current;
    const upcomingIndex = state.roundIndex + 1;
    if (upcomingIndex >= totalRounds) {
      commitAndBroadcast({ ...state, phase: 'finished' });
      return;
    }

    const upcomingPrompt = promptsRef.current[upcomingIndex];
    const refreshed: string[] = [];
    const hands: Record<string, CargoCard[]> = {};

    Object.entries(state.hands).forEach(([clientId, hand]) => {
      const played = state.submissions.find((s) => s.clientId === clientId);
      const afterDraw = played
        ? drawReplacement(hand, played.cardId, deckRef.current, upcomingPrompt)
        : hand;
      const repaired = repairHandForPrompt(afterDraw, deckRef.current, upcomingPrompt);
      hands[clientId] = repaired.hand;
      if (repaired.refreshed) refreshed.push(clientId);
    });

    commitAndBroadcast({
      ...state,
      hands,
      refreshed,
      submissions: [],
      votedClientIds: [],
      readerAssignment: {},
      readDone: [],
      readingIndex: 0,
      roundIndex: upcomingIndex,
      // Previous rounds' action IDs are dead weight â€” a replayed action from an earlier
      // round is already rejected on round identity â€” and the persisted payload has to
      // stay small enough for the keepalive flush on refresh (64KB budget).
      processedActionIds: [],
      phase: 'choosing',
    });
  }, [commitAndBroadcast, totalRounds]);

  // A refresh unmounts this component. Flush whatever the debounce still owes with a
  // keepalive request rather than cancelling it, or the newest state is lost exactly
  // when recovery needs it.
  useEffect(
    () => () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        if (pendingSaveRef.current) persistNow(stateRef.current, { keepalive: true });
      }
    },
    [persistNow],
  );

  // â”€â”€ Shared screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const orderedSubmissions = useMemo(
    () => [...view.submissions].sort((a, b) => a.submissionId.localeCompare(b.submissionId)),
    [view.submissions],
  );
  const favorites = useMemo(
    () => new Set(favoriteSubmissionIds(view.submissions)),
    [view.submissions],
  );
  const playerList = useMemo(() => Object.values(view.players), [view.players]);
  const leaderboard = useMemo(
    () =>
      [...playerList].sort(
        (a, b) => b.grammarPoints + b.favoritePoints - (a.grammarPoints + a.favoritePoints),
      ),
    [playerList],
  );

  const boardedCount = playerList.length;
  const unsavedScores = view.pendingScores.length;
  const currentPrompt = prompts[view.roundIndex] ?? prompts[0] ?? null;
  const nextPrompt = prompts[view.roundIndex + 1] ?? null;

  if (restoring) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center text-sm text-slate-400">
        Checking the cargo manifestâ€¦
      </div>
    );
  }

  if (view.phase === 'idle') {
    const enough = students.length >= MIN_PLAYERS;
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6 text-center">
        <Luggage className="mx-auto h-12 w-12 text-cyan-300" aria-hidden />
        <h2 className="text-2xl font-bold text-slate-100">Cargo Hold</h2>
        <ol className="space-y-2 text-left text-sm text-slate-300">
          <li>1. Everyone keeps a private hand of cards across the whole game.</li>
          <li>2. Each round, play the card that fits the prompt grammatically.</li>
          <li>3. Answers are read anonymously â€” the class votes for the funniest one.</li>
        </ol>
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {totalRounds} rounds Â· {deck.length} cards Â· needs {MIN_PLAYERS}â€“12 students
        </p>
        {!enough ? (
          <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Cargo Hold needs at least {MIN_PLAYERS} students on the roster.
          </p>
        ) : null}
        <Button onClick={startGame} disabled={!enough} size="lg">
          Open the cargo hold
        </Button>
      </div>
    );
  }

  if (view.phase === 'dealing') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6 text-center">
        <Users className="mx-auto h-10 w-10 text-cyan-300" aria-hidden />
        <h2 className="text-xl font-bold text-slate-100">Collecting hands</h2>
        <p className="text-sm text-slate-300">
          Everyone taps &quot;Collect my cards&quot; on their phone.
        </p>
        <p className="text-4xl font-bold tabular-nums text-cyan-200">{boardedCount}</p>
        <p className="text-xs uppercase tracking-wider text-slate-400">on board</p>
        <div className="flex flex-wrap justify-center gap-2">
          {playerList.map((player) => (
            <span
              key={player.clientId}
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
            >
              {player.displayName}
            </span>
          ))}
        </div>
        <Button onClick={dealAndStartRound} disabled={boardedCount < MIN_PLAYERS} size="lg">
          Deal the cards
        </Button>
        {boardedCount < MIN_PLAYERS ? (
          <p className="text-xs text-slate-400">Waiting for {MIN_PLAYERS - boardedCount} more.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
        <span>Round {view.roundIndex + 1} of {totalRounds}</span>
        <span>{boardedCount} players</span>
      </header>

      {currentPrompt && view.phase !== 'finished' ? (
        <p className="rounded-xl border border-slate-600/40 bg-slate-900/60 p-6 text-center text-2xl leading-relaxed text-slate-100">
          {currentPrompt.textBefore}
          <span className="mx-2 inline-block min-w-[120px] border-b-2 border-dashed border-cyan-300/70 align-middle" />
          {currentPrompt.textAfter}
        </p>
      ) : null}

      {view.phase === 'choosing' ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-300">
            This prompt takes{' '}
            <span className="text-cyan-200">{currentPrompt ? acceptsLabel(currentPrompt) : ''}</span>
          </p>
          <p className="text-4xl font-bold tabular-nums text-cyan-200">
            {view.submissions.length}
            <span className="text-lg text-slate-400"> / {boardedCount}</span>
          </p>
          <p className="text-xs uppercase tracking-wider text-slate-400">cargo loaded</p>
          <Button onClick={closeChoosing} disabled={view.submissions.length === 0} size="lg">
            Close the cargo hold
          </Button>
        </div>
      ) : null}

      {view.phase === 'validating' ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-300">
            Check the grammar. Tap any card to override the stamp.
          </p>
          {orderedSubmissions.map((submission) => (
            <button
              key={submission.submissionId}
              type="button"
              onClick={() => toggleValidity(submission.submissionId)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                submission.teacherValidity
                  ? 'border-emerald-400/40 bg-emerald-400/[0.07]'
                  : 'border-amber-400/40 bg-amber-400/[0.07]'
              }`}
            >
              {submission.teacherValidity ? (
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
              )}
              <span>
                <span className="block text-base text-slate-100">{submission.composedSentence}</span>
                <span
                  className={`mt-1 block text-xs ${
                    submission.teacherValidity ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {submission.teacherValidity
                    ? 'Cleared by customs'
                    : 'Held at customs â€” the grammar does not fit this prompt'}
                </span>
              </span>
            </button>
          ))}
          <div className="pt-2 text-center">
            <Button onClick={startReading} size="lg">Read them out</Button>
          </div>
        </div>
      ) : null}

      {view.phase === 'reading' ? (
        <div className="space-y-4">
          <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-amber-200">
            <Megaphone className="h-4 w-4" aria-hidden /> Cabin announcements
          </p>
          {orderedSubmissions.slice(0, view.readingIndex + 1).map((submission, index) => {
            const readerId = view.readerAssignment[submission.submissionId];
            const reader = readerId ? view.players[readerId] : null;
            const isCurrent = index === view.readingIndex;
            return (
              <div
                key={submission.submissionId}
                className={`rounded-lg border p-4 ${
                  isCurrent
                    ? 'border-cyan-300/50 bg-cyan-400/[0.08]'
                    : 'border-slate-600/40 bg-slate-800/40'
                }`}
              >
                <p className="text-lg text-slate-100">{submission.composedSentence}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {reader ? `Read by ${reader.displayName}` : 'No reader available â€” read it yourself'}
                    {view.readDone.includes(submission.submissionId) ? ' Â· done' : ''}
                  </span>
                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleReassignReader(submission.submissionId)}
                      className="underline underline-offset-2 hover:text-slate-200"
                    >
                      Reassign
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div className="flex justify-center gap-3 pt-2">
            {view.readingIndex < orderedSubmissions.length - 1 ? (
              <Button onClick={advanceReading} size="lg">Next announcement</Button>
            ) : (
              <Button onClick={startVoting} size="lg">Open the vote</Button>
            )}
          </div>
        </div>
      ) : null}

      {view.phase === 'voting' ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-300">Vote for the funniest valid answer.</p>
          {/* Totals stay hidden until the vote closes so nobody follows the crowd. */}
          <div className="flex flex-wrap justify-center gap-2">
            {view.votedClientIds.map((clientId) => (
              <span
                key={clientId}
                className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
              >
                <Check className="mr-1 inline h-3 w-3" aria-hidden />
                {view.players[clientId]?.displayName ?? 'Voted'}
              </span>
            ))}
          </div>
          <p className="text-4xl font-bold tabular-nums text-cyan-200">
            {view.votedClientIds.length}
            <span className="text-lg text-slate-400"> / {boardedCount}</span>
          </p>
          <Button onClick={closeVoting} size="lg">Close the vote</Button>
        </div>
      ) : null}

      {view.phase === 'result' ? (
        <div className="space-y-4">
          {orderedSubmissions
            .filter((s) => favorites.has(s.submissionId))
            .map((submission) => (
              <div
                key={submission.submissionId}
                className="rounded-xl border border-amber-300/50 bg-amber-400/10 p-6 text-center"
              >
                <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-amber-200">
                  <Sparkles className="h-4 w-4" aria-hidden /> Class Favourite
                </p>
                <p className="mt-2 text-2xl text-slate-100">{submission.composedSentence}</p>
                <p className="mt-2 text-sm font-semibold text-amber-200">{submission.displayName}</p>
              </div>
            ))}
          {favorites.size === 0 ? (
            <p className="text-center text-sm text-slate-400">
              No votes this round â€” grammar points only.
            </p>
          ) : null}

          <ul className="space-y-1 text-sm">
            {orderedSubmissions.map((submission) => (
              <li
                key={submission.submissionId}
                className="flex items-center justify-between rounded-md border border-slate-600/30 bg-slate-800/40 px-3 py-2"
              >
                <span className="text-slate-200">{submission.displayName}</span>
                <span className="text-xs text-slate-400">
                  {submission.teacherValidity ? '+1 grammar' : 'no grammar point'}
                  {favorites.has(submission.submissionId) ? ' Â· +2 favourite' : ''}
                  {` Â· ${submission.voteCount} vote${submission.voteCount === 1 ? '' : 's'}`}
                </span>
              </li>
            ))}
          </ul>

          {nextPrompt && view.roundIndex + 1 < totalRounds ? (
            <p className="text-center text-xs uppercase tracking-wider text-slate-400">
              Next round takes {nextPrompt.previewLabel}
            </p>
          ) : null}

          <div className="space-y-2 text-center">
            {/* Advancing is blocked until every score is stored â€” the next round clears
                the submissions these were computed from. */}
            {unsavedScores > 0 ? (
              scoreSaveFailed ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-200">
                    {unsavedScores} score{unsavedScores === 1 ? '' : 's'} did not save.
                  </p>
                  <Button onClick={() => void flushScores()} size="lg" variant="secondary">
                    Retry saving scores
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400" role="status">
                  Saving scoresâ€¦
                </p>
              )
            ) : null}
            <Button onClick={nextRound} size="lg" disabled={unsavedScores > 0}>
              {view.roundIndex + 1 >= totalRounds ? 'Finish' : 'Next round'}
            </Button>
          </div>
        </div>
      ) : null}

      {view.phase === 'finished' ? (
        <div className="space-y-5 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-300" aria-hidden />
          <h2 className="text-xl font-bold text-slate-100">Cargo unloaded</h2>
          <ul className="mx-auto max-w-md space-y-1 text-left text-sm">
            {leaderboard.map((player, index) => (
              <li
                key={player.clientId}
                className="flex items-center justify-between rounded-md border border-slate-600/30 bg-slate-800/40 px-3 py-2"
              >
                <span className="text-slate-200">
                  {index + 1}. {player.displayName}
                </span>
                <span className="text-xs text-slate-400">
                  {player.grammarPoints + player.favoritePoints} pts Â· {player.grammarPoints} grammar Â·{' '}
                  {player.favoritePoints / 2} favourite{player.favoritePoints === 2 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
          <Button onClick={startGame} size="lg" variant="secondary">Play again</Button>
        </div>
      ) : null}
    </div>
  );
}
