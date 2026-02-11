import { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { SessionSettings } from '@/stores/session-store';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';

// Activity categories
export type ActivityCategory = 'icebreaker' | 'learning' | 'practice' | 'debate';

// Common skills that activities can develop
export type ActivitySkill =
  | 'Speaking'
  | 'Listening'
  | 'Vocabulary'
  | 'Critical Thinking'
  | 'Debate'
  | 'Collaboration'
  | 'Creativity'
  | 'Question Formation'
  | 'Persuasion'
  | 'Role-play';

// Base props that all activities receive
export interface ActivityProps {
  students: Student[];
  currentStudentId: string | null;
  sessionSettings: SessionSettings;
  // Pre-generated content for this activity
  generatedContent: ActivityGeneratedContent;
  // Callback for dynamic follow-ups during the activity
  onContinue: (request: ActivityContinueRequest) => Promise<ActivityContinueResponse>;
  // Callback when activity phase changes
  onPhaseChange?: (phase: string) => void;
  // Custom topic (if using lesson planner mode)
  customTopic?: string;
  // Input spec system - activities set this to tell student controllers what input to show
  onSetInputSpec?: (spec: InputSpec | null) => void;
  // Submission handler - activities register this to evaluate approved submissions
  onRegisterSubmissionHandler?: (handler: SubmissionHandler | null) => void;
  // Remote vote handler - register to receive votes from remote students in real-time
  onRegisterRemoteVoteHandler?: (handler: ((vote: RemoteVote) => void) | null) => void;
}

// Remote vote received from a student device
export interface RemoteVote {
  clientId: string;
  studentId?: string | null;
  displayName: string;
  choice: string;
  team?: 'red' | 'blue' | null;
  gameKey: string;
  inputType: string;
}

// Plugin definition for an activity
export interface ActivityPlugin {
  key: string;
  name: string;
  description: string;
  category: ActivityCategory;
  skills: ActivitySkill[];
  component: ComponentType<ActivityProps>;
  supportsCustomTopic: boolean;
  estimatedMinutes: number;
  // Optional icon for UI
  icon?: string;
}

// Configuration field for activity-specific settings
export interface ActivityConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'toggle';
  options?: { label: string; value: string }[];
  default: unknown;
}

// ============================================
// Generated Content Types (pre-generated before class)
// ============================================

// Base interface for all generated content
export interface ActivityGeneratedContent {
  activityKey: string;
  topicContext: string;
  // Each activity type extends this with specific content
  [key: string]: unknown;
}

// Would You Rather content
export interface WouldYouRatherContent extends ActivityGeneratedContent {
  activityKey: 'would-you-rather';
  dilemmas: WouldYouRatherDilemma[];
  potentialFollowUps: Record<string, string[]>; // dilemmaId -> follow-up questions
}

export interface WouldYouRatherDilemma {
  id: string;
  optionA: string;
  optionB: string;
  discussionPrompt: string;
}

// Two Truths & A Fabrication content
export interface TwoTruthsContent extends ActivityGeneratedContent {
  activityKey: 'two-truths';
  rounds: TwoTruthsRound[];
}

