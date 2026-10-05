import { Headphones } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { ListenCheckActivity } from '../listen-check/activity';

// Listening flight landing (docs/listening-flight-concept.md). Needs a library clip with a listening pack.
export const finalListenPlugin: ActivityPlugin = {
  key: 'final-listen',
  name: 'Final Listen',
  description: 'The same clip again: the same questions plus a harder one, how much more the class caught, then the words on screen.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Listening'],
  component: ListenCheckActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: Headphones,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};
