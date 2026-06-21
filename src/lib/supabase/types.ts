import type { WorldFlightEvidenceSnapshot, WorldFlightLegStatus, WorldFlightSessionContext } from '@/lib/world-flight/journey';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';
import type { WorldFlightExpeditionSnapshot, WorldFlightExpeditionStatus } from '@/lib/world-flight/expeditions';
import type { WorldFlightRewardSnapshot } from '@/lib/world-flight/progression';
import type { DesignStudioBrief, DesignStudioState } from '@/activities/types';

export interface Teacher {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_status: 'free' | 'trial' | 'active' | 'cancelled';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  theme: 'colorful' | 'professional';
  ai_scoring_config: Record<string, unknown>;
  default_difficulty: string | null;
  default_tone: string | null;
  default_scoring_mode: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  avatar_seed: string;
  created_at: string;
}

export interface Session {
  id: string;
  class_id: string;
  status: 'active' | 'paused' | 'ended';
  started_at: string;
  ended_at: string | null;
  frozen: boolean;
  topic?: string;
  difficulty?: string;
  custom_topic?: string | null;
  world_flight_context?: WorldFlightSessionContext | null;
  world_flight_design_mission_context?: WorldFlightDesignMissionContext | null;
}

export interface ClassWorldFlightState {
  class_id: string;
  current_destination_id: string | null;
  plane_tier: number;
  plane_key: string;
  plane_selection_required: boolean;
  range_km: number;
  flight_hours: number;
  crew_stars: number;
  updated_at: string;
}

