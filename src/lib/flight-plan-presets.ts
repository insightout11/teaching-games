import type { ScoringMode } from '@/stores/session-store';
import type { GoalTag, SlotType } from './flight-plan-config';

export type LessonType = 'inquisitive' | 'skill-builder' | 'performance' | 'game-day';

export interface PresetScenarios {
  /** Heading shown above the option chips. */
  label: string;
  /** Placeholder for the free-text write-in input. */
  placeholder: string;
  /** Curated options — clicking one pre-fills the input. */
  options: string[];
}

export type FlightStageKind = 'stage' | 'micro-event' | 'end-game' | 'landing';

// Three-layer route model:
//  1. phase  — fixed universal lesson structure (Takeoff…Landing). Never swaps.
//  2. label  — the stage JOB: the stable contract of the slot, true for every
//              activity that can occupy it (e.g. "Explore", not "Wonder Board").
//  3. activity (the chosen module name) lives on the slot, not here.
export type FlightPhase = 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing';

export interface FlightStageDefinition {
  stageId: string;
  label: string;
  kind: FlightStageKind;
  phase: FlightPhase;
}

export interface FlightPresetConfig {
  stages: FlightStageDefinition[];
  stageByKey: Record<string, string>;
}

export interface FlightPlanPreset {
  id: string;
  name: string;
  description: string;
  lessonDurationMinutes: 30 | 45 | 60 | 90;
  goal: GoalTag;
  lessonType: LessonType;
  /** Short one-line subtitle shown on preset pickers/cards. */
  tagline?: string;
  /** Explicit scoring mode override — skips goal-derived default when set. */
  scoringMode?: ScoringMode;
  /** When true, loadPreset skips mission-selector takeoff and landing — pure game sequence. */
  skipTakeoffLanding?: boolean;
  /**
   * When true, do NOT auto-inject a source briefing (video-player / read-aloud) from the
   * attached source. For presets that supply their own grounding via a synthetic source
   * (e.g. Travel's buildTravelContext) where the "source" has no playable video or
   * student-facing reading — only generation context.
   */
  skipSourceBriefing?: boolean;
  /** Explicit takeoff activity key — overrides auto-assignment when set. */
  takeoff?: string;
  /** Explicit landing activity key — overrides auto-assignment when set. */
  landing?: string;
  /** Middle slots only — takeoff/landing are always auto-assigned. */
  moduleSequence: Array<{ slotType: SlotType; key: string; stageId?: string; stageLabel?: string; isMicroEvent?: boolean; pool?: string[]; worldFlightOnly?: boolean }>;
  /** Dedicated journey metadata for curated flight modes. */
  flightConfig?: FlightPresetConfig;
  /**
   * When present, clicking this preset opens a scenario picker modal instead of
   * loading immediately. The selected scenario string is written to the topic field.
   */
  scenarios?: PresetScenarios;
}

/**
 * Archived presets — built in the old style, kept in code for reference/revival but
 * NOT shown anywhere live. Only Captain's Flight (in FLIGHT_PLAN_PRESETS below) is live.
 * These will be rebuilt one by one in the new card/lesson style (June 2026 redesign).
 */
