import type { ComponentType } from 'react';
import { getActivity } from '@/activities/registry';
import { getGame } from '@/games/registry';
import type { ActivityCategory } from '@/activities/types';
import type { GameCategory } from '@/games/types';

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
