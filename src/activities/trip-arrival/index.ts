import type { ActivityPlugin } from '../types';
import { TripArrivalActivity } from './activity';
import { PlaneLanding } from 'lucide-react';

export const tripArrivalPlugin: ActivityPlugin = {
  key: 'trip-arrival',
  name: 'Arrival',
  description: 'Go through immigration — one officer, the travellers present, sized to your class.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Role-play', 'Listening'],
  component: TripArrivalActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: PlaneLanding,
  // Only meaningful inside the Travel arc.
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  // Adapts to class size (officer + travellers); works even solo (teacher is the officer).
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: true,
};

export { TripArrivalActivity };
export { buildTripArrivalContent } from './content';
