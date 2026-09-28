/**
 * Synthetic cockpit data, plus the real catalogue.
 *
 * The catalogue is deliberately *not* invented: names, descriptions and
 * categories come from the shipped game and activity registries, filtered by
 * the registries' own visibility rule, because an illustrative catalogue would
 * make the composition look decided when it is not.
 *
 * Readiness is the one thing that cannot be read from a registry — nothing has
 * been integrated with the room yet — so it is assigned here from an explicit
 * list and labelled as a fixture assumption in the review. Astra's A-08
 * inventory replaces it wholesale.
 */

import { WIDGET_ICON_PATHS } from '@/components/session/widget-registry';
import { getAllActivities } from '@/activities/registry';
import { getAllGames } from '@/games/registry';
import type {
  CatalogueEntry,
  CockpitState,
  TrayItem,
  WidgetSlot,
} from '../../ui/cockpit-workspace/types';

/**
 * The room's four moves.
 *
 * Shortcuts, not the catalogue — they sit alongside it under their own label.
 */
const ROOM_MOVES: CatalogueEntry[] = [
  {
    key: 'move:discuss',
    name: 'Discussion questions',
    description: 'Questions about the source you have selected, for talking through together.',
    category: 'Room moves',
    kind: 'move',
    readiness: 'configure',
    readinessNote: 'Needs a selected source before it can be prepared.',
    minutes: 10,
    deviceFree: true,
  },
  {
    key: 'move:vocabulary',
    name: 'Vocabulary from this text',
    description: 'Pull the words worth teaching out of the passage you chose.',
    category: 'Room moves',
    kind: 'move',
    readiness: 'configure',
    readinessNote: 'Needs a selected source before it can be prepared.',
    minutes: 8,
    deviceFree: true,
  },
  {
    key: 'move:fact-detective',
    name: 'Fact Detective',
    description: 'Check what the passage actually says against what it is claimed to say.',
    category: 'Room moves',
    kind: 'move',
    readiness: 'configure',
    readinessNote: 'Needs a selected passage with text in it.',
    minutes: 12,
    deviceFree: true,
  },
  {
    key: 'move:roleplay',
    name: 'Role play',
    description: 'A short scene built from the situation in the source.',
    category: 'Room moves',
    kind: 'move',
    readiness: 'configure',
    readinessNote: 'Needs a selected source before it can be prepared.',
    minutes: 15,
    deviceFree: true,
  },
];

/**
 * The two entries chosen as the first integration candidates in the plan.
 * Everything else is honestly marked as not yet connected to the room.
 */
const PREVIEW_CANDIDATES = new Set(['flash-quiz', 'vocab-sprint']);

const NOT_INTEGRATED_NOTE =
  'Not connected to the room yet. It still runs the normal way from a lesson.';

function gameEntries(): CatalogueEntry[] {
  return (
    getAllGames()
      // The registries' own rule: Flight-Plan-only entries are not browsable.
      .filter(game => !game.flightPlanOnly)
      .map(game => ({
        key: game.key,
        name: game.name,
        description: game.description,
        category: game.category,
        kind: 'game' as const,
        readiness: PREVIEW_CANDIDATES.has(game.key)
          ? ('configure' as const)
          : ('not-integrated' as const),
        readinessNote: PREVIEW_CANDIDATES.has(game.key)
          ? 'Selected as a first integration candidate. Its adapter is not built yet.'
          : NOT_INTEGRATED_NOTE,
        minutes: game.estimatedMinutes,
        deviceFree: game.deviceFree,
        scored: game.maxPointsPerTurn > 0,
      }))
  );
}

function activityEntries(): CatalogueEntry[] {
  return getAllActivities()
    .filter(activity => !activity.flightPlanOnly)
    .map(activity => ({
      key: activity.key,
      name: activity.name,
      description: activity.description,
      category: activity.category,
      kind: 'activity' as const,
      readiness: 'not-integrated' as const,
      readinessNote: NOT_INTEGRATED_NOTE,
      minutes: activity.estimatedMinutes,
      deviceFree: activity.deviceFree,
    }));
}

export function cockpitCatalogue(): CatalogueEntry[] {
  return [...ROOM_MOVES, ...gameEntries(), ...activityEntries()];
}

export function cockpitCategories(entries: CatalogueEntry[]): string[] {
  return Array.from(new Set(entries.map(entry => entry.category)));
}

/**
 * The six widget families, with honest availability.
 *
 * Timer, Poll, Class Board, Word Cloud and Class Questions all reach a session
 * this composition does not have — `TimerContent` builds a Supabase client at
 * module scope, so it is not merely unwired, it is unmountable here. Random
 * Picker takes a student list and nothing else, so the real component runs.
 */
