import type { ActivityPlugin } from '../types';
import { DraftingCompass } from 'lucide-react';
import { DesignStudioActivity } from './activity';

export const designStudioPlugin: ActivityPlugin = {
  key: 'design-studio',
  name: 'Design Studio',
  description: 'The class builds one shared design through contextual AI questions, discussion, and progressive votes.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration', 'Creativity'],
  component: DesignStudioActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 35,
  defaultTimerSeconds: 30,
  icon: DraftingCompass,
  flightPlanOnly: true,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: true,
    supportsStandout: false,
    tracksAccuracy: false,
    defaultOutcome: 'on-task',
  },
};

export { DesignStudioActivity };
export * from './types';
