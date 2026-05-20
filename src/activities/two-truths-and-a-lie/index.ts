import type { ActivityPlugin } from '../types';
import { TwoTruthsAndALieActivity } from './activity';
import { Users } from 'lucide-react';

export const twoTruthsAndALiePlugin: ActivityPlugin = {
  key: 'two-truths-and-a-lie',
  name: 'Two Truths & a Lie',
  description: 'Students write 3 sentences about themselves — 2 truths and 1 lie. The class votes on the lie, then the student reveals.',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Speaking', 'Critical Thinking', 'Listening'],
  component: TwoTruthsAndALieActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 15,
  defaultTimerSeconds: 30,
  icon: Users,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
};

export { TwoTruthsAndALieActivity };
export * from './types';