export const COCKPIT_WIDGETS: WidgetSlot[] = [
  {
    id: 'timer',
    label: 'Timer',
    iconPath: WIDGET_ICON_PATHS.timer,
    availability: 'needs-session',
    note: 'The real timer writes to the session so the class display can follow it. A layout stand-in is shown instead.',
  },
  {
    id: 'random-picker',
    label: 'Random Picker',
    iconPath: WIDGET_ICON_PATHS['random-picker'],
    availability: 'local',
  },
  {
    id: 'poll',
    label: 'Poll',
    iconPath: WIDGET_ICON_PATHS.poll,
    availability: 'needs-input-owner',
    note: 'A poll asks students to answer, so it would take over the student prompt. That decision is not made yet.',
  },
  {
    id: 'class-board',
    label: 'Class Board',
    iconPath: WIDGET_ICON_PATHS['class-board'],
    availability: 'needs-input-owner',
    note: 'The board writes what students type. It cannot share the prompt with an activity yet.',
  },
  {
    id: 'word-cloud',
    label: 'Word Cloud',
    iconPath: WIDGET_ICON_PATHS['word-cloud'],
    availability: 'needs-input-owner',
    note: 'Collects words from students, so it owns the prompt while it is open.',
  },
  {
    id: 'class-questions',
    label: 'Class Questions',
    iconPath: WIDGET_ICON_PATHS['class-questions'],
    availability: 'needs-session',
    note: 'Reads questions from the session. Not the same thing as the student inbox, and not a substitute for it.',
  },
];

// --- synthetic room content -------------------------------------------------

export const SYNTHETIC_STUDENTS = [
  { id: 's1', name: 'Aiko', points: 34, team: 'Harbour' },
  { id: 's2', name: 'Bruno', points: 31, team: 'Hill' },
  { id: 's3', name: 'Chen', points: 28, team: 'Harbour' },
  { id: 's4', name: 'Dania', points: 25, team: 'Hill' },
  { id: 's5', name: 'Emre', points: 22, team: 'Harbour' },
  { id: 's6', name: 'Farida', points: 19, team: 'Hill' },
  { id: 's7', name: 'Goro', points: 15, team: 'Harbour' },
];

export const SYNTHETIC_TEAMS = [
  { name: 'Harbour', points: 99 },
  { name: 'Hill', points: 75 },
];

const ITEMS: TrayItem[] = [
  {
    id: 'item-1',
    kind: 'source',
    title: 'Advisory lifted for coastal districts',
    caption: 'Fixture Press · 8 Sep',
    detail:
      'An advisory was issued for low-lying coastal areas on Tuesday evening and lifted the following morning. Residents were asked to move to higher ground and to wait for an official all-clear before returning.',
    attribution: 'Fixture Press · retrieved 12 Sep 2026',
  },
  {
    id: 'item-2',
    kind: 'place',
    title: 'Fixture Harbour Museum',
    caption: '1 Example Quay',
    detail: 'A place you kept, with your own note attached.',
    attribution: 'Place details from the discovery provider',
  },
  {
    id: 'item-3',
    kind: 'note',
    title: 'Words to pre-teach',
    caption: 'Your own note',
    detail: 'advisory · evacuate · all-clear · low-lying · drill',
  },
  {
    id: 'item-4',
    kind: 'video',
    title: 'A harbour drill, explained',
    caption: 'Fixture Channel · 4 min',
    detail: 'A reference you kept. It cannot be played in the room yet.',
    attribution: 'Fixture Channel',
  },
  {
    id: 'item-5',
    kind: 'image',
    title: 'Harbour wall diagram',
    caption: 'Image reference',
    detail: 'An image reference with your description.',
  },
];

export function baseCockpitState(overrides: Partial<CockpitState> = {}): CockpitState {
  return {
    identity: { className: 'Tuesday Conversation B1', sessionLabel: 'Lesson 14' },
    lesson: {
      title: 'Lesson 14',
      objectives: 'Talk about how a coastal town prepares for a warning.',
      level: 'B1',
      tone: 'Encouraging',
    },
    drawer: null,
    overlay: null,
    items: ITEMS,
    selectedItemId: null,
    focusedItemId: null,
    stage: { kind: 'idle' },
    publicView: { kind: 'blank' },
    drafts: {},
    widgets: [],
    scoreMode: 'class',
    pinnedScores: false,
    catalogue: { query: '', category: null, favourites: [], recent: [] },
    participants: { roster: 14, present: 12, connected: 9 },
    save: { status: 'idle', error: null },
    activity: [],
    ...overrides,
  };
}

export interface CockpitStory {
  key: string;
  label: string;
  blurb: string;
  state: CockpitState;
  presenting?: boolean;
}

