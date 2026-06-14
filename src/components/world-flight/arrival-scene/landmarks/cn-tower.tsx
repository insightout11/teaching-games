import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// CN Tower (Toronto) — foreground slot. Slender shaft with a lit sky-pod and a
// tall antenna. Lit deck windows + a pulsing red beacon (ambient) help it stand
// out against the winter skyline. Base-center origin, built upward.
export function CnTowerLandmark({ palette, ambient }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* tapering shaft + lit edge */}
      <polygon points="-26 0, -12 -360, 12 -360, 26 0" fill={f} />
      <polygon points="-26 0, -12 -360, -8 -360, -22 0" fill="rgba(255,255,255,0.12)" />
      {/* sky pod (lit observation decks) */}
      <path d="M -44 -356 C -44 -384 44 -384 44 -356 L 36 -334 C 12 -322 -12 -322 -36 -334 Z" fill={f} />
      <rect x={-34} y={-356} width={68} height={5} fill="rgba(255,236,180,0.85)" />
      <rect x={-30} y={-347} width={60} height={4} fill={palette.windowWarm} opacity={0.6} />
      {/* upper pod ring */}
      <rect x={-18} y={-398} width={36} height={16} rx={4} fill={f} />
      <rect x={-16} y={-394} width={32} height={3} fill="rgba(255,236,180,0.8)" />
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
