import type { BoardLayout, BoardSquare, Wall, HoleZone } from './types';

// Mini-golf style course: shared start → Y-fork → upper or lower branch → merge → curved end → finish
// Upper branch: y≈158 (bonus risk). Lower branch: y≈348 (safer). Water hazard in the gap between.
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  // Shared start — left side, going right
  { index: 0,  x:  80, y: 240, type: 'start' },
  { index: 1,  x: 175, y: 235, type: 'question' },
  { index: 2,  x: 268, y: 230, type: 'safe' },
  { index: 3,  x: 355, y: 227, type: 'question' },   // ← fork point

  // Upper branch — elevated corridor
  { index: 4,  x: 415, y: 165, type: 'question-boost' },
  { index: 5,  x: 510, y: 152, type: 'safe' },
  { index: 6,  x: 608, y: 150, type: 'question' },
  { index: 7,  x: 705, y: 160, type: 'boost' },       // hidden

  // Lower branch — lower corridor
  { index: 8,  x: 415, y: 338, type: 'question' },
  { index: 9,  x: 510, y: 352, type: 'freeze' },
  { index: 10, x: 608, y: 355, type: 'question' },
  { index: 11, x: 705, y: 342, type: 'trap' },        // hidden

  // Merge point
  { index: 12, x: 798, y: 240, type: 'safe' },        // ← merge

  // Shared end — sweeps right then curves up across the top → finish
  { index: 13, x: 875, y: 222, type: 'question' },
  { index: 14, x: 935, y: 195, type: 'question-boost' },
  { index: 15, x: 960, y: 145, type: 'safe' },
  { index: 16, x: 942, y:  92, type: 'question' },
  { index: 17, x: 882, y:  58, type: 'boost' },       // hidden
  { index: 18, x: 808, y:  48, type: 'question' },
  { index: 19, x: 728, y:  55, type: 'safe' },
  { index: 20, x: 645, y:  64, type: 'question' },
  { index: 21, x: 558, y:  72, type: 'trap' },        // hidden
  { index: 22, x: 468, y:  78, type: 'question' },
  { index: 23, x: 382, y:  82, type: 'safe' },
  { index: 24, x: 295, y:  80, type: 'finish' },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  revealed: s.type !== 'boost' && s.type !== 'trap',
}));

const HALF_WIDTH = 38;

// Full-width corridor walls for each segment
function corridorWalls(pts: { x: number; y: number }[]): Wall[] {
  const walls: Wall[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[i + 1].x, by = pts[i + 1].y;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1) continue;
    const nx = -(by - ay) / len;
    const ny =  (bx - ax) / len;
    walls.push(
      { x1: ax + nx * HALF_WIDTH, y1: ay + ny * HALF_WIDTH, x2: bx + nx * HALF_WIDTH, y2: by + ny * HALF_WIDTH },
      { x1: ax - nx * HALF_WIDTH, y1: ay - ny * HALF_WIDTH, x2: bx - nx * HALF_WIDTH, y2: by - ny * HALF_WIDTH },
    );
  }
  return walls;
}

const sq = rawSquares;

// Single outer wall for fork/merge transition zones — avoids inner walls crossing between branch corridors
function singleWall(a: { x: number; y: number }, b: { x: number; y: number }, usePositiveOffset: boolean): Wall {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const s = usePositiveOffset ? 1 : -1;
  return {
    x1: a.x + s * nx * HALF_WIDTH, y1: a.y + s * ny * HALF_WIDTH,
    x2: b.x + s * nx * HALF_WIDTH, y2: b.y + s * ny * HALF_WIDTH,
  };
}

const corridorWallList: Wall[] = [
  // Shared start — full double walls sq0→sq3
  ...corridorWalls([sq[0], sq[1], sq[2], sq[3]]),
  // Fork entries: outer wall only per branch (inner walls would cross each other between sq3 and first branch square)
  singleWall(sq[3], sq[4], false),   // upper fork entry: outer/top wall only
  singleWall(sq[3], sq[8], true),    // lower fork entry: outer/bottom wall only
  // Branch bodies: full double walls
  ...corridorWalls([sq[4], sq[5], sq[6], sq[7]]),
  ...corridorWalls([sq[8], sq[9], sq[10], sq[11]]),
  // Merge exits: outer wall only per branch (inner walls would cross each other approaching sq12)
  singleWall(sq[7],  sq[12], false), // upper merge exit: outer/top wall only
  singleWall(sq[11], sq[12], true),  // lower merge exit: outer/bottom wall only
  // End section — full double walls sq12→sq24
  ...corridorWalls([sq[12], sq[13], sq[14], sq[15], sq[16], sq[17], sq[18], sq[19], sq[20], sq[21], sq[22], sq[23], sq[24]]),
];

const boundaryWalls: Wall[] = [
  { x1: 10,  y1: 10,  x2: 990, y2: 10  },
  { x1: 10,  y1: 450, x2: 990, y2: 450 },
  { x1: 10,  y1: 10,  x2: 10,  y2: 450 },
  { x1: 990, y1: 10,  x2: 990, y2: 450 },
];

const walls: Wall[] = [...corridorWallList, ...boundaryWalls];

// No holes — with 360° aiming the corner holes were too accessible and caused frustration
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

// Track section point arrays for multi-polyline rendering (creates visible fork shape)
type Pt = { x: number; y: number };
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
