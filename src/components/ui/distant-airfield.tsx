'use client';

// Tiny parked-plane silhouettes far down the apron, near the grass line, to
// add depth + airfield life between the hangar and the tower. Drawn small and
// dark (lit only by a faint nav light) so they read as distant. Fills a thin
// full-width wrapper positioned at the grass line; viewBox 0 0 1440 150 with
// the planes' wheels on the baseline (y=120).

const DARK = 'rgba(17,23,31,0.95)';
const DARKER = 'rgba(10,14,20,0.96)';

function MiniPlane({ x, s, navColor }: { x: number; s: number; navColor: string }) {
  return (
    <g transform={`translate(${x},120) scale(${s})`}>
      {/* ground shadow */}
      <ellipse cx="-2" cy="3" rx="32" ry="3.5" fill="rgba(0,0,0,0.35)" />
      {/* fuselage */}
      <path d="M-32,-9 Q-36,-9 -32,-12 L18,-14 Q31,-13 31,-9 Q31,-5 18,-5 L-28,-5 Q-36,-5 -32,-9 Z" fill={DARK} />
      {/* vertical tail fin */}
      <path d="M15,-14 L27,-28 L31,-13 Z" fill={DARK} />
      {/* horizontal stabilizer */}
      <path d="M21,-14 L35,-19 L31,-12 Z" fill={DARK} />
      {/* near wing, angled down to the gear */}
      <path d="M-8,-8 L8,-8 L-2,5 L-20,5 Z" fill={DARKER} />
      {/* nose / prop spinner */}
      <line x1="-32" y1="-9" x2="-38" y2="-9" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
      {/* nav light */}
      <circle cx="-37" cy="-9" r="1.8" fill={navColor} />
    </g>
  );
}

export function DistantAirfield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 150"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax slice"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <MiniPlane x={585} s={0.82} navColor="rgba(255,170,60,0.8)" />
      <MiniPlane x={815} s={0.66} navColor="rgba(120,220,140,0.75)" />
      <MiniPlane x={1055} s={0.74} navColor="rgba(255,90,70,0.8)" />
    </svg>
  );
}
