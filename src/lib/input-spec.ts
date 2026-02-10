// Input Spec System - Defines what input type the student controller should show

export type InputType =
  | 'text'           // Single line text input
  | 'textarea'       // Multi-line text input
  | 'choice'         // Multiple choice (pick one)
  | 'binary'         // A or B choice
  | 'multi-select'   // Pick N from list
  | 'sequence'       // Order items (tap to build sequence)
  | 'ranking';       // Rank items (drag to reorder)

export interface InputSpec {
  type: InputType;
  gameKey: string;           // Which game/activity this is for
  prompt?: string;           // Instructions shown to student, e.g., "Type your replacement word"
  options?: string[];        // For choice/multi-select/sequence/ranking
  maxLength?: number;        // For text inputs
  selectCount?: number;      // For multi-select (e.g., 4 for connections)
  placeholder?: string;      // Input placeholder text
  optionLabels?: string[];   // Labels for binary choice (e.g., ["Option A", "Option B"])
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
}
