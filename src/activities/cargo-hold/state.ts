/**
 * Cargo Hold â€” the authoritative round state and the reducer that advances it.
 *
 * Why a reducer rather than React state in the handler: reconnect replays every stored
 * action for the activity synchronously, so several plays or votes arrive before React
 * has re-rendered even once. Any handler that reads component state (or a ref that is
 * only refreshed during render) computes all of them from the same stale snapshot and
 * keeps just the last. Every mutation therefore goes through this pure reducer against
 * a synchronously-updated store.
 */

import type {
  CargoCard,
  CargoPhase,
  CargoPlayerState,
  CargoPrompt,
  CargoStudentAction,
  CargoSubmission,
} from './types';
import type { ScoreOutcome } from '@/lib/score-engine';
import { applyRepack, composeSentence, isCardCompatible } from './deal';
import { acceptVote } from './scoring';

export interface CargoRuntimeState {
  instanceId: string;
  instanceStartedAt: number;
  sequence: number;
  phase: CargoPhase;
  roundIndex: number;
  players: Record<string, CargoPlayerState>;
  hands: Record<string, CargoCard[]>;
  /** Clients whose hand Customs repaired at the start of the current round. */
  refreshed: string[];
  submissions: CargoSubmission[];
  readerAssignment: Record<string, string | null>;
  readDone: string[];
  readingIndex: number;
  votedClientIds: string[];
  processedActionIds: string[];
  scoredKeys: string[];
  /**
   * Score writes that have not been confirmed stored yet. They live in the persisted
   * state so a refresh mid-write can finish them, and so advancing the round cannot
   * discard the data needed to reconstruct them.
   */
  pendingScores: PendingCargoScore[];
}

/** Everything needed to retry one score write without the round still being live. */
export interface PendingCargoScore {
  key: string;
  studentId: string | null;
  clientId: string;
  displayName: string;
  promptIndex: number;
  points: number;
  outcome: ScoreOutcome;
  isCorrect: boolean;
}

export function emptyCargoState(): CargoRuntimeState {
  return {
    instanceId: '',
    instanceStartedAt: 0,
    sequence: 0,
    phase: 'idle',
    roundIndex: 0,
    players: {},
    hands: {},
    refreshed: [],
    submissions: [],
    readerAssignment: {},
    readDone: [],
    readingIndex: 0,
    votedClientIds: [],
    processedActionIds: [],
    scoredKeys: [],
    pendingScores: [],
  };
}

/** Round identity for a step. Students append an action suffix to this. */
export function roundIdFor(
  instanceId: string,
  step: 'board' | 'choose' | 'read' | 'vote',
  roundIndex: number,
): string {
  return step === 'board'
    ? `cargo-${instanceId}-board`
    : `cargo-${instanceId}-r${roundIndex}-${step}`;
}

export interface ActorIdentity {
  clientId: string;
  studentId: string | null;
  displayName: string;
}

export interface ApplyActionContext {
  deck: CargoCard[];
  prompts: CargoPrompt[];
}

export interface ApplyActionResult {
  state: CargoRuntimeState;
  /** What the caller must re-broadcast, if anything. */
  changed: 'none' | 'players' | 'hands' | 'submissions' | 'reading' | 'votes';
}

/**
 * Apply one student action. Pure: same state + same action always yields the same
 * result, and a repeated actionId is inert, which is what makes reconnect replay safe.
 */