export const ARCHIVED_PRESETS: FlightPlanPreset[] = [
  {
    id: 'game-day-60',
    name: 'Game Day',
    description: 'Pure competitive fun — 4 back-to-back games, running scoreboard',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'game-day',
    scoringMode: 'competitive',
    skipTakeoffLanding: true,
    moduleSequence: [
      { slotType: 'practice', key: 'connections' },
      { slotType: 'practice', key: 'grid-rush' },
      { slotType: 'presentation', key: 'imposter' },
      { slotType: 'practice', key: 'flash-quiz' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Famous movies and TV shows',
      options: [
        'Pop culture and entertainment',
        'Sport and competition',
        'Food and drink',
        'Travel and places',
        'Nature and animals',
        'Technology and gadgets',
      ],
    },
  },
  {
    id: 'debate-ready-60',
    name: 'Debate Ready',
    description: 'Opinion formation, structured argument, vote-and-discuss',
    lessonDurationMinutes: 60,
    goal: 'discussion-debate',
    lessonType: 'inquisitive',
    takeoff: 'mission-selector',
    landing: 'opinion-shift',
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'production', key: 'defend-it' },
      { slotType: 'production', key: 'hot-take-arena' },
    ],
    scenarios: {
      label: 'Choose a discussion theme',
      placeholder: 'e.g. Should junk food be taxed?',
      options: [
        'Technology and society',
        'Environment and sustainability',
        'Education and learning',
        'Health and lifestyle',
        'Work and the future',
        'Culture and identity',
      ],
    },
  },
  {
    id: 'vocab-blitz-60',
    name: 'Vocab Blitz',
    description: 'Vocabulary-first with game-based reinforcement and real use',
    lessonDurationMinutes: 60,
    goal: 'vocabulary-building',
    lessonType: 'skill-builder',
    takeoff: 'vocab-radar',
    landing: 'in-your-words',
    moduleSequence: [
      { slotType: 'practice', key: 'synonym-showdown' },
      { slotType: 'practice', key: 'vocab-sprint' },
      { slotType: 'production', key: 'password' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Street food around the world',
      options: [
        'Technology and the internet',
        'Food and cooking',
        'Travel and adventure',
        'Health and fitness',
        'Work and careers',
        'Nature and the environment',
      ],
    },
  },
  {
    id: 'speaking-circle-60',
    name: 'Speaking Circle',
    description: 'High speaking load, confidence-building sequence',
    lessonDurationMinutes: 60,
    goal: 'speaking-fluency',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'would-you-rather' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a speaking situation',
      placeholder: 'e.g. Catching up with an old friend',
      options: [
        'Daily life — routines, home, neighbourhood',
        'Social — meeting people, making plans, small talk',
        'Opinions — sharing views on familiar topics',
        'Problem-solving — navigating everyday issues together',
        'Storytelling — sharing experiences and reactions',
        'Workplace — simple professional interactions',
      ],
    },
  },
  {
    id: 'grammar-clinic-60',
    name: 'Grammar Clinic',
    description: 'Sentence-level accuracy — spot errors, build sentences, perform under pressure',
    lessonDurationMinutes: 60,
    goal: 'grammar-reinforcement',
    lessonType: 'skill-builder',
    takeoff: 'grammar-check-in',
    landing: 'grammar-proof',
    moduleSequence: [
      { slotType: 'practice', key: 'error-hunter' },
      { slotType: 'practice', key: 'sentence-scramble' },
      { slotType: 'practice', key: 'grammar-boss' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Shopping at the market',
      options: [
        'Technology and social media',
        'Travel and transport',
        'Health and wellbeing',
        'Food and daily routines',
        'Work and careers',
        'The environment',
      ],
    },
  },
  {
    id: 'think-tank-60',
    name: 'Think Tank',
    description: 'Deep critical thinking — question, investigate, and deduce',
    lessonDurationMinutes: 60,
    goal: 'critical-thinking',
    lessonType: 'inquisitive',
    takeoff: 'fact-detective',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'wonder-board' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'production', key: 'twenty-questions' },
    ],
    scenarios: {
      label: 'Choose a thinking challenge',
      placeholder: 'e.g. Should cities ban private cars?',
      options: [
        'Artificial intelligence and society',
        'Climate change and the future',
        'Education and learning',
        'Health and medical ethics',
        'Urban life and community',
        'Media and truth',
      ],
    },
  },
  {
    id: 'travel-english-60',
    name: 'Travel English',
    description: 'Airport, hotel, and restaurant scenarios — situational speaking in real travel contexts',
    lessonDurationMinutes: 60,
    goal: 'functional-english',
    lessonType: 'performance',
    takeoff: 'vocab-radar',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'practice', key: 'dialogue-detective' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a travel situation',
      placeholder: 'e.g. Checking in at a budget hostel',
      options: [
        'Airport — check-in and boarding',
        'Hotel — checking in and accommodation',
        'Restaurant — ordering and dealing with issues',
        'Shopping — markets, shops, and returns',
        'Getting around — directions and public transport',
        'Emergencies — problems, help, and medical situations',
      ],
    },
  },
  {
    id: 'job-english-60',
    name: 'Job English',
    description: 'Interview prep and workplace communication — professional vocabulary with role-based speaking',
    lessonDurationMinutes: 60,
    goal: 'functional-english',
    lessonType: 'performance',
    takeoff: 'vocab-radar',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'practice', key: 'dialogue-detective' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a job role',
      placeholder: 'e.g. Barista at a specialty coffee shop',
      options: [
        'Waiter or restaurant server',
        'Cashier or retail assistant',
        'Hotel receptionist or concierge',
        'Customer service agent',
        'Healthcare worker or medical receptionist',
        'Office or admin assistant',
        'Tour guide or tourism worker',
      ],
    },
  },
  {
    id: 'creative-sprint-60',
    name: 'Creative Sprint',
    description: 'Open-ended expression with imagination-first storytelling',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'wonder-board' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'story-sprint' },
    ],
    scenarios: {
      label: 'Choose a creative theme',
      placeholder: 'e.g. A strange discovery in an old building',
      options: [
        'Adventure and exploration',
        'Mystery and suspense',
        'Friendship and relationships',
        'Technology and the future',
        'Nature and survival',
        'Dreams and imagination',
      ],
    },
  },
  {
    id: 'first-day-60',
    name: 'First Day',
    description: 'Social icebreaker — gets students talking, laughing, and learning each other',
    lessonDurationMinutes: 60,
    goal: 'confidence-building',
    lessonType: 'performance',
    takeoff: 'quick-pulse',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'two-truths-and-a-lie' },
      { slotType: 'production', key: 'would-you-rather' },
      { slotType: 'presentation', key: 'imposter' },
    ],
    scenarios: {
      label: 'Choose a theme',
      placeholder: 'e.g. Things we all have in common',
      options: [
        'Getting to know each other',
        'Hobbies and free time',
        'Dreams and ambitions',
        'Technology and daily life',
        'The environment',
        'Health and lifestyle',
      ],
    },
  },
];

