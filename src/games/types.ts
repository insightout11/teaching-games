import { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { SessionSettings } from '@/stores/session-store';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';

// Game categories
export type GameCategory = 'vocabulary' | 'grammar-writing' | 'logic-puzzles';

export interface ScoreResult {
  isCorrect: boolean;
  points: number;
  responseData?: Record<string, unknown>;
}

// Remote vote received from a student device (same as activity RemoteVote)
export interface GameRemoteVote {
  clientId: string;
  studentId?: string | null;
  displayName: string;
  choice: string;
  team?: 'red' | 'blue' | null;
  gameKey: string;
  inputType: string;
}

export interface GameProps {
  students: Student[];
  currentStudentId: string | null;
  onScore: (studentId: string, result: ScoreResult) => void;
  onPickStudent: () => void;
  config: Record<string, unknown>;
  sessionSettings: SessionSettings;
  // Input spec system - games set this to tell student controllers what input to show
  onSetInputSpec?: (spec: InputSpec | null) => void;
  // Submission handler - games register this to evaluate approved submissions
  onRegisterSubmissionHandler?: (handler: SubmissionHandler | null) => void;
  // Remote vote handler - register to receive votes from remote students in real-time
  onRegisterRemoteVoteHandler?: (handler: ((vote: GameRemoteVote) => void) | null) => void;
}

export interface GameConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  default: unknown;
}

export interface GamePlugin {
  key: string;
  name: string;
  description: string;
  category: GameCategory;
  icon: ComponentType<{ className?: string }>;
  skills: string[];
  component: ComponentType<GameProps>;
  configSchema: GameConfigField[];
  maxPointsPerTurn: number;
}
