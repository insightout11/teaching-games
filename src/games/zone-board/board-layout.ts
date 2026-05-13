import type { BoardLayout, BoardSquare, Wall, HoleZone } from './types';

// "The Gauntlet" — diagonal start, high/low fork, winding end sweep
// Upper branch (sq4-7): cuts high through tight quarters — risky shortcut
// Lower branch (sq8-11): stays low, longer but safer route
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  // Shared start — diagonal from bottom-left going upper-right
  { index: 0,  x:  65, y: 400, type: 'start' },
  { index: 1,  x: 182, y: 362, type: 'question' },
  { index: 2,  x: 298, y: 315, type: 'safe' },
  { index: 3,  x: 400, y: 258, type: 'question' },   // ← fork point

  // Upper branch — cuts sharply upward (riskier, shorter)
  { index: 4,  x: 455, y: 182, type: 'question-boost' },
  { index: 5,  x: 572, y: 148, type: 'safe' },
  { index: 6,  x: 695, y: 155, type: 'question' },
  { index: 7,  x: 802, y: 180, type: 'boost' },       // hidden

  // Lower branch — stays lower (safer, longer route)
  { index: 8,  x: 448, y: 332, type: 'question' },
  { index: 9,  x: 572, y: 358, type: 'freeze' },
  { index: 10, x: 695, y: 342, type: 'question' },
  { index: 11, x: 805, y: 298, type: 'trap' },        // hidden

  // Merge point
  { index: 12, x: 872, y: 238, type: 'safe' },

  // End section — sweeps right, curves up and back left across the top
  { index: 13, x: 935, y: 196, type: 'question' },
  { index: 14, x: 972, y: 145, type: 'question-boost' },
  { index: 15, x: 960, y:  94, type: 'safe' },
  { index: 16, x: 914, y:  60, type: 'question' },
  { index: 17, x: 845, y:  65, type: 'boost' },       // hidden
  { index: 18, x: 768, y:  72, type: 'question' },
  { index: 19, x: 686, y:  63, type: 'safe' },
  { index: 20, x: 602, y:  75, type: 'question' },
  { index: 21, x: 515, y:  82, type: 'trap' },        // hidden
  { index: 22, x: 430, y:  90, type: 'question' },
  { index: 23, x: 342, y:  96, type: 'safe' },
  { index: 24, x: 258, y: 102, type: 'finish' },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  revealed: s.type !== 'boost' && s.type !== 'trap',
}));

const walls: Wall[] = [];
const holes: HoleZone[] = [];

export const CANVAS_W = 1000;
export const CANVAS_H = 460;

export const BOARD_LAYOUT: BoardLayout = {
  width: CANVAS_W,
  height: CANVAS_H,
  squares,
  walls,
  holes,
};

const HALF_WIDTH = 40;

type Pt = { x: number; y: number };
const sq = rawSquares;
export const TRACK_SECTIONS: Record<string, Pt[]> = {
  start:       [sq[0], sq[1], sq[2], sq[3]],
  upper:       [sq[3], sq[4], sq[5], sq[6], sq[7]],
  lower:       [sq[3], sq[8], sq[9], sq[10], sq[11]],
  upper_exit:  [sq[7], sq[12]],
  lower_exit:  [sq[11], sq[12]],
  end:         [sq[12], sq[13], sq[14], sq[15], sq[16], sq[17], sq[18], sq[19], sq[20], sq[21], sq[22], sq[23], sq[24]],
};

export const TRACK_STROKE_WIDTH = HALF_WIDTH * 2;

export const SQUARE_CONFIG: Record<string, { color: string; label: string }> = {
  start:            { color: '#10b981', label: 'START'   },
  finish:           { color: '#f59e0b', label: 'FINISH'  },
  question:         { color: '#3b82f6', label: 'Q?'      },
  safe:             { color: '#64748b', label: 'SAFE'    },
  boost:            { color: '#f59e0b', label: 'BOOST'   },
  trap:             { color: '#ef4444', label: 'TRAP'    },
  'question-boost': { color: '#a855f7', label: 'Q+B'     },
  freeze:           { color: '#06b6d4', label: 'FREEZE'  },
  hole:             { color: '#ef4444', label: 'HOLE'    },
};
