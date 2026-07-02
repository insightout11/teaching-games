import type { ActivityPlugin } from '../types';
import { RankItActivity } from './activity';
import { Sparkles } from 'lucide-react';

export const rankItPlugin: ActivityPlugin = {
  key: 'rank-it',
  name: 'Rank It!',
  description: 'Students rank items related to the topic, explain their reasoning, then topic-generated facts might change their minds.',
  category: 'icebreaker',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration'],
  component: RankItActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 60,
  icon: Sparkles,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { RankItActivity };
export * from './types';
