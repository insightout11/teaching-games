import type { ProviderName } from './config';

export type TaskClass =
  | 'content-generation'
  | 'evaluation'
  | 'game-logic'
  | 'activity-facilitation'
  | 'bulk-generation';

export type RetryPromptVariant = 'strict' | 'normal';

export interface TaskClassConfig {
  providers: ProviderName[];
  timeoutMs: number;
  retryTemperature: number;
  retryPromptVariant: RetryPromptVariant;
}

export const TASK_CLASS_CONFIG: Record<TaskClass, TaskClassConfig> = {
  'content-generation': {
    providers: ['gemini', 'groq', 'openai'],
    timeoutMs: 15_000,
    retryTemperature: 0.7,
    retryPromptVariant: 'normal',
  },
  evaluation: {
    providers: ['openai', 'gemini'],
    timeoutMs: 10_000,
    retryTemperature: 0.3,
    retryPromptVariant: 'strict',
  },
  'game-logic': {
    providers: ['openai', 'gemini'],
    timeoutMs: 8_000,
    retryTemperature: 0.2,
    retryPromptVariant: 'strict',
  },
  'activity-facilitation': {
    providers: ['gemini', 'openai'],
    timeoutMs: 12_000,
    retryTemperature: 0.5,
    retryPromptVariant: 'normal',
  },
  'bulk-generation': {
    providers: ['gemini', 'groq', 'openai'],
    timeoutMs: 30_000,
    retryTemperature: 0.7,
    retryPromptVariant: 'normal',
  },
};

const DEFAULT_TASK_CLASS: TaskClass = 'content-generation';

export function resolveTaskClass(taskClass: TaskClass | undefined): TaskClass {
  if (taskClass) return taskClass;

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[AI Routing] Missing taskClass — defaulting to content-generation. ' +
        'Tag this call to suppress this warning.',
    );
  }

  return DEFAULT_TASK_CLASS;
}
