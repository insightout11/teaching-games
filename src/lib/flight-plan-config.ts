// Flight Plan routing config — static metadata for generator slot-filling and sequencing.
// No runtime imports. Generator imports this file to make slot and goal decisions.

export type GoalTag =
  | 'speaking-fluency'
  | 'discussion-debate'
  | 'vocabulary-building'
  | 'grammar-reinforcement'
  | 'collaboration'
  | 'creativity'
  | 'critical-thinking'
  | 'confidence-building';

export type SlotType =
  | 'takeoff'
  | 'presentation'
  | 'practice'
  | 'production'
  | 'landing';

export type LevelFit = 'beginner' | 'intermediate' | 'advanced';

export type EnergyLevel = 'low' | 'medium' | 'high';

export type LoadLevel = 'low' | 'medium' | 'high';

export type InteractionModel =
  | 'simultaneous'
  | 'turn-based'
  | 'team-based'
  | 'role-based'
  | 'voting'
  | 'discussion'
  | 'performance'
  | 'submission';

export interface FlightPlanItem {
  key: string;
  slotFit: SlotType[];
  goalFit: GoalTag[];
  levelFit: LevelFit[];
  energy: EnergyLevel;
  interactionModel: InteractionModel[];
  speakingLoad: LoadLevel;
  writingLoad: LoadLevel;
  teacherControlLoad: LoadLevel;
  /** Keys this item should NOT directly follow (avoid back-to-back). */
  avoidAfter: string[];
  /** Keys that pair well immediately before or after this item. */
  strongWith: string[];
  /** Production activities that support mission context re-generation after Mission Selector. */
  missionAware?: boolean;
  /** Landing activities eligible for mission-based Flight Plan sessions. */
  missionLanding?: boolean;
}

