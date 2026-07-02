import type { ActivityPlugin } from '../types';
import { TeamDebateActivity } from './activity';
import { Scale } from 'lucide-react';

export const teamDebatePlugin: ActivityPlugin = {
  key: 'team-debate',
  name: 'Team Debate',
  description: 'Two teams argue a motion through Opening, Rebuttal, and Closing turns — structured, timed, role-based.',
  category: 'debate',
  pppStage: 'production',
  skills: ['Debate', 'Persuasion', 'Speaking', 'Critical Thinking'],
  component: TeamDebateActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 25,
  defaultTimerSeconds: 90,
  icon: Scale,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 2,
  idealStudents: { min: 4, max: null },
  deviceFree: false,
};

export { TeamDebateActivity };
