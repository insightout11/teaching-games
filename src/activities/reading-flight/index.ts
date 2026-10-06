import { BookOpen, BookCheck } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { StoryPredictActivity, StoryRecapActivity } from './activity';

// Reading flight takeoff + landing (docs/reading-flight-concept.md). Need a book lesson (library book course).
const base = {
  category: 'learning' as const,
  supportsCustomTopic: false,
  defaultTimerSeconds: 0,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class' as const, supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export const storyPredictPlugin: ActivityPlugin = {
  ...base,
  key: 'story-predict',
  name: 'Predict',
  description: 'Before reading: who is who, then predict what happens in this chapter and say how well you follow the story.',
  pppStage: 'presentation',
  skills: ['Speaking'],
  component: StoryPredictActivity,
  estimatedMinutes: 4,
  icon: BookOpen,
};

export const storyRecapPlugin: ActivityPlugin = {
  ...base,
  key: 'story-recap',
  name: 'What Really Happened',
  description: 'After reading: a quick check, the predictions vs the story, then everyone adds one line to the class retelling.',
  pppStage: 'production',
  skills: ['Speaking'],
  component: StoryRecapActivity,
  estimatedMinutes: 8,
  icon: BookCheck,
};
