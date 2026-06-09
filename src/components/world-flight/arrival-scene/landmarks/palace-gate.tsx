import type { LandmarkLayerProps } from '../types';

// Gwanghwamun palace gate (Seoul) — foreground slot. Stone base with arched
// gateways under an upswept tiled pavilion roof. Base-center origin, upward.
export function PalaceGateLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* stone base */}
      <rect x={-170} y={-104} width={340} height={104} fill={f} />
      {/* three arched gates */}
      {[-100, 0, 100].map((x) => (
        <path key={x} d={`M ${x - 22} 0 L ${x - 22} -52 Q ${x} -80 ${x + 22} -52 L ${x + 22} 0 Z`} fill={a} opacity={0.32} />
      ))}
      {/* parapet */}
      <rect x={-150} y={-120} width={300} height={16} fill={f} />
      {[-130, -90, -50, -10, 30, 70, 110].map((x) => (
        <rect key={x} x={x} y={-130} width={18} height={12} fill={f} />
      ))}
      {/* pavilion body */}
      <rect x={-130} y={-176} width={260} height={56} fill={f} />
      {/* upswept roof */}
      <path d="M -158 -176 Q -176 -188 -190 -208 L 0 -250 L 190 -208 Q 176 -188 158 -176 Z" fill={f} />
      <path d="M -190 -208 L 0 -250 L 190 -208" fill="none" stroke={a} strokeWidth={5} opacity={0.5} />
    </g>
  );
}
