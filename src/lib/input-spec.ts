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
  /** Unix ms timestamp when the question was broadcast — student uses this to sync their countdown */
  startedAt?: number;
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
  /** Class Board: initial selected category key. */
  boardDefaultCategory?: string;
  /** Class Board: initial selected zone key. */
  boardDefaultZone?: string;
  /** Class Board: whether visible board items can be upvoted. */
  boardAllowVotes?: boolean;
  /** Initial map center as [longitude, latitude]. */
  mapCenter?: [number, number];
  /** Initial map zoom level. */
  mapZoom?: number;
  /** Optional map bounds as [west, south, east, north]. */
  mapBounds?: [number, number, number, number];
  /** Whether geographic labels should be visible on map inputs. Defaults to false. */
  mapLabels?: boolean;
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
