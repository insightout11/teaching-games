import { ConciergeBell } from 'lucide-react';
import { TripHotelActivity } from '../trip-hotel/activity';
import type { ActivityPlugin } from '../types';

// Travel-arc Hotel stop. Since Travel v2 it runs on the line-by-line PerformedExchange engine
// (like Arrival / Getting There / Local Table), with a Take 2 problem card. Content is data-seeded
// (buildTripHotelContent), injected at launch via the trip pack.
export const tripHotelPlugin: ActivityPlugin = {
  key: 'trip-hotel',
  name: 'Hotel Check-In',
  description: 'Check in at the front desk line by line, then handle a problem in your own words.',
  icon: ConciergeBell,
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Role-play', 'Listening'],
  component: TripHotelActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  // Only meaningful inside the Travel arc.
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  // Adapts to class size (receptionist + guests); works solo (teacher is the receptionist).
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: true,
};
