import type { ActivityPlugin } from '../types';
import { QuickPulseActivity } from './activity';
import { Zap } from 'lucide-react';

export const quickPulsePlugin: ActivityPlugin = {
  key: 'quick-pulse',
  name: 'Quick Pulse',
  description: 'A fast, simultaneous icebreaker with three mini-prompts and an instant class response view.',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: [],
  component: QuickPulseActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 30,
  icon: Zap,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { QuickPulseActivity };
