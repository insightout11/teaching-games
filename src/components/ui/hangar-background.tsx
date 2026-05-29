'use client';

// Arched aircraft hangar drawn as a BOUNDED building — no ground of its own.
// It fills its parent wrapper (which sizes + positions it); the existing
// SkyBackground runway shows beneath it. viewBox 0 0 1200 700 with the
// building base flush at the bottom (y=700) so a plane parked at the mouth
// sits on the same line. preserveAspectRatio keeps the whole building visible.
//
// Draw order (back → front):
//   1. Back arch silhouette (roof, peeks up-left of the front = depth)
//   2. Left side wall (parallelogram receding back = depth)
//   3. Front face arch (lit metal silhouette)
//   4. Opening cut into the front — recessed interior you look INTO
//      (receding side walls + floor + warm-lit back wall + ceiling lights)
//   5. Rim highlight around the opening

export function HangarBackground({ className }: { className?: string }) {
  // ── Geometry (mouth centred near x=645 of the 1200-wide viewBox) ──────────
  const FRONT_OUTER =
    'M105,700 L105,380 C105,200 355,70 645,70 C935,70 1185,200 1185,380 L1185,700 Z';
  const OPENING =
    'M160,700 L160,400 C160,235 395,120 645,120 C895,120 1130,235 1130,400 L1130,700 Z';
  const BACK_ARCH =
    'M15,645 L15,325 C15,145 265,15 555,15 C845,15 1095,145 1095,325 L1095,645 Z';
  const LEFT_WALL = '105,700 15,645 15,325 105,380';
  const BACK_WALL =
    'M285,670 L285,430 C285,310 445,230 645,230 C845,230 1005,310 1005,430 L1005,670 Z';
  const INT_FLOOR = '160,700 1130,700 1005,670 285,670';
  const INT_WALL_L = '160,700 285,670 285,430 160,400';
  const INT_WALL_R = '1130,700 1005,670 1005,430 1130,400';

  const lights = [485, 645, 805] as const;

  return (
    <svg
      viewBox="0 0 1200 700"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="hbg-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4655" />
          <stop offset="0.55" stopColor="#28323e" />
          <stop offset="1" stopColor="#1b222b" />
        </linearGradient>
        <radialGradient id="hbg-backwall" cx="0.5" cy="0.62" r="0.75">
          <stop offset="0" stopColor="rgba(150,92,30,0.95)" />
          <stop offset="0.5" stopColor="rgba(78,44,14,0.95)" />
          <stop offset="1" stopColor="rgba(30,17,6,0.98)" />
        </radialGradient>
        <filter id="hbg-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="hbg-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── DEPTH: roof seen behind + receding side wall ─────────────────── */}
      <path d={BACK_ARCH} fill="#1a222d" />
      <polygon points={LEFT_WALL} fill="#111720" />
      <polygon points={LEFT_WALL} fill="rgba(0,0,0,0.22)" />

      {/* ── FRONT FACE ───────────────────────────────────────────────────── */}
      <path d={FRONT_OUTER} fill="url(#hbg-front)" />
      {/* Eave highlight along the top of the arch */}
      <path d="M105,380 C105,200 355,70 645,70 C935,70 1185,200 1185,380"
        fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2.5" />

      {/* ── OPENING (recessed interior you look INTO) ────────────────────── */}
      <path d={OPENING} fill="#0a0805" />
      <polygon points={INT_WALL_L} fill="rgba(28,16,6,0.96)" />
      <polygon points={INT_WALL_R} fill="rgba(20,11,4,0.96)" />
      <polygon points={INT_FLOOR} fill="rgba(34,19,7,0.97)" />
      <path d={BACK_WALL} fill="url(#hbg-backwall)" />
      <ellipse cx="645" cy="470" rx="250" ry="170"
        fill="rgba(210,120,30,0.22)" filter="url(#hbg-soft)" />

      {/* Interior ceiling lights on the back wall */}
      {lights.map((lx) => (
        <g key={lx}>
          <rect x={lx - 1.5} y={258} width="3" height="20" fill="rgba(150,130,90,0.5)" />
          <ellipse cx={lx} cy={288} rx="13" ry="5"
            fill="rgba(255,210,110,0.85)" filter="url(#hbg-bulb)" />
          <circle cx={lx} cy={288} r="28"
            fill="rgba(255,180,60,0.18)" filter="url(#hbg-bulb)" />
        </g>
      ))}

      {/* ── RIM: lit metal frame around the opening ──────────────────────── */}
      <path d={OPENING} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
      <path d={OPENING} fill="none" stroke="rgba(225,135,35,0.30)" strokeWidth="9"
        filter="url(#hbg-soft)" />

      {/* Company-stripe accent on the front fascia */}
      <path d="M395,118 C495,96 795,96 895,118"
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
    </svg>
  );
}
