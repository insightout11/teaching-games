import type { ActivityPlugin } from '../types';
import { HotTakeArenaActivity } from './activity';
import { Scale } from 'lucide-react';

export const hotTakeArenaPlugin: ActivityPlugin = {
  key: 'hot-take-arena',
  name: 'Hot Take Arena',
  description: 'Students debate a provocative statement. Smart devil\'s advocate challenges BOTH sides with counter-arguments.',
  category: 'debate',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Debate', 'Persuasion'],
  component: HotTakeArenaActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 90,
  icon: Scale,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { HotTakeArenaActivity };
export * from './types';
