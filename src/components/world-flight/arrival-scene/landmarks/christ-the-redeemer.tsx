import type { LandmarkLayerProps } from '../types';

// Christ the Redeemer (Rio de Janeiro) — background slot. Arms-outstretched
// figure atop the Corcovado peak. Base-center origin (peak base at y=0), upward.
export function ChristTheRedeemerLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* steep peak */}
      <path d="M -150 0 C -80 -120 -40 -210 -8 -250 L 8 -250 C 40 -210 90 -120 150 0 Z" fill={f} />
      <path d="M -40 -120 L -8 -250 L 8 -250 L 40 -120" fill="rgba(255,255,255,0.06)" />
      {/* statue: pedestal */}
      <rect x={-10} y={-280} width={20} height={30} fill={f} />
      {/* outstretched arms (robed) */}
      <path d="M -64 -322 L 64 -322 L 64 -312 L 10 -304 L 10 -280 L -10 -280 L -10 -304 L -64 -312 Z" fill={f} />
      {/* body */}
      <path d="M -12 -304 L -8 -360 L 8 -360 L 12 -304 Z" fill={f} />
      {/* head */}
      <circle cx={0} cy={-370} r={9} fill={f} />
      {/* faint halo accent */}
      <circle cx={0} cy={-370} r={14} fill="none" stroke={palette.landmarkAccent} strokeWidth={2} opacity={0.3} />
    </g>
  );
}
