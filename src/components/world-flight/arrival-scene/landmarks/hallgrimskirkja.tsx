import type { LandmarkLayerProps } from '../types';

// Hallgrímskirkja (Reykjavik) — foreground slot. Expressionist church with a
// stepped, splayed spire echoing basalt columns. Base-center origin, upward.
export function HallgrimskirkjaLandmark({ palette }: LandmarkLayerProps) {
  // Symmetric stepped wings descending from the central tower.
  const wings = [
    { x: 30, w: 26, h: 150 },
    { x: 56, w: 26, h: 120 },
    { x: 82, w: 26, h: 94 },
    { x: 108, w: 26, h: 70 },
    { x: 134, w: 26, h: 48 },
  ];
  return (
    <g aria-hidden>
      {/* splayed wings, mirrored */}
      {wings.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={-s.h} width={s.w} height={s.h} fill={palette.landmarkFill} />
          <rect x={-s.x - s.w} y={-s.h} width={s.w} height={s.h} fill={palette.landmarkFill} />
        </g>
      ))}
      {/* central tower */}
      <rect x={-30} y={-300} width={60} height={300} fill={palette.landmarkFill} />
      {/* tapering spire */}
      <polygon points="-30 -300, 0 -420, 30 -300" fill={palette.landmarkFill} />
      <polygon points="-12 -380, 0 -456, 12 -380" fill={palette.landmarkFill} />
      {/* tall door + a slit window accent */}
      <path d="M -16 0 L -16 -54 Q 0 -70 16 -54 L 16 0 Z" fill={palette.landmarkAccent} opacity={0.4} />
      <rect x={-4} y={-300} width={8} height={120} fill={palette.landmarkAccent} opacity={0.3} />
    </g>
  );
}
