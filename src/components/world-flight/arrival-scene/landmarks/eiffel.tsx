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

// Eiffel Tower (Paris) — foreground slot. Warm "Eiffel Brown" bronze iron with
// two-tone depth (lit left / shaded right via half-clips), a diagonal lattice
// truss (the tower's signature ironwork), a glowing gold contour, and warm gold
// lights that flash/sparkle when animated. Base-center origin, built upward.
export function EiffelLandmark({ palette, ambient, idPrefix }: LandmarkLayerProps) {
  const iron = 'rgb(112,88,62)'; // graduated bronze "Eiffel Brown"
  const ironShade = 'rgba(38,26,14,0.5)'; // right-half shadow
  const ironLit = 'rgba(220,182,120,0.42)'; // left-half catch-light
  const gold = palette.light === 'moon' ? 'rgb(255,232,150)' : 'rgb(255,222,140)';
  const lit = palette.light === 'moon' ? 'rgba(255,238,178,0.95)' : 'rgba(255,230,152,0.92)';
  const clipR = `${idPrefix}-eiffel-r`;
  const clipL = `${idPrefix}-eiffel-l`;

  // The iron massing, re-rendered with different fills for the base layer + the
  // clipped lit/shade overlays (kept DRY so the three passes never drift).
  const Struct = ({ fill }: { fill: string }) => (
    <>
      {/* legs — curved struts with an open gap between them */}
      <path d="M -84 0 L -58 0 C -50 -78 -34 -118 -16 -140 L -27 -140 C -48 -110 -70 -54 -84 0 Z" fill={fill} />
      <path d="M 84 0 L 58 0 C 50 -78 34 -118 16 -140 L 27 -140 C 48 -110 70 -54 84 0 Z" fill={fill} />
      {/* grand base arch */}
      <path d="M -58 0 C -46 -50 -22 -74 0 -74 C 22 -74 46 -50 58 0 L 44 0 C 34 -40 18 -58 0 -58 C -18 -58 -34 -40 -44 0 Z" fill={fill} />
      {/* first platform */}
      <rect x={-60} y={-152} width={120} height={12} fill={fill} />
      {/* mid taper */}
      <path d="M -27 -152 L -13 -276 L 13 -276 L 27 -152 Z" fill={fill} />
      {/* second platform */}
      <rect x={-24} y={-286} width={48} height={10} fill={fill} />
      {/* upper tower */}
      <path d="M -12 -286 L -4 -404 L 4 -404 L 12 -286 Z" fill={fill} />
      {/* lantern + antenna */}
      <rect x={-6} y={-420} width={12} height={16} fill={fill} />
      <rect x={-2} y={-470} width={4} height={50} fill={fill} />
    </>
  );

  return (
    <g aria-hidden>
      <defs>
        <clipPath id={clipR}><rect x={0} y={-500} width={120} height={520} /></clipPath>
        <clipPath id={clipL}><rect x={-120} y={-500} width={120} height={520} /></clipPath>
      </defs>

      {/* base bronze, then half-clipped shade (right) + catch-light (left) */}
      <Struct fill={iron} />
      <g clipPath={`url(#${clipR})`}><Struct fill={ironShade} /></g>
      <g clipPath={`url(#${clipL})`}><Struct fill={ironLit} /></g>

      {/* lattice ironwork — horizontal truss belts + diagonal cross-bracing */}
      <g stroke="rgba(28,18,10,0.42)" strokeWidth={1.4} fill="none">
        {/* leg cross-braces */}
        <path d="M -78 -8 L -34 -116 M -34 -8 L -74 -110" />
        <path d="M 78 -8 L 34 -116 M 34 -8 L 74 -110" />
        {/* lower body (first→second platform) X-truss */}
        <path d="M -26 -158 L 12 -272 M -12 -158 L -26 -200 M 12 -158 L 26 -200 M 26 -158 L -12 -272" />
        <path d="M -23 -190 L 23 -190 M -19 -228 L 19 -228 M -16 -262 L 16 -262" />
        {/* upper tower X-truss */}
        <path d="M -11 -292 L 4 -400 M 11 -292 L -4 -400" />
        <path d="M -9 -330 L 9 -330 M -6 -372 L 6 -372" />
      </g>
      {/* counter-diagonal catch-light on the lattice */}
      <g stroke="rgba(224,186,128,0.3)" strokeWidth={1} fill="none">
        <path d="M -74 -8 L -32 -112 M 74 -8 L 32 -112" />
        <path d="M -24 -160 L 22 -270 M -10 -290 L 9 -396" />
      </g>

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
