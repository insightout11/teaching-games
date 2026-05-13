import type { BoardLayout, BoardSquare, Wall, HoleZone, Bumper } from './types';

// Winding snake course: bottom (left→right) → right connector (up) → middle (right→left) → left connector (up) → top (left→right) → finish
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  // Bottom row — left to right
  { index: 0,  x:  75, y: 455, type: 'start'         },
  { index: 1,  x: 200, y: 448, type: 'safe'           },
  { index: 2,  x: 325, y: 440, type: 'question'       },
  { index: 3,  x: 450, y: 435, type: 'bounce'         },
  { index: 4,  x: 575, y: 432, type: 'trap'           },
  { index: 5,  x: 695, y: 428, type: 'safe'           },

  // Right connector — going up
  { index: 6,  x: 800, y: 382, type: 'shortcut'       },
  { index: 7,  x: 842, y: 313, type: 'safe'           },

  // Middle row — right to left
  { index: 8,  x: 800, y: 260, type: 'question'       },
  { index: 9,  x: 672, y: 252, type: 'freeze'         },
  { index: 10, x: 548, y: 245, type: 'boost'          },
  { index: 11, x: 424, y: 245, type: 'question'       },
  { index: 12, x: 300, y: 248, type: 'question-boost' },
  { index: 13, x: 176, y: 255, type: 'double'         },

  // Left connector — going up
  { index: 14, x:  98, y: 202, type: 'steal'          },

  // Top row — left to right
  { index: 15, x: 128, y: 145, type: 'safe'           },
  { index: 16, x: 252, y: 132, type: 'question'       },
  { index: 17, x: 378, y: 125, type: 'trap'           },
  { index: 18, x: 504, y: 122, type: 'question'       },
  { index: 19, x: 630, y: 120, type: 'boost'          },
  { index: 20, x: 756, y: 122, type: 'safe'           },
  { index: 21, x: 880, y: 105, type: 'finish'         },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  revealed: s.type !== 'boost' && s.type !== 'trap' && s.type !== 'double' && s.type !== 'steal',
}));

const walls: Wall[] = [];

// Four physics bumpers in the rough between track rows. Index 2 is the windmill obstacle.
export const BUMPERS: Bumper[] = [
  { cx: 545, cy: 348, r: 17 },  // bottom rough, center-right
  { cx: 195, cy: 345, r: 17 },  // bottom rough, center-left
  { cx: 720, cy: 190, r: 22 },  // windmill (between middle + top rows, right side)
  { cx: 375, cy: 186, r: 17 },  // between middle + top rows, left side
];

const holes: HoleZone[] = [];

export const CANVAS_W = 1000;
export const CANVAS_H = 500;

export const BOARD_LAYOUT: BoardLayout = {
  width: CANVAS_W,
  height: CANVAS_H,
  squares,
  walls,
  bumpers: BUMPERS,
  holes,
};

const HALF_WIDTH = 38;

type Pt = { x: number; y: number };
const sq = rawSquares;
export const TRACK_SECTIONS: Record<string, Pt[]> = {
  bottom: [sq[0], sq[1], sq[2], sq[3], sq[4], sq[5]],
  right:  [sq[5], sq[6], sq[7]],
  middle: [sq[7], sq[8], sq[9], sq[10], sq[11], sq[12], sq[13]],
  left:   [sq[13], sq[14], sq[15]],
  top:    [sq[15], sq[16], sq[17], sq[18], sq[19], sq[20], sq[21]],
};

export const TRACK_STROKE_WIDTH = HALF_WIDTH * 2;

export const SQUARE_CONFIG: Record<string, { color: string; label: string }> = {
  start:            { color: '#10b981', label: 'START'  },
  finish:           { color: '#f59e0b', label: 'HOLE'   },
  question:         { color: '#60a5fa', label: 'Q?'     },
  safe:             { color: '#4ade80', label: 'SAFE'   },
  boost:            { color: '#fbbf24', label: 'BONUS'  },
  trap:             { color: '#f87171', label: 'TRAP'   },
  'question-boost': { color: '#c084fc', label: 'Q+B'    },
  freeze:           { color: '#22d3ee', label: 'FREEZE' },
  double:           { color: '#a78bfa', label: '2X'     },
  steal:            { color: '#818cf8', label: 'STEAL'  },
  shortcut:         { color: '#fb923c', label: 'SKIP+'  },
  bounce:           { color: '#fcd34d', label: 'BNCE'   },
  hole:             { color: '#ef4444', label: 'HOLE'   },
};
