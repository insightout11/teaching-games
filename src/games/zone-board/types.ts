import type { Student } from '@/lib/supabase/types';

export type SquareType =
  | 'start' | 'finish'
  | 'question' | 'safe'
  | 'boost' | 'trap'
  | 'question-boost' | 'freeze' | 'hole'
  | 'double' | 'steal' | 'shortcut' | 'bounce';

export type GamePhase =
  | 'idle'
  | 'shooting'
  | 'animating'
  | 'resolving'
  | 'answering'
  | 'scoring'
  | 'game_over';

export interface BoardSquare {
  index: number;
  x: number;
  y: number;
  type: SquareType;
  revealed: boolean;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Bumper {
  cx: number;
  cy: number;
  r: number;
}

export interface HoleZone {
  x: number;
  y: number;
  radius: number;
}

export interface BoardLayout {
  width: number;
  height: number;
  squares: BoardSquare[];
  walls: Wall[];
  bumpers: Bumper[];
  holes: HoleZone[];
}

export interface TeamState {
  id: number;
  name: string;
  color: string;
  bgClass: string;
  members: Student[];
  squareIndex: number;
  shooterIndex: number;
  skipNextTurn: boolean;
  finished: boolean;
}

export interface ActiveQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  cacheId: string | null;
}

export interface PuckPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  fellInHole: boolean;
}
