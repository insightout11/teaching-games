import type { LandmarkLayerProps } from '../types';

// Almaty Tower on Kök-Töbe hill (Almaty) — foreground slot. A tapering concrete
// TV tower with a lower observation ring and an upper pod, topped by a tall
// antenna, standing on a rounded foothill. Base-center origin, built upward.
export function KokTobeLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(69, 96, 117)';
  const fLit = 'rgb(133, 169, 178)';
  const a = 'rgb(226, 185, 98)';
  return (
    <g aria-hidden>
      {/* foothill (opaque green — Kök-Töbe hill) */}
      <path d="M -260 0 Q -120 -72 0 -78 Q 120 -72 230 0 Z" fill="rgb(58,74,56)" />
      <path d="M 0 -78 Q 120 -72 230 0 L 120 0 Q 60 -50 0 -78 Z" fill="rgba(0,0,0,0.16)" />
      {/* tapering shaft (rising from the hilltop) */}
      <polygon points="-18 -72, -9 -360, 9 -360, 18 -72" fill={f} />
      <polygon points="-18 -72, -9 -360, 0 -360, 0 -72" fill={fLit} opacity={0.42} />
      {/* lower observation ring */}
      <ellipse cx={0} cy={-252} rx={30} ry={11} fill={fLit} />
      {/* upper observation pod */}
      <rect x={-20} y={-394} width={40} height={36} fill={fLit} />
      <rect x={-20} y={-390} width={40} height={5} fill={palette.windowWarm} opacity={0.5} />
      {/* antenna */}
      <polygon points="-5 -394, -2 -474, 2 -474, 5 -394" fill={f} />
      <rect x={-1} y={-524} width={2} height={50} fill={f} />
      <circle cx={0} cy={-526} r={3.5} fill={a} />
    </g>
  );
}
