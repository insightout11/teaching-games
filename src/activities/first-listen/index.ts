import { Headphones } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { ListenCheckActivity } from '../listen-check/activity';

// Listening flight takeoff (docs/listening-flight-concept.md). Needs a library clip with a listening pack.
export const firstListenPlugin: ActivityPlugin = {
  key: 'first-listen',
  name: 'First Listen',
  description: 'The class hears the clip once and answers big-picture questions: the before of the Listening flight.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Listening'],
  component: ListenCheckActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 4,
  defaultTimerSeconds: 0,
  icon: Headphones,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};
