import type { ComponentType } from 'react';
import type { ActivityPlugin, ActivityCategory } from './types';
import { wouldYouRatherPlugin } from './would-you-rather';
import { hotTakeArenaPlugin } from './hot-take-arena';
import { twoTruthsPlugin } from './two-truths';
import { rankItPlugin } from './rank-it';
import { factDetectivePlugin } from './fact-detective';
import { expertPanelPlugin } from './expert-panel';
import { scenarioSimulatorPlugin } from './scenario-simulator';
// VAULTED: interviewLabPlugin (teacher transcription, AI latency, niche use case)
import { problemSolversPlugin } from './problem-solvers';
import { quickPulsePlugin } from './quick-pulse';
import { vocabRadarPlugin } from './vocab-radar';
import { predictionRoundPlugin } from './prediction-round';
import { sceneIgniterPlugin } from './scene-igniter';
import { finalAnswerPlugin } from './final-answer';
import { micDropPlugin } from './mic-drop';
import { lightningRoundPlugin } from './lightning-round';
import { missionSelectorPlugin } from './mission-selector';
import { opinionShiftPlugin } from './opinion-shift';
import { Sparkles, BookOpen, Users, Scale, Flag } from 'lucide-react';

// All registered activities
const activities: ActivityPlugin[] = [
  // Icebreakers / Mission
  missionSelectorPlugin,
  quickPulsePlugin,
  vocabRadarPlugin,
  predictionRoundPlugin,
  sceneIgniterPlugin,
  wouldYouRatherPlugin,
  twoTruthsPlugin,
  rankItPlugin,
  // Learning modules
  factDetectivePlugin,
  expertPanelPlugin,
  // Practice activities
  scenarioSimulatorPlugin,
  // VAULTED: interviewLabPlugin
  problemSolversPlugin,
  // Debates
  hotTakeArenaPlugin,
  // Closing activities
  finalAnswerPlugin,
  opinionShiftPlugin,
  micDropPlugin,
  lightningRoundPlugin,
];

/**
 * Get an activity by its key
 */
export function getActivity(key: string): ActivityPlugin | undefined {
  return activities.find((a) => a.key === key);
}

/**
 * Get all registered activities
 */
export function getAllActivities(): ActivityPlugin[] {
  return activities;
}

/**
 * Get activities filtered by category
 */
export function getActivitiesByCategory(category: ActivityCategory): ActivityPlugin[] {
  return activities.filter((a) => a.category === category);
}

/**
 * Get activities grouped by category
 */
export function getActivitiesGrouped(): Record<ActivityCategory, ActivityPlugin[]> {
  return {
    icebreaker: getActivitiesByCategory('icebreaker'),
    learning: getActivitiesByCategory('learning'),
    practice: getActivitiesByCategory('practice'),
    debate: getActivitiesByCategory('debate'),
    closing: getActivitiesByCategory('closing'),
  };
}

/**
 * Category display names, descriptions, icons, and colors
 */
export const CATEGORY_INFO: Record<ActivityCategory, {
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}> = {
  icebreaker: {
    name: 'Icebreakers',
    description: 'Warm-up activities to get students talking',
    icon: Sparkles,
    color: 'text-amber-400',
  },
  learning: {
    name: 'Learning Modules',
    description: 'Teach new concepts and vocabulary',
    icon: BookOpen,
    color: 'text-emerald-400',
  },
  practice: {
    name: 'Practice Activities',
    description: 'Apply skills through discussion and roleplay',
    icon: Users,
    color: 'text-sky-400',
  },
  debate: {
    name: 'Debates',
    description: 'Structured argumentation and critical thinking',
    icon: Scale,
    color: 'text-rose-400',
  },
  closing: {
    name: 'Closing Activities',
    description: 'Land the lesson — consolidate learning and give every student a final voice',
    icon: Flag,
    color: 'text-teal-400',
  },
};
