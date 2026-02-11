export interface ConnectionsGroup {
  category: string;  // e.g., "Kitchen utensils"
  words: string[];   // 4 words in this group
  difficulty: 'easy' | 'medium' | 'hard' | 'tricky';
  color: 'yellow' | 'green' | 'blue' | 'purple';  // NYT colors
}

export interface ConnectionsChallenge {
  words: string[];  // 16 words shuffled
  groups: ConnectionsGroup[];  // 4 groups (hidden from player)
}

export interface ConnectionsResult {
  isCorrect: boolean;
  matchedGroup?: ConnectionsGroup;
  feedback: string;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  PLAYING = 'playing',
  EVALUATING = 'evaluating',
  WON = 'won',
  LOST = 'lost'
}

export type GroupColor = 'yellow' | 'green' | 'blue' | 'purple';

export const GROUP_COLORS: Record<GroupColor, { bg: string; text: string; border: string }> = {
  yellow: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-900',
    border: 'border-yellow-500'
  },
  green: {
    bg: 'bg-emerald-400',
    text: 'text-emerald-900',
    border: 'border-emerald-500'
  },
  blue: {
    bg: 'bg-blue-400',
    text: 'text-blue-900',
    border: 'border-blue-500'
  },
  purple: {
    bg: 'bg-blue-400',
    text: 'text-blue-900',
    border: 'border-blue-500'
  }
};
