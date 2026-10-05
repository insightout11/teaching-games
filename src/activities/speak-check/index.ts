import { MessageCircle } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { SpeakCheckActivity } from './activity';

// Speak v2 takeoff: the situation check (Try 1). Pairs with speak-reveal at landing.
export const speakCheckPlugin: ActivityPlugin = {
  key: 'speak-check',
  name: 'Situation Check',
  description: 'One real situation: which reply would you use, how confident are you, could you do it? Try 1 of the lesson.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Speaking'],
  component: SpeakCheckActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 2,
  defaultTimerSeconds: 0,
  icon: MessageCircle,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { SpeakCheckActivity };
