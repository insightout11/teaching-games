import type { LandmarkLayerProps } from '../types';

// Fallback monument for any landmarkSilhouette value not yet authored — a
// stylized commemorative spire on a tiered plinth. Deliberately neutral so an
// unauthored city still reads as "a landmark," not a gap. Base-center origin.
export function GenericLandmark({ palette }: LandmarkLayerProps) {
  return (
    <g aria-hidden>
      {/* tiered plinth */}
      <rect x={-90} y={-44} width={180} height={44} fill={palette.landmarkFill} />
      <rect x={-66} y={-72} width={132} height={32} fill={palette.landmarkFill} />
      {/* tapering shaft */}
      <polygon points="-34 -72, -22 -300, 22 -300, 34 -72" fill={palette.landmarkFill} />
      {/* capstone */}
      <polygon points="-22 -300, 0 -348, 22 -300" fill={palette.landmarkFill} />
      <circle cx={0} cy={-354} r={8} fill={palette.landmarkAccent} />
      {/* face accent */}
      <polygon points="-22 -300, 0 -348, 0 -72, -28 -86" fill={palette.landmarkAccent} opacity={0.18} />
    </g>
  );
}
