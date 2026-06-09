import type { LandmarkLayerProps } from '../types';

// Obelisco (Buenos Aires) — foreground slot. A tall, clean four-sided obelisk
// with a small window near the apex. Base-center origin, built upward.
export function ObeliskLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* base step */}
      <rect x={-46} y={-30} width={92} height={30} fill={f} />
      {/* tapering shaft */}
      <polygon points="-34 -30, -8 -330, 8 -330, 34 -30" fill={f} />
      {/* pyramidion */}
      <polygon points="-8 -330, 0 -372, 8 -330" fill={f} />
      {/* lit shading on one face */}
      <polygon points="0 -372, 8 -330, 34 -30, 0 -30" fill={palette.landmarkAccent} opacity={0.16} />
      {/* small apex opening */}
      <rect x={-3} y={-310} width={6} height={14} fill={palette.windowWarm} opacity={0.6} />
    </g>
  );
}
