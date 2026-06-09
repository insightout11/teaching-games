import type { LandmarkLayerProps } from '../types';

// Victoria Harbour (Hong Kong) — foreground slot. A traditional red-sailed junk
// gliding on the harbour water. Base-center origin, built upward.
export function HarbourLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const sail = 'rgba(176,58,46,0.92)';
  return (
    <g aria-hidden>
      {/* water + glints */}
      <ellipse cx={0} cy={-6} rx={240} ry={20} fill={a} opacity={0.12} />
      {[-180, -90, 20, 120, 200].map((x) => (
        <rect key={x} x={x} y={-8 + (x % 10)} width={34} height={2} fill={a} opacity={0.3} />
      ))}
      {/* hull */}
      <path d="M -120 -40 L 120 -40 L 92 -10 L -92 -10 Z" fill={f} />
      <path d="M -120 -40 Q -150 -44 -150 -54 L -120 -52 Z" fill={f} />
      {/* masts */}
      <rect x={-44} y={-200} width={6} height={160} fill={f} />
      <rect x={46} y={-176} width={6} height={136} fill={f} />
      {/* battened junk sails */}
      <path d="M -40 -198 C -2 -190 6 -120 -2 -46 L -86 -54 C -78 -120 -72 -180 -40 -198 Z" fill={sail} />
      <path d="M 50 -174 C 86 -166 92 -110 86 -46 L 16 -50 C 18 -110 24 -160 50 -174 Z" fill={sail} />
      {/* sail battens */}
      {[-160, -130, -100, -72].map((y) => (
        <line key={y} x1={-86} y1={y * 0.5 - 10} x2={-2} y2={y * 0.5 - 10} stroke={f} strokeWidth={2} opacity={0.4} />
      ))}
    </g>
  );
}
