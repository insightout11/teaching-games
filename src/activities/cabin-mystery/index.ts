import type { ActivityPlugin } from '../types';
import { CabinMysteryActivity } from './activity';
import { Plane } from 'lucide-react';

export const cabinMysteryPlugin: ActivityPlugin = {
  key: 'cabin-mystery',
  name: 'Cabin Mystery',
  description:
    'A mystery unfolds at 35,000ft. Students receive private role cards and work together to solve the case.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Listening', 'Question Formation', 'Role-play'],
  component: CabinMysteryActivity,
  supportsCustomTopic: false, // V1: static case only; generator comes later
  estimatedMinutes: 50,
  defaultTimerSeconds: 0,
  icon: Plane,
  flightPlanOnly: true, // hidden from public browse until launch-ready
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: true,
    supportsStandout: false,
    tracksAccuracy: false,
    defaultOutcome: 'on-task',
  },
};

export { CabinMysteryActivity };
