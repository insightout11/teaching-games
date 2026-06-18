import { Radio } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { VocabMicroActivity } from './activity';

export const vocabMicroPlugin: ActivityPlugin = {
  key: 'vocab-micro',
  name: 'Comms Check',
  description: 'One quick "which word fits?" gap — students vote, teacher reveals the word and its meaning. Flight-plan micro-event; ends after a single round.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary'],
  component: VocabMicroActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 0,
  icon: Radio,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
};

export { VocabMicroActivity };
