import type { ActivityPlugin } from '../types';
import { VocabRadarActivity } from './activity';
import { ScanSearch } from 'lucide-react';

export const vocabRadarPlugin: ActivityPlugin = {
  key: 'vocab-radar',
  name: 'Vocab Radar',
  description: 'Students rate familiarity with 5–6 key words — teacher sees an instant vocabulary map',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Vocabulary'],
  component: VocabRadarActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 20,
  icon: ScanSearch,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { VocabRadarActivity };
