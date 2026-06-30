import type { LandmarkLayerProps } from '../types';

// Cerro de Monserrate (Bogotá) — background slot. A tall green Andean peak with
// the whitewashed sanctuary church perched at the summit. Base-center origin
// (mountain base at y=0), built upward.
export function MonserrateLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  // Whitewashed colonial sanctuary — restrained light accent at the summit.
  const white = 'rgba(244,243,236,0.92)';
  return (
    <g aria-hidden>
      {/* peak */}
      <path
        d="M -300 0 L -150 -190 L -50 -350 L 0 -402 L 44 -372 L 160 -190 L 300 0 Z"
        fill={f}
        opacity={0.92}
      />
      {/* lit ridge highlight */}
      <path d="M -50 -350 L 0 -402 L 44 -372" fill="none" stroke={a} strokeWidth={3} opacity={0.3} />
      {/* funicular line up to the summit */}
      <path d="M 110 -130 L 16 -378" stroke={a} strokeWidth={2} opacity={0.25} />
      {/* summit sanctuary church — nudged down so it nestles on the peak's
          shoulder rather than perching on the sharp point */}
      <g transform="translate(0,26)">
        <rect x={-26} y={-444} width={52} height={42} fill={white} />
        <polygon points="-30 -444, 0 -468, 30 -444" fill={white} />
        {/* central bell tower + cross */}
        <rect x={-7} y={-486} width={14} height={42} fill={white} />
        <rect x={-2} y={-500} width={4} height={14} fill={white} />
        <rect x={-7} y={-496} width={14} height={4} fill={white} />
      </g>
    </g>
  );
}
