import type { ActivityPlugin } from '../types';
import { RankItActivity } from './activity';

export const rankItPlugin: ActivityPlugin = {
  key: 'rank-it',
  name: 'Rank It!',
  description: 'Students rank items related to the topic, explain their reasoning, then AI reveals facts that might change their minds.',
  category: 'icebreaker',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration'],
  component: RankItActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  icon: '📊',
};

export { RankItActivity };
export * from './types';
