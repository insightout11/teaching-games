import type { ActivityPlugin } from '../types';
import { TwoTruthsActivity } from './activity';
import { Sparkles } from 'lucide-react';

export const twoTruthsPlugin: ActivityPlugin = {
  key: 'two-truths',
  name: 'Two Truths & A Fabrication',
  description: 'AI generates 3 statements about the topic (2 true, 1 false). Students debate which is the fabrication before the reveal.',
  category: 'icebreaker',
  pppStage: 'practice',
  skills: ['Speaking', 'Critical Thinking', 'Listening'],
  component: TwoTruthsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 45,
  icon: Sparkles,
};

export { TwoTruthsActivity };
export * from './types';
