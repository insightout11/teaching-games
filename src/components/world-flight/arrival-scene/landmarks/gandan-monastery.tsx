import type { LandmarkLayerProps } from '../types';

// Gandantegchinlen Monastery (Ulaanbaatar) — foreground slot. The tall white
// temple that houses the standing Migjid Janraisig, drawn as stacked masonry
// tiers under upswept gilded pagoda roofs. Base-center origin, built upward.
export function GandanMonasteryLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  // Gilded Tibetan-Mongolian temple roofs — restrained warm accent.
  const gold = 'rgba(212,168,76,0.85)';

  const RoofTier = ({ y, half }: { y: number; half: number }) => (
    <path
      d={`M ${-half} ${y} Q ${-half - 14} ${y - 4} ${-half - 22} ${y - 18} L 0 ${y - 40} L ${half + 22} ${y - 18} Q ${half + 14} ${y - 4} ${half} ${y} Z`}
      fill={gold}
    />
  );

  return (
    <g aria-hidden>
      {/* stacked masonry tiers */}
      <rect x={-110} y={-120} width={220} height={120} fill={f} />
      <rect x={-86} y={-220} width={172} height={100} fill={f} />
      <rect x={-58} y={-318} width={116} height={98} fill={f} />
      {/* recessed windows */}
      {[-70, 0, 70].map((x) => (
        <rect key={x} x={x - 9} y={-100} width={18} height={40} fill={a} opacity={0.28} />
      ))}
      {[-44, 44].map((x) => (
        <rect key={x} x={x - 8} y={-200} width={16} height={36} fill={a} opacity={0.28} />
      ))}
      {/* tiered upswept roofs */}
      <RoofTier y={-120} half={120} />
      <RoofTier y={-220} half={96} />
      <RoofTier y={-318} half={68} />
      {/* gilded finial */}
      <rect x={-3} y={-372} width={6} height={26} fill={gold} />
      <circle cx={0} cy={-376} r={6} fill={gold} />
    </g>
  );
}
