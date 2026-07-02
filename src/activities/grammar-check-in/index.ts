import type { ActivityPlugin } from '../types';
import { GrammarCheckInActivity } from './activity';
import { ClipboardCheck } from 'lucide-react';

export const grammarCheckInPlugin: ActivityPlugin = {
  key: 'grammar-check-in',
  name: 'Grammar Check-In',
  description: 'Students rate 3 sentences to reveal where grammar confidence is weakest — teacher sees heat map and sets the lesson target',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Critical Thinking'],
  component: GrammarCheckInActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 30,
  icon: ClipboardCheck,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { GrammarCheckInActivity };
