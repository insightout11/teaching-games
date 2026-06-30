import type { LandmarkLayerProps } from '../types';

// Statue of Liberty (New York) — foreground slot, the scene's hero. Robed figure
// in oxidised copper (verdigris) on a granite pedestal + star-fort base, raising
// a gilded torch, with a seven-ray radiate crown and the tablet in the left arm.
// Base-center origin (pedestal base at y=0), built upward. Uses fixed iconic
// colours (no palette) so the floodlit monument stays bright at any time of day;
// every form is two-tone (lit left / shaded right) so nothing reads as a flat blob.
export function StatueLibertyLandmark({ idPrefix }: LandmarkLayerProps) {
  // Oxidised copper — the classic Liberty verdigris.
  const copper = 'rgb(78,168,150)';
  const copperLit = 'rgb(126,202,182)';
  const copperShade = 'rgba(38,112,100,0.96)';
  // Floodlit granite pedestal.
  const stone = 'rgb(150,150,140)';
  const stoneLit = 'rgb(182,182,170)';
  const stoneShade = 'rgba(0,0,0,0.22)';
  const gold = 'rgb(255,206,112)';
  const glowId = `${idPrefix}-liberty-flame`;

  // Seven-ray radiate crown spikes, swept across the top arc of the head.
  const headY = -342;
  const rHead = 13;
  const crown = [-66, -44, -22, 0, 22, 44, 66].map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const tip = rHead + 22;
    const hw = 3;
    const bx = rHead * s;
    const by = headY - rHead * c;
    const tx = tip * s;
    const ty = headY - tip * c;
    return (
      <polygon
        key={i}
        points={`${bx - c * hw} ${by - s * hw}, ${bx + c * hw} ${by + s * hw}, ${tx} ${ty}`}
        fill={deg <= 0 ? copperLit : copper}
      />
    );
  });

  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,224,150,0.85)" />
          <stop offset="100%" stopColor="rgba(255,206,112,0)" />
        </radialGradient>
      </defs>

      {/* ── Star-fort base (Fort Wood) — wide battered walls, two-tone ── */}
      <polygon points="-88 0, -74 -40, 74 -40, 88 0" fill={stone} />
      <polygon points="6 -40, 74 -40, 88 0, 6 0" fill={stoneShade} />
      {/* bastion points hinting the eleven-point star */}
      <polygon points="-74 -40, -64 -40, -69 -54" fill={stone} />
      <polygon points="74 -40, 64 -40, 69 -54" fill={stoneShade} />

      {/* ── Granite pedestal column ── */}
      <rect x={-50} y={-150} width={100} height={110} fill={stone} />
      <rect x={6} y={-150} width={44} height={110} fill={stoneShade} />
      {/* cornice cap + plinth */}
      <rect x={-56} y={-162} width={112} height={14} fill={stoneLit} />
      <rect x={6} y={-162} width={50} height={14} fill={stoneShade} />
      <rect x={-34} y={-190} width={68} height={28} fill={stone} />
      <rect x={6} y={-190} width={28} height={28} fill={stoneShade} />

      {/* ── Robed figure (verdigris) ── */}
      {/* flowing robe — base flares wider than the shoulders */}
      <path d="M -32 -190 L -22 -316 L 22 -316 L 32 -190 Z" fill={copper} />
      {/* lit left edge + shaded right half */}
      <path d="M -32 -190 L -22 -316 L -14 -316 L -24 -190 Z" fill={copperLit} />
      <path d="M 2 -316 L 22 -316 L 32 -190 L 2 -190 Z" fill={copperShade} />
      {/* robe folds */}
      <path d="M -10 -200 L -6 -310" stroke={copperShade} strokeWidth={2} fill="none" opacity={0.7} />
      <path d="M 8 -200 L 6 -308" stroke="rgba(20,80,72,0.5)" strokeWidth={2} fill="none" />

      {/* head + neck */}
      <rect x={-5} y={-328} width={10} height={16} fill={copper} />
      <circle cx={0} cy={headY} r={rHead} fill={copper} />
      <path d={`M 0 ${headY - rHead} A ${rHead} ${rHead} 0 0 1 0 ${headY + rHead} Z`} fill={copperShade} opacity={0.5} />
      {crown}

      {/* ── Raised right arm + gilded torch ── */}
      <polygon points="16 -304, 28 -308, 50 -396, 40 -400" fill={copper} />
      <polygon points="16 -304, 22 -306, 44 -396, 40 -400" fill={copperLit} />
      {/* torch handle + bowl */}
      <rect x={40} y={-414} width={12} height={20} rx={2} fill={gold} />
      <path d="M 38 -414 L 54 -414 L 50 -406 L 42 -406 Z" fill={gold} />
      {/* flame + glow */}
      <circle cx={46} cy={-426} r={20} fill={`url(#${glowId})`} />
      <path d="M 46 -448 C 36 -428 40 -416 46 -418 C 52 -416 56 -428 46 -448 Z" fill={gold} />
      <path d="M 46 -442 C 42 -430 44 -421 46 -422 C 49 -421 50 -430 46 -442 Z" fill="rgba(255,244,210,0.95)" />

      {/* ── Left arm cradling the tablet ── */}
      <polygon points="-18 -300, -8 -302, -20 -248, -30 -250" fill={copperShade} />
      <g transform="rotate(-18 -34 -250)">
        <rect x={-50} y={-272} width={32} height={42} rx={2} fill={copperLit} />
        <rect x={-34} y={-272} width={16} height={42} fill={copper} />
        {/* engraved lines */}
        {[-262, -254, -246, -238].map((y) => (
          <rect key={y} x={-46} y={y} width={24} height={1.6} fill={copperShade} opacity={0.6} />
        ))}
      </g>
    </g>
  );
}
