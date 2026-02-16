import type { ActivityPlugin } from '../types';
import { HotTakeArenaActivity } from './activity';
import { Scale } from 'lucide-react';

export const hotTakeArenaPlugin: ActivityPlugin = {
  key: 'hot-take-arena',
  name: 'Hot Take Arena',
  description: 'Students debate a provocative statement. AI plays devil\'s advocate, challenging BOTH sides with counter-arguments.',
  category: 'debate',
  skills: ['Speaking', 'Critical Thinking', 'Debate', 'Persuasion'],
  component: HotTakeArenaActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 90,
  icon: Scale,
};

export { HotTakeArenaActivity };
export * from './types';
