'use client';

// Arched aircraft hangar drawn as a BOUNDED building sitting in a scene.
// viewBox 0 0 1440 900, preserveAspectRatio="xMidYMid meet" so the WHOLE
// building is always visible — the transparent area around it lets the
// SkyBackground behind show as sky (top corners + side gaps).
//
// Composition (back-to-front draw order):
//   1. Tarmac ground (lower portion) with perspective centerline
//   2. Back arch silhouette (roof, peeks up-left of the front = depth)
//   3. Left side wall (parallelogram receding back = depth)
//   4. Front face arch (the building's front silhouette, lit metal)
//   5. Opening cut into the front face — recessed interior you look INTO
//      (receding side walls + floor + warm-lit back wall + ceiling lights)
//   6. Rim highlight + roof corrugation texture

export function HangarBackground({ className }: { className?: string }) {
  const VW = 1440, VH = 900;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const FRONT_OUTER =
    'M180,700 L180,380 C180,200 430,70 720,70 C1010,70 1260,200 1260,380 L1260,700 Z';
  const OPENING =
    'M235,700 L235,400 C235,235 470,120 720,120 C970,120 1205,235 1205,400 L1205,700 Z';
  const BACK_ARCH =
    'M90,645 L90,325 C90,145 340,15 630,15 C920,15 1170,145 1170,325 L1170,645 Z';
  const LEFT_WALL = '180,700 90,645 90,325 180,380';
  // Interior recess
  const BACK_WALL =
    'M360,670 L360,430 C360,310 520,230 720,230 C920,230 1080,310 1080,430 L1080,670 Z';
  const INT_FLOOR = '235,700 1205,700 1080,670 360,670';
  const INT_WALL_L = '235,700 360,670 360,430 235,400';
  const INT_WALL_R = '1205,700 1080,670 1080,430 1205,400';
  const GROUND = '-200,900 1640,900 1320,700 120,700';

  const lights = [560, 720, 880] as const;

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 1 }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
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
          <linearGradient id="hbg-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1219" />
            <stop offset="1" stopColor="#070a0f" />
          </linearGradient>
          <filter id="hbg-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="hbg-bulb" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── GROUND / TARMAC ──────────────────────────────────────────────── */}
        <polygon points={GROUND} fill="url(#hbg-ground)" />
        {/* Tarmac edge highlight where it meets the building */}
        <polygon points="120,700 1320,700 1320,704 120,704" fill="rgba(255,255,255,0.05)" />
        {/* Perspective centerline — tapering dashes toward the mouth */}
        {([
          { y: 880, w: 64 },
          { y: 815, w: 48 },
          { y: 760, w: 34 },
          { y: 720, w: 22 },
        ] as const).map(({ y, w }) => (
          <rect key={y} x={720 - w / 2} y={y} width={w} height={y > 850 ? 18 : 12} rx="2"
            fill="rgba(235,195,60,0.32)" />
        ))}
        {/* Warm light bleeding from the open mouth onto the apron in front */}
        <ellipse cx="720" cy="720" rx="430" ry="80"
          fill="rgba(220,135,35,0.16)" filter="url(#hbg-soft)" />

        {/* ── DEPTH: roof seen behind + receding side wall ─────────────────── */}
        <path d={BACK_ARCH} fill="#1a222d" />
        <polygon points={LEFT_WALL} fill="#111720" />
        {/* shading seam on the side wall */}
        <polygon points="180,700 90,645 90,325 180,380" fill="rgba(0,0,0,0.25)" />

        {/* ── FRONT FACE ───────────────────────────────────────────────────── */}
        <path d={FRONT_OUTER} fill="url(#hbg-front)" />
        {/* Roof corrugation ribs following the arch */}
        {([0.18, 0.34, 0.5, 0.66, 0.82] as const).map((t) => {
          const x = 180 + t * (1260 - 180);
          return (
            <path
              key={t}
              d={`M${x},700 L${x},380 C${x},${230 + Math.abs(t - 0.5) * 180} ${720 + (x - 720) * 0.4},${90 + Math.abs(t - 0.5) * 120} 720,${72 + 0}`}
              fill="none"
              stroke="rgba(255,255,255,0.035)"
              strokeWidth="2"
            />
          );
        })}
        {/* Eave shadow line just inside the front silhouette top */}
        <path d="M180,380 C180,200 430,70 720,70 C1010,70 1260,200 1260,380"
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2.5" />

        {/* ── OPENING (recessed interior you look INTO) ────────────────────── */}
        {/* base dark fill of the mouth */}
        <path d={OPENING} fill="#0a0805" />
        {/* receding interior side walls + floor */}
        <polygon points={INT_WALL_L} fill="rgba(28,16,6,0.96)" />
        <polygon points={INT_WALL_R} fill="rgba(20,11,4,0.96)" />
        <polygon points={INT_FLOOR} fill="rgba(34,19,7,0.97)" />
        {/* warm-lit back wall at the depth of the hangar */}
        <path d={BACK_WALL} fill="url(#hbg-backwall)" />
        {/* ambient interior glow */}
        <ellipse cx="720" cy="500" rx="300" ry="190"
          fill="rgba(210,120,30,0.20)" filter="url(#hbg-soft)" />

        {/* Interior ceiling lights (small, on the back wall) */}
        {lights.map((lx) => (
          <g key={lx}>
            <rect x={lx - 1.5} y={258} width="3" height="20" fill="rgba(150,130,90,0.5)" />
            <ellipse cx={lx} cy={288} rx="14" ry="5"
              fill="rgba(255,210,110,0.85)" filter="url(#hbg-bulb)" />
            <circle cx={lx} cy={288} r="30"
              fill="rgba(255,180,60,0.18)" filter="url(#hbg-bulb)" />
          </g>
        ))}

        {/* ── RIM: lit metal frame around the opening ──────────────────────── */}
        <path d={OPENING} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
        {/* warm spill on the inner edge of the rim */}
        <path d={OPENING} fill="none" stroke="rgba(225,135,35,0.30)" strokeWidth="9"
          filter="url(#hbg-soft)" />

        {/* Company-stripe accent on the front fascia (top of arch) */}
        <path d="M470,118 C570,96 870,96 970,118"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      </svg>
    </div>
  );
}
