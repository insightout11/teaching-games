import { TrendingUp } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { SpeakRevealActivity } from './activity';

// Speak v2 landing: Try 3 of the situation, the Better answers reveal, then everyone says it.
// Self-seeded from the session store (the takeoff's situation), no content of its own.
export const speakRevealPlugin: ActivityPlugin = {
  key: 'speak-reveal',
  name: 'Better Answers',
  description: 'Back to the takeoff situation with new replies: see how the class changed, then everyone says it aloud.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking'],
  component: SpeakRevealActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 6,
  defaultTimerSeconds: 0,
  icon: TrendingUp,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { SpeakRevealActivity };
