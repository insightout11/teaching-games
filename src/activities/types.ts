import { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { SessionSettings } from '@/stores/session-store';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import type { ScoreOutcome, ScoringProfile } from '@/lib/score-engine';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';

// Activity categories
export type ActivityCategory = 'icebreaker' | 'learning' | 'practice' | 'debate' | 'closing';

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
  sessionId: string | null;
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
  // Score writing - activities pass promptIndex; use outcome for V2 classification
  onScore?: (request: {
    studentId: string | null;
    clientId: string | null;
    displayName: string;
    promptIndex: number;
    points: number;
    isCorrect: boolean | null;
    outcome?: ScoreOutcome;
    isEmpty?: boolean;
  }) => Promise<void>;
  // Mission system — populated for Landing activities in mission-based lessons
  studentMissions?: Record<string, string>;  // clientId → mission question
  // Landing activities call this to record the student's final answer
  onLandingAnswer?: (clientId: string, answer: string) => void;
  // Character Cards / opening stance system
  openingStances?: Record<string, string>;          // clientId → opening stance text
  characterAssignments?: Record<string, CharacterCard>; // clientId → assigned character
  classMission?: string | null;
  // Takeoff activities call this after content regeneration to update the shell's content map
  onContentRegenerate?: (updatedContent: Record<string, ActivityGeneratedContent>) => void;
  // When true, the activity is a flight-plan micro-event and must stop after exactly one round
  isMicroEvent?: boolean;
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
  /** Resources the student selected alongside their text (problem-solvers) */
  resourcesUsed?: string[];
}

