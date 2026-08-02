import type { LandmarkLayerProps } from '../types';

// Suva Government Buildings clock tower (Fiji) — foreground slot. A colonial
// stone block with an arched colonnade, fronted by a tall square clock tower
// under a pyramidal roof. Base-center origin, built upward.
export function SuvaClockTowerLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(111, 99, 86)';
  const fLit = 'rgb(196, 178, 143)';
  const a = 'rgb(226, 187, 103)';
  const open = palette.light === 'moon' ? 'rgba(255,212,130,0.3)' : 'rgba(0,0,0,0.32)';
  return (
    <g aria-hidden>
      {/* low colonial wings */}
      <rect x={-180} y={-92} width={360} height={92} fill={fLit} />
      {/* arched colonnade */}
      {[-150, -110, -70, 70, 110, 150].map((x) => (
        <path key={x} d={`M ${x - 12} 0 L ${x - 12} -54 Q ${x} -70 ${x + 12} -54 L ${x + 12} 0 Z`} fill={open} />
      ))}
      {/* cornice */}
      <rect x={-184} y={-100} width={368} height={8} fill={a} opacity={0.28} />
      {/* central clock tower */}
      <rect x={-34} y={-300} width={68} height={208} fill={fLit} />
      <rect x={0} y={-300} width={34} height={208} fill={f} opacity={0.62} />
      {/* clock face */}
      <circle cx={0} cy={-250} r={20} fill={a} opacity={0.85} />
      <circle cx={0} cy={-250} r={20} fill="none" stroke={f} strokeWidth={3} />
      <path d="M 0 -250 L 0 -264 M 0 -250 L 10 -245" stroke={f} strokeWidth={2.5} />
      {/* belfry */}
      <rect x={-40} y={-330} width={80} height={30} fill={f} />
      {/* pyramidal roof + finial */}
      <polygon points="-40 -330, 0 -396, 40 -330" fill={f} />
      <rect x={-2} y={-416} width={4} height={20} fill={f} />
      <circle cx={0} cy={-418} r={4} fill={a} />
    </g>
  );
}
