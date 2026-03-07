import type { GoalTag, SlotType } from './flight-plan-config';

export interface FlightPlanPreset {
  id: string;
  name: string;
  description: string;
  lessonDurationMinutes: 30 | 45 | 60 | 90;
  goal: GoalTag;
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
];
