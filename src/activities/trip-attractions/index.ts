import type { ActivityPlugin } from '../types';
import { TripAttractionsActivity } from './activity';
import { MapPin } from 'lucide-react';

export const tripAttractionsPlugin: ActivityPlugin = {
  key: 'trip-attractions',
  name: 'Out & About',
  description: 'Discuss and rank a city\'s real attractions on the board, then react to a travel moment',
  category: 'debate',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration'],
  component: TripAttractionsActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: MapPin,
  // Only meaningful inside the Travel arc (needs a destination's real attractions).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { TripAttractionsActivity };
export { buildTripAttractionsContent } from './content';
