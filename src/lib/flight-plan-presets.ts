import type { ScoringMode } from '@/stores/session-store';
import type { GoalTag, SlotType } from './flight-plan-config';

export type LessonType = 'inquisitive' | 'skill-builder' | 'performance' | 'game-day';

export interface FlightPlanPreset {
  id: string;
  name: string;
  description: string;
  lessonDurationMinutes: 30 | 45 | 60 | 90;
  goal: GoalTag;
  lessonType: LessonType;
  /** Explicit scoring mode override — skips goal-derived default when set. */
  scoringMode?: ScoringMode;
  /** When true, loadPreset skips mission-selector takeoff and landing — pure game sequence. */
  skipTakeoffLanding?: boolean;
  /** Explicit takeoff activity key — overrides auto-assignment when set. */
  takeoff?: string;
  /** Explicit landing activity key — overrides auto-assignment when set. */
  landing?: string;
  /** Middle slots only — takeoff/landing are always auto-assigned. */
  moduleSequence: Array<{ slotType: SlotType; key: string }>;
}

export const FLIGHT_PLAN_PRESETS: FlightPlanPreset[] = [
  {
    id: 'grammar-clinic-45',
    name: 'Grammar Clinic',
    description: 'Sentence-level accuracy with writing-heavy games',
    lessonDurationMinutes: 45,
    goal: 'grammar-reinforcement',
    lessonType: 'skill-builder',
    takeoff: 'grammar-check-in',
    landing: 'grammar-proof',
    moduleSequence: [
      { slotType: 'practice', key: 'error-hunter' },
      { slotType: 'practice', key: 'grammar-boss' },
    ],
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
      { slotType: 'presentation', key: 'quick-pulse' },
      { slotType: 'production', key: 'scenario-simulator' },
      { slotType: 'practice', key: 'dialogue-detective' },
    ],
  },
  {
    id: 'debate-ready-60',
    name: 'Debate Ready',
    description: 'Opinion formation, structured argument, vote-and-discuss',
    lessonDurationMinutes: 60,
    goal: 'discussion-debate',
    lessonType: 'inquisitive',
    landing: 'opinion-shift',
    moduleSequence: [
      { slotType: 'presentation', key: 'prediction-round' },
      { slotType: 'production', key: 'hot-take-arena' },
      { slotType: 'practice', key: 'connections' },
    ],
  },
  {
    id: 'vocab-blitz-45',
    name: 'Vocab Blitz',
    description: 'Vocabulary-first with game-based reinforcement',
    lessonDurationMinutes: 45,
    goal: 'vocabulary-building',
    lessonType: 'skill-builder',
    takeoff: 'vocab-radar',
    landing: 'final-answer',
    moduleSequence: [
      { slotType: 'presentation', key: 'synonym-showdown' },
      { slotType: 'practice', key: 'vocab-sprint' },
    ],
  },
  {
    id: 'game-day-60',
    name: 'Game Day',
    description: 'Pure competitive fun — 5 back-to-back games, running scoreboard',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'game-day',
    scoringMode: 'competitive',
    skipTakeoffLanding: true,
    moduleSequence: [
      { slotType: 'practice', key: 'vocab-sprint' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'practice', key: 'grid-rush' },
      { slotType: 'practice', key: 'sentence-scramble' },
      { slotType: 'production', key: 'twenty-questions' },
    ],
  },
  {
    id: 'creative-sprint-60',
    name: 'Creative Sprint',
    description: 'Open-ended expression with story-driven production',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'quick-pulse' },
      { slotType: 'production', key: 'story-sprint' },
    ],
  },
  {
    id: 'think-tank-60',
    name: 'Think Tank',
    description: 'Deep critical thinking — evidence, logic, peer challenge',
    lessonDurationMinutes: 60,
    goal: 'critical-thinking',
    lessonType: 'inquisitive',
    landing: 'opinion-shift',
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'production', key: 'twenty-questions' },
    ],
  },
];
