/**
 * Cargo Hold â€” shared types.
 *
 * Spec: docs/cargo-hold-implementation-spec.md
 *
 * Everything in this file is framework-free so the deal/compatibility/reader/vote/score
 * logic can be exhaustively tested without React.
 */

// â”€â”€â”€ Content (generated with the lesson, cached, never fetched mid-round) â”€â”€â”€â”€

export type CargoCardFamily =
  | 'thing'        // noun or noun phrase
  | 'action'       // gerund or action phrase
  | 'description'  // adjective phrase
  | 'reason'       // because-clause or explanatory phrase
  | 'wildcard';    // deliberately flexible and rare

export const CARGO_CARD_FAMILIES: CargoCardFamily[] = [
  'thing',
  'action',
  'description',
  'reason',
  'wildcard',
];

export interface CargoCard {
  id: string;
  family: CargoCardFamily;
  /** The phrase that completes the prompt, e.g. "negotiating with a pigeon at Gate 12". */
  text: string;
  /** Canonical lesson item, e.g. "negotiate". */
  targetTerm: string;
  /** Naturally inflected form actually used in `text`, e.g. "negotiating". */
  targetForm: string;
  meaning: string;
  /**
   * Wildcards (and any card that bends its family) must declare the prompt tags they
   * genuinely fit. A wildcard never automatically fits every prompt.
   */
  compatiblePromptTags?: string[];
  emoji?: string;
  source: 'lesson-vocab' | 'lesson-expression' | 'safe-fallback';
}

export interface CargoPrompt {
  id: string;
  textBefore: string;
  textAfter?: string;
  acceptedFamilies: CargoCardFamily[];
  promptTag: string;
  /** Shown as the next-round teaser, e.g. "an action". Never reveals the prompt itself. */
  previewLabel: string;
  /** Teacher-facing note on what the prompt is practising. */
  explanation: string;
}

// â”€â”€â”€ Runtime state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CargoPhase =
  | 'idle'
  | 'dealing'
  | 'choosing'
  | 'validating'
  | 'reading'
  | 'voting'
  | 'result'
  | 'finished';

export interface CargoPlayerState {
  clientId: string;
  studentId: string | null;
  displayName: string;
  handCardIds: string[];
  repackUsed: boolean;
  grammarPoints: number;
  favoritePoints: number;
}

export interface CargoSubmission {
  submissionId: string;
  activityInstanceId: string;
  roundId: string;
  clientId: string;
  studentId: string | null;
  displayName: string;
  cardId: string;
  composedSentence: string;
  /** Derived from card family vs prompt families. Never AI-judged. */
  automaticValidity: boolean;
  /** Teacher override, seeded from automaticValidity. This is the value that scores. */
  teacherValidity: boolean;
  readerClientId: string | null;
  voteCount: number;
}

/** The shared-screen view of a round. Contains nothing private. */
export interface CargoPublicRoundState {
  activityInstanceId: string;
  activityInstanceStartedAt: number;
  activitySequence: number;
  phase: CargoPhase;
  roundIndex: number;
  roundId: string;
  promptId: string;
  nextPromptFamily?: CargoCardFamily;
  submittedCount: number;
  eligibleVoterCount: number;
  anonymizedSubmissions?: Array<{
    submissionId: string;
    sentence: string;
    valid: boolean;
    readerDisplayName?: string;
    voteCount?: number;
  }>;
}

// â”€â”€â”€ Student actions (typed JSON over the existing submit path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CargoStudentAction =
  | { type: 'repack'; actionId: string; activityInstanceId: string; roundId: string; cardIds: string[] }
  | { type: 'play'; actionId: string; activityInstanceId: string; roundId: string; cardId: string }
  | { type: 'read-complete'; actionId: string; activityInstanceId: string; roundId: string; submissionId: string }
  | { type: 'vote'; actionId: string; activityInstanceId: string; roundId: string; submissionId: string }
  | { type: 'board'; actionId: string; activityInstanceId: string; roundId: string };

/** What a single student's device is told. Never contains another student's hand. */
export interface CargoPerStudentPayload {
  hand: CargoCard[];
  repackUsed: boolean;
  submittedCardId?: string;
  /** Set when Customs repaired this hand at round start â€” shown as a neutral notice. */
  customsRefreshed?: boolean;
  /** Sentence(s) this student must read aloud. Never includes the author. */
  readingAssignments?: Array<{ submissionId: string; sentence: string; done: boolean }>;
  /** Voting: the student's own submission, disabled client- and handler-side. */
  ownSubmissionId?: string;
  votedSubmissionId?: string;
}