export interface TwoTruthsRound {
  id: string;
  statements: string[];
  fabricationIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Rank It content
export interface RankItContent extends ActivityGeneratedContent {
  activityKey: 'rank-it';
  challenges: RankItChallenge[];
}

export interface RankItChallenge {
  id: string;
  prompt: string;
  items: RankItItem[];
  revealFacts: string[];
}

export interface RankItItem {
  id: string;
  name: string;
  hiddenFact: string;
}

// Fact Detective content
export interface FactDetectiveContent extends ActivityGeneratedContent {
  activityKey: 'fact-detective';
  claims: FactDetectiveClaim[];
}

export interface FactDetectiveClaim {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  vocabulary: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Expert Panel content
export interface ExpertPanelContent extends ActivityGeneratedContent {
  activityKey: 'expert-panel';
  roles: ExpertRole[];
  starterQuestions: ExpertQuestion[];
}

export interface ExpertRole {
  id: string;
  title: string;
  description: string;
  expertise: string[];
  suggestedVocabulary: string[];
}

export interface ExpertQuestion {
  id: string;
  targetRoleId: string;
  question: string;
  followUpHints: string[];
}

// Concept Ladder content
export interface ConceptLadderContent extends ActivityGeneratedContent {
  activityKey: 'concept-ladder';
  levels: ConceptLevel[];
}

export interface ConceptLevel {
  id: string;
  level: number;
  concept: string;
  explanation: string;
  checkQuestion: string;
  vocabulary: string[];
}

// Hot Take Arena content
export interface HotTakeArenaContent extends ActivityGeneratedContent {
  activityKey: 'hot-take-arena';
  statement: string;
  proArguments: string[];
  conArguments: string[];
  devilsAdvocate: {
    proChallenges: string[];
    conChallenges: string[];
  };
  vocabularyHighlights: string[];
}

// Scenario Simulator content
export interface ScenarioSimulatorContent extends ActivityGeneratedContent {
  activityKey: 'scenario-simulator';
  scenario: ScenarioSetup;
  roles: ScenarioRole[];
  initialSituation: string;
  branchingPoints: ScenarioBranch[];
}

export interface ScenarioSetup {
  title: string;
  context: string;
  objective: string;
}

export interface ScenarioRole {
  id: string;
  name: string;
  description: string;
  goals: string[];
}

export interface ScenarioBranch {
  id: string;
  situation: string;
  choices: ScenarioChoice[];
}

export interface ScenarioChoice {
  id: string;
  action: string;
  consequence: string;
  nextBranchId?: string;
}

// Interview Lab content
export interface InterviewLabContent extends ActivityGeneratedContent {
  activityKey: 'interview-lab';
  character: InterviewCharacter;
  context: string;
  sampleQuestions: string[];
  registers: ('formal' | 'casual')[];
}

export interface InterviewCharacter {
  name: string;
  role: string;
  background: string;
  personality: string;
  expertise: string[];
}

// Problem Solvers content
export interface ProblemSolversContent extends ActivityGeneratedContent {
  activityKey: 'problem-solvers';
  problem: ProblemStatement;
  constraints: string[];
  complications: ProblemComplication[];
}

export interface ProblemStatement {
  title: string;
  description: string;
  resources: string[];
  successCriteria: string[];
}

export interface ProblemComplication {
  id: string;
  trigger: string;
  complication: string;
  hints: string[];
}

// ============================================
// Dynamic Continue Types (called during class)
// ============================================

export interface ActivityContinueRequest {
  sessionId: string;
  activityKey: string;
  topicContext: string;
  previousExchanges: ActivityExchange[];
  studentResponse: string;
  requestType: 'follow-up' | 'challenge' | 'hint' | 'evaluate';
}

export interface ActivityExchange {
  role: 'system' | 'student' | 'teacher';
  content: string;
  timestamp: number;
}

export interface ActivityContinueResponse {
  nextQuestion?: string;
  challenge?: string;
  hint?: string;
  evaluation?: {
    score: number;
    feedback: string;
  };
  teacherNote?: string;
  vocabularyHighlight?: string[];
}

// ============================================
// Lesson Plan Types
// ============================================

export interface LessonPlan {
  id: string;
  teacherId: string;
  title: string;
  customTopic: string;
  difficulty: string;
  activities: LessonActivity[];
  generatedContent: Record<string, ActivityGeneratedContent>;
  createdAt: string;
  updatedAt: string;
}

export interface LessonActivity {
  activityKey: string;
  order: number;
  config?: Record<string, unknown>;
}

// Request to generate a full lesson plan
export interface LessonPlanGenerateRequest {
  customTopic: string;
  difficulty: string;
  activities: string[]; // Activity keys
  games?: string[]; // Game keys (optional for backward compatibility)
}

// Game generated content types for lesson planner
export interface VocabSprintGeneratedContent {
  gameKey: 'vocab-sprint';
  sentences: Array<{ sentence: string; weakWord: string; hint: string }>;
}

export interface GrammarBossGeneratedContent {
  gameKey: 'grammar-boss';
  task: string;
  exampleSentence: string;
}

export interface WordChainGeneratedContent {
  gameKey: 'word-chain';
  startingWord: string;
  hint: string;
}

export interface SynonymShowdownGeneratedContent {
  gameKey: 'synonym-showdown';
  targetWord: string;
  contextSentence: string;
  hint: string;
}

export interface ErrorHunterGeneratedContent {
  gameKey: 'error-hunter';
  paragraph: string;
  errorCount: number;
  _errors: Array<{ position: number; word: string; errorType: string; correction: string }>;
}

export interface DialogueDetectiveGeneratedContent {
  gameKey: 'dialogue-detective';
  speakerA_before: string;
  speakerA_after: string;
  context: string;
  goal: string;
}

export interface ToneTransformerGeneratedContent {
  gameKey: 'tone-transformer';
  originalSentence: string;
  currentTone: string;
  targetTone: string;
  context: string;
}

export interface ConnectionGeneratedContent {
  gameKey: 'connection';
  word1: string;
  word2: string;
  category: string;
  hint: string;
}

export interface ConnectionsGeneratedContent {
  gameKey: 'connections';
  words: string[];  // 16 shuffled words
  groups: Array<{
    category: string;
    words: string[];
    difficulty: 'easy' | 'medium' | 'hard' | 'tricky';
    color: 'yellow' | 'green' | 'blue' | 'purple';
  }>;
}

export type GameGeneratedContent =
  | VocabSprintGeneratedContent
  | GrammarBossGeneratedContent
  | WordChainGeneratedContent
  | SynonymShowdownGeneratedContent
  | ErrorHunterGeneratedContent
  | DialogueDetectiveGeneratedContent
  | ToneTransformerGeneratedContent
  | ConnectionGeneratedContent
  | ConnectionsGeneratedContent;

// Response from lesson plan generation
export interface LessonPlanGenerateResponse {
  success: boolean;
  content: Record<string, ActivityGeneratedContent>;
  gameContent?: Record<string, GameGeneratedContent>;
  error?: string;
}

// ============================================
// Activity Response Storage
// ============================================

export interface ActivityResponse {
  id: string;
  sessionId: string;
  activityKey: string;
  studentId: string;
  responseData: Record<string, unknown>;
  aiFollowup?: ActivityContinueResponse;
  createdAt: string;
}
