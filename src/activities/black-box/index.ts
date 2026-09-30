import type { ActivityPlugin } from '../types';
import { BlackBoxActivity } from './activity';
import { Box } from 'lucide-react';

export const blackBoxPlugin: ActivityPlugin = {
  key: 'black-box',
  name: 'Black Box',
  description: 'Listening: a short recording is played with key words hidden. Students tap every word they heard (some were never said), the class rebuilds the recording, talks about the gaps, then opens the box.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Listening', 'Vocabulary'],
  component: BlackBoxActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: Box,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { BlackBoxActivity };
