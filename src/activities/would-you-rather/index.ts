import type { ActivityPlugin } from '../types';
import { WouldYouRatherActivity } from './activity';
import { Sparkles } from 'lucide-react';

export const wouldYouRatherPlugin: ActivityPlugin = {
  key: 'would-you-rather',
  name: 'Would You Rather?',
  description: 'topic-generated dilemmas with no "right" answer. Students choose, explain why, and discuss differences.',
  category: 'icebreaker',
  pppStage: 'practice',
  skills: ['Speaking', 'Critical Thinking', 'Debate'],
  component: WouldYouRatherActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 60,
  icon: Sparkles,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { WouldYouRatherActivity };
export * from './types';
