import type { BoardLayout, BoardSquare, Wall, HoleZone } from './types';

// S-shaped course: bottom row goes right→left, middle row left→right, top row right→left
// Start: bottom-right. Finish: top-left.
const rawSquares: Omit<BoardSquare, 'revealed'>[] = [
  // Bottom row (right → left, y=500)
  { index: 0,  x: 700, y: 500, type: 'start' },
  { index: 1,  x: 600, y: 500, type: 'question' },
  { index: 2,  x: 500, y: 500, type: 'safe' },
  { index: 3,  x: 400, y: 500, type: 'boost' },       // hidden
  { index: 4,  x: 300, y: 500, type: 'question' },
  { index: 5,  x: 200, y: 500, type: 'trap' },         // hidden
  { index: 6,  x: 120, y: 500, type: 'question-boost' },

  // Left turn (going up)
  { index: 7,  x: 80,  y: 430, type: 'safe' },
  { index: 8,  x: 80,  y: 350, type: 'question' },

  // Middle row (left → right, y=300)
  { index: 9,  x: 80,  y: 300, type: 'safe' },
  { index: 10, x: 180, y: 300, type: 'hole' },
  { index: 11, x: 280, y: 300, type: 'question' },
  { index: 12, x: 380, y: 300, type: 'question' },
  { index: 13, x: 480, y: 300, type: 'question' },
  { index: 14, x: 580, y: 300, type: 'freeze' },
  { index: 15, x: 680, y: 300, type: 'question-boost' },

  // Right turn (going up)
  { index: 16, x: 720, y: 240, type: 'safe' },
  { index: 17, x: 720, y: 170, type: 'trap' },         // hidden

  // Top row (right → left, y=110)
  { index: 18, x: 680, y: 110, type: 'question' },
  { index: 19, x: 580, y: 110, type: 'hole' },
  { index: 20, x: 480, y: 110, type: 'safe' },
  { index: 21, x: 380, y: 110, type: 'question' },
  { index: 22, x: 280, y: 110, type: 'question' },
  { index: 23, x: 180, y: 110, type: 'boost' },        // hidden
  { index: 24, x: 100, y: 110, type: 'finish' },
];

const squares: BoardSquare[] = rawSquares.map(s => ({
  ...s,
  // Boost and trap squares start hidden (face-down)
  revealed: s.type !== 'boost' && s.type !== 'trap',
}));

// Corridor walls (line segments). Corridors are 80px wide.
// Bottom corridor: y=460 to y=540, x=120 to x=740
// Left transition: x=40 to x=120, y=260 to y=460
// Middle corridor: y=260 to y=340, x=40 to x=680
// Right transition: x=680 to x=760, y=70 to y=340
// Top corridor: y=70 to y=150, x=60 to x=760
const walls: Wall[] = [
  // Bottom corridor
  { x1: 120, y1: 540, x2: 740, y2: 540 }, // bottom
  { x1: 120, y1: 460, x2: 740, y2: 460 }, // top
  { x1: 740, y1: 460, x2: 740, y2: 540 }, // right end (near START)

  // Left transition
  { x1: 40,  y1: 260, x2: 40,  y2: 450 }, // outer/left wall (gap at bottom for Hole 1)
  { x1: 120, y1: 260, x2: 120, y2: 460 }, // inner/right wall

  // Middle corridor
  { x1: 40,  y1: 260, x2: 680, y2: 260 }, // top wall
  { x1: 40,  y1: 340, x2: 680, y2: 340 }, // bottom wall

  // Right transition
  { x1: 760, y1: 155, x2: 760, y2: 350 }, // outer/right wall (gap at top for Hole 2)
  { x1: 680, y1: 155, x2: 680, y2: 260 }, // inner/left partial wall

  // Top corridor
  { x1: 60,  y1: 70,  x2: 760, y2: 70  }, // top wall
  { x1: 60,  y1: 150, x2: 680, y2: 150 }, // bottom wall
  { x1: 60,  y1: 70,  x2: 60,  y2: 150 }, // left end wall (FINISH area)

  // Right transition top connector
  { x1: 680, y1: 70,  x2: 760, y2: 70  },
  { x1: 760, y1: 70,  x2: 760, y2: 155 },

  // Canvas boundary
  { x1: 10,  y1: 10,  x2: 790, y2: 10  },
  { x1: 10,  y1: 590, x2: 790, y2: 590 },
  { x1: 10,  y1: 10,  x2: 10,  y2: 590 },
  { x1: 790, y1: 10,  x2: 790, y2: 590 },
];

// Hole zones: puck disappears when it enters these regions during animation
const holes: HoleZone[] = [
  { x: 55,  y: 490, radius: 28 }, // bottom-left outer corner pocket
  { x: 745, y: 295, radius: 28 }, // middle-right outer corner pocket
];

export const BOARD_LAYOUT: BoardLayout = {
  width: 800,
  height: 600,
  squares,
  walls,
  holes,
};

// Corridor rects for SVG track rendering (background fill)
export const CORRIDOR_RECTS = [
  { x: 120, y: 460, w: 620, h: 80 }, // bottom
  { x: 40,  y: 260, w: 80,  h: 200 }, // left transition
  { x: 40,  y: 260, w: 640, h: 80 },  // middle
  { x: 680, y: 70,  w: 80,  h: 270 }, // right transition
  { x: 60,  y: 70,  w: 700, h: 80 },  // top
];

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
