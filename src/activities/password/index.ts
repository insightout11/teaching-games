import type { ActivityPlugin } from '../types';
import { PasswordActivity } from './activity';
import { KeyRound } from 'lucide-react';

export const passwordPlugin: ActivityPlugin = {
  key: 'password',
  name: 'Password',
  description: 'Your team knows the secret word — say it naturally in conversation without giving it away.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Critical Thinking'],
  component: PasswordActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 30,
  icon: KeyRound,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'team', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 4,
  idealStudents: { min: 6, max: null },
  deviceFree: false,
};

export { PasswordActivity };
