import { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { SessionSettings } from '@/stores/session-store';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import type { ScoreOutcome, ScoringProfile } from '@/lib/score-engine';

// Game categories
export type GameCategory = 'vocabulary' | 'grammar-writing' | 'logic-puzzles' | 'quiz';

export interface ScoreResult {
  isCorrect: boolean | null;
  points: number;
  outcome?: ScoreOutcome;
  isEmpty?: boolean;
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
  onPickSpecificStudent?: (studentId: string) => void;
  config: Record<string, unknown>;
  sessionSettings: SessionSettings;
  // Input spec system - games set this to tell student controllers what input to show
  onSetInputSpec?: (spec: InputSpec | null) => void;
  // Submission handler - games register this to evaluate approved submissions
  onRegisterSubmissionHandler?: (handler: SubmissionHandler | null) => void;
  // Remote vote handler - register to receive votes from remote students in real-time
  onRegisterRemoteVoteHandler?: (handler: ((vote: GameRemoteVote) => void) | null) => void;
  // Per-student prefs — keyed by clientId. Games use this to respect score_visible (stealth mode).
  prefsMap?: Map<string, { score_visible: boolean }>;
  // Race-mode games call this to show the top-3 overlay on the teacher's screen.
  onRevealTopSubmissions?: (submissions: TopSubmission[]) => void;
}

export interface GameConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  default: unknown;
}

export interface TopSubmission {
  content: string;
  feedback: string;
  points: number;
  clientId: string;
  displayName: string;
}

export interface GamePlugin {
  key: string;
  name: string;
  description: string;
  category: GameCategory;
  /** PPP stage this game belongs to. Internal metadata — must not appear in rendered strings. */
  pppStage: 'presentation' | 'practice' | 'production';
  icon: ComponentType<{ className?: string }>;
  skills: string[];
  component: ComponentType<GameProps>;
  configSchema: GameConfigField[];
  maxPointsPerTurn: number;
  defaultTimerSeconds: number;
  estimatedMinutes: number;
  /** When true, this game only makes sense within a Flight Plan and is hidden from Explore. */
  flightPlanOnly?: boolean;
  /** Scoring V2: how this game classifies outcomes and what the leaderboard shows. */
  scoringProfile?: ScoringProfile;
}
