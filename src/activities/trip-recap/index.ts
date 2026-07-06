import type { ActivityPlugin } from '../types';
import { TripRecapActivity } from './activity';
import { Plane } from 'lucide-react';

export const tripRecapPlugin: ActivityPlugin = {
  key: 'trip-recap',
  name: 'Trip Recap',
  description: 'The Travel arc\'s closing act: the class looks back over the journey they actually took — each stop and its real anchors — and every traveller shares a spoken highlight.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Speaking'],
  component: TripRecapActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 60,
  icon: Plane,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { TripRecapActivity };
