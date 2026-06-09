import type { LandmarkLayerProps } from '../types';

// Brandenburg Gate (Berlin) — foreground slot. Neoclassical colonnade under a
// broad entablature crowned by a quadriga. Base-center origin, built upward.
export function BrandenburgGateLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const cols = [-150, -110, -70, -24, 24, 70, 110, 150];
  return (
    <g aria-hidden>
      {/* base plinth */}
      <rect x={-176} y={-16} width={352} height={16} fill={f} />
      {/* columns */}
      {cols.map((x) => (
        <rect key={x} x={x - 12} y={-200} width={24} height={184} fill={f} />
      ))}
      {/* capitals */}
      {cols.map((x) => (
        <rect key={`c${x}`} x={x - 15} y={-208} width={30} height={10} fill={f} />
      ))}
      {/* entablature */}
      <rect x={-184} y={-244} width={368} height={36} fill={f} />
      <rect x={-184} y={-252} width={368} height={8} fill={palette.landmarkAccent} opacity={0.3} />
      {/* quadriga base + horses (stylized) */}
      <rect x={-44} y={-262} width={88} height={18} fill={f} />
      <g transform="translate(0 -262)">
        <rect x={-34} y={-30} width={10} height={30} fill={f} />
        <rect x={-18} y={-30} width={10} height={30} fill={f} />
        <rect x={-2} y={-30} width={10} height={30} fill={f} />
        <path d="M -40 -30 Q -10 -54 24 -34 L 24 -30 Z" fill={f} />
      </g>
    </g>
  );
}
