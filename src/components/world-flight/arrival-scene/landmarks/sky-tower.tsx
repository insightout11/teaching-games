import type { LandmarkLayerProps } from '../types';

// Sky Tower (Auckland) — foreground slot. A slender shaft with a multi-level
// observation pod near the top and a very tall thin antenna mast, with a low
// hint of the Harbour Bridge to the left. Base-center origin, built upward.
export function SkyTowerLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(69, 88, 115)';
  const fShade = 'rgba(18,30,54,0.42)';
  const led = 'rgb(153,120,238)'; // Sky Tower's coloured LED lighting (purple)
  const ledLit = 'rgba(190,160,255,0.9)';
  const warm = palette.windowWarm;
  return (
    <g aria-hidden>
      {/* harbour bridge hint (low, left) */}
      <path d="M -214 0 Q -150 -58 -86 0" fill="none" stroke={f} strokeWidth={6} opacity={0.6} />
      <rect x={-216} y={-30} width={6} height={30} fill={f} opacity={0.6} />
      <rect x={-90} y={-30} width={6} height={30} fill={f} opacity={0.6} />
      {/* shaft (two-tone) + a lit LED seam so it stands out */}
      <polygon points="-13 0, -8 -384, 8 -384, 13 0" fill={f} />
      <polygon points="0 0, 0 -384, 8 -384, 13 0" fill={fShade} />
      <rect x={-1.5} y={-380} width={3} height={380} fill={led} opacity={0.82} />
      {/* observation pod — coloured glow + lit decks */}
      <ellipse cx={0} cy={-390} rx={40} ry={30} fill={led} opacity={0.34} />
      <path d="M -30 -384 C -30 -410 30 -410 30 -384 L 24 -354 L -24 -354 Z" fill={f} />
      <rect x={-24} y={-378} width={48} height={5} fill={warm} opacity={0.75} />
      <rect x={-22} y={-370} width={44} height={4} fill={ledLit} />
      <rect x={-20} y={-362} width={40} height={3} fill={warm} opacity={0.5} />
      <rect x={-15} y={-426} width={30} height={18} fill={f} />
      <rect x={-13} y={-422} width={26} height={3} fill={ledLit} opacity={0.8} />
      {/* long antenna mast + beacon */}
      <polygon points="-4 -426, -1.5 -578, 1.5 -578, 4 -426" fill={f} />
      <rect x={-1} y={-620} width={2} height={42} fill={f} />
      <circle cx={0} cy={-622} r={3.5} fill={ledLit} />
    </g>
  );
}
