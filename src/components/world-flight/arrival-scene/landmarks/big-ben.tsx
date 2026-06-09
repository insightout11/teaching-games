import type { LandmarkLayerProps } from '../types';

// Big Ben / Elizabeth Tower (London) — foreground slot. Gothic clock tower with
// a clock face and a spired roof. Base-center origin, built upward.
export function BigBenLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* shaft */}
      <rect x={-42} y={-300} width={84} height={300} fill={f} />
      {/* vertical pilaster lines */}
      {[-28, 0, 28].map((x) => (
        <rect key={x} x={x - 1.5} y={-296} width={3} height={250} fill={palette.landmarkAccent} opacity={0.25} />
      ))}
      {/* belfry */}
      <rect x={-48} y={-336} width={96} height={40} fill={f} />
      {/* clock face */}
      <circle cx={0} cy={-264} r={26} fill={palette.landmarkAccent} opacity={0.85} />
      <circle cx={0} cy={-264} r={26} fill="none" stroke={f} strokeWidth={4} />
      <path d="M 0 -264 L 0 -282 M 0 -264 L 12 -258" stroke={f} strokeWidth={3} />
      {/* spired roof */}
      <polygon points="-48 -336, 0 -430, 48 -336" fill={f} />
      <rect x={-3} y={-456} width={6} height={28} fill={f} />
      <circle cx={0} cy={-458} r={5} fill={palette.landmarkAccent} />
    </g>
  );
}
