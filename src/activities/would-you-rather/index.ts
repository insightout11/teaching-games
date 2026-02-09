import type { ActivityPlugin } from '../types';
import { WouldYouRatherActivity } from './activity';

export const wouldYouRatherPlugin: ActivityPlugin = {
  key: 'would-you-rather',
  name: 'Would You Rather?',
  description: 'AI generates topic-relevant dilemmas with no "right" answer. Students choose, explain why, and discuss differences.',
  category: 'icebreaker',
  skills: ['Speaking', 'Critical Thinking', 'Debate'],
  component: WouldYouRatherActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  icon: '🤔',
};

export { WouldYouRatherActivity };
export * from './types';
