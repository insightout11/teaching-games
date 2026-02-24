import type { ComponentType } from 'react';
import type { Student } from '@/lib/supabase/types';
import { TimerContent } from './timer-tool';
import { RandomPickerContent } from './random-picker-tool';
import { PollContent } from './poll-manager';
import { FreezeContent } from './freeze-widget';

export interface WidgetContext {
  sessionId: string;
  students: Student[];
}

export interface WidgetDefinition {
  id: string;
  label: string;
  iconPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  getProps?: (ctx: WidgetContext) => Record<string, unknown>;
}

export const WIDGET_ICON_PATHS: Record<string, string> = {
  timer: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'random-picker':
    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  poll: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  freeze: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
};

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'timer',
    label: 'Timer',
    iconPath: WIDGET_ICON_PATHS.timer,
    component: TimerContent,
    getProps: () => ({}),
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
];
