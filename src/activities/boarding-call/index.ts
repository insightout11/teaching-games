import type { ActivityPlugin } from '../types';
import { BoardingCallActivity } from './activity';
import { PlaneTakeoff } from 'lucide-react';

export const boardingCallPlugin: ActivityPlugin = {
  key: 'boarding-call',
  name: 'Boarding Call',
  description: 'The Travel takeoff: the whole class is flying to one city together, so three quick spoken prompts about the trip ahead — what they’re packing, what they’re excited to see, one worry — warm everyone up before departure.',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Speaking'],
  component: BoardingCallActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 6,
  defaultTimerSeconds: 30,
  icon: PlaneTakeoff,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { BoardingCallActivity };
export { buildBoardingCallContent } from './content';
