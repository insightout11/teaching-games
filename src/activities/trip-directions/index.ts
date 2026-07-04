import type { ActivityPlugin } from '../types';
import { TripDirectionsActivity } from './activity';
import { Compass } from 'lucide-react';

export const tripDirectionsPlugin: ActivityPlugin = {
  key: 'trip-directions',
  name: 'Find Your Way',
  description: 'A real city street map — one student guides, the class follows the directions and drops a pin.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Speaking', 'Listening', 'Role-play'],
  component: TripDirectionsActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  icon: Compass,
  // Only meaningful inside the Travel arc (needs the city's real landmark coordinates).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: true, tracksAccuracy: false, defaultOutcome: 'genuine' },
  // Guide + navigators, all on devices — the guide is always a student (their device shows
  // the destination secretly), so this genuinely needs 2+ connected students.
  minStudents: 2,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { TripDirectionsActivity };
export { buildTripDirectionsContent } from './content';
