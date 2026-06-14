import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// Outline tracing the stepped setback silhouette (left up → spire → right down).
const OUTLINE =
  'M -58 0 L -58 -150 L -46 -150 L -46 -280 L -35 -280 L -35 -400 L -25 -400 L -25 -496 L -16 -496 L -16 -566 L -6 -566 L 0 -660 L 6 -566 L 16 -566 L 16 -496 L 25 -496 L 25 -400 L 35 -400 L 35 -280 L 46 -280 L 46 -150 L 58 -150 L 58 0';

// Light-show bands: [y, halfWidth] up the tapering tower.
const BANDS: Array<[number, number]> = [
  [-70, 50], [-150, 44], [-210, 40], [-280, 35], [-340, 32], [-400, 28], [-460, 22], [-520, 16], [-560, 13],
];

// Burj Khalifa (Dubai) — foreground slot. Tapering tiered spire that puts on a
// golden LIGHT SHOW: a bright gold contour, lit bands that run up the tower, a
// rooftop beam + beacon. Animated shimmer when `ambient` (steady glow otherwise).
export function BurjLandmark({ palette, ambient }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const gold = 'rgb(255,206,84)';
  const tiers = [
    { y: 0, w: 116, h: 150 },
    { y: -150, w: 92, h: 130 },
    { y: -280, w: 70, h: 120 },
    { y: -400, w: 50, h: 96 },
    { y: -496, w: 32, h: 70 },
  ];
  return (
    <g aria-hidden>
      {tiers.map((t, i) => (
        <rect key={i} x={-t.w / 2} y={t.y - t.h} width={t.w} height={t.h} fill={f} />
      ))}
      <polygon points="-6 -566, 0 -660, 6 -566" fill={f} />
      {/* upward light beam */}
      {ambient && (
        <motion.polygon
          points="-4 -660, 4 -660, 11 -884, -11 -884"
          fill={gold}
          animate={{ opacity: [0.05, 0.32, 0.05] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* gold lit contour + central spine glow */}
      <path d={OUTLINE} fill="none" stroke={gold} strokeWidth={2.2} strokeLinejoin="round" />
      <rect x={-2} y={-660} width={4} height={660} fill={gold} opacity={0.4} />
      {/* light-show bands (run up the tower when animated) */}
      {BANDS.map(([y, hw], i) =>
        ambient ? (
          <motion.rect
            key={i}
            x={-hw}
            y={y}
            width={hw * 2}
            height={3.5}
            fill={gold}
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 2.4, delay: (i * 0.22) % 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <rect key={i} x={-hw} y={y} width={hw * 2} height={3.5} fill={gold} opacity={0.55} />
        ),
      )}
      {/* spire beacon */}
      {ambient ? (
        <motion.circle cx={0} cy={-662} r={5} fill={gold} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <circle cx={0} cy={-662} r={4.5} fill={gold} />
      )}
    </g>
  );
}
