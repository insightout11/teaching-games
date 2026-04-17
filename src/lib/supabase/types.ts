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
      session_notes: { Row: SessionNote; Insert: Partial<SessionNote> & Pick<SessionNote, 'session_id' | 'teacher_id'>; Update: Partial<SessionNote> };
    };
    Views: {
      session_leaderboard: { Row: LeaderboardEntry };
    };
  };
}
