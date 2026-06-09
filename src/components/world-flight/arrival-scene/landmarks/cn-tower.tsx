import type { LandmarkLayerProps } from '../types';

// CN Tower (Toronto) — foreground slot. Slender shaft with a sky-pod bulb and a
// tall antenna. Base-center origin, built upward.
export function CnTowerLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* tapering shaft */}
      <polygon points="-26 0, -12 -360, 12 -360, 26 0" fill={f} />
      {/* sky pod */}
      <path d="M -44 -356 C -44 -384 44 -384 44 -356 L 36 -334 C 12 -322 -12 -322 -36 -334 Z" fill={f} />
      <rect x={-30} y={-352} width={60} height={6} fill={palette.windowWarm} opacity={0.55} />
      {/* upper pod ring */}
      <rect x={-18} y={-398} width={36} height={16} rx={4} fill={f} />
      {/* antenna */}
      <polygon points="-6 -398, -2 -520, 2 -520, 6 -398" fill={f} />
      <rect x={-1.5} y={-560} width={3} height={40} fill={f} />
      <circle cx={0} cy={-562} r={4} fill={palette.landmarkAccent} />
    </g>
  );
}