export const COCKPIT_STORIES: CockpitStory[] = [
  {
    key: 'idle',
    label: 'Room idle',
    blurb: 'Nothing selected, nothing shown. The stage is the largest thing on screen.',
    state: baseCockpitState(),
  },
  {
    key: 'selected',
    label: 'Source selected',
    blurb: 'One item open privately. The class display is still blank.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      drafts: { 'item-1': 'Ask them what they would take with them.' },
      save: { status: 'saved', error: null },
    }),
  },
  {
    key: 'shown',
    label: 'Showing the class',
    blurb: 'The same item, deliberately shown. Note the amber indicator.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      focusedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      publicView: { kind: 'material', itemId: 'item-1' },
      drafts: { 'item-1': 'Ask them what they would take with them.' },
    }),
  },
  {
    key: 'catalogue',
    label: 'Catalogue open',
    blurb: 'Real registry entries, real categories, honest readiness.',
    state: baseCockpitState({
      drawer: 'catalogue',
      selectedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      catalogue: { query: '', category: null, favourites: ['flash-quiz'], recent: [] },
    }),
  },
  {
    key: 'sources',
    label: 'Sources drawer',
    blurb: 'The real five-surface drawer in the cockpit drawer slot.',
    state: baseCockpitState({ drawer: 'sources' }),
  },
  {
    key: 'configure',
    label: 'Setting up an activity',
    blurb: 'Configuration on the stage, labelled as a layout example.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      stage: { kind: 'module', entryKey: 'flash-quiz', phase: 'configure' },
    }),
  },
  {
    key: 'running',
    label: 'Activity running',
    blurb: 'A fixture module on the stage. Nothing is generated or scored.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      stage: { kind: 'module', entryKey: 'flash-quiz', phase: 'running' },
      pinnedScores: true,
      drafts: { 'item-1': 'Ask them what they would take with them.' },
      catalogue: { query: '', category: null, favourites: [], recent: ['flash-quiz'] },
    }),
  },
  {
    key: 'widgets',
    label: 'Timer and picker',
    blurb: 'Two widget windows beside the stage, bounded inside the frame.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      widgets: [
        { id: 'timer', minimized: false },
        { id: 'random-picker', minimized: false },
      ],
    }),
  },
  {
    key: 'scores',
    label: 'Scoreboard open',
    blurb: 'One action from the top bar. Class, teams, individual and off.',
    state: baseCockpitState({ overlay: 'scores', pinnedScores: true, scoreMode: 'team' }),
  },
  {
    key: 'join',
    label: 'Join panel',
    blurb: 'Student joining and teacher-device access, kept apart.',
    state: baseCockpitState({ overlay: 'join' }),
  },
  {
    key: 'menu',
    label: 'Lesson settings',
    blurb: 'Title, objectives, level, tone, attendance and End session.',
    state: baseCockpitState({ overlay: 'menu' }),
  },
  {
    key: 'error',
    label: 'A real save failure',
    blurb: 'Compact save status gives way to something actionable.',
    state: baseCockpitState({
      selectedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      save: { status: 'error', error: 'That note did not save. Try again.' },
    }),
  },
  {
    key: 'zero-joined',
    label: 'Teaching before anyone joins',
    blurb:
      'Synthetic: 0 connected. A source is open and shown, a note is drafted, a widget is open. Use the fixture control to simulate students arriving — nothing else changes.',
    state: baseCockpitState({
      participants: { roster: 14, present: 0, connected: 0 },
      selectedItemId: 'item-1',
      stage: { kind: 'material', itemId: 'item-1' },
      publicView: { kind: 'material', itemId: 'item-1' },
      drafts: { 'item-1': 'Start talking before the phones come out.' },
      widgets: [{ id: 'random-picker', minimized: false }],
    }),
  },
  {
    key: 'zero-joined-activity',
    label: 'Activity with nobody connected',
    blurb:
      'Synthetic: a device-dependent activity on the stage with 0 connected. It describes what it needs instead of pretending to have participants.',
    state: baseCockpitState({
      participants: { roster: 14, present: 0, connected: 0 },
      selectedItemId: 'item-1',
      // Grid Rush declares `deviceFree: false` in its registry entry, so it is
      // a genuinely device-dependent activity. (VocabSprint, used here first,
      // is device-free — the story claimed a requirement that did not exist.)
      stage: { kind: 'module', entryKey: 'grid-rush', phase: 'configure' },
    }),
  },
  {
    key: 'presenting',
    label: 'Clean presentation',
    blurb: 'What the class sees. No tray, no dock, no notes, no widgets.',
    presenting: true,
    state: baseCockpitState({
      selectedItemId: 'item-1',
      publicView: { kind: 'material', itemId: 'item-1' },
      drafts: { 'item-1': 'PRIVATE-NOTE-must-not-appear' },
      widgets: [{ id: 'random-picker', minimized: false }],
    }),
  },
];

export const storyFor = (key: string): CockpitStory =>
  COCKPIT_STORIES.find(story => story.key === key) ?? COCKPIT_STORIES[0];
