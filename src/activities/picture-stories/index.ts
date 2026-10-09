import type { ActivityPlugin } from '../types';
import { PictureStoriesActivity } from './activity';
import { BookImage } from 'lucide-react';

export const pictureStoriesPlugin: ActivityPlugin = {
  key: 'picture-stories',
  name: 'Picture Stories',
  description: 'Junior classes: a short story told with pictures, one page at a time, read aloud. Then picture questions on the phones.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Listening', 'Vocabulary'],
  component: PictureStoriesActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 30,
  icon: BookImage,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { PictureStoriesActivity };