/**
 * Live presets shown to teachers.
 */
export const FLIGHT_PLAN_PRESETS: FlightPlanPreset[] = [
  {
    id: 'all-around-flight-60',
    name: "Captain's Flight",
    description: 'Warm up, unpack a source, then move through an opinion pulse and language work into a full discussion, a review game, and a final word.',
    tagline: 'The all-rounder — comprehend a source, then discuss',
    lessonDurationMinutes: 60,
    goal: 'speaking-fluency',
    lessonType: 'skill-builder',
    takeoff: 'prediction-round',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'read-aloud', stageId: 'briefing' },
      { slotType: 'practice', key: 'would-you-rather', stageId: 'opinion-pulse', isMicroEvent: true, pool: ['would-you-rather', 'rank-it'] },
      { slotType: 'practice', key: 'language-toolkit', stageId: 'language-toolkit' },
      { slotType: 'practice', key: 'error-hunter', stageId: 'accuracy-check', isMicroEvent: true, pool: ['error-hunter', 'sentence-scramble', 'synonym-showdown', 'vocab-sprint'] },
      { slotType: 'production', key: 'decision-council', stageId: 'production' },
      { slotType: 'practice', key: 'radar-fix', stageId: 'navigation-check', isMicroEvent: true, worldFlightOnly: true },
      { slotType: 'practice', key: 'flash-quiz', stageId: 'end-game', pool: ['flash-quiz', 'connections', 'word-chain', 'grid-rush', 'imposter', 'password', 'sector-strike'] },
    ],
    flightConfig: {
      stages: [
        { stageId: 'icebreaker', label: 'Warm-up', kind: 'stage', phase: 'takeoff' },
        { stageId: 'briefing', label: 'Briefing', kind: 'stage', phase: 'climb' },
        { stageId: 'opinion-pulse', label: 'Opinion Pulse', kind: 'micro-event', phase: 'climb' },
        { stageId: 'language-toolkit', label: 'Language Toolkit', kind: 'stage', phase: 'climb' },
        { stageId: 'accuracy-check', label: 'Accuracy Check', kind: 'micro-event', phase: 'cruise' },
        { stageId: 'production', label: 'Main Discussion', kind: 'stage', phase: 'cruise' },
        { stageId: 'navigation-check', label: 'Navigation Check', kind: 'micro-event', phase: 'cruise' },
        { stageId: 'end-game', label: 'Review Game', kind: 'end-game', phase: 'descent' },
        { stageId: 'landing', label: 'Wrap-up', kind: 'landing', phase: 'landing' },
      ],
      stageByKey: {
        'prediction-round': 'icebreaker',
        'video-player': 'briefing',
        'read-aloud': 'briefing',
        'language-toolkit': 'language-toolkit',
        'would-you-rather': 'opinion-pulse',
        'rank-it': 'opinion-pulse',
        'error-hunter': 'accuracy-check',
        'sentence-scramble': 'accuracy-check',
        'synonym-showdown': 'accuracy-check',
        'vocab-sprint': 'accuracy-check',
        'radar-fix': 'navigation-check',
        'decision-council': 'production',
        'flash-quiz': 'end-game',
        'connections': 'end-game',
        'word-chain': 'end-game',
        'grid-rush': 'end-game',
        'imposter': 'end-game',
        'password': 'end-game',
        'sector-strike': 'end-game',
        'final-word': 'landing',
      },
    },
    scenarios: {
      label: 'Choose a lesson theme',
      placeholder: 'e.g. Should schools use AI tutors?',
      options: [
        'Technology and daily life',
        'Environment and everyday choices',
        'Social media and relationships',
        'Food, health, and habits',
        'Travel and cultural differences',
        'Work, school, and the future',
      ],
    },
  },
  {
    id: 'speak-60',
    name: 'Speak',
    description: 'Warm up, play out a scaffolded scene, then keep talking — an opinion pulse, open conversation, a comms check, a review game, and a final word.',
    tagline: 'Maximum talk time — fluency over accuracy',
    lessonDurationMinutes: 60,
    goal: 'speaking-fluency',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    // No new components — reuses the existing speaking engine (scene-igniter → conversation-rounds).
    // Micro defaults (Vocab) await the Vocab micro + toggle system; Opinion Pulse baked in for now.
    moduleSequence: [
      { slotType: 'presentation', key: 'scene-igniter', stageId: 'scene' },
      { slotType: 'practice', key: 'would-you-rather', stageId: 'opinion-pulse', isMicroEvent: true, pool: ['would-you-rather', 'rank-it'] },
      { slotType: 'production', key: 'conversation-rounds', stageId: 'conversation' },
      { slotType: 'practice', key: 'vocab-micro', stageId: 'vocab-check', isMicroEvent: true },
      { slotType: 'practice', key: 'imposter', stageId: 'end-game', pool: ['word-chain', 'connections', 'synonym-showdown', 'vocab-sprint', 'taboo-sprint', 'imposter'] },
    ],
    flightConfig: {
      stages: [
        { stageId: 'icebreaker', label: 'Warm-up', kind: 'stage', phase: 'takeoff' },
        { stageId: 'scene', label: 'Scene', kind: 'stage', phase: 'climb' },
        { stageId: 'opinion-pulse', label: 'Opinion Pulse', kind: 'micro-event', phase: 'cruise' },
        { stageId: 'conversation', label: 'Conversation', kind: 'stage', phase: 'cruise' },
        { stageId: 'vocab-check', label: 'Comms Check', kind: 'micro-event', phase: 'cruise' },
        { stageId: 'end-game', label: 'Review Game', kind: 'end-game', phase: 'descent' },
        { stageId: 'landing', label: 'Wrap-up', kind: 'landing', phase: 'landing' },
      ],
      stageByKey: {
        'character-cards': 'icebreaker',
        'scene-igniter': 'scene',
        'would-you-rather': 'opinion-pulse',
        'rank-it': 'opinion-pulse',
        'conversation-rounds': 'conversation',
        'vocab-micro': 'vocab-check',
        'word-chain': 'end-game',
        'connections': 'end-game',
        'synonym-showdown': 'end-game',
        'vocab-sprint': 'end-game',
        'taboo-sprint': 'end-game',
        'imposter': 'end-game',
        'final-word': 'landing',
      },
    },
    scenarios: {
      label: 'Choose a speaking situation',
      placeholder: 'e.g. Catching up with an old friend',
      options: [
        'Daily life — routines, home, neighbourhood',
        'Social — meeting people, making plans, small talk',
        'Opinions — sharing views on familiar topics',
        'Storytelling — sharing experiences and reactions',
        'Problem-solving — navigating everyday issues together',
        'Workplace — simple professional interactions',
      ],
    },
  },
  {
    id: 'grammar-60',
    name: 'Grammar',
    description: 'Check in on a target structure, learn the rule, spot errors, rebuild sentences, produce under pressure, then review and prove it.',
    tagline: 'Form & accuracy — notice, fix, produce',
    lessonDurationMinutes: 60,
    goal: 'grammar-reinforcement',
    lessonType: 'skill-builder',
    takeoff: 'grammar-check-in',
    landing: 'grammar-proof',
    // The target structure threads through the drills; goal derives accuracy scoring.
    moduleSequence: [
      { slotType: 'presentation', key: 'grammar-clarify', stageId: 'clarify' },
      { slotType: 'practice', key: 'error-hunter', stageId: 'notice' },
      { slotType: 'practice', key: 'sentence-scramble', stageId: 'build' },
      { slotType: 'practice', key: 'grammar-boss', stageId: 'produce' },
      { slotType: 'practice', key: 'flash-quiz', stageId: 'end-game', pool: ['grid-rush', 'flash-quiz', 'connections', 'synonym-showdown', 'vocab-sprint'] },
    ],
    flightConfig: {
      stages: [
        { stageId: 'icebreaker', label: 'Check-In', kind: 'stage', phase: 'takeoff' },
        { stageId: 'clarify', label: 'The Rule', kind: 'stage', phase: 'climb' },
        { stageId: 'notice', label: 'Spot Errors', kind: 'stage', phase: 'climb' },
        { stageId: 'build', label: 'Rebuild', kind: 'stage', phase: 'cruise' },
        { stageId: 'produce', label: 'Produce', kind: 'stage', phase: 'cruise' },
        { stageId: 'end-game', label: 'Review Game', kind: 'end-game', phase: 'descent' },
        { stageId: 'landing', label: 'Wrap-up', kind: 'landing', phase: 'landing' },
      ],
      stageByKey: {
        'grammar-check-in': 'icebreaker',
        'grammar-clarify': 'clarify',
        'error-hunter': 'notice',
        'sentence-scramble': 'build',
        'grammar-boss': 'produce',
        'grid-rush': 'end-game',
        'flash-quiz': 'end-game',
        'connections': 'end-game',
        'synonym-showdown': 'end-game',
        'vocab-sprint': 'end-game',
        'grammar-proof': 'landing',
      },
    },
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Shopping at the market',
      options: [
        'Technology and social media',
        'Travel and transport',
        'Health and wellbeing',
        'Food and daily routines',
        'Work and careers',
        'The environment',
      ],
    },
  },
  {
    id: 'travel-60',
    name: 'Travel',
    description: 'Fly a whole trip through one city — arrival, getting there, finding your way, the hotel, a real sight, and a local meal — speaking at every stop.',
    tagline: 'One city, the whole journey — speak at every stop',
    lessonDurationMinutes: 60,
    goal: 'functional-english',
    lessonType: 'performance',
    // functional-english is not in goalToScoringMode (would fall through to competitive),
    // so set participation explicitly — Travel is task-completion, not a winner.
    scoringMode: 'participation',
    // Each stage grounds on its own per-stage SourceMaterial (buildTripItinerary), injected at
    // launch via the trip pack — there's no single playable video / readable passage.
    skipSourceBriefing: true,
    takeoff: 'boarding-call',
    landing: 'trip-recap',
    // The fixed trip spine. trip-arrival / trip-getting-there / trip-meal are purpose-built on the
    // line-by-line PerformedExchange engine (AI-varied lines, deterministic fallback); only
    // trip-hotel still uses ConversationRounds. trip-attractions is seeded from the city's real
    // attractions (no AI). See docs/travel-trip-anchors-codex-brief.md.
    moduleSequence: [
      { slotType: 'production', key: 'trip-arrival', stageId: 'arrival' },
      { slotType: 'production', key: 'trip-getting-there', stageId: 'getting-there' },
      { slotType: 'practice', key: 'trip-directions', stageId: 'find-your-way', isMicroEvent: true },
      { slotType: 'production', key: 'trip-hotel', stageId: 'hotel' },
      { slotType: 'production', key: 'trip-attractions', stageId: 'attraction' },
      { slotType: 'production', key: 'trip-meal', stageId: 'local-table' },
      { slotType: 'practice', key: 'flash-quiz', stageId: 'end-game', pool: ['flash-quiz', 'connections', 'word-chain', 'vocab-sprint'] },
    ],
    flightConfig: {
      stages: [
        { stageId: 'departures', label: 'Departures', kind: 'stage', phase: 'takeoff' },
        { stageId: 'arrival', label: 'Arrival', kind: 'stage', phase: 'climb' },
        { stageId: 'getting-there', label: 'Getting There', kind: 'stage', phase: 'climb' },
        { stageId: 'find-your-way', label: 'Find Your Way', kind: 'micro-event', phase: 'cruise' },
        { stageId: 'hotel', label: 'Hotel', kind: 'stage', phase: 'cruise' },
        { stageId: 'attraction', label: 'Out & About', kind: 'stage', phase: 'cruise' },
        { stageId: 'local-table', label: 'Local Table', kind: 'stage', phase: 'descent' },
        { stageId: 'end-game', label: 'Trip Quiz', kind: 'end-game', phase: 'descent' },
        { stageId: 'landing', label: 'Trip Recap', kind: 'landing', phase: 'landing' },
      ],
      stageByKey: {
        'boarding-call': 'departures',
        'trip-arrival': 'arrival',
        'trip-getting-there': 'getting-there',
        'trip-directions': 'find-your-way',
        'trip-hotel': 'hotel',
        'trip-attractions': 'attraction',
        'trip-meal': 'local-table',
        'flash-quiz': 'end-game',
        'connections': 'end-game',
        'word-chain': 'end-game',
        'vocab-sprint': 'end-game',
        'trip-recap': 'landing',
      },
    },
  },
  {
    id: 'debate-60',
    name: 'Debate',
    description: 'Warm up opinions, build an evidence base, pick a side, argue the motion through opening, rebuttal, and closing, then reflect on who changed their mind.',
    tagline: 'Two teams, one motion — make your case',
    lessonDurationMinutes: 60,
    goal: 'discussion-debate',
    lessonType: 'performance',
    // discussion-debate derives to participation — no winner's vote; opinion-shift is the close.
    takeoff: 'quick-pulse',
    landing: 'opinion-shift',
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective', stageId: 'evidence' },
      { slotType: 'practice', key: 'would-you-rather', stageId: 'take-side', isMicroEvent: true, pool: ['would-you-rather', 'rank-it'] },
      { slotType: 'production', key: 'team-debate', stageId: 'debate' },
      { slotType: 'practice', key: 'imposter', stageId: 'end-game', pool: ['flash-quiz', 'connections', 'word-chain', 'synonym-showdown', 'imposter', 'twenty-questions', 'sector-strike'] },
    ],
    flightConfig: {
      stages: [
        { stageId: 'icebreaker', label: 'Warm-up', kind: 'stage', phase: 'takeoff' },
        { stageId: 'evidence', label: 'Evidence', kind: 'stage', phase: 'climb' },
        { stageId: 'take-side', label: 'Stance Check', kind: 'micro-event', phase: 'climb' },
        { stageId: 'debate', label: 'Debate', kind: 'stage', phase: 'cruise' },
        { stageId: 'end-game', label: 'Review Game', kind: 'end-game', phase: 'descent' },
        { stageId: 'landing', label: 'Reflection', kind: 'landing', phase: 'landing' },
      ],
      stageByKey: {
        'quick-pulse': 'icebreaker',
        'fact-detective': 'evidence',
        'would-you-rather': 'take-side',
        'rank-it': 'take-side',
        'team-debate': 'debate',
        'flash-quiz': 'end-game',
        'connections': 'end-game',
        'word-chain': 'end-game',
        'synonym-showdown': 'end-game',
        'imposter': 'end-game',
        'twenty-questions': 'end-game',
        'sector-strike': 'end-game',
        'opinion-shift': 'landing',
      },
    },
    scenarios: {
      label: 'Choose a debate topic',
      placeholder: 'e.g. Should homework be banned?',
      options: [
        'Technology and social media',
        'School and education',
        'Environment and climate',
        'Work and the future of jobs',
        'Health, food, and lifestyle',
        'City life vs. country life',
      ],
    },
  },
  {
    id: 'design-studio-60',
    name: 'Design Studio',
    description: 'Build one class-created design through contextual questions, debate, and progressive votes',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'performance',
    scoringMode: 'participation',
    skipTakeoffLanding: true,
    moduleSequence: [
      { slotType: 'production', key: 'design-studio' },
    ],
    scenarios: {
      label: 'Choose a design challenge',
      placeholder: 'e.g. Design a floating neighborhood that can survive floods',
      options: [
        'Design a public space where different communities feel welcome',
        'Design a neighborhood that can adapt to extreme weather',
        'Design a fairer way for people to move through a busy city',
        'Design a school that supports different ways of learning',
        'Design a food system that wastes less and feeds more people',
        'Design a safer, more useful public park',
      ],
    },
  },
];
