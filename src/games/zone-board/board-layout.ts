import type { BoardLayout, BoardSquare, Wall, HoleZone } from './types';

// 3-row serpentine on 1000×460 canvas.
// Row 1 (bottom): left→right. Right connector: up. Row 2 (middle): right→left.
// Left connector: up. Row 3 (top): left→right → FINISH.
// Squares spaced ~110px apart. No loops, no self-intersections.
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  // Row 1 — bottom, left → right
  { index: 0,  x:  85, y: 400, type: 'start' },
  { index: 1,  x: 195, y: 393, type: 'question' },
  { index: 2,  x: 305, y: 387, type: 'safe' },
  { index: 3,  x: 415, y: 390, type: 'question' },
  { index: 4,  x: 525, y: 387, type: 'boost' },        // hidden
  { index: 5,  x: 635, y: 393, type: 'question' },
  { index: 6,  x: 745, y: 400, type: 'question-boost' },

  // Right connector — diagonal up
  { index: 7,  x: 828, y: 335, type: 'safe' },
  { index: 8,  x: 855, y: 262, type: 'question' },

  // Row 2 — middle, right → left
  { index: 9,  x: 775, y: 220, type: 'trap' },          // hidden
  { index: 10, x: 665, y: 213, type: 'question' },
  { index: 11, x: 555, y: 208, type: 'safe' },
  { index: 12, x: 445, y: 211, type: 'question' },
  { index: 13, x: 335, y: 217, type: 'freeze' },
  { index: 14, x: 225, y: 223, type: 'question' },

  // Left connector — diagonal up
  { index: 15, x: 148, y: 162, type: 'safe' },
  { index: 16, x: 105, y:  95, type: 'question' },

  // Row 3 — top, left → right → FINISH
  { index: 17, x: 195, y:  57, type: 'question-boost' },
  { index: 18, x: 308, y:  50, type: 'safe' },
  { index: 19, x: 420, y:  46, type: 'question' },
  { index: 20, x: 532, y:  50, type: 'boost' },         // hidden
  { index: 21, x: 644, y:  57, type: 'question' },
  { index: 22, x: 745, y:  63, type: 'trap' },          // hidden
  { index: 23, x: 845, y:  57, type: 'question' },
  { index: 24, x: 930, y:  46, type: 'finish' },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  revealed: s.type !== 'boost' && s.type !== 'trap',
}));

// Corridor walls computed from path segments.
// Two offset lines per segment, perpendicular to the direction.
const HALF_WIDTH = 38;

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

const pathPts = rawSquares.map(s => ({ x: s.x, y: s.y }));
const corridorWallList = corridorWalls(pathPts);

// Canvas boundary
const boundaryWalls: Wall[] = [
  { x1: 10,  y1: 10,  x2: 990, y2: 10  },
  { x1: 10,  y1: 450, x2: 990, y2: 450 },
  { x1: 10,  y1: 10,  x2: 10,  y2: 450 },
  { x1: 990, y1: 10,  x2: 990, y2: 450 },
];

const walls: Wall[] = [...corridorWallList, ...boundaryWalls];

// Holes sit in dead-end pockets off the path.
// Hole A: bottom-right — catches sq6 shots that overshoot past the right connector.
// Hole B: top-left — catches sq15→sq16 shots that veer hard left.
const holes: HoleZone[] = [
  { x: 955, y: 415, radius: 34 },
  { x:  52, y: 118, radius: 34 },
];

export const CANVAS_W = 1000;
export const CANVAS_H = 460;

export const BOARD_LAYOUT: BoardLayout = {
  width: CANVAS_W,
  height: CANVAS_H,
  squares,
  walls,
  holes,
};

export const TRACK_POLYLINE = rawSquares.map(s => `${s.x},${s.y}`).join(' ');
export const TRACK_STROKE_WIDTH = HALF_WIDTH * 2;

export const SQUARE_CONFIG: Record<string, { color: string; label: string }> = {
  start:            { color: '#10b981', label: 'START'   },
  finish:           { color: '#f59e0b', label: 'FINISH'  },
  question:         { color: '#3b82f6', label: 'Q?'      },
  safe:             { color: '#64748b', label: 'SAFE'    },
  boost:            { color: '#f59e0b', label: 'BOOST'   },
  trap:             { color: '#ef4444', label: 'TRAP'    },
  'question-boost': { color: '#a855f7', label: 'Q+BOOST' },
  freeze:           { color: '#06b6d4', label: 'FREEZE'  },
  hole:             { color: '#ef4444', label: 'DANGER'  },
};
