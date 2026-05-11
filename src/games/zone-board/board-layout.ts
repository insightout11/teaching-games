import type { BoardLayout, BoardSquare, Wall, HoleZone } from './types';

// Winding diagonal path: bottom-center → spiral up and across the 800×560 canvas.
// Squares spaced 80–110px apart. Holes sit in dead-end alcoves off the path,
// not at corners, so banking shots are rewarded rather than punished.
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  { index: 0,  x: 400, y: 520, type: 'start' },
  { index: 1,  x: 310, y: 490, type: 'question' },
  { index: 2,  x: 220, y: 455, type: 'safe' },
  { index: 3,  x: 150, y: 400, type: 'question' },
  { index: 4,  x: 110, y: 330, type: 'boost' },        // hidden
  { index: 5,  x: 130, y: 260, type: 'question' },
  { index: 6,  x: 180, y: 200, type: 'question-boost' },
  { index: 7,  x: 250, y: 155, type: 'safe' },
  { index: 8,  x: 340, y: 120, type: 'question' },
  { index: 9,  x: 440, y: 100, type: 'safe' },
  { index: 10, x: 540, y: 115, type: 'question' },
  { index: 11, x: 630, y: 155, type: 'trap' },          // hidden
  { index: 12, x: 690, y: 220, type: 'question' },
  { index: 13, x: 700, y: 300, type: 'freeze' },
  { index: 14, x: 670, y: 375, type: 'question' },
  { index: 15, x: 610, y: 440, type: 'safe' },
  { index: 16, x: 530, y: 470, type: 'question' },
  { index: 17, x: 450, y: 455, type: 'question' },
  { index: 18, x: 370, y: 430, type: 'safe' },
  { index: 19, x: 290, y: 400, type: 'question' },
  { index: 20, x: 230, y: 350, type: 'boost' },         // hidden
  { index: 21, x: 200, y: 285, type: 'question-boost' },
  { index: 22, x: 155, y: 210, type: 'trap' },          // hidden
  { index: 23, x: 120, y: 145, type: 'question' },
  { index: 24, x: 80,  y: 80,  type: 'finish' },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  revealed: s.type !== 'boost' && s.type !== 'trap',
}));

// Generate corridor walls from path segments.
// For each consecutive pair of squares, produce two wall lines offset ±HALF_WIDTH
// perpendicular to the segment direction.
const HALF_WIDTH = 38;

function corridorWalls(pts: { x: number; y: number }[]): Wall[] {
  const walls: Wall[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[i + 1].x, by = pts[i + 1].y;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1) continue;
    // Perpendicular unit vector
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

// Canvas boundary walls
const boundaryWalls: Wall[] = [
  { x1: 10,  y1: 10,  x2: 790, y2: 10  },
  { x1: 10,  y1: 550, x2: 790, y2: 550 },
  { x1: 10,  y1: 10,  x2: 10,  y2: 550 },
  { x1: 790, y1: 10,  x2: 790, y2: 550 },
];

const walls: Wall[] = [...corridorWallList, ...boundaryWalls];

// Holes sit in dead-end alcoves off the path, not at corner-banking spots.
// Hole A: bottom-left pocket — catches hard-left shots from sq3→sq4 corridor.
// Hole B: top-right pocket — catches overpowered shots from sq10→sq11 corridor.
const holes: HoleZone[] = [
  { x: 60,  y: 475, radius: 32 },
  { x: 740, y: 95,  radius: 32 },
];

export const BOARD_LAYOUT: BoardLayout = {
  width: 800,
  height: 560,
  squares,
  walls,
  holes,
};

// SVG polyline points string for the track center-line (used as thick stroke background)
export const TRACK_POLYLINE = rawSquares
  .map(s => `${s.x},${s.y}`)
  .join(' ');

// Track stroke width (corridor visual width)
export const TRACK_STROKE_WIDTH = HALF_WIDTH * 2;

// Square type configuration
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
