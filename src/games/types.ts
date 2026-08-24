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
  /** Extra competitive points added after the shared 0/1/3/5 outcome score. */
  bonusPoints?: number;
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
  roundId?: string;
}

export interface GameProps {
  sessionId?: string;
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
  // Report the game's internal lifecycle to Captain's Flight so the stage-level
  // action stays secondary until the complete game has actually finished.
  onPhaseChange?: (phase: string) => void;
  // Per-student prefs — keyed by clientId. Games use this to respect score_visible (stealth mode).
  prefsMap?: Map<string, { score_visible: boolean }>;
  // Race-mode games call this to show the top-3 overlay on the teacher's screen.
  onRevealTopSubmissions?: (submissions: TopSubmission[]) => void;
  // When true, the game is a flight-plan micro-event and must stop after exactly one round
  isMicroEvent?: boolean;
  // Active World Flight destination, when the lesson was launched from World Flight.
  destinationId?: string;
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
  /** Minimum roster size for the game to function correctly (not just "doesn't crash" — the core mechanic needs this many roles/participants). 1 = fully solo-capable. */
  minStudents: number;
  /** Optional hard upper bound. Omit when there is no maximum. */
  maxStudents?: number | null;
  /** Roster size range where the game's design intent is best realized. Not a hard limit — used for honest fit labels, not gating. `max: null` means no practical ceiling. */
  idealStudents: { min: number; max: number | null };
  /** True only if the whole game can be run with everyone on one projected screen and verbal answers — the teacher operates every input from the shared display, no student device required. Judge conservatively from the game's actual input mechanics. */
  deviceFree: boolean;
}
