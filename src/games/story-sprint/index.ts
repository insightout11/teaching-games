import type { GamePlugin } from '../types';
import { StorySprintGame } from './game';
import { PenLine } from 'lucide-react';

export const storySprintPlugin: GamePlugin = {
  key: 'story-sprint',
  name: 'Story Sprint',
  description: 'Collaborative storytelling. Add one sentence at a time and get AI feedback.',
  category: 'grammar-writing',
  icon: PenLine,
  skills: ['Creative Writing', 'Grammar', 'Storytelling'],
  component: StorySprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 60,
};