export function applyStudentAction(
  state: CargoRuntimeState,
  action: CargoStudentAction,
  actor: ActorIdentity,
  { deck, prompts }: ApplyActionContext,
): ApplyActionResult {
  const unchanged: ApplyActionResult = { state, changed: 'none' };

  if (state.processedActionIds.includes(action.actionId)) return unchanged;
  if (action.activityInstanceId !== state.instanceId) return unchanged;

  const baseRound = action.roundId.split('::')[0];
  const markProcessed = (next: CargoRuntimeState): CargoRuntimeState => ({
    ...next,
    processedActionIds: [...next.processedActionIds, action.actionId],
  });

  if (action.type === 'board') {
    if (state.phase !== 'dealing') return unchanged;
    if (baseRound !== roundIdFor(state.instanceId, 'board', 0)) return unchanged;
    if (state.players[actor.clientId]) return { state: markProcessed(state), changed: 'none' };
    return {
      state: markProcessed({
        ...state,
        players: {
          ...state.players,
          [actor.clientId]: {
            clientId: actor.clientId,
            studentId: actor.studentId,
            displayName: actor.displayName,
            handCardIds: [],
            repackUsed: false,
            grammarPoints: 0,
            favoritePoints: 0,
          },
        },
      }),
      changed: 'players',
    };
  }

  const prompt = prompts[state.roundIndex];

  if (action.type === 'repack') {
    if (state.phase !== 'choosing') return unchanged;
    if (baseRound !== roundIdFor(state.instanceId, 'choose', state.roundIndex)) return unchanged;
    const player = state.players[actor.clientId];
    const hand = state.hands[actor.clientId];
    if (!player || !hand || !prompt) return unchanged;
    // Repack is only available before the card is loaded.
    if (state.submissions.some((s) => s.clientId === actor.clientId)) {
      return { state: markProcessed(state), changed: 'none' };
    }

    const result = applyRepack(player, hand, action.cardIds, deck, prompt);
    if (!result.applied) return { state: markProcessed(state), changed: 'none' };

    return {
      state: markProcessed({
        ...state,
        hands: { ...state.hands, [actor.clientId]: result.hand },
        players: { ...state.players, [actor.clientId]: { ...player, repackUsed: true } },
      }),
      changed: 'hands',
    };
  }

  if (action.type === 'play') {
    if (state.phase !== 'choosing') return unchanged;
    if (baseRound !== roundIdFor(state.instanceId, 'choose', state.roundIndex)) return unchanged;
    if (state.submissions.some((s) => s.clientId === actor.clientId)) {
      return { state: markProcessed(state), changed: 'none' };
    }
    const hand = state.hands[actor.clientId];
    const card = hand?.find((c) => c.id === action.cardId);
    if (!hand || !prompt || !card) return unchanged;

    const automaticValidity = isCardCompatible(card, prompt);
    const submission: CargoSubmission = {
      submissionId: `${state.instanceId}-r${state.roundIndex}-${actor.clientId}`,
      activityInstanceId: state.instanceId,
      roundId: baseRound,
      clientId: actor.clientId,
      studentId: actor.studentId,
      displayName: actor.displayName,
      cardId: card.id,
      composedSentence: composeSentence(prompt, card),
      automaticValidity,
      teacherValidity: automaticValidity,
      readerClientId: null,
      voteCount: 0,
    };

    return {
      state: markProcessed({ ...state, submissions: [...state.submissions, submission] }),
      changed: 'submissions',
    };
  }

  if (action.type === 'read-complete') {
    if (state.phase !== 'reading') return unchanged;
    if (baseRound !== roundIdFor(state.instanceId, 'read', state.roundIndex)) return unchanged;
    // Only the assigned reader can retire their own announcement.
    if (state.readerAssignment[action.submissionId] !== actor.clientId) return unchanged;
    if (state.readDone.includes(action.submissionId)) {
      return { state: markProcessed(state), changed: 'none' };
    }
    return {
      state: markProcessed({ ...state, readDone: [...state.readDone, action.submissionId] }),
      changed: 'reading',
    };
  }

  if (action.type === 'vote') {
    if (state.phase !== 'voting') return unchanged;
    const decision = acceptVote(
      {
        clientId: actor.clientId,
        activityInstanceId: action.activityInstanceId,
        roundId: baseRound,
        submissionId: action.submissionId,
      },
      {
        activityInstanceId: state.instanceId,
        roundId: roundIdFor(state.instanceId, 'vote', state.roundIndex),
        submissions: state.submissions,
        votedClientIds: state.votedClientIds,
      },
    );
    if (!decision.accepted) return { state: markProcessed(state), changed: 'none' };

    return {
      state: markProcessed({
        ...state,
        submissions: state.submissions.map((s) =>
          s.submissionId === action.submissionId ? { ...s, voteCount: s.voteCount + 1 } : s,
        ),
        votedClientIds: [...state.votedClientIds, actor.clientId],
      }),
      changed: 'votes',
    };
  }

  return unchanged;
}

/** Restores a persisted payload, discarding anything structurally unusable. */
export function hydrateCargoState(raw: unknown): CargoRuntimeState | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<CargoRuntimeState>;
  if (typeof candidate.instanceId !== 'string' || !candidate.instanceId) return null;
  if (typeof candidate.phase !== 'string') return null;
  const base = emptyCargoState();
  return {
    ...base,
    ...candidate,
    players: candidate.players ?? {},
    hands: candidate.hands ?? {},
    submissions: candidate.submissions ?? [],
    readerAssignment: candidate.readerAssignment ?? {},
    readDone: candidate.readDone ?? [],
    votedClientIds: candidate.votedClientIds ?? [],
    processedActionIds: candidate.processedActionIds ?? [],
    scoredKeys: candidate.scoredKeys ?? [],
    pendingScores: candidate.pendingScores ?? [],
    refreshed: candidate.refreshed ?? [],
  } as CargoRuntimeState;
}


/** Marks one pending score as stored. Idempotent, so a duplicated success is inert. */
export function confirmScore(state: CargoRuntimeState, key: string): CargoRuntimeState {
  if (!state.pendingScores.some((entry) => entry.key === key)) return state;
  return {
    ...state,
    pendingScores: state.pendingScores.filter((entry) => entry.key !== key),
    scoredKeys: state.scoredKeys.includes(key) ? state.scoredKeys : [...state.scoredKeys, key],
  };
}

/** True while any score for this run is still unwritten. */
export function hasUnsavedScores(state: CargoRuntimeState): boolean {
  return state.pendingScores.length > 0;
}
