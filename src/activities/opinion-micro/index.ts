import { MessageSquare } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { OpinionMicroActivity } from './activity';

export const opinionMicroPlugin: ActivityPlugin = {
  key: 'opinion-micro',
  name: 'Opinion Pulse',
  description: 'One quick dilemma — students vote once, see the class split, discuss. Flight-plan micro-event; ends after a single round.',
  category: 'icebreaker',
  pppStage: 'practice',
  skills: ['Critical Thinking', 'Speaking'],
  component: OpinionMicroActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 0,
  icon: MessageSquare,
  flightPlanOnly: true,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: false,
    supportsStandout: false,
    tracksAccuracy: false,
    defaultOutcome: 'genuine',
  },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};
