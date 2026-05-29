'use client';

// Full-screen hangar interior background for the lobby.
// SVG viewBox 0 0 1440 900, preserveAspectRatio="xMidYMid slice" fills any screen.
//
// Layout zones (% of 900px height):
//   Ceiling  y=0–198  (22%) — dark with structural beams + pendant lights
//   Interior y=198–792 (66%) — warm dark interior visible through open door
//   Floor    y=792–900 (12%) — dark concrete
//
// Left/right door openings (x=0–115 and x=1325–1440) are SVG-transparent,
// so the SkyBackground behind shows as sky slivers.

export function HangarBackground({ className }: { className?: string }) {
  const VW = 1440, VH = 900;
  const CY  = 198;   // ceiling bottom / interior top
  const FY  = 792;   // interior bottom / floor top
  const PW  = 115;   // door pillar width on each side

  const dark     = 'rgba(4,7,12,0.98)';
  const interior = 'rgba(14,7,2,0.97)';
  const concrete = 'rgba(6,9,14,0.97)';
  const seam     = 'rgba(255,255,255,0.028)';

  const lights = [360, 720, 1080] as const;

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
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
        aria-hidden
      >
        <defs>
          <filter id="hbg-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
          <filter id="hbg-fix" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="11" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hbg-cone" x="-60%" y="-20%" width="220%" height="140%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter id="hbg-edge" x="-60%" y="-10%" width="220%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ── CEILING ─────────────────────────────────────────────────────── */}
        <rect x="0" y="0" width={VW} height={CY} fill={dark} />

        {/* Horizontal ceiling panel seams */}
        {([44, 98, 150] as const).map(y => (
          <rect key={y} x="0" y={y} width={VW} height="1.5" fill={seam} />
        ))}

        {/* Structural vertical sub-beams */}
        {([350, 720, 1090] as const).map(x => (
          <rect key={x} x={x - 4} y="0" width="8" height={CY} fill="rgba(255,255,255,0.018)" />
        ))}

        {/* Main fascia beam at ceiling/interior join */}
        <rect x="0" y={CY - 22} width={VW} height="22" fill="rgba(3,5,9,1)" />
        <rect x="0" y={CY - 23} width={VW} height="2" fill="rgba(255,255,255,0.04)" />

        {/* ── LIGHT CONES — drawn before walls so they fade naturally ─────── */}
        {lights.map(lx => (
          <polygon
            key={lx}
            points={`${lx - 90},${CY} ${lx + 90},${CY} ${lx + 290},${FY} ${lx - 290},${FY}`}
            fill="rgba(215,130,25,0.055)"
            filter="url(#hbg-cone)"
          />
        ))}

        {/* ── INTERIOR BACK WALL ──────────────────────────────────────────── */}
        <rect x={PW} y={CY} width={VW - 2 * PW} height={FY - CY} fill={interior} />

        {/* Central ambient glow from all lights combined */}
        <ellipse
          cx={VW / 2} cy={(CY + FY) / 2} rx="580" ry="270"
          fill="rgba(185,90,10,0.11)" filter="url(#hbg-glow)"
        />

        {/* Back wall structural panel lines */}
        {([260, 440, 600] as const).map(dy => (
          <rect key={dy} x={PW} y={CY + dy} width={VW - 2 * PW} height="1.5" fill={seam} />
        ))}

        {/* ── PENDANT LIGHTS ──────────────────────────────────────────────── */}
        {lights.map(lx => (
          <g key={lx}>
            {/* Pendant stem */}
            <rect x={lx - 2} y={CY - 22} width="4" height="44"
              fill="rgba(160,140,100,0.45)" />
            {/* Fixture disc */}
            <ellipse cx={lx} cy={CY + 24} rx="32" ry="11"
              fill="rgba(215,175,70,0.72)" filter="url(#hbg-fix)" />
            {/* Bulb core */}
            <circle cx={lx} cy={CY + 24} r="15" fill="rgba(255,225,100,0.92)" />
            {/* Wide halo */}
            <circle cx={lx} cy={CY + 24} r="56"
              fill="rgba(255,175,45,0.22)" filter="url(#hbg-fix)" />
          </g>
        ))}

        {/* ── DOOR FRAME PILLARS ──────────────────────────────────────────── */}
        {/* Left pillar */}
        <rect x="0" y={CY} width={PW} height={FY - CY} fill={dark} />
        <rect x={PW - 2}  y={CY} width="2" height={FY - CY} fill="rgba(255,255,255,0.034)" />
        <rect x={PW - 12} y={CY} width="2" height={FY - CY} fill={seam} />
        <rect x={PW - 22} y={CY} width="2" height={FY - CY} fill={seam} />
        {/* Warm light spill onto left pillar inner edge */}
        <rect x={PW - 2} y={CY} width="20" height={FY - CY}
          fill="rgba(185,85,8,0.18)" filter="url(#hbg-edge)" />

        {/* Right pillar */}
        <rect x={VW - PW} y={CY} width={PW} height={FY - CY} fill={dark} />
        <rect x={VW - PW}     y={CY} width="2" height={FY - CY} fill="rgba(255,255,255,0.034)" />
        <rect x={VW - PW + 10} y={CY} width="2" height={FY - CY} fill={seam} />
        <rect x={VW - PW + 20} y={CY} width="2" height={FY - CY} fill={seam} />
        {/* Warm light spill onto right pillar inner edge */}
        <rect x={VW - PW - 18} y={CY} width="20" height={FY - CY}
          fill="rgba(185,85,8,0.18)" filter="url(#hbg-edge)" />

        {/* ── FLOOR ───────────────────────────────────────────────────────── */}
        <rect x="0" y={FY} width={VW} height={VH - FY} fill={concrete} />

        {/* Floor/wall join highlight */}
        <rect x="0" y={FY} width={VW} height="2" fill="rgba(255,255,255,0.04)" />

        {/* Floor expansion joint lines */}
        {([350, 720, 1090] as const).map(x => (
          <rect key={x} x={x} y={FY} width="1.5" height={VH - FY} fill="rgba(255,255,255,0.04)" />
        ))}

        {/* Floor centerline taxi marking */}
        <rect x={VW / 2 - 48} y={FY + 10} width="96" height="3" rx="1"
          fill="rgba(255,255,255,0.08)" />

        {/* Floor light pools below each pendant */}
        {lights.map(lx => (
          <ellipse key={lx} cx={lx} cy={FY + 22} rx="120" ry="24"
            fill="rgba(215,130,25,0.09)" filter="url(#hbg-glow)" />
        ))}
      </svg>
    </div>
  );
}
