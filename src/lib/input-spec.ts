// Input Spec System - Defines what input type the student controller should show

export type InputType =
  | 'text'           // Single line text input
  | 'textarea'       // Multi-line text input
  | 'choice'         // Multiple choice (pick one)
  | 'binary'         // A or B choice
  | 'multi-select'   // Pick N from list
  | 'sequence'       // Order items (tap to build sequence)
  | 'ranking'        // Rank items (drag to reorder)
  | 'error-correction' // Select words and provide corrections
  | 'confirm'        // Single confirm button
  | 'read-aloud'     // Queue display + done button for current reader
  | 'shuffleboard'   // Drag-and-release physics shot (Zone Board)
  | 'geo-point'      // Place and confirm a pin on an interactive map
  | 'board'          // Add a text item to a shared class board
  | 'cabin-question' // Cabin Mystery two-step question picker (target → question)
  | 'cabin-vote'     // Cabin Mystery final theory form (suspect + motive)
  | 'cabin-culprit'  // Cabin Mystery culprit-side — prompt for culprit, listening state for others
  | 'debate-prep';   // Team Debate prep board — add points to your team's live list

export interface InputSpec {
  type: InputType;
  gameKey: string;           // Which game/activity this is for
  prompt?: string;           // Instructions shown to student, e.g., "Type your replacement word"
  options?: string[];        // For choice/multi-select/sequence/ranking
  maxLength?: number;        // For text inputs
  selectCount?: number;      // For multi-select (e.g., 4 for connections)
  placeholder?: string;      // Input placeholder text
  optionLabels?: string[];   // Labels for binary choice (e.g., ["Option A", "Option B"])
  hint?: {
    title?: string;
    content: string | { rule?: string; example?: string; mistakes?: string[] };
  };
  perStudentData?: Record<string, unknown>;
  /** When set, renders required resource chip-select above textarea before submission */
  resources?: string[];
  /** When true, the submit API does not delete previous submissions from this student (allows multiple per session) */
  allowMultiple?: boolean;
  /** Force text/textarea submissions through teacher review instead of direct scoring. */
  reviewMode?: 'approval' | 'direct';
  /** Vocabulary words to display as chips to the student (e.g. Final Answer target keywords) */
  keywords?: string[];
  /** Language Toolkit vocab cards shown above the input on student devices. */
  toolkitItems?: Array<{ term: string; meaning: string; example: string; prompt: string }>;
  /** Role-grouped phrases with labels (e.g. for Conversation Rounds). Preferred over flat keywords when present. */
  keywordGroups?: { label: string; phrases: string[] }[];
  /** When true, choice inputs show an "Other: write your own…" option */
  allowWriteIn?: boolean;
  /** For confirm inputs: label for the confirm button */
  buttonLabel?: string;
  /** For textarea inputs: pre-filled content keyed by clientId */
  prefillByClientId?: Record<string, string>;
  /** Short instructional label shown above the prompt */
  instruction?: string;
  /** Result feedback pushed by game after evaluation (sequence inputs) */
  result?: 'correct' | 'incorrect';
  /** When set, student device shows a countdown timer for this many seconds (quiz mode) */
  timerSeconds?: number;
  /**
   * Unix ms timestamp when the question was broadcast — student uses this to sync their countdown.
   * Games send their local clock; for timed specs the input-spec API replaces it with server time
   * (the client value is kept in clientStartedAt as a round nonce). Only server clocks are compared
   * against startedAt on the student side.
   */
  startedAt?: number;
  /** Server-stamped Unix ms when answers open (startedAt + grace). Students see a 3-2-1 beat until then. */
  answersOpenAt?: number;
  /** The game's original client startedAt, echoed back by the API. Round identity nonce — never compare to clocks. */
  clientStartedAt?: number;
  /** Supabase broadcast channel session ID — used by Zone Board to stream aim data */
  sessionId?: string;
  /** Stable round identifier for structured multi-round inputs such as geo-point. */
  roundId?: string;
  /** Class Board: stable board namespace for the current activity/session. */
  boardKey?: string;
  /** Class Board: title shown on student and teacher board surfaces. */
  boardTitle?: string;
  /** Class Board: board-specific prompt. */
  boardPrompt?: string;
  /** Class Board: selectable contribution categories. */
  boardCategories?: Array<{ key: string; label: string }>;
  /** Class Board: selectable board zones/columns. */
  boardZones?: Array<{ key: string; label: string; description?: string }>;
  /** Class Board: visual layout used to draw the board scaffold. */
  boardLayout?: 'list' | 't-chart' | 'venn' | 'quadrants' | 'ranked' | 'image-evidence' | 'columns';
  /** Class Board: initial selected category key. */
  boardDefaultCategory?: string;
  /** Class Board: initial selected zone key. */
  boardDefaultZone?: string;
  /** Class Board: whether visible board items can be upvoted. */
  boardAllowVotes?: boolean;
  /** Class Board: question-wall mode (Wonder Board) — enables answers + follow-up replies on items. */
  boardQuestionWall?: boolean;
  /** Class Board: word-cloud mode — single-word submissions rendered as a frequency cloud, no moderation/list. */
  boardWordCloud?: boolean;
  /** Initial map center as [longitude, latitude]. */
  mapCenter?: [number, number];
  /** Initial map zoom level. */
  mapZoom?: number;
  /** Optional map bounds as [west, south, east, north]. */
  mapBounds?: [number, number, number, number];
  /** Whether geographic labels should be visible on map inputs. Defaults to false. */
  mapLabels?: boolean;
  /** Basemap for map inputs: the world guess map (default) or a city street map (directions). */
  mapStyle?: 'world' | 'city-streets';
  /** Max zoom for map inputs (city street maps need ~16, world guessing caps lower). */
  mapMaxZoom?: number;
  /** Fixed reference markers shown on map inputs (e.g. the START point for directions). */
  mapMarkers?: Array<{ lat: number; lng: number; label?: string; color?: string }>;
  /** For wonder-board follow-ups: the parent question ID this reply belongs to */
  wonderParentId?: string;
  /** When true, student picks which answered question to follow up on (no locked parentId) */
  wonderFollowUpMode?: boolean;
  /** For read-aloud: ordered paragraph queue with per-entry status */
  readAloudQueue?: ReadAloudQueueEntry[];
  /** For picture-book read-aloud: current slide image URL synced to all students */
  currentSlideUrl?: string;
  /** Vocab words to highlight inline in the read-aloud passage */
  readAloudVocabWords?: string[];
  /** Team Debate prep: which side each student is on, keyed by roster studentId. */
  debateSideByStudentId?: Record<string, 'for' | 'against'>;
  /** Team Debate prep: stance label for the For side. */
  debateForLabel?: string;
  /** Team Debate prep: stance label for the Against side. */
  debateAgainstLabel?: string;
  /** Team Debate prep: argument angles shown to the For side. */
  debateForPrompts?: string[];
  /** Team Debate prep: argument angles shown to the Against side. */
  debateAgainstPrompts?: string[];
  /** Sector Strike: which team each student is on, keyed by roster studentId. */
  sectorTeamByStudentId?: Record<string, 'x' | 'o'>;
  /** Sector Strike: which team is currently answering this sector. Defending team's device shows a holding screen. */
  sectorActiveTeam?: 'x' | 'o';
}

