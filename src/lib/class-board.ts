export type ClassBoardLayout = 'list' | 't-chart' | 'venn' | 'quadrants' | 'ranked' | 'image-evidence';

export type ClassBoardVisibility = 'pending' | 'visible' | 'hidden';

export interface ClassBoardCategory {
  key: string;
  label: string;
  tone?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose' | 'slate';
}

export interface ClassBoardZone {
  key: string;
  label: string;
  description?: string;
}

export interface ClassBoardPreset {
  key: string;
  title: string;
  prompt: string;
  layout: ClassBoardLayout;
  categories: ClassBoardCategory[];
  zones: ClassBoardZone[];
  defaultCategory: string;
  defaultZone: string;
  allowVotes: boolean;
  rankable: boolean;
  studentVisibility: 'pending' | 'visible';
}

export const DEFAULT_CLASS_BOARD_KEY = 'class-board';
export const DEFAULT_CLASS_BOARD_PRESET_KEY = 'open-board';

export const CLASS_BOARD_PRESETS: Record<string, ClassBoardPreset> = {
  'open-board': {
    key: 'open-board',
    title: 'Class Board',
    prompt: 'Add ideas, examples, questions, or evidence for the class to discuss.',
    layout: 'list',
    categories: [
      { key: 'idea', label: 'Idea', tone: 'cyan' },
      { key: 'evidence', label: 'Evidence', tone: 'emerald' },
      { key: 'question', label: 'Question', tone: 'amber' },
    ],
    zones: [{ key: 'main', label: 'Board' }],
    defaultCategory: 'idea',
    defaultZone: 'main',
    allowVotes: true,
    rankable: false,
    studentVisibility: 'pending',
  },
  'geo-detective': {
    key: 'geo-detective',
    title: 'Geo Detective Board',
    prompt: 'Use English to describe what you notice, what it proves, and where you think the place could be.',
    layout: 'image-evidence',
    categories: [
      { key: 'observation', label: 'Observation', tone: 'cyan' },
      { key: 'evidence', label: 'Evidence', tone: 'emerald' },
      { key: 'guess', label: 'Guess', tone: 'amber' },
      { key: 'question', label: 'Question', tone: 'violet' },
    ],
    zones: [
      { key: 'notice', label: 'I notice', description: 'Visible clues in the image.' },
      { key: 'prove', label: 'This proves', description: 'Evidence or reasoning.' },
      { key: 'wonder', label: 'I wonder', description: 'Questions before the reveal.' },
    ],
    defaultCategory: 'observation',
    defaultZone: 'notice',
    allowVotes: true,
    rankable: true,
    studentVisibility: 'pending',
  },
  't-chart': {
    key: 't-chart',
    title: 'T-Chart',
    prompt: 'Sort ideas into two sides so the class can compare them clearly.',
    layout: 't-chart',
    categories: [
      { key: 'point', label: 'Point', tone: 'cyan' },
      { key: 'example', label: 'Example', tone: 'emerald' },
      { key: 'question', label: 'Question', tone: 'amber' },
    ],
    zones: [
      { key: 'left', label: 'Side A', description: 'First option, argument, or category.' },
      { key: 'right', label: 'Side B', description: 'Second option, argument, or category.' },
    ],
    defaultCategory: 'point',
    defaultZone: 'left',
    allowVotes: true,
    rankable: false,
    studentVisibility: 'pending',
  },
  'venn': {
    key: 'venn',
    title: 'Venn Board',
    prompt: 'Compare two ideas by placing details on the left, right, or shared middle.',
    layout: 'venn',
    categories: [
      { key: 'feature', label: 'Feature', tone: 'cyan' },
      { key: 'example', label: 'Example', tone: 'emerald' },
      { key: 'question', label: 'Question', tone: 'violet' },
    ],
    zones: [
      { key: 'left', label: 'Only A', description: 'True for the first idea.' },
      { key: 'both', label: 'Both', description: 'True for both ideas.' },
      { key: 'right', label: 'Only B', description: 'True for the second idea.' },
    ],
    defaultCategory: 'feature',
    defaultZone: 'both',
    allowVotes: true,
    rankable: false,
    studentVisibility: 'pending',
  },
  'quadrants': {
    key: 'quadrants',
    title: 'Four Corners',
    prompt: 'Place ideas into four groups so patterns are easier to discuss.',
    layout: 'quadrants',
    categories: [
      { key: 'idea', label: 'Idea', tone: 'cyan' },
      { key: 'reason', label: 'Reason', tone: 'emerald' },
      { key: 'question', label: 'Question', tone: 'amber' },
    ],
    zones: [
      { key: 'top-left', label: 'Group 1' },
      { key: 'top-right', label: 'Group 2' },
      { key: 'bottom-left', label: 'Group 3' },
      { key: 'bottom-right', label: 'Group 4' },
    ],
    defaultCategory: 'idea',
    defaultZone: 'top-left',
    allowVotes: true,
    rankable: false,
    studentVisibility: 'pending',
  },
  'ranked-list': {
    key: 'ranked-list',
    title: 'Ranked Board',
    prompt: 'Collect options, then move the strongest or most important ideas up the list.',
    layout: 'ranked',
    categories: [
      { key: 'option', label: 'Option', tone: 'cyan' },
      { key: 'reason', label: 'Reason', tone: 'emerald' },
      { key: 'concern', label: 'Concern', tone: 'rose' },
    ],
    zones: [{ key: 'ranking', label: 'Ranking' }],
    defaultCategory: 'option',
    defaultZone: 'ranking',
    allowVotes: true,
    rankable: true,
    studentVisibility: 'pending',
  },
};

export function getClassBoardPreset(key?: string | null): ClassBoardPreset {
  return CLASS_BOARD_PRESETS[key ?? DEFAULT_CLASS_BOARD_PRESET_KEY] ?? CLASS_BOARD_PRESETS[DEFAULT_CLASS_BOARD_PRESET_KEY];
}

/**
 * Build the board-specific fields of an InputSpec from a preset. Callers spread the
 * result into `setInputSpec({ type: 'board', ... })`. `zonesOverride` lets the teacher
 * rename zone titles on the board and have those labels propagate to every surface.
 */
export function boardSpecFields(
  preset: ClassBoardPreset,
  boardKey: string,
  zonesOverride?: ClassBoardZone[],
) {
  const zones = zonesOverride ?? preset.zones;
  return {
    boardKey,
    boardTitle: preset.title,
    boardPrompt: preset.prompt,
    boardLayout: preset.layout,
    boardCategories: preset.categories.map(({ key, label }) => ({ key, label })),
    boardZones: zones.map(({ key, label, description }) => ({ key, label, description })),
    boardDefaultCategory: preset.defaultCategory,
    boardDefaultZone: preset.defaultZone,
    boardAllowVotes: preset.allowVotes,
  };
}

/** Whether a layout supports teacher-driven ranking of items within a zone. */
export function isRankableLayout(layout?: ClassBoardLayout | null) {
  return layout === 'ranked' || layout === 'image-evidence';
}

export function normalizeClassBoardKey(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_CLASS_BOARD_KEY;
  return trimmed.slice(0, 80);
}
