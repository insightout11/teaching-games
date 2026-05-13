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

// Physics bumpers placed ON the course between squares.
// Index 2 is the windmill — rendered differently, same collision shape.
export const BUMPERS: Bumper[] = [
  { cx: 262, cy: 443, r: 13 },  // bottom row, between sq1–sq2
  { cx: 640, cy: 429, r: 13 },  // bottom row, between sq4–sq5
  { cx: 736, cy: 256, r: 18 },  // WINDMILL — middle row, in front of FREEZE (sq9)
  { cx: 442, cy: 244, r: 13 },  // middle row, between sq11–sq12
  { cx: 316, cy: 127, r: 13 },  // top row, between sq16–sq17
];

const holes: HoleZone[] = [];

export const CANVAS_W = 1000;
export const CANVAS_H = 500;

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

// Generate wall segment pairs (one each side) along a polyline
function genWalls(pts: Pt[], hw: number): Wall[] {
  const out: Wall[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const nx = (-dy / len) * hw, ny = (dx / len) * hw;
    out.push({ x1: a.x + nx, y1: a.y + ny, x2: b.x + nx, y2: b.y + ny }); // left wall
    out.push({ x1: a.x - nx, y1: a.y - ny, x2: b.x - nx, y2: b.y - ny }); // right wall
  }
  return out;
}

const WALL_HW = HALF_WIDTH + 3; // slightly wider than visual track

export const COURSE_WALLS: Wall[] = [
  ...genWalls(TRACK_SECTIONS.bottom, WALL_HW),
  ...genWalls(TRACK_SECTIONS.right,  WALL_HW),
  ...genWalls(TRACK_SECTIONS.middle, WALL_HW),
  ...genWalls(TRACK_SECTIONS.left,   WALL_HW),
  ...genWalls(TRACK_SECTIONS.top,    WALL_HW),
];

const walls: Wall[] = [];

export const BOARD_LAYOUT: BoardLayout = {
  width: CANVAS_W,
  height: CANVAS_H,
  squares,
  walls,
  bumpers: BUMPERS,
  holes,
};

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