export const INPUT_SPEC_REALTIME_EVENT = 'input-spec';

export interface InputSpecRealtimePayload {
  spec: InputSpec | null;
  inputSpecRevision: string;
  serverNow: number;
}

export function inputSpecChannelName(sessionId: string): string {
  return `session-input-spec:${sessionId}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined';
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

/** Stable, short revision used by realtime and poll fallback to detect input-spec changes. */
export function getInputSpecRevision(spec: unknown): string {
  const text = stableStringify(spec ?? null);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Grace window between a timed spec's broadcast and answers opening (teacher 3-2-1 beat + student "Get ready"). */
export const ANSWERS_OPEN_GRACE_MS = 4000;

/**
 * Server-side stamping for timed specs (input-spec API only). Replaces the game's
 * client startedAt with server time and derives answersOpenAt, so student countdowns
 * never depend on the teacher device's clock. Games re-broadcast the same round with
 * the same client startedAt (lock updates, reveals) — those rewrites keep the original
 * server stamp instead of restarting the timer.
 */
export function stampTimedSpec(spec: unknown, existing: unknown): unknown {
  if (!spec || typeof spec !== 'object') return spec;
  const next = spec as InputSpec;
  if (!next.timerSeconds || typeof next.timerSeconds !== 'number') return spec;

  const nonce = typeof next.startedAt === 'number' ? next.startedAt : undefined;
  const prev = existing && typeof existing === 'object' ? (existing as InputSpec) : null;
  const isSameRound =
    prev !== null &&
    prev.gameKey === next.gameKey &&
    nonce !== undefined &&
    prev.clientStartedAt === nonce &&
    typeof prev.startedAt === 'number';

  if (isSameRound) {
    return {
      ...next,
      startedAt: prev.startedAt,
      answersOpenAt: prev.answersOpenAt,
      clientStartedAt: nonce,
    };
  }

  const now = Date.now();
  return {
    ...next,
    clientStartedAt: nonce,
    startedAt: now,
    answersOpenAt: now + ANSWERS_OPEN_GRACE_MS,
  };
}

/** The server-stamped clock for one timed round. Both the teacher and student screens
 *  derive their countdown from this, so they agree within a tick. */
export interface TimedRoundClock {
  /** The game's original client startedAt — round-identity nonce. */
  clientStartedAt?: number;
  /** Server ms when the round was broadcast. */
  startedAt: number;
  /** Server ms when answers open (startedAt + grace). */
  answersOpenAt?: number;
  /** Length of the answer window in seconds. */
  timerSeconds: number;
}

export interface TimerState {
  /** Whole seconds left in the answer window (never exceeds timerSeconds). */
  timeLeft: number;
  /** Whole seconds until answers open (0 once open). */
  opensIn: number;
  /** True once the grace beat has elapsed and answers are live. */
  answersOpen: boolean;
}

/**
 * Single source of truth for both screens' countdown. The answer window runs for
 * `timerSeconds` starting at `answersOpenAt`, so the grace beat DEFERS the countdown
 * instead of eating into it. Remaining time is derived from the server clock
 * (local clock + measured offset) rather than a local decrement, so the teacher
 * screen and every student device show the same number regardless of device clock
 * skew or delivery delay.
 *
 * `extraMs` extends the deadline (the teacher "+30s" escape hatch in race games).
 */
export function computeTimerState(
  clock: { timerSeconds?: number; startedAt?: number; answersOpenAt?: number },
  clockOffsetMs = 0,
  extraMs = 0,
): TimerState {
  const timerSeconds = clock.timerSeconds ?? 0;
  const { startedAt, answersOpenAt } = clock;
  if (!timerSeconds || typeof startedAt !== 'number') {
    return { timeLeft: timerSeconds, opensIn: 0, answersOpen: true };
  }
  const serverNow = Date.now() + clockOffsetMs;
  // Fall back to startedAt for specs written before answersOpenAt existed.
  const openAt = typeof answersOpenAt === 'number' ? answersOpenAt : startedAt;
  const deadline = openAt + timerSeconds * 1000 + extraMs;
  // Clamp to the window length: before answers open, (deadline - now) exceeds
  // timerSeconds by the grace remainder — hold at the full value until it opens.
  const rawLeft = Math.ceil((deadline - serverNow) / 1000);
  const timeLeft = Math.max(0, Math.min(Math.ceil(timerSeconds + extraMs / 1000), rawLeft));
  const opensIn = typeof answersOpenAt === 'number'
    ? Math.max(0, Math.ceil((answersOpenAt - serverNow) / 1000))
    : 0;
  return { timeLeft, opensIn, answersOpen: opensIn <= 0 };
}

export interface ReadAloudQueueEntry {
  index: number;
  text: string;
  clientId: string;
  studentName: string;
  status: 'done' | 'active' | 'upcoming';
}

// Submission handler result from games
export interface SubmissionResult {
  isCorrect: boolean | null;
  points: number;
  feedback?: string;
  outcome?: import('@/lib/score-engine').ScoreOutcome;
  isEmpty?: boolean;
}

// Handler that games register to process approved submissions
export interface SubmissionHandler {
  handleSubmission: (content: string, metadata?: Record<string, unknown>) => Promise<SubmissionResult>;
  /** When true, submissions are processed automatically without teacher approval */
  autoApprove?: boolean;
}
