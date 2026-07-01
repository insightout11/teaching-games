import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// CN Tower (Toronto) — foreground slot. Slender shaft with a lit sky-pod and a
// tall antenna. Lit deck windows + a pulsing red beacon (ambient) help it stand
// out against the winter skyline. Base-center origin, built upward.
export function CnTowerLandmark({ palette, ambient }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const glow = 'rgb(96,150,240)'; // CN Tower's signature blue LED lighting
  const litWarm = 'rgba(255,236,180,0.9)';
  return (
    <g aria-hidden>
      {/* tapering shaft + lit edge + coloured LED seam */}
      <polygon points="-26 0, -12 -360, 12 -360, 26 0" fill={f} />
      <polygon points="-26 0, -12 -360, -8 -360, -22 0" fill="rgba(255,255,255,0.12)" />
      <rect x={-1.6} y={-356} width={3.2} height={356} fill={glow} opacity={0.5} />
      {/* coloured glow behind the sky pod so it stands out */}
      <ellipse cx={0} cy={-356} rx={60} ry={32} fill={glow} opacity={0.2} />
      {/* sky pod (lit observation decks) */}
      <path d="M -44 -356 C -44 -384 44 -384 44 -356 L 36 -334 C 12 -322 -12 -322 -36 -334 Z" fill={f} />
      <rect x={-34} y={-356} width={68} height={5} fill={litWarm} />
      <rect x={-30} y={-347} width={60} height={4} fill={glow} opacity={0.8} />
      <rect x={-30} y={-340} width={60} height={3} fill={palette.windowWarm} opacity={0.6} />
      {/* upper pod ring */}
      <rect x={-18} y={-398} width={36} height={16} rx={4} fill={f} />
      <rect x={-16} y={-394} width={32} height={3} fill={litWarm} />
      <rect x={-16} y={-389} width={32} height={2} fill={glow} opacity={0.7} />
      {/* antenna + beacon */}
      <polygon points="-6 -398, -2 -520, 2 -520, 6 -398" fill={f} />
      <rect x={-1.5} y={-560} width={3} height={40} fill={f} />
      {ambient ? (
        <motion.circle cx={0} cy={-562} r={5} fill="rgba(255,90,90,0.95)" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <circle cx={0} cy={-562} r={4.5} fill="rgba(255,90,90,0.95)" />
      )}
    </g>
  );
}
