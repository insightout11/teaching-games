import type { LandmarkLayerProps } from '../types';

// African Renaissance Monument (Dakar) — foreground slot. The bronze group atop
// its hill: a striding man lifting a child skyward on one arm, a woman sweeping
// behind. Simplified silhouette. Base-center origin, built upward.
export function RenaissanceMonumentLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* hill (opaque green) + plinth */}
      <path d="M -170 0 Q 0 -54 170 0 Z" fill="rgb(60,76,58)" />
      <path d="M 0 -50 Q 0 -54 170 0 L 60 0 Q 30 -36 0 -50 Z" fill="rgba(0,0,0,0.16)" />
      <rect x={-46} y={-66} width={92} height={42} fill={f} />
      {/* woman sweeping behind (left) */}
      <g opacity={0.88}>
        <path d="M -56 -66 L -48 -158 L -32 -158 L -38 -66 Z" fill={f} />
        <circle cx={-44} cy={-170} r={9} fill={f} />
        <path d="M -48 -148 L -82 -126 L -78 -118 L -42 -136 Z" fill={f} />
      </g>
      {/* man striding */}
      <path d="M -14 -66 L -18 -110 L 4 -160 L 18 -158 L 14 -110 L 22 -66 Z" fill={f} />
      <circle cx={9} cy={-174} r={11} fill={f} />
      {/* raised arm */}
      <path d="M 12 -158 L 38 -198 L 48 -192 L 24 -152 Z" fill={f} />
      {/* child held aloft, arm pointing up */}
      <g>
        <circle cx={48} cy={-210} r={6} fill={f} />
        <rect x={45} y={-206} width={7} height={18} fill={f} />
        <path d="M 50 -208 L 60 -226 L 64 -222 L 54 -204 Z" fill={f} />
      </g>
      {/* faint highlight on the man */}
      <path d="M 4 -160 L 18 -158 L 14 -110 Z" fill={a} opacity={0.12} />
    </g>
  );
}
