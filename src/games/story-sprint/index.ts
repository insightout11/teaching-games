import type { GamePlugin } from '../types';
import { StorySprintGame } from './game';
import { PenLine } from 'lucide-react';

export const storySprintPlugin: GamePlugin = {
  key: 'story-sprint',
  name: 'Story Sprint',
  description: 'Collaborative storytelling. Add one sentence at a time and get smart feedback.',
  category: 'grammar-writing',
  pppStage: 'production',
  icon: PenLine,
  skills: ['Creative Writing', 'Grammar', 'Storytelling'],
  component: StorySprintGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 60,
  estimatedMinutes: 18,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  // Small-group sweet spot only — solo loses the collaborative "add a sentence" turn-taking,
  // and a full classroom means most students wait a long time between turns.
  idealStudents: { min: 2, max: 6 },
  deviceFree: true,
};
