import type { ActivityPlugin } from '../types';
import { PictureQuizActivity } from './activity';
import { Image } from 'lucide-react';

export const pictureQuizPlugin: ActivityPlugin = {
  key: 'picture-quiz',
  name: 'Picture Quiz',
  description: 'Junior classes: tap the right picture. Big picture tiles on phones, every question read aloud, class counts only.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Listening'],
  component: PictureQuizActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 8,
  defaultTimerSeconds: 30,
  icon: Image,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { PictureQuizActivity };
