import type { ActivityPlugin } from '../types';
import { TripMealActivity } from './activity';
import { UtensilsCrossed } from 'lucide-react';

export const tripMealPlugin: ActivityPlugin = {
  key: 'trip-meal',
  name: 'Local Table',
  description: 'Pick a real local dish from the menu, learn what it is, then order it.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Vocabulary', 'Role-play'],
  component: TripMealActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  icon: UtensilsCrossed,
  // Only meaningful inside the Travel arc (needs the city's real dishes).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  // Students pick a dish on their device; works with any class size (even solo).
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { TripMealActivity };
export { buildTripMealContent } from './content';