// Plugin definition for an activity
export interface ActivityPlugin {
  key: string;
  name: string;
  description: string;
  category: ActivityCategory;
  /** PPP stage this activity belongs to. Internal metadata — must not appear in rendered strings. */
  pppStage: 'presentation' | 'practice' | 'production' | 'landing';
  skills: ActivitySkill[];
  component: ComponentType<ActivityProps>;
  supportsCustomTopic: boolean;
  estimatedMinutes: number;
  defaultTimerSeconds: number;
  // Lucide icon component for UI
  icon: ComponentType<{ className?: string }>;
  /** When true, this activity only makes sense within a Flight Plan and is hidden from Explore. */
  flightPlanOnly?: boolean;
  /** Scoring V2: how this activity classifies outcomes and what the leaderboard shows. */
  scoringProfile?: ScoringProfile;
  /** Minimum roster size for the activity to function correctly (not just "doesn't crash" — the core mechanic needs this many roles/participants). 1 = fully solo-capable. */
  minStudents: number;
  /** Roster size range where the activity's design intent is best realized. Not a hard limit — used for honest fit labels, not gating. `max: null` means no practical ceiling. */
  idealStudents: { min: number; max: number | null };
  /** True only if the whole activity can be run with everyone on one projected screen and verbal answers — the teacher operates every input from the shared display, no student device required. Judge conservatively from the activity's actual input mechanics. */
  deviceFree: boolean;
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
// Vocabulary Word Types
// ============================================

export interface VocabWord {
  word: string;
  definition: string;
}

export interface SourceVocabItem {
  term: string;
  meaning: string;        // ≤15 words, plain English
  example: string;        // Natural sentence using the term
  prompt?: string;        // Use-it discussion/reflection question (required for Language Toolkit, optional elsewhere)
  sourceContext?: string; // Sentence from source material where term appears
}

export interface LanguageToolkitContent extends ActivityGeneratedContent {
  activityKey: 'language-toolkit';
  items: SourceVocabItem[];
}

export function normalizeVocabWord(item: string | VocabWord): VocabWord {
  if (typeof item === 'string') return { word: item, definition: '' };
  return item;
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

// Wonder Board content
export interface WonderBoardContent extends ActivityGeneratedContent {
  activityKey: 'wonder-board';
  framingPrompt: string; // One sentence the teacher uses to introduce the board
}

// Trip Attractions content (Travel arc — attraction board stage).
// Seeded from a destination's real travelAnchors.attractions — no AI.
export interface TripAttractionOption {
  id: string;
  name: string;
  whatItIs: string;   // one-line info so students know what the place is
  whyVisit?: string;  // optional traveller hook
}

export interface TripAttractionsContent extends ActivityGeneratedContent {
  activityKey: 'trip-attractions';
  city: string;
  framingPrompt: string;
  attractions: TripAttractionOption[];
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

// Spot the Fib content (key: two-truths) — AI topic statements, one is false
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
  vocabulary: (string | VocabWord)[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Expert Panel content
export interface ExpertPanelContent extends ActivityGeneratedContent {
  activityKey: 'expert-panel';
  roles: ExpertPanelRole[];         // length === studentCount at generation time
  questions: ExpertPanelQuestion[]; // length === studentCount at generation time
}

export interface ExpertPanelRole {
  id: string;
  title: string;
  tags: string[];      // exactly 3 short noun phrases
  starters: string[];  // exactly 2 sentence starters
}

export interface ExpertPanelQuestion {
  id: string;
  text: string;  // max 15 words
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
  vocabularyHighlights: (string | VocabWord)[];
}

// Scenario Simulator content
export interface ScenarioSimulatorContent extends ActivityGeneratedContent {
  activityKey: 'scenario-simulator';
  title: string;
  hook: string;               // 1-line urgent hook shown at start
  tone: 'thriller' | 'comedy' | 'sci-fi' | 'mystery' | 'default';
  // Two skinnable meter labels — AI generates based on scenario
  goalLabel: string;          // e.g. "Escape", "Trust", "Repair", "Score"
  dangerLabel: string;        // e.g. "Chaos", "Suspicion", "Damage", "Time"
  openingLines: string[];     // 2–3 lines establishing setting + stakes (shown in IDLE)
  storyContext: string;       // 2–3 sentence story setup — passed to AI for each dynamic round
  rounds: ScenarioRound[];    // Round 1 only; Rounds 2–5 generated dynamically during session
  finalePrompt: string;
  successBanner: string;
  failureBanner: string;
}

export interface ScenarioRound {
  id: number;                 // 1–5
  readLines: string[];        // default 3 lines (≤12 words each), 4–5 allowed
  situation: string;          // 1–2 sentence teacher context (shown small)
  choices: ScenarioChoice[];  // exactly 3
}

export interface ScenarioChoice {
  label: 'A' | 'B' | 'C';
  text: string;               // ≤10 words — shown on student button
  consequence: string;        // 1–2 cinematic sentences shown after vote
  goalDelta: number;          // -2 to +2 (hidden — drives GOAL meter)
  dangerDelta: number;        // -2 to +2 (hidden — drives DANGER meter)
}

// Finale top-3 pick (returned by continue API)
export interface FinaleOption {
  label: 'A' | 'B' | 'C';
  text: string;
  tag: 'bold' | 'safe' | 'risky';  // used for comeback logic and outcome reason
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
  submissionMaxWords: number;
  sentenceStarters: string[];
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

// Design Studio content
export interface DesignStudioContent extends ActivityGeneratedContent {
  activityKey: 'design-studio';
  challenge: string;
  openingPrompt: string;
  successCriteria: string[];
  maxDecisions: number;
  worldFlightMission?: WorldFlightDesignMissionContext;
}

export interface DesignStudioOption {
  id: 'A' | 'B' | 'C';
  title: string;
  description: string;
  benefit: string;
  tradeoff: string;
  designChange: string;
}

export interface DesignStudioRound {
  stage: string;
  question: string;
  whyItMatters: string;
  designSummary: string;
  options: DesignStudioOption[];
}

export interface DesignStudioDecision {
  roundNumber: number;
  stage: string;
  question: string;
  selectedOption: DesignStudioOption;
}

export interface DesignStudioState {
  challenge: string;
  originalIdeas: string[];
  designSummary: string;
  decisions: DesignStudioDecision[];
}

export interface DesignStudioBrief {
  title: string;
  summary: string;
  intendedUsers: string[];
  coreFeatures: string[];
  evidenceAndReasoning: string[];
  remainingTradeoffs: string[];
  pitch: string;
}

// ============================================
// Conversation Rounds Content Types
// ============================================

export interface ConversationRoundsRole {
  title: string;
  goal: string;
  situation: string;
  phrases: string[];
  lifelines: string[];
}

export interface ConversationRoundsContent extends ActivityGeneratedContent {
  activityKey: 'conversation-rounds';
  scenario: string;
  context: string;
  roles: [ConversationRoundsRole, ConversationRoundsRole];
  complications: string[];
  // Task-roleplay only (Travel): ~3 things the traveler must accomplish; teacher ticks them off.
  taskChecklist?: string[];
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
  requestType:
    | 'follow-up'
    | 'challenge'
    | 'hint'
    | 'evaluate'
    | 'counter-argument'
    | 'pick-top3'
    | 'generate-round'
    | 'design-studio-start'
    | 'design-studio-next'
    | 'design-studio-finalize';
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
  top3Picks?: FinaleOption[];
  generatedRound?: ScenarioRound;
  designStudioRound?: DesignStudioRound;
  designStudioBrief?: DesignStudioBrief;
  /** Full content replacement — used by Conversation Rounds scenario regeneration. */
  regeneratedContent?: ActivityGeneratedContent;
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
  studentCount?: number; // used by Expert Panel generator; defaults to 9
  goal?: string; // GoalTag — used by mission-selector generator for mission type selection
  missionContext?: string[]; // Up to 5 unique student mission questions for mission-aware generators
  sourceMaterial?: import('@/types/source-material').SourceMaterial; // External source for grounded generation
  /** When true, this lesson has a canonical vocab flow (language-toolkit in slots). */
  needsSourceVocab?: boolean;
  /** Canonical vocab already generated — skip generation and use directly. */
  sourceVocab?: SourceVocabItem[];
}

// Video Player activity content (source-based lessons)
export interface VideoPlayerContent extends ActivityGeneratedContent {
  activityKey: 'video-player';
  videoUrl: string;
  videoTitle: string;
  comprehensionQuestions: import('@/types/source-material').ComprehensionQuestion[];
  /** Optional open-ended speaking prompt shown after the comprehension questions. */
  discussionPrompt?: string;
}

export interface ReadAloudContent extends ActivityGeneratedContent {
  activityKey: 'read-aloud';
  sourceText: string;
  sourceTitle: string;
  /** Maximum passage size selected for the lesson difficulty. */
  readingTurnWords?: number;
  sourceCitations?: import('@/types/source-material').SourceCitation[];
  slides?: string[];
  vocabWords?: string[];
  /** Optional end-of-reading comprehension check. If absent, the reader skips the quiz. */
  comprehensionQuestions?: import('@/types/source-material').ComprehensionQuestion[];
  /** Optional open-ended speaking prompt shown after the comprehension questions. */
  discussionPrompt?: string;
}

// Game generated content types for lesson planner
export interface VocabSprintGeneratedContent {
  gameKey: 'vocab-sprint';
  sentences: Array<{ sentence: string; weakWord: string; hint: string; level: 'easy' | 'medium' | 'hard'; targetWord?: string }>;
}

export interface GrammarBossGeneratedContent {
  gameKey: 'grammar-boss';
  task: string;
  exampleSentence: string;
  sentenceStarter?: string;
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

// Quick Pulse content
export type QuickPulsePromptType = 'likert' | 'yesno';

export interface QuickPulsePrompt {
  type: QuickPulsePromptType;
  text: string;
}

export interface QuickPulseContent extends ActivityGeneratedContent {
  activityKey: 'quick-pulse';
  prompts: [QuickPulsePrompt, QuickPulsePrompt, QuickPulsePrompt];
}

// Vocab Radar content
export interface VocabRadarWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;  // ≤15 words, student-facing
}

export interface VocabRadarContent extends ActivityGeneratedContent {
  activityKey: 'vocab-radar';
  words: VocabRadarWord[]; // 5–6 words
}

// Listening Gap Fill content
export interface GapFillItem {
  display: string;        // Sentence with ___ in place of the blank
  full: string;           // Complete sentence for reveal
  answer: string;         // Correct word, lowercase normalized
  alternatives?: string[]; // Other accepted forms (e.g. plural/conjugation variants)
  hint?: string;          // Brief grammatical label e.g. "verb (past tense)"
}

export interface ListeningGapFillContent extends ActivityGeneratedContent {
  activityKey: 'listening-gap-fill';
  mode?: 'listening' | 'reading';
  title?: string;
  instruction?: string;
  items: GapFillItem[];   // 5–6 items
}

// Opinion Micro content (flight-plan micro-event — single dilemma)
export interface OpinionMicroDilemma {
  optionA: string;
  optionB: string;
  discussionPrompt: string;
}

export interface OpinionMicroContent extends ActivityGeneratedContent {
  activityKey: 'opinion-micro';
  dilemma: OpinionMicroDilemma;
}

// Accuracy Micro content (flight-plan micro-event — single sentence correction)
export interface AccuracyMicroContent extends ActivityGeneratedContent {
  activityKey: 'accuracy-micro';
  sentence: string;          // version with the error (Option A)
  correctedSentence: string; // corrected version (Option B)
  errorType: string;         // e.g. "subject-verb agreement"
  explanation: string;       // why the correction is right
}

// Vocab Micro content ("Comms Check" — single "which word fits?" gap)
export interface VocabMicroContent extends ActivityGeneratedContent {
  activityKey: 'vocab-micro';
  sentence: string;     // one sentence with a single gap shown as "___"
  options: string[];    // 3–4 single-word choices
  correctIndex: number; // index of the best word in options
  word: string;         // the correct word (= options[correctIndex])
  explanation: string;  // meaning + why it fits
  example?: string;     // a second example sentence
}

// Prediction Round content
export interface PredictionRoundQuestion {
  text: string;        // The prediction statement / question
  optionA: string;     // e.g. "True" or "Option A"
  optionB: string;     // e.g. "False" or "Option B"
  correctAnswer: 'A' | 'B';
  revealFact: string;  // Brief explanation shown after reveal
}

export interface PredictionRoundContent extends ActivityGeneratedContent {
  activityKey: 'prediction-round';
  questions: [PredictionRoundQuestion, PredictionRoundQuestion, PredictionRoundQuestion];
}

// Mission Selector content
export interface MissionSelectorContent extends ActivityGeneratedContent {
  activityKey: 'mission-selector';
  questions: string[];  // 6 mission questions
}

// Opinion Shift content
export interface OpinionShiftContent extends ActivityGeneratedContent {
  activityKey: 'opinion-shift';
  beforePrompt: string;  // e.g. "Before this lesson I thought about travel as..."
  nowPrompt: string;     // e.g. "Now I think travel is..."
}

// Final Answer content
export interface FinalAnswerContent extends ActivityGeneratedContent {
  activityKey: 'final-answer';
  prompt: string;
  targetKeywords: string[];       // 4-6 lesson vocabulary words for scoring
  sentenceStarter?: string;       // scaffold e.g. "I think that..."
  exampleAnswer?: string;         // teacher-only model answer
}

// Mic Drop content
export interface MicDropContent extends ActivityGeneratedContent {
  activityKey: 'mic-drop';
  prompt: string;
  targetKeywords: string[];
  exampleLine?: string;           // teacher-only strong example
}

// Lightning Round content
export interface LightningRoundPrompt {
  text: string;                   // short prompt ≤12 words
  targetKeywords: string[];       // 2-4 keywords per prompt
}

export interface LightningRoundContent extends ActivityGeneratedContent {
  activityKey: 'lightning-round';
  prompts: LightningRoundPrompt[]; // 3-5 prompts
}

// Character Cards content
export interface CharacterCard {
  name: string;
  viewpoint: string;
  speakingLine: string;
}
export interface CharacterCardsContent extends ActivityGeneratedContent {
  activityKey: 'character-cards';
  characters: CharacterCard[];
  topic: string;
}

// Imposter content
export interface ImposterRound {
  word: string;
  description: string;
}

export interface ImposterContent extends ActivityGeneratedContent {
  activityKey: 'imposter';
  rounds: ImposterRound[];
  topic: string;
}

// Password content
export interface PasswordRound {
  word: string;
  description: string;
}

export interface PasswordContent extends ActivityGeneratedContent {
  activityKey: 'password';
  rounds: PasswordRound[];
  topic: string;
}

// Bluff Definition content
export interface BluffDefinitionRound {
  word: string;
  correctDefinition: string;
}

export interface BluffDefinitionContent extends ActivityGeneratedContent {
  activityKey: 'bluff-definition';
  rounds: BluffDefinitionRound[];
  topic: string;
}

// Taboo Sprint content
export interface TabooRound {
  word: string;
  description: string;
  forbiddenWords: string[];
}

export interface TabooSprintContent extends ActivityGeneratedContent {
  activityKey: 'taboo-sprint';
  rounds: TabooRound[];
  topic: string;
}

// Grammar Check-In content
export interface GrammarCheckInSentence {
  text: string;
  isCorrect: boolean;
  explanation: string;
}
export interface GrammarCheckInContent extends ActivityGeneratedContent {
  activityKey: 'grammar-check-in';
  grammarTarget: string;
  sentences: GrammarCheckInSentence[];
}

// Grammar Proof content
export interface GrammarProofContent extends ActivityGeneratedContent {
  activityKey: 'grammar-proof';
  grammarTarget: string;
  prompt: string;
  exampleSentences: string[];
}

// Grammar Clarify content — the "teach the rule" step before the drills.
export interface GrammarClarifyContent extends ActivityGeneratedContent {
  activityKey: 'grammar-clarify';
  grammarTarget: string;
  form: string;          // how the structure is built
  examples: string[];    // 2–3 model sentences, on the lesson topic
  whenToUse: string;     // meaning / use
  pitfall: string;       // a common mistake to avoid
}

// Contribution Break content
export interface ContributionBreakContent extends ActivityGeneratedContent {
  activityKey: 'contribution-break';
  prompt: string;
}

// Decision Council content
export interface DecisionCouncilContent extends ActivityGeneratedContent {
  activityKey: 'decision-council';
  councilQuestion: string;      // Open-ended decision question ≤20 words
  contextBrief: string;         // 2–3 sentence background, student-readable in 30s
  stanceOptions?: string[];     // 3–4 possible positions (noun phrases ≤8 words)
  sourceDetails?: string[];     // Key facts from source material
  usefulPhrases?: string[];     // Proposal language starters (5–6)
  challengeStarters?: string[]; // Challenge language starters (4–5)
}

// Team Debate content — structured two-team debate (motion + per-side prep angles).
// The debate STRUCTURE (Opening → Rebuttal → Closing) is fixed in the component;
// only the motion/context/prep material is generated.
export interface TeamDebateContent extends ActivityGeneratedContent {
  activityKey: 'team-debate';
  motion: string;            // Debatable statement, e.g. "This house believes that ..."
  context: string;           // 2–3 sentence framing students can read in ~30s
  forLabel: string;          // Stance label for the For team (e.g. "For" or a position)
  againstLabel: string;      // Stance label for the Against team
  forPrompts: string[];      // 3–4 prep angles / arguments for the For side
  againstPrompts: string[];  // 3–4 prep angles / arguments for the Against side
  usefulPhrases: string[];   // 5–6 debate language starters (both sides)
}

// Final Word content
export interface FinalWordContent extends ActivityGeneratedContent {
  activityKey: 'final-word';
  prompt: string;
}

// In Your Words content
export interface InYourWordsContent extends ActivityGeneratedContent {
  activityKey: 'in-your-words';
  words: string[]; // key vocabulary from Vocab Radar
}

// Scene Igniter content
export interface SceneIgniterLine {
  lineIndex: number;   // 1-based, maps to prompt_index in scores
  character: string;  // 'A' | 'B' | 'C' | 'D'
  text: string;
  direction?: string;  // optional 1–2 word stage direction, e.g. "nervously", "whispering"
}

export interface SceneIgniterImprovLine {
  character: string;  // 'A' | 'B' | 'C' | 'D' — same chars as parent scene
  text: string;       // contains ___ blanks for improvised phrases
  hint?: string;      // e.g. "e.g. weird, broken, tiny" — 2–3 example words for the blank
}

export interface SceneIgniterScene {
  title: string;
  context: string;           // 2–3 sentence scene setup
  lines: SceneIgniterLine[]; // Scene 1 has 4 chars (12 lines); Scene 2 has 3 chars (9 lines)
  improvPrompt: string;      // one-sentence twist
  improvScript: SceneIgniterImprovLine[];  // 8 lines, 1–2 blanks each
}

export interface SceneIgniterContent extends ActivityGeneratedContent {
  activityKey: 'scene-igniter';
  scenes: SceneIgniterScene[]; // [g1original, g2original, g1alt, g2alt]
}

export interface StorySprintGeneratedContent {
  gameKey: 'story-sprint';
  starterSentence: string;
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
  | ConnectionsGeneratedContent
  | StorySprintGeneratedContent;

// Response from lesson plan generation
export interface LessonPlanGenerateResponse {
  success: boolean;
  content: Record<string, ActivityGeneratedContent>;
  gameContent?: Record<string, GameGeneratedContent>;
  error?: string;
  degraded?: boolean;
  failedCount?: number;
  /** Canonical source vocab — returned when generated for the first time in this lesson. */
  sourceVocab?: SourceVocabItem[];
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
