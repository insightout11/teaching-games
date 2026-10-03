import { Map as MapIcon } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { TripPlanActivity } from './activity';

export const tripPlanPlugin: ActivityPlugin = {
  key: 'trip-plan',
  name: 'Plan the Day',
  description: 'Shortlist the trip stops, the class votes, and the top 3 stay in the trip.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Speaking'],
  component: TripPlanActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 3,
  defaultTimerSeconds: 0,
  icon: MapIcon,
  // Only meaningful inside the Travel arc.
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { TripPlanActivity };
