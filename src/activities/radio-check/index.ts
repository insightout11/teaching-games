import type { ActivityPlugin } from '../types';
import { RadioCheckActivity } from './activity';
import { Radio } from 'lucide-react';

export const radioCheckPlugin: ActivityPlugin = {
  key: 'radio-check',
  name: 'Radio Check',
  description: 'Listening: hear a short clip from the video (or a spoken recording on the topic), answer one question on your phone, replay if needed, then hear the line that holds the answer.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Listening', 'Vocabulary'],
  component: RadioCheckActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: Radio,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { RadioCheckActivity };
