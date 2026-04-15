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
  | 'confirm';       // Single confirm button

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
  /** Vocabulary words to display as chips to the student (e.g. Final Answer target keywords) */
  keywords?: string[];
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
  /** For wonder-board follow-ups: the parent question ID this reply belongs to */
  wonderParentId?: string;
}

// Submission handler result from games
export interface SubmissionResult {
  isCorrect: boolean;
  points: number;
  feedback?: string;
}

// Handler that games register to process approved submissions
export interface SubmissionHandler {
  handleSubmission: (content: string, metadata?: Record<string, unknown>) => Promise<SubmissionResult>;
  /** When true, submissions are processed automatically without teacher approval */
  autoApprove?: boolean;
}
