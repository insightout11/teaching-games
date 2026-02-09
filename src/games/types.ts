import { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import type { SessionSettings } from '@/stores/session-store';

export interface ScoreResult {
  isCorrect: boolean;
  points: number;
  responseData?: Record<string, unknown>;
}

export interface GameProps {
  students: Student[];
  currentStudentId: string | null;
  onScore: (studentId: string, result: ScoreResult) => void;
  onPickStudent: () => void;
  config: Record<string, unknown>;
  sessionSettings: SessionSettings;
}

export interface GameConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  default: unknown;
}

export interface GamePlugin {
  key: string;
  name: string;
  description: string;
  skills: string[];
  component: ComponentType<GameProps>;
  configSchema: GameConfigField[];
  maxPointsPerTurn: number;
}
