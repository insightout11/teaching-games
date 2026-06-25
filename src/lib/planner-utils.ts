import type { ComponentType } from 'react';
import { getActivity } from '@/activities/registry';
import { getGame } from '@/games/registry';
import type { ActivityCategory } from '@/activities/types';
import type { GameCategory } from '@/games/types';
import type { PlanModule } from './planner-compose';
import type { LessonSlot, CourseLessonPayload } from './course';
import type { Difficulty } from './difficulty';
import type { GoalTag } from './flight-plan-config';
import type { ScoringMode } from '@/stores/session-store';
import type { GrammarTarget } from './grammar';
import type { SourceMaterial } from '@/types/source-material';

// Pure selection/sequencing logic lives in planner-compose (no registry imports,
// cheap to test). Re-exported here so existing import sites stay unchanged.
export {
  isUndeterminedModule,
  moduleCountForDuration,
  pickNearestPreset,
  composeLesson,
  suggestModules,
  type PlanModule,
  type ComposeIntent,
  type ComposerLevel,
} from './planner-compose';

export interface ModuleDisplayInfo {
  name: string;
  type: 'activity' | 'game';
  description: string;
  category: ActivityCategory | GameCategory;
  icon: ComponentType<{ className?: string }>;
}

/**
 * Build launchable LessonSlot[] from composed modules — the single source of truth for the
 * module→slot mapping, shared by the planner (launchLesson) and Course Builder so they can't drift.
 */
export function buildLessonSlots(modules: PlanModule[]): LessonSlot[] {
  return modules.map((m) => {
    const meta = {
      ...(m.stageId ? { stageId: m.stageId } : {}),
      ...(m.stageLabel ? { stageLabel: m.stageLabel } : {}),
      ...(m.isMicroEvent ? { isMicroEvent: true } : {}),
      ...(m.pool ? { pool: m.pool } : {}),
    };
    const activity = getActivity(m.key);
    if (activity) {
      return { type: 'activity' as const, key: m.key, name: activity.name, category: activity.category, ...meta };
    }
    const game = getGame(m.key);
    if (game) {
      return { type: 'game' as const, key: m.key, name: game.name, category: game.category, ...meta };
    }
    return { type: 'activity' as const, key: m.key, name: m.key, ...meta };
  });
}

/** Assemble a Course Builder lesson payload (the launchLesson shape, minus world-flight/ephemeral). */
export function buildCourseLessonPayload(
  settings: {
    topic: string;
    difficulty: Difficulty;
    goal?: GoalTag;
    durationMinutes?: 30 | 45 | 60 | 90;
    scoringMode?: ScoringMode;
    grammarTarget?: GrammarTarget | null;
    sourceMaterial?: SourceMaterial;
  },
  modules: PlanModule[],
): CourseLessonPayload {
  const hasMissionSelector = modules.some((m) => m.key === 'mission-selector');
  return {
    customTopic: settings.topic,
    difficulty: settings.difficulty,
    ...(settings.goal ? { goal: settings.goal } : {}),
    ...(settings.durationMinutes ? { lessonDurationMinutes: settings.durationMinutes } : {}),
    ...(settings.scoringMode ? { scoringMode: settings.scoringMode } : {}),
    ...(hasMissionSelector ? { isMissionBased: true } : {}),
    ...(settings.grammarTarget ? { grammarTarget: settings.grammarTarget } : {}),
    ...(settings.sourceMaterial ? { sourceMaterial: settings.sourceMaterial } : {}),
    slots: buildLessonSlots(modules),
    generatedContent: {},
    generatedGameContent: {},
  };
}

export function getModuleDisplayInfo(key: string): ModuleDisplayInfo | null {
  const activity = getActivity(key);
  if (activity) {
    return {
      name: activity.name,
      type: 'activity',
      description: activity.description,
      category: activity.category,
      icon: activity.icon,
    };
  }
  const game = getGame(key);
  if (game) {
    return {
      name: game.name,
      type: 'game',
      description: game.description,
      category: game.category,
      icon: game.icon,
    };
  }
  return null;
}
