import type { GamePlugin } from '../types';
import { StorySprintGame } from './game';

export const storySprintPlugin: GamePlugin = {
  key: 'story-sprint',
  name: 'Story Sprint',
  description: 'Collaborative storytelling. Add one sentence at a time and get AI feedback.',
  skills: ['Creative Writing', 'Grammar', 'Storytelling'],
  component: StorySprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};
