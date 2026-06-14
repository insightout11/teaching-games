import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// Sparkle-light positions over the structure (local coords, base-center origin).
const SPARKLES: ReadonlyArray<readonly [number, number]> = [
  [-64, -26], [-50, -66], [-36, -106], [-22, -134],
  [64, -26], [50, -66], [36, -106], [22, -134],
  [-24, -52], [0, -66], [24, -52],
  [-46, -148], [-16, -148], [16, -148], [46, -148],
  [-16, -198], [0, -236], [16, -198], [-9, -262], [9, -262],
  [-16, -284], [0, -291], [16, -284],
  [-7, -344], [7, -344], [0, -388],
];

// Eiffel Tower (Paris) — foreground slot. Two tones: dark grey IRON structure
// (splayed legs, base arch, two platforms, tapering upper tower + antenna) and
// warm GOLD lights that flash/sparkle when animated. Base-center origin, upward.
export function EiffelLandmark({ palette, ambient }: LandmarkLayerProps) {
  const iron = 'rgb(76,80,90)';
  const gold = palette.light === 'moon' ? 'rgb(255,232,150)' : 'rgb(255,222,140)';
  const lit = palette.light === 'moon' ? 'rgba(255,238,178,0.95)' : 'rgba(255,230,152,0.92)';
  return (
    <g aria-hidden>
      {/* legs — curved struts with an open gap between them */}
      <path d="M -84 0 L -58 0 C -50 -78 -34 -118 -16 -140 L -27 -140 C -48 -110 -70 -54 -84 0 Z" fill={iron} />
      <path d="M 84 0 L 58 0 C 50 -78 34 -118 16 -140 L 27 -140 C 48 -110 70 -54 84 0 Z" fill={iron} />
      {/* grand base arch */}
      <path d="M -58 0 C -46 -50 -22 -74 0 -74 C 22 -74 46 -50 58 0 L 44 0 C 34 -40 18 -58 0 -58 C -18 -58 -34 -40 -44 0 Z" fill={iron} />
      {/* first platform */}
      <rect x={-60} y={-152} width={120} height={12} fill={iron} />
      {/* mid taper */}
      <path d="M -27 -152 L -13 -276 L 13 -276 L 27 -152 Z" fill={iron} />
      {/* second platform */}
      <rect x={-24} y={-286} width={48} height={10} fill={iron} />
      {/* upper tower */}
      <path d="M -12 -286 L -4 -404 L 4 -404 L 12 -286 Z" fill={iron} />
      {/* lantern + antenna */}
      <rect x={-6} y={-420} width={12} height={16} fill={iron} />
      <rect x={-2} y={-470} width={4} height={50} fill={iron} />
      {/* lattice cross-hatch */}
      <path d="M -52 -40 L 52 -40 M -42 -100 L 42 -100 M -20 -204 L 20 -204 M -15 -250 L 15 -250" stroke="rgba(0,0,0,0.25)" strokeWidth={2} fill="none" />
      {/* lit contour — a glowing gold outline tracing the tower's stepped profile */}
      <path
        d="M -84 0 C -70 -54 -50 -112 -30 -140 L -60 -140 L -60 -152 L -27 -152 L -13 -276 L -24 -276 L -24 -286 L -12 -286 L -4 -404 L 0 -474 L 4 -404 L 12 -286 L 24 -286 L 24 -276 L 13 -276 L 27 -152 L 60 -152 L 60 -140 L 30 -140 C 50 -112 70 -54 84 0"
        fill="none"
        stroke={lit}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* flashing gold sparkle lights */}
      {SPARKLES.map(([sx, sy], i) =>
        ambient ? (
          <motion.circle
            key={i}
            cx={sx}
            cy={sy}
            r={2.3}
            fill={gold}
            initial={{ opacity: 0.12 }}
            animate={{ opacity: [0.12, 1, 0.12] }}
            transition={{
              duration: 0.45 + (i % 5) * 0.16,
              delay: (i * 0.17) % 2.4,
              repeat: Infinity,
              repeatDelay: (i % 4) * 0.4,
              ease: 'easeInOut',
            }}
          />
        ) : (
          <circle key={i} cx={sx} cy={sy} r={2} fill={gold} opacity={0.35} />
        ),
      )}
      {/* top beacon */}
      {ambient ? (
        <motion.circle cx={0} cy={-474} r={5} fill={gold} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <circle cx={0} cy={-474} r={4.5} fill={gold} opacity={0.7} />
      )}
    </g>
  );
}
