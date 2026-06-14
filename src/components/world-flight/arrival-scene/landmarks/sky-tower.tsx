import type { LandmarkLayerProps } from '../types';

// Sky Tower (Auckland) — foreground slot. A slender shaft with a multi-level
// observation pod near the top and a very tall thin antenna mast, with a low
// hint of the Harbour Bridge to the left. Base-center origin, built upward.
export function SkyTowerLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* harbour bridge hint (low, left) */}
      <path d="M -214 0 Q -150 -58 -86 0" fill="none" stroke={f} strokeWidth={6} opacity={0.65} />
      <rect x={-216} y={-30} width={6} height={30} fill={f} opacity={0.65} />
      <rect x={-90} y={-30} width={6} height={30} fill={f} opacity={0.65} />
      {/* shaft */}
      <polygon points="-13 0, -8 -384, 8 -384, 13 0" fill={f} />
      {/* observation pod (two stacked levels) */}
      <path d="M -30 -384 C -30 -410 30 -410 30 -384 L 24 -354 L -24 -354 Z" fill={f} />
      <rect x={-24} y={-378} width={48} height={6} fill={palette.windowWarm} opacity={0.5} />
      <rect x={-15} y={-426} width={30} height={18} fill={f} />
      {/* long antenna mast */}
      <polygon points="-4 -426, -1.5 -578, 1.5 -578, 4 -426" fill={f} />
      <rect x={-1} y={-620} width={2} height={42} fill={f} />
      <circle cx={0} cy={-622} r={3.5} fill={a} />
    </g>
  );
}
