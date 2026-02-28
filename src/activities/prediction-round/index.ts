import type { ActivityPlugin } from '../types';
import { PredictionRoundActivity } from './activity';
import { Lightbulb } from 'lucide-react';

export const predictionRoundPlugin: ActivityPlugin = {
  key: 'prediction-round',
  name: 'Prediction Round',
  description: '3 topic predictions — students commit before the reveal, sparking curiosity',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Critical Thinking'],
  component: PredictionRoundActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 30,
  icon: Lightbulb,
};

export { PredictionRoundActivity };
