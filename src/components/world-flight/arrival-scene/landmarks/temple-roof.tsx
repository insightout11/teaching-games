import type { LandmarkLayerProps } from '../types';

// Thai temple roof (Bangkok) — foreground slot. Tiered, upswept gables with a
// spire finial. Base-center origin, built upward.
export function TempleRoofLandmark({ palette }: LandmarkLayerProps) {
  const Tier = ({ y, half, h }: { y: number; half: number; h: number }) => (
    <path
      d={`M ${-half} ${y}
          Q ${-half - 18} ${y - 10} ${-half - 26} ${y - 26}
          L 0 ${y - h}
          L ${half + 26} ${y - 26}
          Q ${half + 18} ${y - 10} ${half} ${y} Z`}
      fill={palette.landmarkFill}
    />
  );
  return (
    <g aria-hidden>
      {/* base hall */}
      <rect x={-150} y={-150} width={300} height={150} fill={palette.landmarkFill} />
      {/* three upswept tiers */}
      <Tier y={-150} half={150} h={92} />
      <Tier y={-218} half={112} h={78} />
      <Tier y={-280} half={74} h={64} />
      {/* spire finial */}
      <polygon points={`-10 -340, 0 -430, 10 -340`} fill={palette.landmarkFill} />
      <circle cx={0} cy={-436} r={9} fill={palette.landmarkAccent} />
      {/* gold trim accents on the eaves */}
      <path d="M -176 -150 L 0 -242 L 176 -150" fill="none" stroke={palette.landmarkAccent} strokeWidth={5} opacity={0.6} />
    </g>
  );
}
