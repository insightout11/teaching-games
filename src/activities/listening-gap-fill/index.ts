import type { ActivityPlugin } from '../types';
import { ListeningGapFillActivity } from './activity';
import { Headphones } from 'lucide-react';

export const listeningGapFillPlugin: ActivityPlugin = {
  key: 'listening-gap-fill',
  name: 'Listening Gap Fill',
  description: 'Students type the missing word in 5–6 sentences — teacher reveals answers with a live accuracy breakdown',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Listening', 'Vocabulary'],
  component: ListeningGapFillActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 6,
  defaultTimerSeconds: 30,
  icon: Headphones,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};