export const FLIGHT_PLAN_ITEMS: FlightPlanItem[] = [
  // ─── GAMES ───────────────────────────────────────────────────────────────

  {
    key: 'vocab-sprint',
    slotFit: ['presentation', 'practice'],
    goalFit: ['vocabulary-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['simultaneous', 'turn-based'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['synonym-showdown', 'word-chain'],
    strongWith: ['vocab-radar', 'prediction-round'],
  },

  {
    key: 'synonym-showdown',
    slotFit: ['practice'],
    goalFit: ['vocabulary-building'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['simultaneous', 'turn-based'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['vocab-sprint', 'word-chain'],
    strongWith: ['vocab-radar'],
  },

  {
    key: 'word-chain',
    slotFit: ['practice'],
    goalFit: ['vocabulary-building', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['team-based', 'turn-based'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'medium',
    avoidAfter: ['vocab-sprint', 'synonym-showdown'],
    strongWith: ['vocab-sprint', 'connections'],
  },

  {
    key: 'grid-rush',
    slotFit: ['practice'],
    goalFit: ['vocabulary-building', 'collaboration'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['team-based', 'simultaneous'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['word-chain', 'connections'],
    strongWith: ['vocab-sprint', 'vocab-radar'],
  },

  {
    key: 'sentence-scramble',
    slotFit: ['practice'],
    goalFit: ['grammar-reinforcement'],
    levelFit: ['beginner', 'intermediate'],
    energy: 'medium',
    interactionModel: ['turn-based', 'simultaneous'],
    speakingLoad: 'low',
    writingLoad: 'high',
    teacherControlLoad: 'low',
    avoidAfter: ['grammar-boss', 'error-hunter'],
    strongWith: ['grammar-boss'],
  },

  {
    key: 'grammar-boss',
    slotFit: ['practice'],
    goalFit: ['grammar-reinforcement'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['turn-based', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'high',
    teacherControlLoad: 'medium',
    avoidAfter: ['sentence-scramble', 'error-hunter'],
    strongWith: ['sentence-scramble', 'error-hunter'],
  },

  {
    key: 'error-hunter',
    slotFit: ['practice'],
    goalFit: ['grammar-reinforcement', 'critical-thinking'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['simultaneous', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['grammar-boss', 'sentence-scramble'],
    strongWith: ['grammar-boss'],
  },

  {
    key: 'story-sprint',
    slotFit: ['production'],
    goalFit: ['creativity', 'grammar-reinforcement', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['turn-based', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'high',
    teacherControlLoad: 'medium',
    avoidAfter: ['twenty-questions'],
    strongWith: ['grammar-boss', 'sentence-scramble'],
  },

  {
    key: 'dialogue-detective',
    slotFit: ['practice', 'production'],
    goalFit: ['grammar-reinforcement', 'speaking-fluency', 'critical-thinking'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['turn-based', 'submission'],
    speakingLoad: 'medium',
    writingLoad: 'medium',
    teacherControlLoad: 'medium',
    avoidAfter: ['story-sprint'],
    strongWith: ['expert-panel', 'scenario-simulator'],
  },

  {
    key: 'connections',
    slotFit: ['practice'],
    goalFit: ['vocabulary-building', 'critical-thinking', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['team-based', 'submission'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['grid-rush', 'word-chain'],
    strongWith: ['vocab-sprint', 'vocab-radar'],
  },

  {
    key: 'twenty-questions',
    slotFit: ['production', 'landing'],
    goalFit: ['speaking-fluency', 'critical-thinking', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['role-based', 'discussion'],
    speakingLoad: 'high',
    writingLoad: 'low',
    teacherControlLoad: 'high',
    avoidAfter: ['expert-panel', 'scenario-simulator'],
    strongWith: ['vocab-sprint', 'connections'],
  },

  // ─── ACTIVITIES ──────────────────────────────────────────────────────────

  {
    key: 'quick-pulse',
    slotFit: ['takeoff', 'landing'],
    goalFit: ['confidence-building', 'discussion-debate'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['voting'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['prediction-round', 'would-you-rather', 'vocab-radar'],
    strongWith: [],
  },

  {
    key: 'vocab-radar',
    slotFit: ['takeoff', 'presentation'],
    goalFit: ['vocabulary-building', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['voting'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['quick-pulse', 'prediction-round'],
    strongWith: ['vocab-sprint', 'synonym-showdown', 'connections'],
  },

  {
    key: 'prediction-round',
    slotFit: ['takeoff', 'presentation'],
    goalFit: ['critical-thinking', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['voting'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['quick-pulse', 'vocab-radar'],
    strongWith: ['fact-detective', 'two-truths'],
  },

  {
    key: 'scene-igniter',
    slotFit: ['takeoff', 'production'],
    goalFit: ['speaking-fluency', 'creativity', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['performance', 'role-based'],
    speakingLoad: 'high',
    writingLoad: 'low',
    teacherControlLoad: 'medium',
    avoidAfter: ['expert-panel', 'scenario-simulator'],
    strongWith: ['would-you-rather', 'hot-take-arena'],
  },

  {
    key: 'would-you-rather',
    slotFit: ['takeoff', 'landing'],
    goalFit: ['speaking-fluency', 'discussion-debate', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['voting', 'discussion'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['hot-take-arena', 'rank-it'],
    strongWith: ['quick-pulse', 'scene-igniter'],
    missionAware: true,
  },

  {
    key: 'two-truths',
    slotFit: ['takeoff', 'practice'],
    goalFit: ['speaking-fluency', 'critical-thinking', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['voting', 'discussion'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['fact-detective'],
    strongWith: ['quick-pulse', 'prediction-round'],
  },

  {
    key: 'rank-it',
    slotFit: ['practice', 'landing'],
    goalFit: ['discussion-debate', 'critical-thinking', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['voting', 'discussion', 'submission'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'medium',
    avoidAfter: ['would-you-rather', 'hot-take-arena'],
    strongWith: ['fact-detective', 'expert-panel'],
  },

  {
    key: 'fact-detective',
    slotFit: ['presentation', 'practice'],
    goalFit: ['critical-thinking', 'vocabulary-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['simultaneous', 'voting'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: ['two-truths', 'prediction-round'],
    strongWith: ['vocab-radar', 'prediction-round', 'rank-it'],
  },

  {
    key: 'expert-panel',
    slotFit: ['production'],
    goalFit: ['speaking-fluency', 'collaboration', 'confidence-building'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['role-based', 'discussion'],
    speakingLoad: 'high',
    writingLoad: 'low',
    teacherControlLoad: 'high',
    avoidAfter: ['twenty-questions', 'scenario-simulator'],
    strongWith: ['vocab-sprint', 'dialogue-detective'],
    missionAware: true,
  },

  {
    key: 'scenario-simulator',
    slotFit: ['practice', 'production'],
    goalFit: ['discussion-debate', 'critical-thinking', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['voting', 'discussion'],
    speakingLoad: 'medium',
    writingLoad: 'low',
    teacherControlLoad: 'medium',
    avoidAfter: ['hot-take-arena', 'expert-panel'],
    strongWith: ['rank-it', 'problem-solvers'],
    missionAware: true,
  },

  {
    key: 'problem-solvers',
    slotFit: ['production'],
    goalFit: ['critical-thinking', 'creativity', 'collaboration'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['submission', 'discussion'],
    speakingLoad: 'medium',
    writingLoad: 'high',
    teacherControlLoad: 'medium',
    avoidAfter: ['story-sprint'],
    strongWith: ['scenario-simulator', 'expert-panel', 'rank-it'],
  },

  {
    key: 'hot-take-arena',
    slotFit: ['production', 'landing'],
    goalFit: ['discussion-debate', 'speaking-fluency', 'critical-thinking'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['voting', 'discussion'],
    speakingLoad: 'high',
    writingLoad: 'low',
    teacherControlLoad: 'medium',
    avoidAfter: ['rank-it', 'would-you-rather', 'scenario-simulator'],
    strongWith: ['would-you-rather', 'fact-detective'],
    missionAware: true,
  },

  {
    key: 'final-answer',
    slotFit: ['landing'],
    goalFit: ['speaking-fluency', 'vocabulary-building', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['simultaneous', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['mic-drop', 'lightning-round'],
    strongWith: ['vocab-radar', 'vocab-sprint', 'grammar-boss'],
    missionLanding: true,
  },

  {
    key: 'mic-drop',
    slotFit: ['landing'],
    goalFit: ['creativity', 'speaking-fluency', 'confidence-building'],
    levelFit: ['intermediate', 'advanced'],
    energy: 'medium',
    interactionModel: ['simultaneous', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['final-answer', 'lightning-round'],
    strongWith: ['hot-take-arena', 'would-you-rather', 'story-sprint'],
  },

  {
    key: 'lightning-round',
    slotFit: ['landing'],
    goalFit: ['vocabulary-building', 'critical-thinking', 'confidence-building'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'high',
    interactionModel: ['simultaneous', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'medium',
    avoidAfter: ['final-answer', 'mic-drop'],
    strongWith: ['vocab-sprint', 'synonym-showdown', 'quick-pulse'],
  },

  {
    key: 'mission-selector',
    slotFit: ['takeoff'],
    goalFit: ['speaking-fluency', 'discussion-debate', 'confidence-building', 'critical-thinking'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['voting'],
    speakingLoad: 'low',
    writingLoad: 'low',
    teacherControlLoad: 'low',
    avoidAfter: [],
    strongWith: ['final-answer', 'opinion-shift'],
  },

  {
    key: 'opinion-shift',
    slotFit: ['landing'],
    goalFit: ['speaking-fluency', 'confidence-building', 'critical-thinking'],
    levelFit: ['beginner', 'intermediate', 'advanced'],
    energy: 'low',
    interactionModel: ['simultaneous', 'submission'],
    speakingLoad: 'low',
    writingLoad: 'medium',
    teacherControlLoad: 'low',
    avoidAfter: ['final-answer'],
    strongWith: ['mission-selector'],
    missionLanding: true,
  },
];

/** Lookup a single item's config by key. Returns undefined if not found. */
export function getFlightPlanItem(key: string): FlightPlanItem | undefined {
  return FLIGHT_PLAN_ITEMS.find((item) => item.key === key);
}

export const GOAL_LABELS: Record<GoalTag, string> = {
  'speaking-fluency': 'Speaking Fluency',
  'discussion-debate': 'Discussion & Debate',
  'vocabulary-building': 'Vocabulary Building',
  'grammar-reinforcement': 'Grammar Reinforcement',
  'collaboration': 'Collaboration',
  'creativity': 'Creativity',
  'critical-thinking': 'Critical Thinking',
  'confidence-building': 'Confidence Building',
};
