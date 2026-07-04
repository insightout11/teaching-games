import type { ActivityPlugin } from '../types';
import { TripGettingThereActivity } from './activity';
import { TramFront } from 'lucide-react';

export const tripGettingTherePlugin: ActivityPlugin = {
  key: 'trip-getting-there',
  name: 'Getting There',
  description: "Compare the city's real ways in from the airport, pick one, then buy the ticket or direct the driver.",
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Vocabulary', 'Role-play'],
  component: TripGettingThereActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: TramFront,
  // Only meaningful inside the Travel arc (needs the city's real transport options).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  // Students pick on their device; works with any class size (even solo).
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { TripGettingThereActivity };
export { buildTripGettingThereContent } from './content';
