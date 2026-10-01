import type { ActivityPlugin } from '../types';
import { FlightVerdictActivity } from './activity';
import { BookMarked } from 'lucide-react';

export const flightVerdictPlugin: ActivityPlugin = {
  key: 'flight-verdict',
  name: 'The Verdict',
  description: "Captain's Flight landing: the Flight Question returns. See how the class's thinking shifted, check predictions against the source, say a Final Word each, and save the flight log.",
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking'],
  component: FlightVerdictActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: BookMarked,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { FlightVerdictActivity };
