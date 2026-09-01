import type { ActivityPlugin } from '../types';
import { CargoHoldActivity } from './activity';
import { Luggage } from 'lucide-react';

export const cargoHoldPlugin: ActivityPlugin = {
  key: 'cargo-hold',
  name: 'Cargo Hold',
  description:
    'Build the funniest grammatically correct sentence from a persistent private hand of lesson vocabulary.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Speaking', 'Listening', 'Creativity'],
  component: CargoHoldActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 16,
  defaultTimerSeconds: 30,
  icon: Luggage,
  flightPlanOnly: false,
  scoringProfile: {
    displayMode: 'competitive',
    supportsOnTask: true,
    supportsStandout: true,
    tracksAccuracy: true,
    defaultOutcome: 'genuine',
  },
  // The mechanic needs an audience: anonymous reveal, a non-author reader, and a class
  // vote all break down below three students.
  minStudents: 3,
  maxStudents: 12,
  idealStudents: { min: 4, max: 10 },
  deviceFree: false,
};

export { CargoHoldActivity };
