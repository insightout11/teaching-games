import type { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import { TimerContent } from './timer-tool';
import { RandomPickerContent } from './random-picker-tool';
import { PollContent } from './poll-manager';
import { ClassQuestionsContent } from './class-questions-widget';
import { ClassBoardCanvas } from './class-board-canvas';
import { WordCloudContent } from './word-cloud-widget';
import { SpinnerContent } from './widgets/spinner-widget';
import { TeamsContent } from './widgets/teams-widget';
import { PictureRevealContent } from './widgets/picture-reveal-widget';
import { WordBankContent } from './widgets/word-bank-widget';
import { ExitTicketContent } from './widgets/exit-ticket-widget';

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
  'class-questions': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'class-board': 'M9 3h6m-7 4h8M6 7h12v14H6V7zm3 4h6m-6 4h4',
  'word-cloud': 'M3 15a4 4 0 004 4h10a4 4 0 100-8 5 5 0 00-9.584-1.32A3.5 3.5 0 003 15z',
  spinner: 'M12 3v9l6.4 6.4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  teams: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  'picture-reveal': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'word-bank': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  'exit-ticket': 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
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
    id: 'class-board',
    label: 'Class Board',
    iconPath: WIDGET_ICON_PATHS['class-board'],
    component: ClassBoardCanvas,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'word-cloud',
    label: 'Word Cloud',
    iconPath: WIDGET_ICON_PATHS['word-cloud'],
    component: WordCloudContent,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'spinner',
    label: 'Spinner',
    iconPath: WIDGET_ICON_PATHS.spinner,
    component: SpinnerContent,
    defaultOpen: false,
    getProps: (ctx) => ({ students: ctx.students }),
  },
  {
    id: 'teams',
    label: 'Teams',
    iconPath: WIDGET_ICON_PATHS.teams,
    component: TeamsContent,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId, students: ctx.students }),
  },
  {
    id: 'picture-reveal',
    label: 'Picture reveal',
    iconPath: WIDGET_ICON_PATHS['picture-reveal'],
    component: PictureRevealContent,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'word-bank',
    label: 'Word bank',
    iconPath: WIDGET_ICON_PATHS['word-bank'],
    component: WordBankContent,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'exit-ticket',
    label: 'Exit ticket',
    iconPath: WIDGET_ICON_PATHS['exit-ticket'],
    component: ExitTicketContent,
    defaultOpen: false,
    getProps: (ctx) => ({ sessionId: ctx.sessionId }),
  },
  {
    id: 'class-questions',
    label: 'Messages',
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
