export type DefendItPhase =
  | 'idle'
  | 'loading'
  | 'statement_reveal'
  | 'side_assignment'
  | 'debating'
  | 'round_results'
  | 'game_over';

export type DebateSide = 'DEFEND' | 'ATTACK';

export const REACTIONS = ['🔥', '🤣', '👏', '💡'] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface ReactionCount {
  '🔥': number;
  '🤣': number;
  '👏': number;
  '💡': number;
}

export function emptyReactionCount(): ReactionCount {
  return { '🔥': 0, '🤣': 0, '👏': 0, '💡': 0 };
}

export function totalReactions(r: ReactionCount): number {
  return r['🔥'] + r['🤣'] + r['👏'] + r['💡'];
}
