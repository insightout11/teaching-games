import type { ActivityPlugin } from '../types';
import { QuickPulseActivity } from './activity';
import { Zap } from 'lucide-react';

export const quickPulsePlugin: ActivityPlugin = {
  key: 'quick-pulse',
  name: 'Quick Pulse',
  description: 'Fast simultaneous icebreaker — 3 mini-prompts, instant distribution reveal',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: [],
  component: QuickPulseActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 30,
  icon: Zap,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { QuickPulseActivity };
