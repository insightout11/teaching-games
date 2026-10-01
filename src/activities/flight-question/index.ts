import type { ActivityPlugin } from '../types';
import { FlightQuestionActivity } from './activity';
import { Compass } from 'lucide-react';

export const flightQuestionPlugin: ActivityPlugin = {
  key: 'flight-question',
  name: 'Flight Question',
  description: "Captain's Flight takeoff: one big question the lesson investigates. Students take a stance and predict what the source will say; both pay off later in the flight.",
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Critical Thinking', 'Speaking'],
  component: FlightQuestionActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 0,
  icon: Compass,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { FlightQuestionActivity };
