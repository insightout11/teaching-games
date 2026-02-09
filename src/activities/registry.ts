import type { ActivityPlugin, ActivityCategory } from './types';
import { wouldYouRatherPlugin } from './would-you-rather';
import { hotTakeArenaPlugin } from './hot-take-arena';
import { twoTruthsPlugin } from './two-truths';
import { rankItPlugin } from './rank-it';
import { factDetectivePlugin } from './fact-detective';
import { expertPanelPlugin } from './expert-panel';
import { scenarioSimulatorPlugin } from './scenario-simulator';
import { interviewLabPlugin } from './interview-lab';
import { problemSolversPlugin } from './problem-solvers';

// All registered activities
const activities: ActivityPlugin[] = [
  // Icebreakers
  wouldYouRatherPlugin,
  twoTruthsPlugin,
  rankItPlugin,
  // Learning modules
  factDetectivePlugin,
  expertPanelPlugin,
  // Practice activities
  scenarioSimulatorPlugin,
  interviewLabPlugin,
  problemSolversPlugin,
  // Debates
  hotTakeArenaPlugin,
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
  };
}

/**
 * Category display names and descriptions
 */
export const CATEGORY_INFO: Record<ActivityCategory, { name: string; description: string }> = {
  icebreaker: {
    name: 'Icebreakers',
    description: 'Warm-up activities to get students talking',
  },
  learning: {
    name: 'Learning Modules',
    description: 'Teach new concepts and vocabulary',
  },
  practice: {
    name: 'Practice Activities',
    description: 'Apply skills through discussion and roleplay',
  },
  debate: {
    name: 'Debates',
    description: 'Structured argumentation and critical thinking',
  },
};
