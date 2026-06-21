import type { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import { TimerContent } from './timer-tool';
import { RandomPickerContent } from './random-picker-tool';
import { PollContent } from './poll-manager';
import { FreezeContent } from './freeze-widget';
import { ClassQuestionsContent } from './class-questions-widget';
import { ClassBoardCanvas } from './class-board-canvas';

export interface WidgetContext {
  sessionId: string;
  students: Student[];
  topic?: string;
  difficulty?: string;
  onShowAnswer?: (question: string, answer: string) => void;
}

export interface WidgetDefinition {
  id: string;
  label: string;
  iconPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  getProps?: (ctx: WidgetContext) => Record<string, unknown>;
  defaultOpen?: boolean;
}

export const WIDGET_ICON_PATHS: Record<string, string> = {
  timer: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'random-picker':
    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  poll: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  freeze: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  'class-questions': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'class-board': 'M9 3h6m-7 4h8M6 7h12v14H6V7zm3 4h6m-6 4h4',
};

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'timer',
    label: 'Timer',
    iconPath: WIDGET_ICON_PATHS.timer,
    component: TimerContent,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'random-picker',
    label: 'Random Picker',
    iconPath: WIDGET_ICON_PATHS['random-picker'],
    component: RandomPickerContent,
    getProps: (ctx) => ({ students: ctx.students }),
  },
  {
    id: 'poll',
    label: 'Poll',
    iconPath: WIDGET_ICON_PATHS.poll,
    component: PollContent,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'freeze',
    label: 'Freeze Input',
    iconPath: WIDGET_ICON_PATHS.freeze,
    component: FreezeContent,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'class-board',
    label: 'Class Board',
    iconPath: WIDGET_ICON_PATHS['class-board'],
    component: ClassBoardCanvas,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'class-questions',
    label: 'Class Questions',
    iconPath: WIDGET_ICON_PATHS['class-questions'],
    component: ClassQuestionsContent,
    getProps: (ctx) => ({
      sessionId: ctx.sessionId,
      topic: ctx.topic ?? 'General',
      difficulty: ctx.difficulty ?? 'Intermediate',
      onShowAnswer: ctx.onShowAnswer ?? (() => {}),
    }),
  },
];