export interface ClassWorldFlightLeg {
  id: string;
  class_id: string;
  session_id: string;
  origin_destination_id: string | null;
  destination_id: string;
  focus_id: string;
  status: WorldFlightLegStatus;
  distance_km: number;
  evidence_snapshot: WorldFlightEvidenceSnapshot;
  planned_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface ClassWorldFlightDesignMission {
  id: string;
  class_id: string;
  session_id: string;
  investigation_id: string;
  status: 'planned' | 'completed' | 'cancelled';
  mission_context: WorldFlightDesignMissionContext;
  design_state_snapshot: DesignStudioState | Record<string, never>;
  brief_snapshot: DesignStudioBrief | Record<string, never>;
  planned_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface ClassWorldFlightExpeditionRun {
  id: string;
  class_id: string;
  expedition_id: string;
  status: WorldFlightExpeditionStatus;
  expedition_snapshot: WorldFlightExpeditionSnapshot;
  visited_destination_ids: string[];
  activated_at: string;
  paused_at: string | null;
  completed_at: string | null;
  left_at: string | null;
  updated_at: string;
}

export interface ClassWorldFlightReward {
  id: string;
  class_id: string;
  session_id: string;
  leg_id: string;
  flight_hours_awarded: number;
  crew_stars_awarded: number;
  everyone_aboard: boolean;
  strong_landing: boolean;
  crew_commendation: boolean;
  reward_snapshot: WorldFlightRewardSnapshot;
  created_at: string;
}

export interface Round {
  id: string;
  session_id: string;
  game_type: string;
  game_config: Record<string, unknown>;
  round_number: number;
  created_at: string;
}

export interface Score {
  id: string;
  round_id: string | null;
  session_id: string;
  student_id: string | null; // Nullable for remote students who join via /join link
  points: number;
  streak_count: number;
  streak_bonus: number;
  is_correct: boolean;
  response_data: Record<string, unknown>;
  created_at: string;
  prompt_index?: number | null;
  // Student input fields (for remote students)
  team?: string | null;
  client_id?: string | null;
  display_name?: string | null;
  // Scoring V2 fields (null for pre-V2 rows)
  outcome?: string | null;
  accuracy_status?: string | null;
  counts_for_accuracy?: boolean | null;
  counts_for_leaderboard?: boolean | null;
  scoring_version?: number | null;
}

// Student Input Types
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'error';
export type SubmissionType = 'text' | 'poll';
export type Team = 'red' | 'blue';

export interface StudentSubmission {
  id: string;
  session_id: string;
  client_id: string;
  display_name: string;
  team: Team | null;
  submission_type: SubmissionType;
  content: string;
  status: SubmissionStatus;
  error_message: string | null;
  game_key: string | null;
  created_at: string;
  published_to_class: boolean;
  published_at: string | null;
  answered_at: string | null;
  ai_feedback: string | null;
  ai_score: number | null;
}

export interface QuestionVote {
  id: string;
  question_id: string;
  session_id: string;
  client_id: string;
  created_at: string;
}

export interface ClassBoardItem {
  id: string;
  session_id: string;
  board_key: string;
  author_type: 'teacher' | 'student';
  client_id: string | null;
  display_name: string;
  category: string;
  zone_key: string;
  content: string;
  visibility: 'pending' | 'visible' | 'hidden';
  pinned: boolean;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClassBoardVote {
  id: string;
  item_id: string;
  session_id: string;
  client_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  session_id: string;
  question: string;
  options: string[];
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StudentSessionPref {
  id: string;
  session_id: string;
  client_id: string;
  score_visible: boolean;
  scoring_mode: string | null;
  updated_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  session_id: string;
  client_id: string;
  display_name: string;
  team: Team | null;
  choice: string;
  created_at: string;
}

export interface SubmissionRateLimit {
  id: string;
  session_id: string;
  client_id: string;
  last_text_submission: string | null;
  last_poll_vote: string | null;
}

export interface LeaderboardEntry {
  session_id: string;
  student_id: string;
  student_name: string;
  avatar_seed: string;
  total_points: number;
  correct_count: number;
  total_attempts: number;
  best_streak: number;
}

export interface FlightCard {
  id: string;
  session_id: string;
  client_id: string;
  student_id: string | null;
  display_name: string | null;
  card_key: string;
  status: 'offered' | 'declined' | 'replaced' | 'held' | 'active' | 'used' | 'expired';
  deal_index: number;
  module_key: string;
  activations_count: number;
  bonus_points_total: number;
  offered_at: string;
  held_at: string | null;
  expired_at: string | null;
  created_at: string;
}

// Lesson Planning Types
export interface LessonPlan {
  id: string;
  teacher_id: string;
  title: string;
  custom_topic: string;
  difficulty: string;
  activities: LessonPlanActivity[];
  generated_content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LessonPlanActivity {
  activity_key: string;
  order: number;
  config?: Record<string, unknown>;
}

export interface SessionNote {
  id: string;
  session_id: string;
  teacher_id: string;
  content: string;
  updated_at: string;
}

export interface StudentSessionNote {
  id: string;
  teacher_id: string;
  class_id: string;
  session_id: string;
  student_id: string;
  note: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ActivityResponse {
  id: string;
  session_id: string;
  activity_key: string;
  student_id: string;
  response_data: Record<string, unknown>;
  ai_followup: Record<string, unknown> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      teachers: { Row: Teacher; Insert: Partial<Teacher> & Pick<Teacher, 'id' | 'email'>; Update: Partial<Teacher> };
      classes: { Row: Class; Insert: Partial<Class> & Pick<Class, 'teacher_id' | 'name'>; Update: Partial<Class> };
      students: { Row: Student; Insert: Partial<Student> & Pick<Student, 'class_id' | 'name'>; Update: Partial<Student> };
      sessions: { Row: Session; Insert: Partial<Session> & Pick<Session, 'class_id'>; Update: Partial<Session> };
      rounds: { Row: Round; Insert: Partial<Round> & Pick<Round, 'session_id' | 'game_type' | 'round_number'>; Update: Partial<Round> };
      scores: { Row: Score; Insert: Partial<Score> & Pick<Score, 'session_id'>; Update: Partial<Score> };
      lesson_plans: { Row: LessonPlan; Insert: Partial<LessonPlan> & Pick<LessonPlan, 'teacher_id' | 'title' | 'custom_topic'>; Update: Partial<LessonPlan> };
      activity_responses: { Row: ActivityResponse; Insert: Partial<ActivityResponse> & Pick<ActivityResponse, 'session_id' | 'activity_key' | 'student_id'>; Update: Partial<ActivityResponse> };
      student_submissions: { Row: StudentSubmission; Insert: Partial<StudentSubmission> & Pick<StudentSubmission, 'session_id' | 'client_id' | 'display_name' | 'submission_type' | 'content'>; Update: Partial<StudentSubmission> };
      polls: { Row: Poll; Insert: Partial<Poll> & Pick<Poll, 'session_id' | 'question' | 'options'>; Update: Partial<Poll> };
      student_session_prefs: { Row: StudentSessionPref; Insert: Partial<StudentSessionPref> & Pick<StudentSessionPref, 'session_id' | 'client_id'>; Update: Partial<StudentSessionPref> };
      poll_votes: { Row: PollVote; Insert: Partial<PollVote> & Pick<PollVote, 'poll_id' | 'session_id' | 'client_id' | 'display_name' | 'choice'>; Update: Partial<PollVote> };
      submission_rate_limits: { Row: SubmissionRateLimit; Insert: Partial<SubmissionRateLimit> & Pick<SubmissionRateLimit, 'session_id' | 'client_id'>; Update: Partial<SubmissionRateLimit> };
      question_votes: { Row: QuestionVote; Insert: Partial<QuestionVote> & Pick<QuestionVote, 'question_id' | 'session_id' | 'client_id'>; Update: Partial<QuestionVote> };
      class_board_items: { Row: ClassBoardItem; Insert: Partial<ClassBoardItem> & Pick<ClassBoardItem, 'session_id' | 'board_key' | 'author_type' | 'display_name' | 'category' | 'zone_key' | 'content'>; Update: Partial<ClassBoardItem> };
      class_board_votes: { Row: ClassBoardVote; Insert: Partial<ClassBoardVote> & Pick<ClassBoardVote, 'item_id' | 'session_id' | 'client_id'>; Update: Partial<ClassBoardVote> };
      session_notes: { Row: SessionNote; Insert: Partial<SessionNote> & Pick<SessionNote, 'session_id' | 'teacher_id'>; Update: Partial<SessionNote> };
      student_session_notes: { Row: StudentSessionNote; Insert: Partial<StudentSessionNote> & Pick<StudentSessionNote, 'session_id' | 'student_id' | 'class_id' | 'teacher_id'>; Update: Partial<StudentSessionNote> };
      class_world_flight_state: { Row: ClassWorldFlightState; Insert: Partial<ClassWorldFlightState> & Pick<ClassWorldFlightState, 'class_id'>; Update: Partial<ClassWorldFlightState> };
      class_world_flight_legs: { Row: ClassWorldFlightLeg; Insert: Partial<ClassWorldFlightLeg> & Pick<ClassWorldFlightLeg, 'class_id' | 'session_id' | 'destination_id' | 'focus_id'>; Update: Partial<ClassWorldFlightLeg> };
      class_world_flight_design_missions: { Row: ClassWorldFlightDesignMission; Insert: Partial<ClassWorldFlightDesignMission> & Pick<ClassWorldFlightDesignMission, 'class_id' | 'session_id' | 'investigation_id'>; Update: Partial<ClassWorldFlightDesignMission> };
      class_world_flight_expedition_runs: { Row: ClassWorldFlightExpeditionRun; Insert: Partial<ClassWorldFlightExpeditionRun> & Pick<ClassWorldFlightExpeditionRun, 'class_id' | 'expedition_id'>; Update: Partial<ClassWorldFlightExpeditionRun> };
      class_world_flight_rewards: { Row: ClassWorldFlightReward; Insert: Partial<ClassWorldFlightReward> & Pick<ClassWorldFlightReward, 'class_id' | 'session_id' | 'leg_id'>; Update: Partial<ClassWorldFlightReward> };
    };
    Views: {
      session_leaderboard: { Row: LeaderboardEntry };
    };
  };
}
