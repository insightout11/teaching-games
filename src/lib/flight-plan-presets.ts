import type { ScoringMode } from '@/stores/session-store';
import type { GoalTag, SlotType } from './flight-plan-config';

export interface FlightPlanPreset {
  id: string;
  name: string;
  description: string;
  lessonDurationMinutes: 30 | 45 | 60 | 90;
  goal: GoalTag;
  /** Explicit scoring mode override — skips goal-derived default when set. */
  scoringMode?: ScoringMode;
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
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'practice', key: 'grammar-boss' },
    ],
  },
  {
    id: 'speaking-circle-60',
    name: 'Speaking Circle',
    description: 'High speaking load, confidence-building sequence',
    lessonDurationMinutes: 60,
    goal: 'speaking-fluency',
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
    moduleSequence: [
      { slotType: 'presentation', key: 'vocab-radar' },
      { slotType: 'practice', key: 'vocab-sprint' },
    ],
  },
  {
    id: 'game-day-45',
    name: 'Game Day',
    description: 'Pure competitive fun — fastest fingers, highest scores',
    lessonDurationMinutes: 45,
    goal: 'creativity',
    scoringMode: 'competitive',
    moduleSequence: [
      { slotType: 'presentation', key: 'prediction-round' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'practice', key: 'sentence-scramble' },
    ],
  },
  {
    id: 'creative-sprint-60',
    name: 'Creative Sprint',
    description: 'Open-ended expression with story-driven production',
    lessonDurationMinutes: 60,
    goal: 'creativity',
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
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'production', key: 'twenty-questions' },
    ],
  },
];
